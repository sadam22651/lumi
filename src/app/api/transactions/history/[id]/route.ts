import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await context.params

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const firebaseUid = decoded.uid

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (err) {
    console.error('[TRANSACTION DETAIL ERROR]', err)
    return NextResponse.json({ error: 'Gagal mengambil detail transaksi' }, { status: 500 })
  }
}
