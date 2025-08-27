import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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

    // ✅ Ganti sesuai admin kamu
    const adminEmails = [process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? '']
    const isAdmin = user?.email && adminEmails.includes(user.email)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Tidak punya akses' }, { status: 403 })
    }

    const orders = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 })
  }
}
