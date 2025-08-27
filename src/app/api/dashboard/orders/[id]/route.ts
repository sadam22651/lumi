// src/app/api/dashboard/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// ——— util kecil ———
function isEmailAdmin(email?: string | null) {
  const adminEnv = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''
  const adminList = adminEnv.split(',').map(s => s.trim()).filter(Boolean)
  return !!email && adminList.includes(email)
}

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return { error: NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 }) }
  }

  const token = authHeader.split(' ')[1]
  let firebaseUid = ''
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    firebaseUid = decoded.uid
  } catch {
    return { error: NextResponse.json({ error: 'Token tidak valid' }, { status: 401 }) }
  }

  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: { email: true },
  })

  if (!isEmailAdmin(user?.email)) {
    return { error: NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 }) }
  }

  return { ok: true as const }
}

// Select kolom yang diperlukan FE (hemat)
const txSelect = {
  id: true,
  createdAt: true,

  user: { select: { name: true, email: true } },
  recipientPhone: true,
  address: true,
  subdistrictName: true,

  courierName: true,
  serviceName: true,
  etd: true,
  shippingCost: true,
  totalAmount: true,

  // tracking
  courierCode: true,
  trackingNumber: true,
  status: true,           // 'paid' | 'processing' | 'shipped' | 'done' | 'cancelled'
  shippedAt: true,
  deliveredAt: true,

  // barang ringkas
  items: {
    select: {
      id: true,
      quantity: true,
      price: true,
      product: { select: { name: true } },
    },
  },
} as const

/** =========================
 *  GET: Detail transaksi (ADMIN)
 *  ========================= */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }, // ⬅️ BUKAN Promise
) {
  try {
    const guard = await requireAdmin(req)
    if ('error' in guard) return guard.error

    const { id } = await params
    if (!id) return NextResponse.json({ error: 'ID kosong' }, { status: 400 })

    const tx = await prisma.transaction.findUnique({
      where: { id },
      select: txSelect,
    })

    if (!tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ transaction: tx })
  } catch (err) {
    console.error('[ADMIN TRANSACTION GET ERROR]', err)
    return NextResponse.json({ error: 'Gagal ambil detail transaksi' }, { status: 500 })
  }
}

/** =========================
 *  PATCH: Update status transaksi (ADMIN)
 *  ========================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }, // ⬅️ BUKAN Promise
) {
  try {
    const guard = await requireAdmin(req)
    if ('error' in guard) return guard.error

    const { id } = params
    if (!id) return NextResponse.json({ error: 'ID kosong' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const newStatus = String(body?.newStatus || '')

    const allowed = ['paid', 'processing', 'shipped', 'done', 'cancelled'] as const
    if (!allowed.includes(newStatus as any)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 })
    }

    // efek samping opsional saat ganti status
    const data: any = { status: newStatus }
    const now = new Date()
    if (newStatus === 'shipped') data.shippedAt = data.shippedAt ?? now
    if (newStatus === 'done') data.deliveredAt = data.deliveredAt ?? now

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      select: { id: true, status: true, shippedAt: true, deliveredAt: true },
    })

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('[ADMIN TRANSACTION PATCH ERROR]', err)
    return NextResponse.json({ error: 'Gagal update status' }, { status: 500 })
  }
}
