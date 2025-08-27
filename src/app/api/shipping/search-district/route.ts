import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword') || ''

    const url = `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=${encodeURIComponent(keyword)}&limit=50`

    const response = await axios.get(url, {
      headers: {
        key: process.env.RAJAONGKIR_COST_KEY!, // API KEY kamu
      },
    })

    return NextResponse.json(response.data)
  } catch (err: any) {
    console.error('Gagal fetch district:', err.response?.data || err.message)
    return NextResponse.json({ error: 'Gagal fetch district' }, { status: 500 })
  }
}
