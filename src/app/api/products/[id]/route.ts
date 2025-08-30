// src/app/api/products/[id]/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs' // Prisma tidak jalan di Edge
const prisma = new PrismaClient()

// GET /api/products/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!product || product.isActive === false) {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json(product)
}

// PATCH /api/products/:id
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { name, price, stock, imageUrl, detail, categoryId, weight, size } = await req.json()

  if (!name || price == null || stock == null) {
    return NextResponse.json(
      { error: 'Data tidak lengkap (nama, harga, stok wajib diisi)' },
      { status: 400 }
    )
  }

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.isActive === false) {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name: String(name),
      price: Number(price),
      stock: Number(stock),
      // pakai imageUrl baru kalau ada; kalau tidak, pertahankan yang lama
      imageUrl: imageUrl ?? existing.imageUrl,
      detail: detail ?? existing.detail,
      categoryId: categoryId ?? existing.categoryId,
      weight: weight != null ? Number(weight) : existing.weight,
      size: size ?? existing.size,
    },
    include: { category: true },
  })

  return NextResponse.json(updated)
}

// DELETE /api/products/:id (soft delete)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.isActive === false) {
    return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
  }

  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ message: 'Produk berhasil dinonaktifkan' })
}
