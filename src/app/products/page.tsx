'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Product = {
  id: string
  name: string
  price: number
  stock: number
  image?: string
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    setLoading(true)
    axios
      .get<Product[]>('/api/products')
      .then((res) => setProducts(res.data))
      .catch(() => toast.error('Gagal mengambil produk'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const f = products.filter((p) => p.name.toLowerCase().includes(q))
    return [...f.filter((p) => p.stock > 0), ...f.filter((p) => p.stock === 0)]
  }, [products, search])

  const totalPages = Math.max(Math.ceil(filtered.length / itemsPerPage), 1)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  const start = (currentPage - 1) * itemsPerPage
  const pageItems = filtered.slice(start, start + itemsPerPage)

  const goToDetail = (id: string) => router.push(`/products/${id}`)
  const fmtRp = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Daftar Produk</h1>
        <Input
          placeholder="Cari produk…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setCurrentPage(1)
          }}
          className="sm:max-w-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardContent className="space-y-2 p-3 sm:p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          Tidak ada produk yang cocok.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
            {pageItems.map((p) => (
              <Card
                key={p.id}
                onClick={() => goToDetail(p.id)}
                className="group relative cursor-pointer overflow-hidden transition hover:shadow-lg"
              >
                <div className="relative">
                  {p.image ? (
                    <img
                      src={`/uploads/${p.image}`}
                      alt={p.name}
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-muted" />
                  )}

                  <div className="absolute left-2 top-2 flex gap-2">
                    {p.stock > 0 ? (
                      <Badge variant="secondary" className="shadow-sm">
                        Stok: {p.stock}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="shadow-sm">
                        Habis
                      </Badge>
                    )}
                  </div>

                  {p.stock === 0 && (
                    <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-[1px]">
                      <span className="rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
                        SOLD OUT
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-3 sm:p-4">
                  <h2 className="line-clamp-1 font-semibold">{p.name}</h2>
                  <p className="text-sm text-muted-foreground">{fmtRp(p.price)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1}
            >
              {'<<'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage <= 1}
            >
              Prev
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              Halaman {Math.min(currentPage, totalPages)} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              {'>>'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
