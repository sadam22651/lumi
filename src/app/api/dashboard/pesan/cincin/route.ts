import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/firebase-admin"
import { Prisma, OrderStatus } from "@prisma/client"

const adminList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean)

async function getAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return null
    const token = authHeader.split(" ")[1]
    const decoded = await adminAuth.verifyIdToken(token)
    if (!decoded?.email || !adminList.includes(decoded.email)) return null
    return decoded
  } catch {
    return null
  }
}

function toOrderStatus(value?: string | null): OrderStatus | undefined {
  if (!value) return undefined
  return (Object.values(OrderStatus) as string[]).includes(value) ? (value as OrderStatus) : undefined
}

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "all" // ring | necklace | all
  const statusEnum = toOrderStatus(searchParams.get("status"))
  const page = Number(searchParams.get("page") ?? 1)
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? 10), 50)
  const skip = Math.max(0, (page - 1) * pageSize)

  try {
    if (type === "ring") {
      const ringWhere: Prisma.RingOrderWhereInput = statusEnum ? { status: statusEnum } : {}

      const [rows, total] = await Promise.all([
        prisma.ringOrder.findMany({
          where: ringWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            createdAt: true,
            status: true,
            customerName: true,
            phone: true,
            address: true,
            ringSize: true,
            engraveText: true,
            quantity: true,
            notes: true,
          },
        }),
        prisma.ringOrder.count({ where: ringWhere }),
      ])
      return NextResponse.json({ type, rows, total, page, pageSize })
    }

    if (type === "necklace") {
      const necklaceWhere: Prisma.NecklaceOrderWhereInput = statusEnum ? { status: statusEnum } : {}

      const [rows, total] = await Promise.all([
        prisma.necklaceOrder.findMany({
          where: necklaceWhere,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
          select: {
            id: true,
            createdAt: true,
            status: true,
            customerName: true,
            phone: true,
            address: true,
            nameText: true,
            chainLength: true,
            fontStyle: true,
            quantity: true,
            notes: true,
          },
        }),
        prisma.necklaceOrder.count({ where: necklaceWhere }),
      ])
      return NextResponse.json({ type, rows, total, page, pageSize })
    }

    // type === "all"
    const ringWhereAll: Prisma.RingOrderWhereInput = statusEnum ? { status: statusEnum } : {}
    const necklaceWhereAll: Prisma.NecklaceOrderWhereInput = statusEnum ? { status: statusEnum } : {}

    const [rings, necklaces] = await Promise.all([
      prisma.ringOrder.findMany({
        where: ringWhereAll,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          createdAt: true,
          status: true,
          customerName: true,
          phone: true,
          address: true,
          ringSize: true,
          engraveText: true,
          quantity: true,
          notes: true,
        },
      }),
      prisma.necklaceOrder.findMany({
        where: necklaceWhereAll,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          createdAt: true,
          status: true,
          customerName: true,
          phone: true,
          address: true,
          nameText: true,
          chainLength: true,
          fontStyle: true,
          quantity: true,
          notes: true,
        },
      }),
    ])

    return NextResponse.json({ type: "all", rows: { rings, necklaces }, page, pageSize })
  } catch {
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 })
  }
}
