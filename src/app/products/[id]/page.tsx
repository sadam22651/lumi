// src/app/products/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import axios from 'axios'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image?: string
  detail?: string
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!id) return
    axios
      .get<Product>(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => toast.error('Gagal mengambil detail produk'))
      .finally(() => setLoading(false))
  }, [id])

  const addToCart = async () => {
    if (!product) return
    if (product.stock === 0) {
      toast.error('Stok habis')
      return
    }
    if (!user) {
      toast.error('Silakan login terlebih dahulu')
      return
    }

    try {
      const token = await user.getIdToken()
      await axios.post(
        '/api/cart',
        {
          productId: product.id,
          quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      toast.success('Berhasil ditambahkan ke keranjang')
      router.push('/cart')
    } catch {
      toast.error('Gagal menambahkan ke keranjang')
    }
  }

  if (loading) return <p className="p-8 text-center">Memuat...</p>
  if (!product) return <p className="p-8 text-center text-red-500">Produk tidak ditemukan</p>

  return (
    <div className="max-w-md mx-auto py-8 space-y-6">
      {product.image && (
        <img
          src={`/uploads/${product.image}`}
          alt={product.name}
          className="w-full h-56 object-cover rounded-lg"
        />
      )}

      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-700">Rp {product.price.toLocaleString()}</p>
      <p className="text-gray-600">
        {product.stock > 0 ? `Stok: ${product.stock}` : 'Habis'}
      </p>
      <p className="text-sm text-gray-500">{product.detail}</p>

      <div className="flex items-center gap-4">
        <label className="font-medium">Qty:</label>
        <Input
          type="number"
          min={1}
          max={product.stock}
          value={quantity}
          onChange={(e) => {
            const val = Number(e.target.value)
            const safe = Number.isFinite(val) ? val : 1
            setQuantity(Math.min(Math.max(safe, 1), product.stock))
          }}
          className="w-20"
        />
      </div>

      <Button
        onClick={addToCart}
        disabled={product.stock === 0}
        className="w-full"
      >
        Masukkan ke Keranjang
      </Button>

      <Button variant="ghost" onClick={() => router.back()} className="w-full">
        Kembali
      </Button>
    </div>
  )
}
