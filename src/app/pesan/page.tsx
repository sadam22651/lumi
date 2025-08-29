// src/app/pesan/page.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Heart, Gem, Shield, Truck, Star } from "lucide-react"

export default function PesanLandingPage() {
  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-8 sm:pt-16">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground bg-background/60 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Koleksi Custom Perak
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Buat Momen Spesial dengan <span className="text-emerald-600">Cincin Pasangan</span> &{" "}
              <span className="text-emerald-600">Kalung Nama</span>
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground">
              Desain sesuai keinginan, bahan perak asli, dikerjakan rapi. Pesan sekarang—mudah, cepat, dan aman.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/pesan/cincin">
                  <Heart className="mr-2 h-5 w-5" />
                  Pesan Cincin Pasangan
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/pesan/kalung">
                  <Gem className="mr-2 h-5 w-5" />
                  Pesan Kalung Nama
                </Link>
              </Button>
            </div>

            
          </div>

          {/* Optional hero image (hapus jika belum punya) */}
          <div className="w-full md:w-[44%]">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl ring-1 ring-emerald-200/60 dark:ring-emerald-900/30 bg-gradient-to-tr from-white to-emerald-50">
              <Image
                src="/pesanan/cincinpasangan1.jpeg" // ganti dengan gambarmu, atau hapus <Image/> jika tidak ada
                alt="Koleksi perak Widuri"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* PILIHAN PRODUK */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cincin Pasangan */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-emerald-600" />
                Cincin Pasangan Perak
              </CardTitle>
              <p className="text-muted-foreground">
                Pilih ukuran masing-masing, tambah ukiran nama/tanggal, dan tentukan jumlah.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="mb-5 grid gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Star className="h-4 w-4" /> Ukuran custom per jari</li>
                <li className="flex items-center gap-2"><Star className="h-4 w-4" /> Ukiran teks opsional</li>
                <li className="flex items-center gap-2"><Star className="h-4 w-4" /> Finishing halus & nyaman</li>
              </ul>
              <div className="flex items-center gap-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/pesan/cincin">Pesan Cincin</Link>
                </Button>
                <Link
                  href="/tutorial/cincin"
                  className="text-sm text-emerald-700 hover:underline"
                >
                  Cara ukur ukuran cincin →
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Kalung Nama */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-emerald-600" />
                Kalung Nama Perak
              </CardTitle>
              <p className="text-muted-foreground">
                Tulis nama/teks, pilih panjang rantai dan jenis rantai.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="mb-5 grid gap-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><Star className="h-4 w-4" /> Teks nama hingga 12–14 karakter</li>
                <li className="flex items-center gap-2"><Star className="h-4 w-4" /> Panjang rantai 40/45/50 cm</li>
                <li className="flex items-center gap-2"><Star className="h-4 w-4" /> Pketebalan rantai bisa di pilih</li>
              </ul>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/pesan/kalung">Pesan Kalung Nama</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* TRUST/USP */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
            <Shield className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">Perak Asli</p>
              <p className="text-sm text-muted-foreground"> aman & tahan lama.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
            <Truck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">Pengiriman Nasional</p>
              <p className="text-sm text-muted-foreground">Lacak paket hingga tiba.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
            <Star className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="font-medium">Finishing Rapi</p>
              <p className="text-sm text-muted-foreground">Detail halus & nyaman dipakai.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <div className="rounded-2xl border bg-emerald-600/5 p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Siap bikin hadiah berkesan?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Pesan sekarang, konsultasi desain gratis.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/pesan/cincin">Pesan Cincin</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pesan/kalung">Pesan Kalung Nama</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
