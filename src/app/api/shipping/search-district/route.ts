// src/app/api/shipping/search-district/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyword = searchParams.get('keyword') || ''

    const url =
      `https://rajaongkir.komerce.id/api/v1/destination/domestic-destination` +
      `?search=${encodeURIComponent(keyword)}&limit=50`

    const response = await axios.get(url, {
      headers: {
        key: process.env.RAJAONGKIR_COST_KEY!, // API KEY kamu
      },
    })

    return NextResponse.json(response.data)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const ax = err as AxiosError
      const data = ax.response?.data ?? ax.message
      console.error('Gagal fetch district:', data)
      return NextResponse.json({ error: data ?? 'Gagal fetch district' }, { status: ax.response?.status ?? 500 })
    }
    console.error('Gagal fetch district:', err)
    return NextResponse.json({ error: 'Gagal fetch district' }, { status: 500 })
  }
}
