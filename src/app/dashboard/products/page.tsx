'use client'

import { useEffect, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  stock: number
  image?: string
  category?: {
    name: string
  }
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
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Ambil data produk dan kategori
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/dashboard/products'),
          axios.get('/api/categories'),
        ])
        setProducts(productsRes.data)
        setCategories(categoriesRes.data)
      } catch (error) {
        console.error(error)
        toast.error('Gagal mengambil data')
      }
    }

    fetchData()
  }, [])

  // Filter produk berdasarkan nama dan kategori
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = selectedCategory
        ? product.category?.name === selectedCategory
        : true
      return matchesName && matchesCategory
    })
  }, [products, search, selectedCategory])

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const currentIndex = (currentPage - 1) * itemsPerPage
  const currentProducts = filteredProducts.slice(currentIndex, currentIndex + itemsPerPage)

  // Handle Delete Product
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin mau hapus produk ini?')) return

    try {
      // Panggil route dinamis dengan ID di URL
      await axios.delete(`/api/dashboard/products/${id}`)
      setProducts(prev => prev.filter((p) => p.id !== id))
      toast.success('Produk dihapus')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menghapus produk')
    }
  }

  // Handle Pagination Click
  const handlePageClick = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // Generate pagination numbers
  const generatePageNumbers = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
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

      {/* Filter Section */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1) // Reset ke halaman 1 saat search
          }}
          className="flex-1"
        />

        <select
          className="border rounded px-3 py-2"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setCurrentPage(1) // Reset ke halaman 1 saat ganti kategori
          }}
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Produk Grid */}
      {currentProducts.length === 0 ? (
        <div className="p-4 border rounded text-sm text-gray-600">
          Tidak ada produk.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {currentProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 flex flex-col">
              {product.image && (
                <img
                  src={`/uploads/${product.image}`}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded mb-3"
                />
              )}
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p>Harga: Rp {product.price.toLocaleString()}</p>
              <p>Stok: {product.stock}</p>
              <p>Kategori: {product.category?.name || 'Tidak ada'}</p>

              <div className="mt-auto flex justify-between">
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/dashboard/products/edit/${product.id}`)
                  }
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <Button
            size="sm"
            onClick={() => handlePageClick(1)}
            disabled={currentPage === 1}
          >
            {'<<'}
          </Button>

          {generatePageNumbers().map((page) => (
            <Button
              key={page}
              size="sm"
              variant={page === currentPage ? 'default' : 'outline'}
              onClick={() => handlePageClick(page)}
            >
              {page}
            </Button>
          ))}

          <Button
            size="sm"
            onClick={() => handlePageClick(totalPages)}
            disabled={currentPage === totalPages}
          >
            {'>>'}
          </Button>
        </div>
      )}
    </div>
  )
}
