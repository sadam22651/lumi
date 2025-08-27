// Pastikan route ini berjalan di Node.js runtime (bukan Edge) karena firebase-admin
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(req: NextRequest) {
  try {
    // --- Authorization header ---
    const auth = req.headers.get('authorization') ?? ''
    if (!auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const idToken = auth.slice(7).trim()
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // --- Verify Firebase ID token ---
    const decoded = await adminAuth.verifyIdToken(idToken)
    const firebaseUid = decoded.uid

    // Body opsional (boleh kosong). Data dari token jadi sumber kebenaran.
    const { email, name, image } = await req.json().catch(() => ({} as any))

    // --- Upsert user (idempotent & race-safe) ---
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      create: {
        firebaseUid,
        email: email ?? decoded.email ?? null,
        name: name ?? (decoded.name as string) ?? null,
        image: image ?? (decoded.picture as string) ?? null,
      },
      update: {
        email: email ?? decoded.email ?? undefined,
        name: name ?? (decoded.name as string) ?? undefined,
        image: image ?? (decoded.picture as string) ?? undefined,
      },
      select: { id: true, firebaseUid: true, email: true, name: true, image: true },
    })

    return NextResponse.json({ userId: user.id, user }, { status: 200 })
  } catch (e: any) {
    // Token invalid/expired atau masalah lainnya
    const msg = e?.message || String(e)
    console.error('USER SYNC ERROR:', msg)
    if (msg.includes('Firebase ID token') || e?.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Terjadi kesalahan saat sinkronisasi user' }, { status: 500 })
  }
}

// Optional: harden method lain
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
