// src/app/api/orders/[id]/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'
import { toOrderStatus } from '@/lib/shipping/status-map'
import type { Transaction } from '@prisma/client'

export const dynamic = 'force-dynamic'

const KOMERCE_URL = 'https://rajaongkir.komerce.id/api/v1/track/waybill'
const PROVIDER_TIMEOUT_MS = 15000

type RouteParamsAsync = { params: Promise<{ id: string }> }
type UIManifest = { date: string; time: string; description: string; city: string }

function asRecord(v: unknown): Record<string, unknown> {
  return (v && typeof v === 'object' ? (v as Record<string, unknown>) : {}) as Record<string, unknown>
}
function asString(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

export async function POST(req: NextRequest, ctx: RouteParamsAsync) {
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

    // call provider + timeout (tanpa .catch(e=>...) supaya tidak infer any)
    const controller = new AbortController()
    const tm = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(KOMERCE_URL, {
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
      })
    } catch (e: unknown) {
      clearTimeout(tm)
      if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'AbortError') {
        return NextResponse.json({ ok: false, message: 'Timeout ke provider' }, { status: 504 })
      }
      throw e
    }
    clearTimeout(tm)

    const ctype = res.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      const snippet = await res.text().catch(() => '')
      return NextResponse.json(
        { ok: false, message: 'Respons provider bukan JSON', httpStatus: res.status, snippet: snippet.slice(0, 200) },
        { status: 502 },
      )
    }

    const payloadUnknown = await res.json().catch(() => null)
    if (!payloadUnknown) return NextResponse.json({ ok: false, message: 'Gagal parse JSON provider' }, { status: 502 })

    const payload = asRecord(payloadUnknown)
    const meta = asRecord(payload.meta)
    if (!res.ok || (typeof meta.code === 'number' && meta.code >= 400)) {
      return NextResponse.json({ ok: false, message: asString(meta.message) || 'Gagal tracking' }, { status: 502 })
    }

    const data = asRecord(payload.data)
    if (!payload.data) return NextResponse.json({ ok: false, message: 'Data tracking kosong' }, { status: 502 })

    // status & update order
    const delivery_status = asRecord(data.delivery_status)
    const summary = asRecord(data.summary)

    const providerStatus: string =
      asString(delivery_status.status) || asString(summary.status) || asString((payload as Record<string, unknown>).status)

    const normalized = toOrderStatus(providerStatus)

    // ⬇️ Tanpa any: batasi ke subset field Transaction yang diupdate
    const updates: Partial<Pick<Transaction, 'deliveredAt' | 'shippedAt' | 'status'>> = {}
    if (normalized === 'DELIVERED') {
      const podDate = asString(delivery_status.pod_date)
      const podTime = asString(delivery_status.pod_time) || '00:00:00'
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

    // === Mapping ke shape UI /orders/[id] ===
    const details = asRecord(data.details)

    const waybill =
      asString(details.waybill_number) ||
      asString(summary.waybill_number) ||
      order.trackingNumber ||
      null

    const courier =
      asString(summary.courier_code) ||
      asString(summary.courier_name) ||
      asString(details.courier) ||
      courierCode ||
      null

    const service =
      asString(summary.service_code) ||
      asString(details.service) ||
      null

    const manifestArr = Array.isArray(data.manifest) ? (data.manifest as unknown[]) : []
    const manifest: UIManifest[] = manifestArr.map((m) => {
      const mr = asRecord(m)
      return {
        date: asString(mr.manifest_date),
        time: asString(mr.manifest_time),
        description: asString(mr.manifest_description) || asString(mr.manifest_code),
        city: asString(mr.city_name),
      }
    })

    return NextResponse.json({
      ok: true,
      tracking: {
        waybill,
        courier,
        service,
        status: providerStatus || null,
        delivered: normalized === 'DELIVERED',
        summary: Object.keys(summary).length ? summary : null,
        manifest,
      },
    })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'AbortError') {
      return NextResponse.json({ ok: false, message: 'Timeout ke provider' }, { status: 504 })
    }
    console.error('[POST /api/orders/:id/track]', e)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
