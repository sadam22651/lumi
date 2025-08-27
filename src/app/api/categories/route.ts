// File: /src/app/api/categories/route.ts
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

const prisma = new PrismaClient()

// GET: Ambil semua kategori
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 })
  }
}

// POST: Tambah kategori baru
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: { name },
    })

    return NextResponse.json(category)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 })
  }
}
