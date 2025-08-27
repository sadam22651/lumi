'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { MessageCircle } from 'lucide-react'

type Product = {
  id: string
  name: string
  price: number
  stock: number
  image?: string
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await axios.get<Product[]>('/api/products')
        if (!alive) return
        setProducts(res.data)
      } catch {
        // silent
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const featured = useMemo(() => products.slice(0, 5), [products])

  const fmtRp = (n: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(n)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-12">
      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/10 to-background"
        aria-label="Hero Widuri Store"
      >
        <div className="relative z-10 px-6 py-14 text-center sm:px-10">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Selamat Datang di Widuri Store
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Temukan perhiasan perak pilihan—ring, kalung nama, gelang—untuk momen spesialmu.
          </p>
          <p className="mt-3 text-sm italic text-muted-foreground">
            Berpengalaman lebih dari 20 tahun
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Link href="/products">
              <Button size="lg">Belanja Sekarang</Button>
            </Link>
            <a
              href="https://wa.me/6281374570507"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat WhatsApp Widuri"
            >
              <Button size="lg" variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Konsultasi
              </Button>
            </a>
          </div>
        </div>

        {/* dekor lembut */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-10 -bottom-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        </div>
      </section>

      {/* FEATURED */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold sm:text-2xl">Produk Unggulan</h2>
          <Link href="/products" className="text-sm text-primary hover:underline">
            Lihat semua
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="space-y-2 p-3 sm:p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
            {featured.map((p) => (
              <Link key={p.id} href={`/products/${p.id}`}>
                <Card className="group relative overflow-hidden transition hover:shadow-lg">
                  {/* gambar */}
                  {p.image ? (
                    <img
                      src={`/uploads/${p.image}`}
                      alt={p.name}
                      className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="aspect-[4/3] w-full bg-muted" />
                  )}

                  {/* badge stok */}
                  <div className="absolute left-2 top-2">
                    <Badge
                      variant={p.stock > 0 ? 'secondary' : 'destructive'}
                      className="shadow-sm"
                    >
                      {p.stock > 0 ? `Stok ${p.stock}` : 'Habis'}
                    </Badge>
                  </div>

                  <CardContent className="p-3 sm:p-4">
                    <h3 className="line-clamp-1 font-medium">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{fmtRp(p.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* INFORMASI LAYANAN SINGKAT */}
      <section className="rounded-2xl border bg-card p-6 sm:p-8">
        <h2 className="text-xl font-semibold sm:text-2xl">Layanan Custom</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Ingin cincin pasangan, kalung nama, atau desain khusus? Kirim referensi dan kami bantu
          wujudkan sesuai ukuran, bahan, dan anggaranmu.
        </p>

        <Separator className="my-6" />

        {/* satu showcase sederhana (tidak mengganggu) */}
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="order-2 space-y-2 md:order-1">
            <h3 className="text-lg font-semibold">Kalung Nama</h3>
            <p className="text-sm text-muted-foreground">
              Personalisasi namamu dalam perak berkualitas. Cocok untuk hadiah.
            </p>
            <div className="flex gap-2 pt-1">
              <Link href="/products">
                <Button size="sm">Lihat Koleksi</Button>
              </Link>
              <a
                href="https://wa.me/6281374570507"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat WhatsApp untuk pemesanan kalung nama"
              >
                <Button size="sm" variant="outline">
                  Tanya Harga
                </Button>
              </a>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <img
              src="/pesanan/kalungnama.jpeg"
              alt="Kalung nama custom"
              className="mx-auto aspect-[4/3] w-full max-w-md rounded-xl object-cover shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border bg-muted/40 p-6 text-center sm:p-10">
        <h3 className="text-xl font-semibold">Butuh bantuan memilih?</h3>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-muted-foreground">
          Tim kami siap bantu rekomendasi model & ukuran. Hubungi kami, gratis.
        </p>
        <div className="mt-5">
          <a
            href="https://wa.me/6281374570507"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi WhatsApp Widuri"
          >
            <Button size="lg" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Hubungi Kami
            </Button>
          </a>
        </div>
      </section>
    </div>
  )
}
