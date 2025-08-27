// src/app/api/shipping/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { waybill, courier } = await req.json().catch(() => ({} as any))
  const awb = String(waybill || 'MT685U91').trim()
  const c = String(courier || 'wahana').trim().toLowerCase()

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
      const snippet = await res.text().then(t => t.slice(0, 200)).catch(() => '')
      return NextResponse.json(
        { status: 'failed', reason: `Respons bukan JSON dari provider`, httpStatus: res.status, snippet },
        { status: 200 }
      )
    }

    const provider = await res.json().catch(() => null)
    if (!provider) {
      return NextResponse.json(
        { status: 'failed', reason: 'Gagal parse JSON dari provider', httpStatus: 502 },
        { status: 200 }
      )
    }

    // ❗ Jika provider ada error → kembalikan failed
    if (!res.ok || provider?.error || provider?.meta?.code >= 400) {
      return NextResponse.json(
        { status: 'failed', reason: provider?.meta?.message || 'Error dari provider', httpStatus: res.status, raw: provider },
        { status: 200 }
      )
    }

    // ✅ Sukses → TERUSKAN { meta, data } ke frontend
    return NextResponse.json({
      meta: provider.meta,
      data: provider.data,
    })
  } catch (e: any) {
    return NextResponse.json(
      { status: 'failed', reason: e?.message || 'Request error/timeout', httpStatus: 500 },
      { status: 200 }
    )
  }
}
