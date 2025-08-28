// src/app/api/tokenizer/route.ts 
import Midtrans from "midtrans-client"
import { NextResponse } from "next/server"

const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey: process.env.SECRET!,
  clientKey: process.env.NEXT_PUBLIC_CLIENT!
})

type Item = { id: string; productName: string; price: number; quantity: number }
type TokenizeBody = { items: Item[] }

export async function POST(request: Request) {
  try {
    // 1. Ambil array items
    const { items } = (await request.json()) as TokenizeBody

    // 2. Bangun item_details sebagai array
    const item_details = items.map(it => ({
      id: it.id,
      name: it.productName,
      price: it.price,
      quantity: it.quantity,
    }))

    // 3. Hitung gross_amount dari array itu
    const gross_amount = item_details.reduce((sum, it) => sum + it.price * it.quantity, 0)

    // 4. Susun parameter sesuai spec Midtrans
    const parameter = {
      transaction_details: {
        order_id: `order-${Date.now()}`,
        gross_amount,
      },
      item_details,
    }

    // 5. Generate Snap token
    const token = await snap.createTransactionToken(parameter)
    return NextResponse.json({ token })
  } catch (e: unknown) {
    const message =
      typeof e === "object" && e && "message" in e
        ? String((e as { message?: unknown }).message)
        : "Internal error"
    console.error("[TOKENIZER ERROR]", e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
