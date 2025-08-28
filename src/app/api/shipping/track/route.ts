// src/app/api/shipping/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

type ProviderMeta = { code?: number; message?: string }
type ProviderResponse = { meta?: ProviderMeta; data?: unknown; error?: unknown }

export async function POST(req: NextRequest) {
  // Parse body tanpa any
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    raw = {}
  }
  const body = (raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>

  const awb = typeof body.waybill === 'string' ? body.waybill.trim() : String(body.waybill ?? 'MT685U91').trim()
  const c = typeof body.courier === 'string' ? body.courier.trim().toLowerCase() : String(body.courier ?? 'wahana').trim().toLowerCase()

  if (!awb || !c) {
    return NextResponse.json(
      { status: 'failed', reason: 'Nomor resi & kurir wajib diisi', httpStatus: 400 },
      { status: 200 }
    )
  }

  const apiKey = process.env.RAJAONGKIR_COST_KEY || ''
  if (!apiKey) {
    return NextResponse.json(
      { status: 'failed', reason: 'API key tidak ditemukan', httpStatus: 500 },
      { status: 200 }
    )
  }

  try {
    const res = await fetch('https://rajaongkir.komerce.id/api/v1/track/waybill', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        key: apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ awb, courier: c }),
      cache: 'no-store',
    })

    const ctype = res.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      const snippet = await res.text().then((t) => t.slice(0, 200)).catch(() => '')
      return NextResponse.json(
        { status: 'failed', reason: 'Respons bukan JSON dari provider', httpStatus: res.status, snippet },
        { status: 200 }
      )
    }

    const provider = (await res.json().catch(() => null)) as ProviderResponse | null
    if (!provider) {
      return NextResponse.json(
        { status: 'failed', reason: 'Gagal parse JSON dari provider', httpStatus: 502 },
        { status: 200 }
      )
    }

    if (!res.ok || provider.error || (typeof provider.meta?.code === 'number' && provider.meta.code >= 400)) {
      return NextResponse.json(
        { status: 'failed', reason: provider.meta?.message || 'Error dari provider', httpStatus: res.status, raw: provider },
        { status: 200 }
      )
    }

    return NextResponse.json({
      meta: provider.meta ?? null,
      data: provider.data ?? null,
    })
  } catch (e: unknown) {
    const message = typeof e === 'object' && e && 'message' in e ? String((e as { message?: unknown }).message) : 'Request error/timeout'
    return NextResponse.json(
      { status: 'failed', reason: message, httpStatus: 500 },
      { status: 200 }
    )
  }
}
