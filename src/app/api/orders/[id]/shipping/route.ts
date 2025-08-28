// src/app/api/orders/[id]/shipping/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'
import { COURIER_CODES, type CourierCode, labelToCode } from '@/lib/shipping/couriers'

export const dynamic = 'force-dynamic'

// Cek admin via env: NEXT_PUBLIC_ADMIN_EMAIL="a@x.com,b@y.com"
function isEmailAdmin(email?: string | null) {
  const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''
  const list = adminEnv.split(',').map((s) => s.trim()).filter(Boolean)
  return !!email && list.includes(email)
}

// Type guard untuk error dari Prisma (punya .code)
type WithCode = { code?: string }
function hasCode(err: unknown): err is WithCode {
  return typeof err === 'object' && err !== null && 'code' in err
}

type RouteParamsAsync = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParamsAsync) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID transaksi kosong' }, { status: 400 })
    }

    // ===== Auth & admin check =====
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) {
      return NextResponse.json({ ok: false, error: 'Token tidak valid' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { email: true },
    })
    if (!isEmailAdmin(user?.email)) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    // ===== Body & normalisasi =====
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      rawBody = {}
    }
    const body = (rawBody && typeof rawBody === 'object'
      ? (rawBody as Record<string, unknown>)
      : {}) as Record<string, unknown>

    const trackingNumber = typeof body.waybill === 'string'
      ? body.waybill.trim()
      : String(body.waybill ?? '').trim()

    const courierRaw = typeof body.courier === 'string'
      ? body.courier.trim()
      : String(body.courier ?? '').trim()

    if (!trackingNumber || !courierRaw) {
      return NextResponse.json(
        { ok: false, error: 'waybill & courier wajib diisi' },
        { status: 400 },
      )
    }
    if (trackingNumber.length < 5) {
      return NextResponse.json(
        { ok: false, error: 'Format waybill/resi tidak valid' },
        { status: 400 },
      )
    }

    // Terima code langsung (jnt/sicepat/…) atau label (J&T Express, SiCepat, …)
    const normalized: CourierCode | null =
      (COURIER_CODES as readonly string[]).includes(courierRaw.toLowerCase())
        ? (courierRaw.toLowerCase() as CourierCode)
        : labelToCode(courierRaw)

    if (!normalized) {
      return NextResponse.json(
        { ok: false, error: `Kurir tidak dikenal. Gunakan salah satu code: ${COURIER_CODES.join(', ')}` },
        { status: 400 },
      )
    }

    // (opsional) cek transaksi eksis dulu
    const existing = await prisma.transaction.findUnique({
      where: { id },
      select: { trackingNumber: true, courierCode: true },
    })
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    // (opsional) kalau tidak ada perubahan, return cepat
    if (existing.trackingNumber === trackingNumber && existing.courierCode === normalized) {
      return NextResponse.json({
        ok: true,
        unchanged: true,
        transaction: { id, trackingNumber, courierCode: normalized },
      })
    }

    // ===== Simpan =====
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        trackingNumber,
        courierCode: normalized, // simpan lowercase konsisten
        // bisa juga otomatis set status/ shippedAt di sini jika mau
      },
      select: { id: true, trackingNumber: true, courierCode: true },
    })

    return NextResponse.json({ ok: true, transaction: updated })
  } catch (err: unknown) {
    if (hasCode(err) && err.code === 'P2025') {
      return NextResponse.json({ ok: false, error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }
    console.error('[ORDERS/SHIPPING POST ERROR]', err)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
