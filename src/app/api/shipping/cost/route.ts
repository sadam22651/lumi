// src/app/api/shipping/cost/route.ts
import { NextRequest, NextResponse } from 'next/server'
import axios, { AxiosError } from 'axios'

type CostBody = {
  origin: string | number
  destination: string | number
  weight?: number
  item_value?: number
  cod?: 'yes' | 'no' | string
}

export async function POST(req: NextRequest) {
  try {
    const raw = (await req.json()) as Partial<CostBody>
    const origin = raw.origin
    const destination = raw.destination
    const weight = typeof raw.weight === 'number' ? raw.weight : 490
    const item_value = typeof raw.item_value === 'number' ? raw.item_value : 50000
    const cod = (raw.cod ?? 'no') as string

    if (origin == null || destination == null) {
      return NextResponse.json(
        { error: 'origin dan destination wajib diisi' },
        { status: 400 },
      )
    }

    const response = await axios.get(
      'https://api-sandbox.collaborator.komerce.id/tariff/api/v1/calculate',
      {
        params: {
          shipper_destination_id: origin,
          receiver_destination_id: destination,
          weight,
          item_value,
          cod,
        },
        headers: {
          'x-api-key': process.env.RAJAONGKIR_DELIVERY_KEY!,
        },
      },
    )

    return NextResponse.json(response.data)
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const ax = err as AxiosError
      const data = ax.response?.data ?? ax.message
      const status = ax.response?.status ?? 500
      console.error('ERROR:', data)
      return NextResponse.json({ error: data }, { status })
    }
    console.error('ERROR:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
