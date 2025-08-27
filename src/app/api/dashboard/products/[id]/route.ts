// src/app/api/products/[id]/route.ts

import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// GET /api/products/:id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  })

  if (!product || product.isActive === false) {
    return NextResponse.json(
      { error: 'Produk tidak ditemukan' },
      { status: 404 }
    )
  }

  return NextResponse.json(product)
}

// PATCH /api/products/:id
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const {
    name,
    price,
    stock,
    image,
    detail,
    categoryId,
    weight,
    size,
  } = await req.json()

  if (!name || !price || !stock) {
    return NextResponse.json(
      { error: 'Data tidak lengkap (nama, harga, atau stok kosong)' },
      { status: 400 }
    )
  }

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.isActive === false) {
    return NextResponse.json(
      { error: 'Produk tidak ditemukan' },
      { status: 404 }
    )
  }

  // Hapus file gambar lama jika ganti image
  if (image && image !== existing.image && existing.image) {
    const oldPath = path.join(process.cwd(), 'public', 'uploads', existing.image)
    if (fs.existsSync(oldPath)) {
      await fs.promises.unlink(oldPath)
    }
  }

  const updated = await prisma.product.update({
    where: { id },
    data: {
      name,
      price: parseInt(price, 10),
      stock: parseInt(stock, 10),
      image,
      detail: detail ?? undefined,
      categoryId,
      weight: weight != null ? parseInt(weight, 10) : undefined,
      size: size ?? undefined,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/products/:id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing || existing.isActive === false) {
    return NextResponse.json(
      { error: 'Produk tidak ditemukan' },
      { status: 404 }
    )
  }

  // (opsional) hapus file gambar lama
  if (existing.image) {
    const imgPath = path.join(process.cwd(), 'public', 'uploads', existing.image)
    if (fs.existsSync(imgPath)) {
      await fs.promises.unlink(imgPath)
    }
  }

  // Soft-delete: set isActive = false
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })

  return NextResponse.json({ message: 'Produk berhasil dinonaktifkan' })
}
