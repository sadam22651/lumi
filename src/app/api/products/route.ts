// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs' // ✅ supaya Prisma tidak jalan di Edge
const prisma = new PrismaClient()

// POST /api/products
export async function POST(req: Request) {
  const {
    name,
    price,
    imageUrl,   // ✅ pakai imageUrl
    detail,
    categoryId,
    stock,
    weight,
    size, // ✅ gunakan `size` bukan `ringSize`
  } = await req.json()

  if (!name || !price || !stock) {
    return NextResponse.json(
      { error: 'Data tidak lengkap (nama, harga, atau stok kosong)' },
      { status: 400 }
    )
  }

  const product = await prisma.product.create({
    data: {
      name,
      price: parseInt(price, 10),
      stock: parseInt(stock, 10),
      weight: weight ? parseInt(weight, 10) : undefined,
      size: size?.trim() || undefined,
      imageUrl, // ✅ simpan ke kolom imageUrl
      detail: detail?.trim() || undefined,
      categoryId,
    },
    include: {
      category: true,
    },
  })

  return NextResponse.json(product)
}

// GET /api/products
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') || ''
  const categoryId = searchParams.get('categoryId') || ''

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      name: {
        contains: name,
        mode: 'insensitive',
      },
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return NextResponse.json(products)
}
