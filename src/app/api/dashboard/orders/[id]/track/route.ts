// src/app/api/orders/[id]/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'
import { toOrderStatus } from '@/lib/shipping/status-map'

export const dynamic = 'force-dynamic'

const KOMERCE_URL = 'https://rajaongkir.komerce.id/api/v1/track/waybill'
const PROVIDER_TIMEOUT_MS = 15000

function isEmailAdmin(email?: string | null) {
  const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL??''
  const list = adminEnv.split(',').map(s => s.trim()).filter(Boolean)
  return !!email && list.includes(email)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ⬅️ params adalah Promise
) {
  try {
    const { id } = await params                           // ⬅️ await dulu
    if (!id) {
      return NextResponse.json({ ok: false, message: 'ID transaksi kosong' }, { status: 400 })
    }

    // ===== Auth: hanya admin =====
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) {
      return NextResponse.json({ ok: false, message: 'Token tidak valid' }, { status: 401 })
    }
    const adminUser = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { email: true },
    })
    if (!isEmailAdmin(adminUser?.email)) {
      return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
    }

    // ===== Ambil transaksi =====
    const tx = await prisma.transaction.findUnique({
      where: { id },
      select: {
        id: true,
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
    if (!tx.trackingNumber || !tx.courierCode) {
      return NextResponse.json(
        { ok: false, message: 'Transaksi belum punya nomor resi / kurir' },
        { status: 400 }
      )
    }

    // ===== API key =====
    const apiKey = process.env.RAJAONGKIR_COST_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: 'RAJAONGKIR_COST_KEY tidak ditemukan di env' },
        { status: 500 }
      )
    }

    // ===== Call provider (timeout) =====
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

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
    clearTimeout(t)

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

    // ===== Normalisasi status =====
    const providerStatus =
      data?.delivery_status?.status ||
      data?.summary?.status ||
      data?.status ||
      ''
    const normalized = toOrderStatus(providerStatus) // 'PENDING' | 'PACKED' | 'SHIPPED' | 'DELIVERED'

    // ===== Update transaksi bila perlu =====
    const updates: Record<string, any> = {}
    if (normalized === 'DELIVERED') {
      const podDate = data?.delivery_status?.pod_date ?? ''
      const podTime = data?.delivery_status?.pod_time ?? '00:00:00'
      const podIso = podDate ? new Date(`${podDate}T${podTime}`) : new Date()
      updates.deliveredAt = tx.deliveredAt ?? podIso
      if (tx.status !== 'done') updates.status = 'done'
    }
    if (normalized === 'SHIPPED') {
      if (!tx.shippedAt) updates.shippedAt = new Date()
      if (tx.status === 'paid' || tx.status === 'processing') updates.status = 'shipped'
    }
    // (opsional) simpan cache tracking
    // updates.tracking_json = body
    // updates.last_tracked_at = new Date()

    if (Object.keys(updates).length > 0) {
      await prisma.transaction.update({ where: { id: tx.id }, data: updates })
    }

    return NextResponse.json({ ok: true, meta: body.meta, data: body.data })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json({ ok: false, message: 'Timeout ke provider' }, { status: 504 })
    }
    console.error('[ORDERS/TRACK POST ERROR]', err)
    return NextResponse.json({ ok: false, message: 'Server error' }, { status: 500 })
  }
}
