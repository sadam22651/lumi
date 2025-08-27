import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

const prisma = new PrismaClient()

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]

    let decoded
    try {
      decoded = await adminAuth.verifyIdToken(token)
    } catch (error) {
      console.error('Token invalid:', error)
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const userId = decoded.uid
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID transaksi tidak ditemukan' }, { status: 400 })
    }

    // Pastikan transaksi milik user
    const existingTransaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: { items: true },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan atau tidak milik user' }, { status: 404 })
    }

    // Ambil isi keranjang dari database
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })
    }

    // Kembalikan stok dari transaksi sebelumnya
    for (const oldItem of existingTransaction.items) {
      await prisma.product.update({
        where: { id: oldItem.productId },
        data: {
          stock: { increment: oldItem.quantity }
        }
      })
    }

    // Hapus item transaksi lama
    await prisma.transactionItem.deleteMany({
      where: { transactionId: id }
    })

    let totalAmount = 0

    for (const item of cartItems) {
      const product = item.product
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Stok produk ${product.name} tidak mencukupi` }, { status: 400 })
      }

      await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: item.quantity }
        }
      })

      await prisma.transactionItem.create({
        data: {
          transactionId: id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        }
      })

      totalAmount += product.price * item.quantity
    }

    // Update transaksi
    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        totalAmount,
      },
      include: {
        items: { include: { product: true } },
        user: true,
      }
    })

    // Kosongkan keranjang user
    await prisma.cartItem.deleteMany({ where: { userId } })

    return NextResponse.json(updatedTransaction)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
