import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/firebase-admin"

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

export async function GET(req: NextRequest) {
  const admin = await getAdmin(req)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "all"         // ring | necklace | all
  const status = searchParams.get("status") || undefined // PENDING/REVIEW/...
  const page = Number(searchParams.get("page") ?? 1)
  const pageSize = Math.min(Number(searchParams.get("pageSize") ?? 10), 50)
  const skip = Math.max(0, (page - 1) * pageSize)

  try {
    if (type === "ring") {
      const [rows, total] = await Promise.all([
        prisma.ringOrder.findMany({
          where: { ...(status ? { status: status as any } : {}) },
          orderBy: { createdAt: "desc" },
          skip, take: pageSize,
          select: {
            id: true, createdAt: true, status: true,
            customerName: true, phone: true, ringSize: true, engraveText: true, quantity: true, notes: true,
          },
        }),
        prisma.ringOrder.count({ where: { ...(status ? { status: status as any } : {}) } }),
      ])
      return NextResponse.json({ type, rows, total, page, pageSize })
    }

    if (type === "necklace") {
      const [rows, total] = await Promise.all([
        prisma.necklaceOrder.findMany({
          where: { ...(status ? { status: status as any } : {}) },
          orderBy: { createdAt: "desc" },
          skip, take: pageSize,
          select: {
            id: true, createdAt: true, status: true,
            customerName: true, phone: true, nameText: true, chainLength: true, fontStyle: true, quantity: true, notes: true,
          },
        }),
        prisma.necklaceOrder.count({ where: { ...(status ? { status: status as any } : {}) } }),
      ])
      return NextResponse.json({ type, rows, total, page, pageSize })
    }

    const [rings, necklaces] = await Promise.all([
      prisma.ringOrder.findMany({
        where: { ...(status ? { status: status as any } : {}) },
        orderBy: { createdAt: "desc" },
        skip, take: pageSize,
        select: {
          id: true, createdAt: true, status: true,
          customerName: true, phone: true, ringSize: true, engraveText: true, quantity: true, notes: true,
        },
      }),
      prisma.necklaceOrder.findMany({
        where: { ...(status ? { status: status as any } : {}) },
        orderBy: { createdAt: "desc" },
        skip, take: pageSize,
        select: {
          id: true, createdAt: true, status: true,
          customerName: true, phone: true, nameText: true, chainLength: true, fontStyle: true, quantity: true, notes: true,
        },
      }),
    ])

    return NextResponse.json({ type: "all", rows: { rings, necklaces }, page, pageSize })
  } catch {
    return NextResponse.json({ error: "Gagal memuat pesanan" }, { status: 500 })
  }
}
