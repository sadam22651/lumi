import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

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
  } catch (error: any) {
    console.error('ERROR:', error.response?.data || error.message)
    return NextResponse.json(
      { error: error.response?.data || error.message },
      { status: error.response?.status || 500 }
    )
  }
}
