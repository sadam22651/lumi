// src/app/api/reports/transactions/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient }  from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')   // format YYYY-MM-DD
  const to   = searchParams.get('to')

  // Tetapkan rentang tanggal
  const startDate = from ? new Date(from)              : new Date('1900-01-01')
  const endDate   = to   ? new Date(to + 'T23:59:59') : new Date()

  // 1) Ambil semua transaksi dalam rentang
  const items = await prisma.transaction.findMany({
    where: { createdAt: { gte: startDate, lte: endDate } },
    include: {
      user: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // 2) Hitung total keseluruhan
  const totalAmount = items.reduce((sum, tx) => sum + tx.totalAmount, 0)

  // 3) Ringkasan per hari
  const summaryByDay = await prisma.transaction.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: { totalAmount: true },
  })

  return NextResponse.json({ items, totalAmount, summaryByDay })
}
