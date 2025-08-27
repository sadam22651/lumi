import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

// Middleware auth reusable
async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.split(' ')[1]
  const decoded = await adminAuth.verifyIdToken(token)
  const firebaseUid = decoded.uid

  const user = await prisma.user.findUnique({ where: { firebaseUid } })
  return user
}

// GET: Ambil isi keranjang + info ongkir
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
      },
    })

    const cart = await prisma.cart.findUnique({ where: { userId: user.id } })

    return NextResponse.json({
      items: cartItems,
      shipping: cart ?? null,
    })
  } catch (err) {
    console.error('Gagal ambil keranjang:', err)
    return NextResponse.json({ error: 'Gagal mengambil keranjang' }, { status: 500 })
  }
}

// POST: Tambah atau update (increment) item di keranjang
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity } = await req.json()
    if (!productId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    // Buat cart kosong jika belum ada
    await prisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    })

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: user.id,
        productId,
        quantity,
      },
    })

    return NextResponse.json({ message: 'Berhasil ditambahkan ke keranjang', item })
  } catch (err) {
    console.error('Gagal tambah keranjang:', err)
    return NextResponse.json({ error: 'Gagal menambahkan ke keranjang' }, { status: 500 })
  }
}

// PATCH: Update jumlah item (bisa + atau - atau set langsung)
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId, quantity } = await req.json()
    if (!productId || typeof quantity !== 'number') {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    if (quantity <= 0) {
      // Hapus jika 0
      await prisma.cartItem.delete({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
      })

      return NextResponse.json({ message: 'Item dihapus karena jumlah = 0' })
    }

    const updated = await prisma.cartItem.update({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
      data: { quantity },
    })

    return NextResponse.json({ message: 'Jumlah berhasil diupdate', item: updated })
  } catch (err) {
    console.error('Gagal update keranjang:', err)
    return NextResponse.json({ error: 'Gagal update jumlah item' }, { status: 500 })
  }
}

// DELETE: Hapus item
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'productId wajib diisi' }, { status: 400 })
    }

    await prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    })

    return NextResponse.json({ message: 'Item berhasil dihapus dari keranjang' })
  } catch (err) {
    console.error('Gagal hapus keranjang:', err)
    return NextResponse.json({ error: 'Gagal hapus item' }, { status: 500 })
  }
}
