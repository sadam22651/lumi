'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  imageUrl?: string | null
  categoryId?: string | null
  category?: { name: string }
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('') // filter pakai ID biar akurat
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // fetch data produk & kategori
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/dashboard/products'),
          axios.get('/api/categories'),
        ])
        setProducts(productsRes.data as Product[])
        setCategories(categoriesRes.data as Category[])
      } catch (err) {
        console.error(err)
        toast.error('Gagal mengambil data')
      }
    }
    fetchData()
  }, [])

  // filter
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchesName = !q || p.name.toLowerCase().includes(q)
      const matchesCategory = selectedCategoryId
        ? p.categoryId === selectedCategoryId
        : true
      return matchesName && matchesCategory
    })
  }, [products, search, selectedCategoryId])

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
  const firstIdx = (currentPage - 1) * itemsPerPage
  const currentProducts = filteredProducts.slice(firstIdx, firstIdx + itemsPerPage)

  // delete product
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus produk ini?')) return
    try {
      await axios.delete(`/api/dashboard/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      toast.success('Produk dihapus')
    } catch (err) {
      console.error(err)
      toast.error('Gagal menghapus produk')
    }
  }

  const goTo = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Kelola Produk</h1>
        <Button onClick={() => router.push('/dashboard/products/new')}>
          Tambah Produk
        </Button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="flex-1"
        />
        <select
          className="border rounded px-3 py-2"
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value)
            setCurrentPage(1)
          }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid Produk */}
      {currentProducts.length === 0 ? (
        <div className="p-4 border rounded text-sm text-gray-600">
          Tidak ada produk.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {currentProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 flex flex-col">
              {/* Gambar dari Supabase Storage (URL penuh), fallback placeholder */}
              <img
                src={
                  product.imageUrl ||
                  'https://placehold.co/600x400?text=No+Image'
                }
                alt={product.name}
                className="w-full h-48 object-cover rounded mb-3"
                loading="lazy"
              />

              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p>Harga: Rp {product.price.toLocaleString('id-ID')}</p>
              <p>Stok: {product.stock}</p>
              <p>Kategori: {product.category?.name || 'Tidak ada'}</p>

              <div className="mt-auto flex justify-between gap-2">
                <Button
                  size="sm"
                  onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(product.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button size="sm" onClick={() => goTo(1)} disabled={currentPage === 1}>
            {'<<'}
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? 'default' : 'outline'}
              onClick={() => goTo(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            size="sm"
            onClick={() => goTo(totalPages)}
            disabled={currentPage === totalPages}
          >
            {'>>'}
          </Button>
        </div>
      )}
    </div>
  )
}
