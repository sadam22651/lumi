// src/app/dashboard/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PackageIcon,
  TagsIcon,
  FileTextIcon,
  TruckIcon,
  SettingsIcon,
  LogOutIcon,
} from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } finally {
      router.push('/login')
    }
  }

  const go = (href: string) => router.push(href)

  // Helper untuk tile klik + keyboard-friendly
  const Tile = ({
    title,
    desc,
    icon: Icon,
    onClick,
    className,
  }: {
    title: string
    desc?: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
    onClick: () => void
    className?: string
  }) => (
    <Card
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' ? onClick() : undefined)}
      className={cn(
        'group relative overflow-hidden transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {/* dekor halus */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
            <Icon className="h-5 w-5" />
          </span>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/10 to-background p-6 sm:p-8">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard Widuri Perak</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola produk, kategori, pesanan, dan laporan transaksi lewat satu tempat.
          </p>
        </div>
        <div className="pointer-events-none absolute -left-14 bottom-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Navigasi Utama */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Tile
          title="Kelola Produk"
          desc="Tambah, edit, atur stok & gambar"
          icon={PackageIcon}
          onClick={() => go('/dashboard/products')}
        />
        <Tile
          title="Kelola Kategori"
          desc="Buat & susun kategori produk"
          icon={TagsIcon}
          onClick={() => go('/dashboard/categories')}
        />
        <Tile
          title="Laporan Transaksi"
          desc="Ringkasan penjualan & filter periode"
          icon={FileTextIcon}
          onClick={() => go('/dashboard/report')}
        />
        <Tile
          title="Order"
          desc="Pantau pesanan yang sedang berjalan"
          icon={TruckIcon}
          onClick={() => go('/dashboard/order')}
        />
        <Tile
          title="Pengaturan"
          desc="Informasi toko & preferensi tampilan"
          icon={SettingsIcon}
          onClick={() => go('/dashboard/settings')}
        />
        <Card className="flex flex-col items-center justify-center gap-3 p-5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <LogOutIcon className="h-5 w-5" />
          </div>
          <p className="text-base font-medium">Keluar</p>
          <p className="text-center text-sm text-muted-foreground">Akhiri sesi sekarang</p>
          <Button variant="destructive" className="mt-1" onClick={handleLogout}>
            Keluar
          </Button>
        </Card>
      </div>
    </div>
  )
}
