import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth } from "@/lib/firebase-admin"

async function getUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return null
    const token = authHeader.split(" ")[1]
    const decoded = await adminAuth.verifyIdToken(token)
    return prisma.user.findUnique({ where: { firebaseUid: decoded.uid } })
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customerName,
      phone,
      address,
      ringSize,
      engraveText,
      quantity = 1,
      notes,
    } = body ?? {}

    if (!customerName || String(customerName).trim().length < 2)
      return NextResponse.json({ error: "Nama pemesan tidak valid" }, { status: 400 })
    if (!phone || String(phone).trim().length < 8)
      return NextResponse.json({ error: "Nomor telepon tidak valid" }, { status: 400 })
    if (!address || String(address).trim().length < 10)
      return NextResponse.json({ error: "Alamat terlalu singkat" }, { status: 400 })

    const sizeNum = Number(ringSize)
    if (!Number.isFinite(sizeNum) || sizeNum < 5 || sizeNum > 30)
      return NextResponse.json({ error: "Ukuran cincin 5–30" }, { status: 400 })

    const qtyNum = Number(quantity)
    if (!Number.isFinite(qtyNum) || qtyNum < 1 || qtyNum > 10)
      return NextResponse.json({ error: "Jumlah 1–10" }, { status: 400 })

    const user = await getUser(req)

    const created = await prisma.ringOrder.create({
      data: {
        userId: user?.id ?? null,
        customerName: String(customerName).trim(),
        phone: String(phone).trim(),
        address: String(address).trim(),
        ringSize: sizeNum,
        engraveText: engraveText ? String(engraveText).trim() : null,
        quantity: qtyNum,
        notes: notes ? String(notes).trim() : null,
      },
      select: { id: true, status: true, createdAt: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pesanan" }, { status: 500 })
  }
}
