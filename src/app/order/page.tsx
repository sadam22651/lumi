// src/app/orders/page.tsx
'use client'
import { useEffect, useMemo, useState } from 'react'
import { getAuth, onIdTokenChanged } from 'firebase/auth'
import { app } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

type OrderRow = {
  id: string
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  createdAt: string
}

export default function OrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const auth = getAuth(app)

    const unsub = onIdTokenChanged(auth, async (user) => {
      try {
        setError(null)
        setLoading(true)

        if (!user) {
          setRows([])
          setLoading(false)
          router.replace('/login')
          return
        }

        const token = await user.getIdToken()
        const r = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        })
        const j = await r.json()
        if (!r.ok) throw new Error(j?.error || 'Gagal memuat pesanan')

        setRows((j.orders || []) as OrderRow[])
      } catch (e: any) {
        console.error(e)
        setError(e?.message || 'Terjadi kesalahan')
      } finally {
        setLoading(false)
      }
    })

    return () => unsub()
  }, [router])

  const onRefresh = async () => {
    // trigger ulang listener dengan “noop”: pindah route lalu kembali
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
              Pesanan Saya
            </h1>
            <p className="mt-1 text-xs text-zinc-500 md:text-sm">
              Lihat status & detail pesanan terbaru Anda
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-zinc-50 active:scale-[0.98]"
            aria-label="Muat ulang"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 12a9 9 0 1 0 3-6.708" />
              <path d="M3 3v6h6" />
            </svg>
            Segarkan
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-10 pt-4">
        {loading && <ListSkeleton />}

        {!loading && error && (
          <div className="rounded-2xl border p-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
                !
              </span>
              <div>
                <div className="font-medium text-red-600">Gagal memuat</div>
                <div className="mt-0.5 text-zinc-600">{error}</div>
                <button
                  onClick={onRefresh}
                  className="mt-3 inline-flex rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && rows.length === 0 && <EmptyState />}

        {!loading && !error && rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((o) => (
              <li key={o.id}>
                <OrderCard
                  order={o}
                  onClick={() => router.push(`/order/${o.id}`)} // tetap pakai path lama Anda
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ---------- UI Pieces ---------- */

function OrderCard({ order, onClick }: { order: OrderRow; onClick: () => void }) {
  const status = useMemo(() => mapStatus(order.status), [order.status])
  const dateStr = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(order.createdAt)),
    [order.createdAt]
  )
  return (
    <button
      onClick={onClick}
      className="group w-full rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7h18M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h2 className="truncate text-base font-semibold">
              Order <span className="text-zinc-500">#{order.id.slice(0, 8)}</span>
            </h2>
          </div>

          <div className="mt-1 text-xs text-zinc-500">{dateStr}</div>
        </div>

        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm text-zinc-600">
          Total
          <span className="mx-2 font-semibold text-zinc-900">
            {formatRupiah(order.totalAmount)}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 transition group-hover:translate-x-0.5">
          Lihat detail
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </div>
    </button>
  )
}

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-zinc-200" />
              <div>
                <div className="h-4 w-40 rounded bg-zinc-200" />
                <div className="mt-2 h-3 w-28 rounded bg-zinc-200" />
              </div>
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-200" />
          </div>
          <div className="mt-4 h-4 w-48 rounded bg-zinc-200" />
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7h18M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
        </svg>
      </div>
      <h3 className="mt-4 text-base font-semibold">Belum ada pesanan</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Pesanan Anda akan tampil di sini setelah checkout berhasil.
      </p>
      <a
        href="/"
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        Mulai belanja
      </a>
    </div>
  )
}

/* ---------- Helpers ---------- */

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function mapStatus(s: OrderRow['status']) {
  switch (s) {
    case 'PENDING':
      return { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 ring-amber-200' }
    case 'PAID':
      return { label: 'Dibayar', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    case 'PROCESSING':
      return { label: 'Diproses', className: 'bg-sky-50 text-sky-700 ring-sky-200' }
    case 'SHIPPED':
      return { label: 'Dikirim', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' }
    case 'DELIVERED':
      return { label: 'Tiba', className: 'bg-violet-50 text-violet-700 ring-violet-200' }
    case 'CANCELLED':
      return { label: 'Dibatalkan', className: 'bg-rose-50 text-rose-700 ring-rose-200' }
    default:
      return { label: s, className: 'bg-zinc-100 text-zinc-700 ring-zinc-200' }
  }
}
