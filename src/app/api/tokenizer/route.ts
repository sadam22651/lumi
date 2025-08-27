// src/app/api/tokenizer/route.ts
import Midtrans from "midtrans-client";
import { NextResponse } from "next/server";

const snap = new Midtrans.Snap({
  isProduction: false,
  serverKey:   process.env.SECRET!,
  clientKey:   process.env.NEXT_PUBLIC_CLIENT!
});

export async function POST(request: Request) {
  try {
    // 1. Ambil array items
    const { items }: {
      items: { id: string; productName: string; price: number; quantity: number }[];
    } = await request.json();

    // 2. Bangun item_details sebagai array
    const item_details = items.map(i => ({
      id:       i.id,           // opsional, tapi bagus untuk track
      name:     i.productName,  
      price:    i.price,        
      quantity: i.quantity      
    }));

    // 3. Hitung gross_amount dari array itu
    const gross_amount = item_details
      .reduce((sum, it) => sum + it.price * it.quantity, 0);

    // 4. Susun parameter sesuai spec Midtrans (item_details harus array!)
    const parameter = {
      transaction_details: {
        order_id:     `order-${Date.now()}`,
        gross_amount: gross_amount
      },
      item_details: item_details
    };

    // 5. Generate Snap token
    const token = await snap.createTransactionToken(parameter);
    return NextResponse.json({ token });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}
