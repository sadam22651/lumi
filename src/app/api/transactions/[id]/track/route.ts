// src/app/api/transactions/[id]/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'
import { toOrderStatus } from '@/lib/shipping/status-map'

export const dynamic = 'force-dynamic'

const KOMERCE_URL = 'https://rajaongkir.komerce.id/api/v1/track/waybill'
const PROVIDER_TIMEOUT_MS = 15000

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> } // Next.js 15: params adalah Promise
) {
  try {
    const { id } = await ctx.params
    if (!id) {
      return NextResponse.json({ ok: false, message: 'ID transaksi kosong' }, { status: 400 })
    }

    // ==== Auth: user harus login ====
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) {
      return NextResponse.json({ ok: false, message: 'Token tidak valid' }, { status: 401 })
    }

    // Ambil user dari Firebase UID
    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    })
    if (!me) {
      return NextResponse.json({ ok: false, message: 'User tidak ditemukan' }, { status: 404 })
    }

    // ==== Ambil transaksi & pastikan miliknya ====
    const tx = await prisma.transaction.findUnique({
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
    if (!tx) {
      return NextResponse.json({ ok: false, message: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    if (tx.userId !== me.id) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }
    if (!tx.trackingNumber || !tx.courierCode) {
      return NextResponse.json(
        { ok: false, message: 'Transaksi belum punya nomor resi / kurir' },
        { status: 400 }
      )
    }

    // ==== API key ====
    const apiKey = process.env.RAJAONGKIR_COST_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: 'RAJAONGKIR_COST_KEY tidak ditemukan di env' },
        { status: 500 }
      )
    }

    // ==== Call provider dengan timeout ====
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

    const res = await fetch(KOMERCE_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        key: apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ awb: tx.trackingNumber, courier: tx.courierCode }),
      cache: 'no-store',
      signal: controller.signal,
    }).catch((e) => {
      if (e?.name === 'AbortError') {
        return new Response(null, { status: 504, statusText: 'Timeout' })
      }
      throw e
    })

    clearTimeout(timeout)

    if (!res) {
      return NextResponse.json({ ok: false, message: 'Tidak ada respons dari provider' }, { status: 502 })
    }

    const ctype = res.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      const snippet = await res.text().catch(() => '')
      const reason = res.status === 404 ? 'Resi tidak ditemukan' : 'Respons bukan JSON dari provider'
      return NextResponse.json(
        { ok: false, message: reason, httpStatus: res.status, snippet: snippet.slice(0, 200) },
        { status: 502 }
      )
    }

    const body = await res.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { ok: false, message: 'Gagal parse JSON dari provider', httpStatus: 502 },
        { status: 502 }
      )
    }

    const metaCode = body?.meta?.code
    if (!res.ok || (typeof metaCode === 'number' && metaCode >= 400)) {
      return NextResponse.json(
        { ok: false, message: body?.meta?.message || 'Gagal tracking', raw: body, httpStatus: res.status },
        { status: 502 }
      )
    }

    const data = body?.data
    if (!data) {
      return NextResponse.json(
        { ok: false, message: 'Data tracking kosong dari provider', raw: body },
        { status: 502 }
      )
    }

    // ==== Normalisasi & update ringan ====
    const providerStatus =
      data?.delivery_status?.status ||
      data?.summary?.status ||
      data?.status ||
      ''

    const normalized = toOrderStatus(providerStatus) // 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED'

    const updates: Record<string, any> = {}
    if (normalized === 'DELIVERED') {
      const podDate = data?.delivery_status?.pod_date ?? ''
      const podTime = data?.delivery_status?.pod_time ?? '00:00:00'
      const deliveredIso = podDate ? new Date(`${podDate}T${podTime}`) : new Date()
      updates.deliveredAt = tx.deliveredAt ?? deliveredIso
      // tidak wajib ubah status user-side, tapi aman kalau kita set 'done'
      if (tx.status !== 'done') updates.status = 'done'
    } else if (normalized === 'SHIPPED') {
      if (!tx.shippedAt) updates.shippedAt = new Date()
      if (tx.status === 'paid' || tx.status === 'processing') updates.status = 'shipped'
    }

    if (Object.keys(updates).length > 0) {
      await prisma.transaction.update({ where: { id: tx.id }, data: updates })
    }

    return NextResponse.json({ ok: true, meta: body.meta, data: body.data })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json({ ok: false, message: 'Timeout ke provider' }, { status: 504 })
    }
    console.error('[USER TRANSACTION TRACK ERROR]', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
