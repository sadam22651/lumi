// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

// GET /api/orders/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⬅️ params adalah Promise
) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = auth.split(' ')[1]
  const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
  if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })

  const me = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid }, select: { id: true } })
  if (!me) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const { id } = await params // ⬅️ await dulu, baru pakai id

  const order = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          quantity: true,
          price: true,
          product: { select: { id: true, name: true, image: true } },
        },
      },
    },
  })
  if (!order || order.userId !== me.id) {
    return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
  }
  return NextResponse.json({ order })
}

// PATCH /api/orders/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ⬅️ sama seperti GET
) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const token = auth.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })

    const me = await prisma.user.findUnique({ where: { firebaseUid: decoded.uid }, select: { id: true } })
    if (!me) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    const { id } = await params // ⬅️ await di sini juga
    const { action } = await req.json().catch(() => ({} as any))

    const order = await prisma.transaction.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order || order.userId !== me.id) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    if (action === 'cancel') {
      if (!['paid', 'processing'].includes(order.status)) {
        return NextResponse.json({ error: 'Order tidak bisa dibatalkan' }, { status: 400 })
      }
      const updated = await prisma.$transaction(async (tx) => {
        for (const it of order.items) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } },
          })
        }
        return tx.transaction.update({
          where: { id: order.id },
          data: { status: 'cancelled' as any },
        })
      })
      return NextResponse.json({ ok: true, order: updated })
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 })
  } catch (e) {
    console.error('[PATCH /api/orders/:id]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
