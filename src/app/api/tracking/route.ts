// src/app/api/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const KOMERCE_URL = 'https://rajaongkir.komerce.id/api/v1/track/waybill'
const PROVIDER_TIMEOUT_MS = 15000

export async function POST(req: NextRequest) {
  try {
    const { waybill, courier } = (await req.json().catch(() => ({}))) as {
      waybill?: string
      courier?: string
    }

    if (!waybill || !courier) {
      return NextResponse.json(
        {
          meta: { message: 'waybill & courier wajib diisi', code: 400, status: 'error' },
        },
        { status: 400 }
      )
    }

    const apiKey = process.env.RAJAONGKIR_COST_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        {
          meta: { message: 'RAJAONGKIR_COST_KEY tidak ditemukan di env', code: 500, status: 'error' },
        },
        { status: 500 }
      )
    }

    // timeout
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

    const res = await fetch(KOMERCE_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        key: apiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        awb: String(waybill).trim(),
        courier: String(courier).trim().toLowerCase(),
        // opsional, sesuai contoh doc:
        // last_phone_number: 'null',
      }),
      cache: 'no-store',
      signal: controller.signal,
    }).catch((e) => {
      if ((e as any)?.name === 'AbortError') {
        return new Response(null, { status: 504, statusText: 'Timeout' })
      }
      throw e
    })
    clearTimeout(t)

    if (!res) {
      return NextResponse.json(
        { meta: { message: 'Tidak ada respons dari provider', code: 502, status: 'error' } },
        { status: 502 }
      )
    }

    const ctype = res.headers.get('content-type') || ''
    if (!ctype.includes('application/json')) {
      const snippet = await res.text().catch(() => '')
      const reason = res.status === 404 ? 'Resi tidak ditemukan' : 'Respons bukan JSON dari provider'
      return NextResponse.json(
        {
          meta: { message: reason, code: res.status, status: 'error' },
          snippet: snippet.slice(0, 200),
        },
        { status: 502 }
      )
    }

    const body = await res.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { meta: { message: 'Gagal parse JSON dari provider', code: 502, status: 'error' } },
        { status: 502 }
      )
    }

    // Provider kadang 200 tapi meta.code error
    const metaCode = body?.meta?.code
    if (!res.ok || (typeof metaCode === 'number' && metaCode >= 400)) {
      return NextResponse.json(
        {
          meta: {
            message: body?.meta?.message || 'Gagal tracking dari provider',
            code: res.status || 502,
            status: 'error',
          },
          raw: body,
        },
        { status: 502 }
      )
    }

    // ✅ sukses — kembalikan persis (meta, data)
    return NextResponse.json(body, { status: 200 })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { meta: { message: 'Timeout ke provider', code: 504, status: 'error' } },
        { status: 504 }
      )
    }
    console.error('[TRACKING API ERROR]', err)
    return NextResponse.json(
      { meta: { message: 'Server error', code: 500, status: 'error' } },
      { status: 500 }
    )
  }
}
