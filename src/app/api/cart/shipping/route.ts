// src/app/api/cart/shipping/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest) {
  try {
    // ---- Auth ----
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const firebaseUid = decoded.uid

    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // ---- Body ----
    const body = await req.json().catch(() => ({} as any))
    let {
      courier_name,
      service_name,
      shipping_cost,
      etd,
      is_cod,
      // opsional: FE boleh kirim ini agar konsisten, tapi Cart tidak menyimpan
      courier_code,
    } = body as {
      courier_name?: string
      service_name?: string
      shipping_cost?: number | string
      etd?: string
      is_cod?: boolean | string
      courier_code?: string
    }

    // ---- Validasi minimal ----
    if (!courier_name || !service_name) {
      return NextResponse.json({ error: 'Data ongkir tidak lengkap (courier_name/service_name kosong)' }, { status: 400 })
    }

    // normalisasi tipe data
    const costNum =
      typeof shipping_cost === 'string' ? Number(shipping_cost) : Number(shipping_cost ?? NaN)
    if (!Number.isFinite(costNum) || costNum < 0) {
      return NextResponse.json({ error: 'shipping_cost tidak valid' }, { status: 400 })
    }

    const isCodBool =
      typeof is_cod === 'string'
        ? ['true', '1', 'yes'].includes(is_cod.toLowerCase())
        : Boolean(is_cod)

    // ---- Upsert Cart ----
    const updated = await prisma.cart.upsert({
      where: { userId: user.id },
      update: {
        courierName: courier_name,
        serviceName: service_name,
        shippingCost: Math.trunc(costNum),
        etd: etd ?? null,
        isCod: isCodBool,
      },
      create: {
        userId: user.id,
        courierName: courier_name,
        serviceName: service_name,
        shippingCost: Math.trunc(costNum),
        etd: etd ?? null,
        isCod: isCodBool,
      },
      select: {
        userId: true,
        courierName: true,
        serviceName: true,
        shippingCost: true,
        etd: true,
        isCod: true,
        updatedAt: true,
      },
    })

    // NB: courier_code tidak disimpan di Cart (schema tidak ada kolomnya).
    // Pastikan FE tetap mengirim courierCode saat POST /api/transactions.

    return NextResponse.json({
      message: 'Ongkir berhasil disimpan',
      cart: updated,
      // hanya echo balik untuk debug di FE (tidak disimpan)
      courier_code: courier_code ?? null,
    })
  } catch (err: any) {
    console.error('[CART/SHIPPING PATCH ERROR]', err?.message || err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
