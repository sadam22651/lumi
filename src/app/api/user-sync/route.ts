// src/app/api/user-sync/route.ts

// Pastikan route ini berjalan di Node.js runtime (bukan Edge) karena firebase-admin
export const runtime = 'nodejs'

import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'

type OptionalBody = {
  email?: string
  name?: string
  image?: string
}

// type guard sederhana untuk akses .message dan/atau .code
function getErrorInfo(err: unknown): { message?: string; code?: string } {
  const out: { message?: string; code?: string } = {}
  if (err && typeof err === 'object') {
    if ('message' in err && typeof (err as { message?: unknown }).message === 'string') {
      out.message = (err as { message?: string }).message
    }
    if ('code' in err && typeof (err as { code?: unknown }).code === 'string') {
      out.code = (err as { code?: string }).code
    }
  }
  return out
}

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

    // Body opsional (boleh kosong). Data dari token tetap jadi sumber kebenaran.
    let raw: unknown
    try {
      raw = await req.json()
    } catch {
      raw = {}
    }
    const body = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>

    const email = typeof body.email === 'string' ? body.email : undefined
    const name = typeof body.name === 'string' ? body.name : undefined
    const image = typeof body.image === 'string' ? body.image : undefined

    const decodedEmail = typeof decoded.email === 'string' ? decoded.email : undefined
    const decodedName = typeof decoded.name === 'string' ? decoded.name : undefined
    const decodedPicture = typeof (decoded as { picture?: unknown }).picture === 'string'
      ? (decoded as { picture: string }).picture
      : undefined

    // --- Upsert user (idempotent & race-safe) ---
    const user = await prisma.user.upsert({
      where: { firebaseUid },
      create: {
        firebaseUid,
        email: email ?? decodedEmail ?? null,
        name: name ?? decodedName ?? null,
        image: image ?? decodedPicture ?? null,
      },
      update: {
        email: email ?? decodedEmail ?? undefined,
        name: name ?? decodedName ?? undefined,
        image: image ?? decodedPicture ?? undefined,
      },
      select: { id: true, firebaseUid: true, email: true, name: true, image: true },
    })

    return NextResponse.json({ userId: user.id, user }, { status: 200 })
  } catch (e: unknown) {
    // Token invalid/expired atau masalah lainnya
    const { message, code } = getErrorInfo(e)
    const msg = message ?? String(e)

    console.error('USER SYNC ERROR:', msg)

    if (msg.includes('Firebase ID token') || code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    return NextResponse.json({ error: 'Terjadi kesalahan saat sinkronisasi user' }, { status: 500 })
  }
}

// Optional: harden method lain
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
