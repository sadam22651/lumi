import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      origin,
      destination,
      weight = 490,
      item_value = 50000,
      cod = 'no',
    } = body

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'origin dan destination wajib diisi' },
        { status: 400 }
      )
    }

    const response = await axios.get(
      `https://api-sandbox.collaborator.komerce.id/tariff/api/v1/calculate`,
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
