// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
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

    const orders = await prisma.transaction.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, totalAmount: true, status: true, createdAt: true,
        shippedAt: true, deliveredAt: true,
        items: { select: { quantity: true, price: true, product: { select: { name: true, image: true } } } },
      },
    })
    return NextResponse.json({ orders })
  } catch (e) {
    console.error('[GET /api/orders]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
