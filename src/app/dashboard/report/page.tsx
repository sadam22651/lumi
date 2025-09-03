'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type GroupBy = 'day' | 'month' | 'year'

type ReportResponse = {
  range: { startDate: string; endDate: string; groupBy: GroupBy }
  summary: {
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    uniqueCustomers: number
  }
  byStatus: Record<string, { count: number; revenue: number }>
  timeseries: Record<string, { orders: number; revenue: number }>
  byCourier: Record<string, { orders: number; revenue: number; totalShippingCost: number }>
  topProducts: Array<{ id: string; name: string; qty: number; revenue: number }>
  customOrders: {
    ring: { total: number; byStatus: Record<string, number> }
    necklace: { total: number; byStatus: Record<string, number> }
  }
}

function formatIDRCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

export default function ReportPage() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [startDate, setStartDate] = useState<string>(firstOfMonth.toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(today.toISOString().slice(0, 10))
  const [groupBy, setGroupBy] = useState<GroupBy>('day')
  const [topN, setTopN] = useState<number>(5)
  const [includeCancelled, setIncludeCancelled] = useState<boolean>(false)

  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<ReportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate, groupBy, topN, includeCancelled }),
      })
      if (!res.ok) {
        const msg = await res.json().catch(() => ({}))
        throw new Error((msg?.error as string) || `HTTP ${res.status}`)
      }
      const json = (await res.json()) as ReportResponse
      setData(json)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // auto-load on first render
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    load()
  }, [])

  const timeseriesData = useMemo(
    () =>
      data
        ? Object.entries(data.timeseries)
            .sort(([a], [b]) => (a > b ? 1 : -1))
            .map(([k, v]) => ({ date: k, orders: v.orders, revenue: v.revenue }))
        : [],
    [data]
  )

  const courierRows = useMemo(
    () =>
      data
        ? Object.entries(data.byCourier).map(([key, v]) => {
            const [courierName, serviceName] = key.split('|')
            return { courierName, serviceName, ...v }
          })
        : [],
    [data]
  )

  const statusRows = useMemo(
    () =>
      data
        ? Object.entries(data.byStatus).map(([status, v]) => ({
            status,
            count: v.count,
            revenue: v.revenue,
          }))
        : [],
    [data]
  )

  const ringStatusRows = useMemo(
    () =>
      data
        ? Object.entries(data.customOrders.ring.byStatus).map(([status, count]) => ({
            status,
            count,
          }))
        : [],
    [data]
  )

  const necklaceStatusRows = useMemo(
    () =>
      data
        ? Object.entries(data.customOrders.necklace.byStatus).map(([status, count]) => ({
            status,
            count,
          }))
        : [],
    [data]
  )

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Laporan Penjualan</h1>
      </header>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="text-sm mb-1 block">Mulai</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm mb-1 block">Sampai</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm mb-1 block">Group By</label>
              <Select value={groupBy} onValueChange={(v: GroupBy) => setGroupBy(v)}>
                <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Harian</SelectItem>
                  <SelectItem value="month">Bulanan</SelectItem>
                  <SelectItem value="year">Tahunan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm mb-1 block">Top Produk</label>
              <Input
                type="number"
                min={1}
                value={topN}
                onChange={(e) => setTopN(Number(e.target.value || 1))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Checkbox
                id="includeCancelled"
                checked={includeCancelled}
                onCheckedChange={(v) => setIncludeCancelled(Boolean(v))}
              />
              <label htmlFor="includeCancelled" className="text-sm">Sertakan yang cancelled</label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={load} disabled={loading}>{loading ? 'Memuat…' : 'Terapkan'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {error && (
        <Card className="border-red-400">
          <CardHeader><CardTitle className="text-red-600">Gagal memuat</CardTitle></CardHeader>
          <CardContent>{error}</CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader><CardTitle>Total Pendapatan</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatIDRCurrency(data.summary.totalRevenue)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Total Pesanan</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatNumber(data.summary.totalOrders)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Rata-rata Order</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatIDRCurrency(data.summary.avgOrderValue)}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Customer Unik</CardTitle></CardHeader>
              <CardContent className="text-2xl font-semibold">
                {formatNumber(data.summary.uniqueCustomers)}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Card>
            <CardHeader><CardTitle>Grafik Orders & Revenue ({data.range.groupBy})</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeseriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(v: number, name: string) => name === 'revenue' ? formatIDRCurrency(v) : formatNumber(v)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status blocks */}
          <Card>
            <CardHeader><CardTitle>Ringkasan Status Transaksi</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statusRows.map((s) => (
                  <div key={s.status} className="rounded-xl border p-4">
                    <div className="text-sm text-muted-foreground">{s.status.toUpperCase()}</div>
                    <div className="mt-1 text-lg font-semibold">{formatNumber(s.count)} pesanan</div>
                    <div className="text-sm">{formatIDRCurrency(s.revenue)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom orders */}
          <Card>
            <CardHeader><CardTitle>Pesanan Custom (Ring & Necklace)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="font-semibold">Ring ({data.customOrders.ring.total})</div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-3">
                    {ringStatusRows.map((r) => (
                      <div key={`ring-${r.status}`} className="rounded-lg border p-3">
                        <div className="text-sm text-muted-foreground">{r.status}</div>
                        <div className="text-lg font-semibold">{formatNumber(r.count)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">Necklace ({data.customOrders.necklace.total})</div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-3">
                    {necklaceStatusRows.map((r) => (
                      <div key={`neck-${r.status}`} className="rounded-lg border p-3">
                        <div className="text-sm text-muted-foreground">{r.status}</div>
                        <div className="text-lg font-semibold">{formatNumber(r.count)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader><CardTitle>Top Produk</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Produk</th>
                    <th className="py-2 pr-4">Qty</th>
                    <th className="py-2 pr-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-2 pr-4">{p.name}</td>
                      <td className="py-2 pr-4">{formatNumber(p.qty)}</td>
                      <td className="py-2 pr-4">{formatIDRCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Courier Breakdown */}
          <Card>
            <CardHeader><CardTitle>Kurir & Layanan</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Kurir</th>
                    <th className="py-2 pr-4">Layanan</th>
                    <th className="py-2 pr-4">Orders</th>
                    <th className="py-2 pr-4">Shipping Cost</th>
                    <th className="py-2 pr-4">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {courierRows.map((c) => (
                    <tr key={`${c.courierName}-${c.serviceName}`} className="border-t">
                      <td className="py-2 pr-4">{c.courierName}</td>
                      <td className="py-2 pr-4">{c.serviceName}</td>
                      <td className="py-2 pr-4">{formatNumber(c.orders)}</td>
                      <td className="py-2 pr-4">{formatIDRCurrency(c.totalShippingCost)}</td>
                      <td className="py-2 pr-4">{formatIDRCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </main>
  )
}
