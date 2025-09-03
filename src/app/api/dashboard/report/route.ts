// src/app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // pastikan ada helper prisma; kalau tidak, instansiasi PrismaClient langsung
// import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient();

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type GroupBy = 'day' | 'month' | 'year'

type Body = {
  startDate: string // ISO, contoh: "2025-08-01"
  endDate: string   // ISO, contoh: "2025-08-31"
  groupBy?: GroupBy
  topN?: number
  includeCancelled?: boolean // default false
}

function parseISODate(s: string) {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date: ' + s)
  return d
}

function keyForDate(d: Date, mode: GroupBy) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  if (mode === 'year') return `${y}`
  if (mode === 'month') return `${y}-${m}`
  return `${y}-${m}-${day}`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const { startDate, endDate, groupBy = 'day', topN = 5, includeCancelled = false } = body

    // Validasi input
    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate dan endDate wajib diisi (format ISO)' }, { status: 400 })
    }
    const start = parseISODate(startDate)
    const end = parseISODate(endDate)
    if (end < start) {
      return NextResponse.json({ error: 'endDate harus >= startDate' }, { status: 400 })
    }

    // Ambil transaksi dalam rentang tanggal
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(includeCancelled ? {} : { NOT: { status: 'cancelled' } }),
      },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, categoryId: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Ring & Necklace custom orders (untuk jumlah & status)
    const [ringOrders, necklaceOrders] = await Promise.all([
      prisma.ringOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.necklaceOrder.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // ======= Perhitungan summary =======
    const totalOrders = transactions.length
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount ?? 0), 0)
    const uniqueCustomers = new Set(transactions.map(t => t.userId)).size
    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0

    // ======= Group by status =======
    const byStatus: Record<string, { count: number; revenue: number }> = {}
    for (const t of transactions) {
      const st = t.status || 'unknown'
      if (!byStatus[st]) byStatus[st] = { count: 0, revenue: 0 }
      byStatus[st].count += 1
      byStatus[st].revenue += t.totalAmount ?? 0
    }

    // ======= Time series (day/month/year) =======
    const timeseries: Record<string, { orders: number; revenue: number }> = {}
    for (const t of transactions) {
      const k = keyForDate(new Date(t.createdAt), groupBy)
      if (!timeseries[k]) timeseries[k] = { orders: 0, revenue: 0 }
      timeseries[k].orders += 1
      timeseries[k].revenue += t.totalAmount ?? 0
    }

    // ======= Group by courier/service =======
    const byCourier: Record<
      string,
      { orders: number; revenue: number; totalShippingCost: number }
    > = {}
    for (const t of transactions) {
      const key = `${t.courierName || 'unknown'}|${t.serviceName || 'unknown'}`
      if (!byCourier[key]) byCourier[key] = { orders: 0, revenue: 0, totalShippingCost: 0 }
      byCourier[key].orders += 1
      byCourier[key].revenue += t.totalAmount ?? 0
      byCourier[key].totalShippingCost += t.shippingCost ?? 0
    }

    // ======= Top products (qty & revenue) =======
    type ProdAgg = { id: string; name: string; qty: number; revenue: number }
    const productMap = new Map<string, ProdAgg>()
    for (const t of transactions) {
      for (const it of t.items) {
        if (!it.product) continue
        const id = it.product.id
        if (!productMap.has(id)) {
          productMap.set(id, {
            id,
            name: it.product.name,
            qty: 0,
            revenue: 0,
          })
        }
        const agg = productMap.get(id)!
        agg.qty += it.quantity ?? 0
        agg.revenue += (it.price ?? 0) * (it.quantity ?? 0)
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
      .slice(0, Math.max(1, topN))

    // ======= Custom orders summary =======
    const ringByStatus: Record<string, number> = {}
    for (const r of ringOrders) {
      const st = r.status || 'PENDING'
      ringByStatus[st] = (ringByStatus[st] ?? 0) + 1
    }
    const necklaceByStatus: Record<string, number> = {}
    for (const n of necklaceOrders) {
      const st = n.status || 'PENDING'
      necklaceByStatus[st] = (necklaceByStatus[st] ?? 0) + 1
    }

    return NextResponse.json({
      range: { startDate, endDate, groupBy },
      summary: {
        totalOrders,
        totalRevenue,
        avgOrderValue,
        uniqueCustomers,
      },
      byStatus,
      timeseries,               // { "2025-08-01": { orders, revenue }, ... }
      byCourier,                // key "courier|service" → { orders, revenue, totalShippingCost }
      topProducts,              // [{ id, name, qty, revenue }]
      customOrders: {
        ring: { total: ringOrders.length, byStatus: ringByStatus },
        necklace: { total: necklaceOrders.length, byStatus: necklaceByStatus },
      },
    })
  } catch (err) {
    console.error('REPORT ERROR:', err)
    return NextResponse.json({ error: (err as Error).message ?? 'Server error' }, { status: 500 })
  }
}
