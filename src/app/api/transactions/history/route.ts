import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
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

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // ✅ Kirim juga field alamat (sudah otomatis disertakan karena modelnya langsung)
    return NextResponse.json(transactions)
  } catch (err) {
    console.error('[TRANSACTION HISTORY ERROR]', err)
    return NextResponse.json({ error: 'Gagal mengambil riwayat' }, { status: 500 })
  }
}
