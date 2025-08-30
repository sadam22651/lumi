// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'
import type { Prisma } from '@prisma/client'

export const dynamic = 'force-dynamic'

type RouteParamsAsync = { params: Promise<{ id: string }> }
type PatchBody = { action?: 'cancel' }
type OrderWithItems = Prisma.TransactionGetPayload<{ include: { items: true } }>

// GET /api/orders/:id
export async function GET(req: NextRequest, { params }: RouteParamsAsync) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = auth.split(' ')[1]
  const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
  if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })

  const me = await prisma.user.findUnique({
    where: { firebaseUid: decoded.uid },
    select: { id: true },
  })
  if (!me) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

  const { id } = await params // ⬅️ wajib await

  const order = await prisma.transaction.findUnique({
    where: { id },
    include: {
      items: {
        select: {
          quantity: true,
          price: true,
          product: { select: { id: true, name: true, imageUrl: true } },
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
export async function PATCH(req: NextRequest, { params }: RouteParamsAsync) {
  try {
    const auth = req.headers.get('authorization')
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const token = auth.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })

    const me = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true },
    })
    if (!me) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })

    const { id } = await params // ⬅️ wajib await

    // Parse body tanpa any
    let bodyUnknown: unknown
    try {
      bodyUnknown = await req.json()
    } catch {
      bodyUnknown = {}
    }
    const { action } = (bodyUnknown ?? {}) as PatchBody

    const order = (await prisma.transaction.findUnique({
      where: { id },
      include: { items: true },
    })) as OrderWithItems | null

    if (!order || order.userId !== me.id) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 })
    }

    if (action === 'cancel') {
      // status di schema Transaction bertipe String → validasi manual
      if (!['paid', 'processing'].includes(order.status)) {
        return NextResponse.json({ error: 'Order tidak bisa dibatalkan' }, { status: 400 })
      }

      const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // kembalikan stok
        for (const it of order.items) {
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } },
          })
        }
        // update status tanpa cast any
        return tx.transaction.update({
          where: { id: order.id },
          data: { status: 'cancelled' },
        })
      })

      return NextResponse.json({ ok: true, order: updated })
    }

    return NextResponse.json({ error: 'Aksi tidak dikenali' }, { status: 400 })
  } catch (e: unknown) {
    // ketik catch variable sebagai unknown (bukan any)
    console.error('[PATCH /api/orders/:id]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
