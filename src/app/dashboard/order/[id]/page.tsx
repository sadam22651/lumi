'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { COURIER_LABELS } from '@/lib/shipping/couriers' // untuk label kurir

type TransactionItem = {
  id: string
  quantity: number
  price: number
  product: { name: string }
}

type Transaction = {
  id: string
  user: { name: string | null; email: string | null }
  address: string
  subdistrictName: string
  recipientPhone: string
  courierName: string
  serviceName: string
  etd: string
  status: 'paid' | 'processing' | 'shipped' | 'done' | 'cancelled'
  shippingCost: number
  totalAmount: number
  items: TransactionItem[]
  // 🔹 field shipping dari schema kamu
  courierCode?: string | null
  trackingNumber?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
}

const formatRp = (n: number) => `Rp${(n ?? 0).toLocaleString('id-ID')}`

export default function OrderDetailPage() {
  const { id } = useParams() as { id: string }
  const user = useAuth()
  const router = useRouter()

  const [data, setData] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<Transaction['status']>('paid')
  const [downloading, setDownloading] = useState(false)

  // 🔹 state baru untuk pengiriman
  const [courierCode, setCourierCode] = useState<string>('')
  const [trackingNumber, setTrackingNumber] = useState<string>('')

  const [savingShip, setSavingShip] = useState(false)
  const [tracking, setTracking] = useState(false)
  const [trackMeta, setTrackMeta] = useState<any | null>(null)
  const [trackData, setTrackData] = useState<any | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await user?.getIdToken()
        const res = await axios.get(`/api/dashboard/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const tx: Transaction = res.data.transaction
        setData(tx)
        setStatus(tx.status)

        // isi form shipping dari data
        setCourierCode(tx.courierCode || '')
        setTrackingNumber(tx.trackingNumber || '')
      } catch (e) {
        toast.error('Gagal memuat detail transaksi')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (user) fetch()
  }, [user, id])

  const updateStatus = async () => {
    try {
      const token = await user?.getIdToken()
      await axios.patch(
        `/api/dashboard/orders/${id}`,
        { newStatus: status },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Status berhasil diperbarui')
      router.refresh()
    } catch (err) {
      toast.error('Gagal update status')
      console.error(err)
    }
  }

  const generateInvoice = async () => {
    if (!data) return
    try {
      setDownloading(true)
      const pdfMake = (await import('pdfmake/build/pdfmake')).default as any
      const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default as any
      pdfMake.vfs = pdfFonts.vfs

      const docDefinition = {
        content: [
          { text: 'INVOICE', style: 'header' },
          { text: `ID Transaksi: ${data.id}`, margin: [0, 0, 0, 10] },

          {
            columns: [
              [
                { text: `Nama: ${data.user?.name ?? '-'}` },
                { text: `Email: ${data.user?.email ?? '-'}` },
                { text: `HP: ${data.recipientPhone}` },
              ],
              [
                { text: `Kurir: ${data.courierName} - ${data.serviceName}` },
                { text: `Resi: ${data.trackingNumber ?? '-'}` },
                { text: `ETD: ${data.etd}` },
              ],
            ],
            margin: [0, 0, 0, 10],
          },

          { text: `Alamat: ${data.address} (${data.subdistrictName})`, margin: [0, 0, 0, 10] },

          {
            table: {
              widths: ['*', 'auto', 'auto'],
              body: [
                ['Nama Produk', 'Qty', 'Harga'],
                ...data.items.map((item) => [
                  item.product.name,
                  item.quantity,
                  formatRp(item.price),
                ]),
              ],
            },
          },

          {
            text:
              `\nOngkir: ${formatRp(data.shippingCost)}\n` +
              `Total Bayar: ${formatRp(data.totalAmount)}`,
            style: 'total',
            margin: [0, 10, 0, 0],
          },
        ],
        styles: {
          header: { fontSize: 18, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
          total: { bold: true },
        },
        defaultStyle: { fontSize: 10 },
      }

      pdfMake.createPdf(docDefinition).download(`invoice-${data.id}.pdf`)
    } catch (e) {
      toast.error('Gagal membuat invoice')
      console.error(e)
    } finally {
      setDownloading(false)
    }
  }

  // 🔹 Simpan pengiriman -> POST /api/orders/[id]/shipping
  async function saveShipping() {
    if (!id) return
    if (!courierCode || trackingNumber.trim().length < 5) {
      toast.error('Kurir & nomor resi wajib diisi (min 5 karakter)')
      return
    }
    try {
      setSavingShip(true)
      const token = await user?.getIdToken()
      await axios.post(
        `/api/orders/${id}/shipping`,
        { waybill: trackingNumber.trim(), courier: courierCode.toLowerCase() },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Pengiriman disimpan')
      router.refresh()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal simpan pengiriman')
      console.error(e)
    } finally {
      setSavingShip(false)
    }
  }

  // 🔹 Lacak sekarang -> POST /api/orders/[id]/track
  async function trackNow() {
    if (!id) return
    try {
      setTracking(true)
      const token = await user?.getIdToken()
      const res = await axios.post(
        `/api/dashboard/orders/${id}/track`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const j = res.data
      if (j?.ok) {
        setTrackMeta(j.meta)
        setTrackData(j.data)
        toast.success('Tracking diperbarui')
      } else {
        toast.error(j?.message || 'Gagal tracking')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Gagal tracking')
      console.error(e)
    } finally {
      setTracking(false)
    }
  }

  if (loading) return <p className="p-4">Loading...</p>
  if (!data) return <p className="p-4">Transaksi tidak ditemukan.</p>

  const courierLabel = courierCode ? (COURIER_LABELS as any)[courierCode] || courierCode.toUpperCase() : '-'

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Detail Transaksi</h1>

      <div className="border p-4 rounded-md">
        <p><strong>Pemesan:</strong> {data.user.name} ({data.user.email})</p>
        <p><strong>Alamat:</strong> {data.address} ({data.subdistrictName})</p>
        <p><strong>HP:</strong> {data.recipientPhone}</p>
        <p><strong>Kurir:</strong> {data.courierName} - {data.serviceName}</p>
        <p><strong>Ongkir:</strong> {formatRp(data.shippingCost)}</p>
        <p><strong>Total Bayar:</strong> {formatRp(data.totalAmount)}</p>
      </div>

      {/* 🔹 Form Pengiriman */}
      <div className="border p-4 rounded-md space-y-3">
        <h2 className="font-semibold">Pengiriman</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Kurir dari checkout (read-only label, tapi kalau mau editable tinggal jadikan select) */}
          <div>
            <div className="text-sm text-gray-500">Kurir</div>
            <div className="font-medium">{courierLabel}</div>
            {!courierCode && <div className="text-xs text-red-600">Kurir belum tersimpan dari checkout</div>}
          </div>

          {/* Nomor Resi */}
          <label className="grid gap-1">
            <span className="text-sm text-gray-500">Nomor Resi</span>
            <input
              className="h-10 rounded border px-3"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.replace(/\s+/g, ''))}
              placeholder="Contoh: MT685U91"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveShipping} disabled={!courierCode || trackingNumber.trim().length < 5 || savingShip}>
            {savingShip ? 'Menyimpan…' : 'Simpan Pengiriman'}
          </Button>
          <Button variant="outline" onClick={trackNow} disabled={tracking}>
            {tracking ? 'Melacak…' : 'Lacak Sekarang'}
          </Button>
        </div>

        {/* Ringkasan tracking (kalau habis klik lacak) */}
        {trackMeta && (
          <div className="rounded border p-3 bg-green-50 mt-3">
            <div className="text-sm">Meta: {trackMeta.message} (code {trackMeta.code})</div>
          </div>
        )}
        {trackData?.summary && (
          <div className="mt-3 rounded border p-3">
            <div className="font-medium">Ringkasan</div>
            <div className="text-sm grid sm:grid-cols-2">
              <div>Waybill: {trackData.summary.waybill_number}</div>
              <div>Status: {trackData.summary.status}</div>
              <div>Kurir: {trackData.summary.courier_name}</div>
              <div>Penerima: {trackData.delivery_status?.pod_receiver || '-'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Barang */}
      <div className="border p-4 rounded-md">
        <h2 className="font-semibold mb-2">Barang:</h2>
        <ul className="space-y-1">
          {data.items.map((item) => (
            <li key={item.id}>
              {item.product.name} — Qty: {item.quantity} — Harga: {formatRp(item.price)}
            </li>
          ))}
        </ul>
      </div>

      {/* Status + Invoice */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus(v as Transaction['status'])}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={updateStatus}>Update Status</Button>
        <Button variant="outline" onClick={generateInvoice} disabled={downloading}>
          {downloading ? 'Membuat Invoice...' : 'Download Invoice'}
        </Button>
      </div>
    </div>
  )
}
