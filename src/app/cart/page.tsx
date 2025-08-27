'use client'

import { useEffect, useState } from 'react'
import { getAuth } from 'firebase/auth'
import { app } from '@/lib/firebase'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  image?: string
}

interface CartItem {
  id: string
  quantity: number
  product: Product | null
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [token, setToken] = useState<string>('')

  useEffect(() => {
    async function fetchCart() {
      try {
        const auth = getAuth(app)
        const user = auth.currentUser
        if (!user) {
          console.warn('Belum login')
          setFetching(false)
          return
        }

        const tkn = await user.getIdToken()
        setToken(tkn)

        const res = await fetch('/api/cart', {
          headers: {
            Authorization: `Bearer ${tkn}`,
          },
        })

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        setItems(data.items || [])
      } catch (error) {
        console.error('Gagal memuat keranjang:', error)
      } finally {
        setFetching(false)
      }
    }

    fetchCart()
  }, [])

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        // Hapus item
        await fetch(`/api/cart`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        })
      } else {
        // Update jumlah
        await fetch(`/api/cart`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId, quantity }),
        })
      }

      // Refresh keranjang
      const res = await fetch('/api/cart', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()
      setItems(data.items || [])
    } catch (err) {
      console.error('Gagal update keranjang:', err)
    }
  }

  const productTotal = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0
  )

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Keranjang Belanja</h1>

      {fetching && <p className="p-8 text-center">Memuat keranjang...</p>}

      {!fetching && items.length === 0 && (
        <p className="p-8 text-center">Keranjang kosong.</p>
      )}

      {!fetching && items.length > 0 && (
        <>
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="border p-4 rounded-md shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{item.product?.name ?? 'Produk tidak ditemukan'}</p>
                  <p className="text-sm text-gray-600">
                    Rp{item.product?.price?.toLocaleString() ?? '0'} × {item.quantity}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.product?.id ?? '', item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 rounded text-sm"
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product?.id ?? '', item.quantity + 1)}
                      className="px-2 py-1 bg-gray-200 rounded text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p className="font-semibold">
                  Rp{((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>

          <div className="border-t pt-4 space-y-2 text-sm text-gray-700">
            <p className="text-right font-semibold">
              Subtotal Produk: Rp{productTotal.toLocaleString()}
            </p>

            <div className="pt-2 text-right text-lg font-bold border-t">
              Total: Rp{productTotal.toLocaleString()}
            </div>
          </div>

          <Link href="/checkout">
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded mt-4">
              Lanjut ke Checkout
            </button>
          </Link>
        </>
      )}
    </div>
  )
}
