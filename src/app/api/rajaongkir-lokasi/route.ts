// src/app/api/shipping-cost/route.ts (contoh)
import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { origin, destination, weight, courier } = body

    // Validasi input
    if (!origin || !destination || !weight || !courier) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    const response = await axios.post(
      'https://rajaongkir.komerce.id/api/v1/domestic-cost',
      { origin, destination, weight, courier },
      {
        headers: {
          key: process.env.RAJAONGKIR_COST_KEY!,
          'Content-Type': 'application/json',
        },
      }
    )

    return NextResponse.json(response.data)
  } catch (err: unknown) {
    // gunakan type guard untuk AxiosError
    if (axios.isAxiosError(err)) {
      const axErr = err as AxiosError
      console.error('ERROR:', axErr.response?.data || axErr.message)
      return NextResponse.json(
        { error: axErr.response?.data || axErr.message },
        { status: axErr.response?.status || 500 }
      )
    }

    console.error('ERROR:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
