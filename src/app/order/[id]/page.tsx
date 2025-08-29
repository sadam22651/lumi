// src/app/orders/[id]/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import { app } from '@/lib/firebase'
import { toast } from 'sonner'

type OrderItem = {
  product: { name: string; image?: string }
  quantity: number
  price: number
}

type OrderDetail = {
  id: string
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  totalAmount: number
  createdAt: string
  shippedAt?: string | null
  deliveredAt?: string | null
  trackingNumber?: string | null
  courierCode?: string | null
  courierName?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  address?: string | null
  subdistrictName?: string | null
  items: OrderItem[]
}

type TrackResp = {
  ok?: boolean
  message?: string
  tracking?: {
    status?: string
    waybill?: string
    courier?: string
    service?: string | null
    manifest?: Array<{ date: string; time: string; city: string; description: string }>
  }
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [track, setTrack] = useState<TrackResp | null>(null)
  const [doing, setDoing] = useState<{ track: boolean; cancel: boolean }>({ track: false, cancel: false })

  async function load() {
    const auth = getAuth(app)
    const user = auth.currentUser
    if (!user) return router.replace('/login')
    const token = await user.getIdToken()
    const r = await fetch(`/api/orders/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    const j = await r.json()
    if (!r.ok) {
      setData(null)
      setLoading(false)
      return
    }
    setData(j.order as OrderDetail)
    setLoading(false)
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function doTrack() {
    setDoing((s) => ({ ...s, track: true }))
    setTrack(null)
    const auth = getAuth(app)
    const user = auth.currentUser
    if (!user) return router.replace('/login')
    const token = await user.getIdToken()
    const r = await fetch(`/api/orders/${id}/track`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const j: TrackResp = await r.json()
    setTrack(j)
    setDoing((s) => ({ ...s, track: false }))
  }

  async function cancelOrder() {
    if (!confirm('Batalkan pesanan ini?')) return
    setDoing((s) => ({ ...s, cancel: true }))
    const auth = getAuth(app)
    const user = auth.currentUser
    if (!user) return router.replace('/login')
    const token = await user.getIdToken()
    const r = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'cancel' }),
    })
    const j = await r.json()
    setDoing((s) => ({ ...s, cancel: false }))
    if (!r.ok) return alert(j?.error || 'Gagal membatalkan')
    load()
  }

  if (loading) return <DetailSkeleton />
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-2xl border p-6 text-red-600">Order tidak ditemukan.</div>
      </div>
    )
  }

  const status = mapStatus(data.status)
  const createdStr = formatDateTime(data.createdAt)
  const shippedStr = data.shippedAt ? formatDateTime(data.shippedAt) : null
  const deliveredStr = data.deliveredAt ? formatDateTime(data.deliveredAt) : null

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold md:text-xl">
              Detail Pesanan <span className="text-zinc-500">#{data.id.slice(0, 8)}</span>
            </h1>
            <p className="mt-1 text-xs text-zinc-500">Dibuat: {createdStr}</p>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-zinc-50"
          >
            ← Kembali
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {/* Left column */}
          <div className="md:col-span-3 space-y-4">
            {/* Status & Total */}
            <div className="rounded-2xl border p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-zinc-500">Status</div>
                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${status.className}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-500">Total</div>
                  <div className="text-lg font-semibold">{formatRupiah(data.totalAmount)}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <InfoRow label="Dibuat" value={createdStr} />
                {shippedStr && <InfoRow label="Dikirim" value={shippedStr} />}
                {deliveredStr && <InfoRow label="Diterima" value={deliveredStr} />}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={doTrack}
                  disabled={doing.track}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
                >
                  {doing.track ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <ArrowPath className="h-4 w-4" />
                  )}
                  {doing.track ? 'Melacak…' : 'Lacak Paket'}
                </button>

                {['paid', 'processing'].includes(data.status) && (
                  <button
                    type="button"
                    onClick={cancelOrder}
                    disabled={doing.cancel}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {doing.cancel ? <Spinner className="h-4 w-4" /> : <XMark className="h-4 w-4" />}
                    {doing.cancel ? 'Membatalkan…' : 'Batalkan Pesanan'}
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="rounded-2xl border shadow-sm">
              <div className="border-b p-4 font-medium">Item</div>
              <ul className="divide-y">
                {data.items.map((it, i) => (
                  <li key={i} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{it.product.name}</div>
                        <div className="text-sm text-zinc-500">x{it.quantity}</div>
                      </div>
                      <div className="shrink-0 text-right font-medium">
                        {formatRupiah(it.price * it.quantity)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-2 space-y-4">
            {/* Pengiriman */}
            <div className="rounded-2xl border p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">Pengiriman</div>
                {data.trackingNumber && (
                  <button
                    type="button"
                    onClick={() => { void copyToClipboard(data.trackingNumber!) }}
                    className="text-xs underline underline-offset-4 hover:opacity-80"
                  >
                    Salin resi
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-2 text-sm">
                <InfoRow label="Resi" value={data.trackingNumber || '-'} mono />
                <InfoRow label="Kurir" value={data.courierCode || data.courierName || '-'} />
                <InfoRow
                  label="Penerima"
                  value={
                    data.recipientName
                      ? `${data.recipientName} (${data.recipientPhone || '-'})`
                      : '-'
                  }
                />
                <InfoRow
                  label="Alamat"
                  value={`${data.address || '-'}${data.subdistrictName ? `, ${data.subdistrictName}` : ''}`}
                />
              </div>

              {/* Hasil Tracking */}
              {track && (
                <div className="mt-4 rounded-xl border">
                  {!track.ok ? (
                    <div className="p-4 text-sm text-rose-700">Gagal: {track.message}</div>
                  ) : (
                    <>
                      <div className="p-4">
                        <div className="text-sm text-zinc-500">Status</div>
                        <div className="font-medium">{track.tracking?.status || '-'}</div>
                        <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                          <InfoRow label="Waybill" value={track.tracking?.waybill || '-'} mono />
                          <InfoRow label="Kurir" value={track.tracking?.courier || '-'} />
                          <InfoRow label="Layanan" value={track.tracking?.service || '-'} />
                        </div>
                      </div>
                      <div className="border-t p-4">
                        <div className="mb-3 font-medium">Riwayat Manifest</div>
                        <ManifestList manifest={track.tracking?.manifest || []} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Components ---------------- */

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-sm text-zinc-900 ${mono ? 'font-mono tracking-tight' : ''}`}>{value}</div>
    </div>
  )
}

function ManifestList({
  manifest,
}: {
  manifest: Array<{ date: string; time: string; city: string; description: string }>
}) {
  if (!manifest.length) {
    return <div className="text-sm text-zinc-600">Belum ada manifest.</div>
  }

  return (
    <ol className="relative ml-3 space-y-4 before:absolute before:-left-3 before:top-1 before:h-full before:w-px before:bg-zinc-200">
      {manifest.map((m, i) => (
        <li key={i} className="relative pl-5">
          <span className="absolute -left-3 top-1.5 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          <div className="text-xs text-zinc-500">
            {m.date} {m.time} · {m.city}
          </div>
          <div className="text-sm">{m.description}</div>
        </li>
      ))}
    </ol>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-9 w-64 rounded-xl bg-zinc-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="md:col-span-3 space-y-4">
            <div className="h-40 rounded-2xl border bg-zinc-100" />
            <div className="h-64 rounded-2xl border bg-zinc-100" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-64 rounded-2xl border bg-zinc-100" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Icons (mini, no deps) ---------------- */
function ArrowPath({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12a9 9 0 1 0 3-6.708" />
      <path d="M3 3v6h6" />
    </svg>
  )
}
function XMark({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  )
}
function Spinner({ className = '' }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}

/* ---------------- Helpers ---------------- */
async function copyToClipboard(text: string): Promise<boolean> {
  // Gunakan Clipboard API jika tersedia & secure context (HTTPS/localhost)
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined' && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Nomor resi disalin')
      return true
    } catch {
      // lanjut ke fallback
    }
  }

  // Fallback: execCommand('copy')
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    if (ok) {
      toast.success('Nomor resi disalin')
      return true
    }
  } catch {
    // ignore
  }

  toast.error('Gagal menyalin. Silakan salin manual (Ctrl/Cmd + C).')
  return false
}

function formatDateTime(x: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(x))
  } catch {
    return x
  }
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function mapStatus(s: OrderDetail['status']) {
  switch (s) {
    case 'pending':
      return { label: 'Menunggu', className: 'bg-amber-50 text-amber-700 ring-amber-200' }
    case 'paid':
      return { label: 'Dibayar', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    case 'processing':
      return { label: 'Diproses', className: 'bg-sky-50 text-sky-700 ring-sky-200' }
    case 'shipped':
      return { label: 'Dikirim', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' }
    case 'delivered':
      return { label: 'Tiba', className: 'bg-violet-50 text-violet-700 ring-violet-200' }
    case 'cancelled':
      return { label: 'Dibatalkan', className: 'bg-rose-50 text-rose-700 ring-rose-200' }
    default:
      return { label: s, className: 'bg-zinc-100 text-zinc-700 ring-zinc-200' }
  }
}
