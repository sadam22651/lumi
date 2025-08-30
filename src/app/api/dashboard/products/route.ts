// src/app/api/products/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

/** Util: pastikan aman ambil pesan error */
function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Server error'
}

/** Util: konversi ke number dengan default (tanpa NaN) */
function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : Number(value as number)
  return Number.isFinite(n) ? n : fallback
}

/** =========================
 *  POST /api/products
 *  ========================= */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string
      price?: number | string
      stock?: number | string
      categoryId?: string | null
      detail?: string | null
      weight?: number | string | null
      size?: string | null
      imageUrl?: string | null
    }

    const {
      name,
      price,
      stock,
      categoryId,
      detail,
      weight,
      size,
      imageUrl,
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
        price: toNumber(price, 0),
        stock: toNumber(stock, 0),
        categoryId: categoryId || null,
        detail: (detail?.trim() || 'detail belum ditambahkan'),
        weight: weight != null ? toNumber(weight, 100) : 100,
        size: size ? String(size).trim() : null,
        imageUrl: imageUrl || null,
        isActive: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}

/** =========================
 *  GET /api/products
 *  ========================= */
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
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 })
  }
}
