import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const { origin, destination, weight, courier } = body

  try {
    const response = await fetch('https://rajaongkir.komerce.id/api/v1/cost/domestic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        key: process.env.RAJAONGKIR_COST_KEY!
      },
      body: JSON.stringify({
        origin,
        destination,
        weight,
        courier
      })
    })

    const text = await response.text()
    console.log('🔍 RAJAONGKIR RAW RESPONSE:', text)

    // Coba parse JSON
    try {
      const data = JSON.parse(text)
      return NextResponse.json(data)
    } catch (parseError) {
      console.error('❌ PARSE ERROR:', parseError)
      return NextResponse.json({
        error: 'Response bukan JSON valid',
        raw: text
      })
    }

  } catch (fetchError) {
    console.error('❌ FETCH ERROR:', fetchError)
    return NextResponse.json({
      error: 'Gagal fetch RajaOngkir',
      detail: fetchError instanceof Error ? fetchError.message : fetchError
    }, { status: 500 })
  }
}
