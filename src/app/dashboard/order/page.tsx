'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import clsx from 'clsx'

interface Order {
  id: string
  createdAt: string
  total: number
  status: string               // status pembayaran/order (jika ada)
  shipping_status?: string     // PENDING | PACKED | SHIPPED | DELIVERED (opsional)
  courier_code?: string | null // contoh: "wahana"
  waybill?: string | null      // contoh: "MT685U91"
  user: { name: string | null; email: string | null }
}

export default function AdminOrderPage() {
  const user = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return
      const token = await user.getIdToken()
      try {
        const res = await axios.get('/api/dashboard/orders', {
          headers: { Authorization: `Bearer ${token}` },
        })
        setOrders(res.data.orders ?? [])
      } catch (err: any) {
        console.error('Gagal ambil pesanan:', err)
        setError(err?.message || 'Gagal memuat pesanan')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  if (!user || loading) return <p className="p-4">Loading...</p>
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Daftar Pesanan Masuk</h1>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Daftar Pesanan Masuk</h1>

      {!orders.length ? (
        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
          Belum ada pesanan.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border p-4 rounded-lg shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="space-y-1">
                <p className="font-semibold">ID: {order.id}</p>
                <p>
                  {order.user.name ?? 'Tanpa Nama'} ({order.user.email ?? '-'})
                </p>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <BadgeStatus status={order.shipping_status ?? order.status} />
                  <span className="text-gray-500">
                    Tanggal: {new Date(order.createdAt).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="text-sm text-gray-700">
                  Kurir:&nbsp;
                  <span className="font-medium">
                    {order.courier_code ? order.courier_code.toUpperCase() : '-'}
                  </span>
                  &nbsp;• Resi:&nbsp;
                  <span className="font-medium">{order.waybill || '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/dashboard/order/${order.id}`)} // ✅ plural
                >
                  Lihat Detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BadgeStatus({ status }: { status?: string }) {
  const s = (status || 'PENDING').toUpperCase()
  const style = clsx(
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs border',
    s === 'DELIVERED' && 'bg-green-50 border-green-300 text-green-700',
    s === 'SHIPPED' && 'bg-blue-50 border-blue-300 text-blue-700',
    (s === 'PACKED' || s === 'READY_TO_SHIP') && 'bg-amber-50 border-amber-300 text-amber-700',
    s === 'PENDING' && 'bg-gray-50 border-gray-300 text-gray-700'
  )
  return <span className={style}>{s}</span>
}
