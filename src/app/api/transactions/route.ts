// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma' // prisma singleton

export const dynamic = 'force-dynamic'

type ItemInput = { productId: string; quantity: number }

export async function POST(req: NextRequest) {
  try {
    // ===== 1) Auth (token Firebase user) =====
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token).catch(() => null)
    if (!decoded) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }
    const firebaseUid = decoded.uid

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // ===== 2) Body =====
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })
    }

    const {
      items,                   // [{ productId, quantity }]
      courierName,
      serviceName,
      shippingCost,
      etd,
      isCod,
      totalAmount,

      // penting untuk tracking (disimpan ke DB)
      courierCode,             // HARUS dikirim dari FE (kode kurir yang valid)

      // alamat & penerima
      recipientName,
      recipientPhone,
      address,
      subdistrictId,
      subdistrictName,
    } = body as {
      items: ItemInput[]
      courierName: string
      serviceName: string
      shippingCost: number
      etd: string
      isCod: boolean
      totalAmount: number
      courierCode?: string
      recipientName: string
      recipientPhone: string
      address: string
      subdistrictId: number
      subdistrictName: string
    }

    // ===== 3) Validasi sederhana =====
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Data item kosong' }, { status: 400 })
    }
    if (!recipientName || !recipientPhone || !address || !subdistrictId || !subdistrictName) {
      return NextResponse.json({ error: 'Data alamat tidak lengkap' }, { status: 400 })
    }
    if (!courierName || !serviceName || typeof shippingCost !== 'number') {
      return NextResponse.json({ error: 'Data pengiriman tidak lengkap' }, { status: 400 })
    }
    if (!courierCode) {
      return NextResponse.json({ error: 'courierCode tidak ada. Pastikan FE mengirimkannya.' }, { status: 400 })
    }

    // ===== 4) Transaksi DB (atomic) =====
    const result = await prisma.$transaction(async (tx) => {
      // 4a. Ambil produk yang diperlukan
      const productIds = [...new Set(items.map(i => i.productId))]
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, stock: true },
      })

      const map = new Map(products.map(p => [p.id, p]))

      // 4b. Validasi stok + bentuk payload items transaksi
      const itemsToCreate = items.map((i) => {
        const p = map.get(i.productId)
        if (!p) throw new Error(`Produk dengan ID ${i.productId} tidak ditemukan`)
        if (p.stock < i.quantity) throw new Error(`Stok produk ${p.name} tidak mencukupi`)
        return { productId: i.productId, quantity: i.quantity, price: p.price } // snapshot harga saat checkout
      })

      // 4c. Buat transaksi utama
      const trx = await tx.transaction.create({
        data: {
          userId: user.id,

          // pengiriman
          courierName,
          serviceName,
          shippingCost,
          etd,
          isCod,
          totalAmount,

          // tracking
          courierCode,            // disimpan untuk proses tracking selanjutnya
          // trackingNumber: null, // (opsional) diisi admin ketika barang dikirim

          // alamat
          recipientName,
          recipientPhone,
          address,
          subdistrictId,
          subdistrictName,

          status: 'paid',

          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: { include: { product: true } },
        },
      })

      // 4d. Kurangi stok setiap produk
      for (const i of items) {
        await tx.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.quantity } },
        })
      }

      // 4e. Kosongkan keranjang user (sesuai schema kamu: CartItem punya userId)
      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      })

      // (Opsional) Kalau kamu ingin reset info ongkir yang tersimpan di Cart,
      // pastikan field-nya ada di schema Cart kamu, lalu un-comment & sesuaikan:
      //
      // await tx.cart.update({
      //   where: { userId: user.id },
      //   data: {
      //     // contoh field — ganti sesuai schema Cart kamu
      //     // courier: null,
      //     // courierCode: null,
      //     // service: null,
      //     // etd: null,
      //     // cost: 0,
      //     // weight: 0,
      //     // originCityId: null,
      //     // destinationSubdistrictId: null,
      //   },
      // }).catch(() => null)

      return trx
    })

    return NextResponse.json(result, {
      status: 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err: any) {
    // Error yang dilempar dari dalam $transaction (throw new Error(...))
    if (typeof err?.message === 'string' && err.message.startsWith('Stok produk')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (typeof err?.message === 'string' && err.message.includes('Produk dengan ID')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }

    console.error('TRANSACTION ERROR:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
