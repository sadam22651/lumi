// src/app/api/orders/[id]/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'
import { toOrderStatus } from '@/lib/shipping/status-map'
export const dynamic = 'force-dynamic'

const KOMERCE_URL = 'https://rajaongkir.komerce.id/api/v1/track/waybill'
const PROVIDER_TIMEOUT_MS = 15000

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    if (!id) return NextResponse.json({ ok: false, message: 'ID order kosong' }, { status: 400 })

    // auth
    const auth = req.headers.get('authorization')
    if (!auth) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    const token = auth.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) return NextResponse.json({ ok: false, message: 'Token tidak valid' }, { status: 401 })

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ ok: false, message: 'User tidak ditemukan' }, { status: 404 })

    // ambil order
    const order = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        trackingNumber: true,
        courierCode: true,
        status: true,
        shippedAt: true,
        deliveredAt: true,
      },
    })
    if (!order || order.userId !== me.id) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }
    if (!order.trackingNumber || !order.courierCode) {
      return NextResponse.json({ ok: false, message: 'Order belum punya nomor resi / kurir' }, { status: 400 })
    }

    const apiKey = process.env.RAJAONGKIR_COST_KEY || ''
    if (!apiKey) {
      return NextResponse.json({ ok: false, message: 'RAJAONGKIR_COST_KEY belum dikonfigurasi' }, { status: 500 })
    }

    // normalisasi courier untuk provider
    const courierCode = String(order.courierCode).trim().toLowerCase()

    // call provider + timeout
    const controller = new AbortController()
    const tm = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)
    const res = await fetch(KOMERCE_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        key: apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        awb: String(order.trackingNumber).trim(),
        courier: courierCode,
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).catch((e) => (e?.name === 'AbortError' ? new Response(null, { status: 504 }) : Promise.reject(e)))
    clearTimeout(tm)

    if (!res) return NextResponse.json({ ok: false, message: 'Tidak ada respons provider' }, { status: 502 })

    const ctype = res.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      const snippet = await res.text().catch(() => '')
      return NextResponse.json(
        { ok: false, message: 'Respons provider bukan JSON', httpStatus: res.status, snippet: snippet.slice(0, 200) },
        { status: 502 },
      )
    }

    const payload = await res.json().catch(() => null)
    if (!payload) return NextResponse.json({ ok: false, message: 'Gagal parse JSON provider' }, { status: 502 })

    // provider kadang 200 tapi meta.code error
    if (!res.ok || (typeof payload?.meta?.code === 'number' && payload.meta.code >= 400)) {
      return NextResponse.json({ ok: false, message: payload?.meta?.message || 'Gagal tracking' }, { status: 502 })
    }

    const data = payload?.data
    if (!data) return NextResponse.json({ ok: false, message: 'Data tracking kosong' }, { status: 502 })

    // status & update order
    const providerStatus: string =
      data?.delivery_status?.status || data?.summary?.status || data?.status || ''
    const normalized = toOrderStatus(providerStatus)

    const updates: Record<string, any> = {}
    if (normalized === 'DELIVERED') {
      const podDate = data?.delivery_status?.pod_date ?? ''
      const podTime = data?.delivery_status?.pod_time ?? '00:00:00'
      const when = podDate ? new Date(`${podDate}T${podTime}`) : new Date()
      updates.deliveredAt = order.deliveredAt ?? when
      if (order.status !== 'done') updates.status = 'done'
    } else if (normalized === 'SHIPPED') {
      if (!order.shippedAt) updates.shippedAt = new Date()
      if (order.status === 'paid' || order.status === 'processing') updates.status = 'shipped'
    }
    if (Object.keys(updates).length) {
      await prisma.transaction.update({ where: { id: order.id }, data: updates })
    }

    // === Mapping ke shape yang diharapkan UI /orders/[id] ===
    const waybill =
      data?.details?.waybill_number ??
      data?.summary?.waybill_number ??
      order.trackingNumber ??
      null

    const courier =
      data?.summary?.courier_code ??
      data?.summary?.courier_name ??
      data?.details?.courier ??
      courierCode ??
      null

    const service =
      data?.summary?.service_code ??
      data?.details?.service ??
      null

    const manifest = Array.isArray(data?.manifest)
      ? data.manifest.map((m: any) => ({
          date: m?.manifest_date ?? '',
          time: m?.manifest_time ?? '',
          description: m?.manifest_description ?? m?.manifest_code ?? '',
          city: m?.city_name ?? '',
        }))
      : []

    return NextResponse.json({
      ok: true,
      tracking: {
        waybill,
        courier,
        service,
        status: providerStatus || null,
        delivered: normalized === 'DELIVERED',
        summary: data?.summary ?? null,
        manifest,
      },
    })
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return NextResponse.json({ ok: false, message: 'Timeout ke provider' }, { status: 504 })
    }
    console.error('[POST /api/orders/:id/track]', e)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
