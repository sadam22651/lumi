// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST /api/products
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      price,
      stock,
      categoryId,
      detail,
      weight,
      size,
      imageUrl, // ✅ URL dari Supabase Storage
    } = body || {}

    if (!name || price == null || stock == null) {
      return NextResponse.json(
        { error: 'Data tidak lengkap (nama, harga, stok wajib diisi)' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        price: Number(price),
        stock: Number(stock),
        categoryId: categoryId || null,
        detail: (detail?.trim() || 'detail belum ditambahkan'),
        weight: weight != null ? Number(weight) : 100,
        size: size ? String(size).trim() : null,
        imageUrl: imageUrl || null, // ✅ simpan URL
        isActive: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}

// GET /api/products
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const name = (searchParams.get('name') || '').trim()
    const categoryId = (searchParams.get('categoryId') || '').trim()

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(name && {
          name: { contains: name, mode: 'insensitive' },
        }),
        ...(categoryId && { categoryId }),
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(products)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
