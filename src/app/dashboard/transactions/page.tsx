'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface TxItem {
  id: string
  totalAmount: number
  createdAt: string
  // …
}

interface Summary {
  createdAt: string
  _sum: { totalAmount: number }
}

export default function ReportsPage() {
  const [from, setFrom] = useState('')
  const [to,   setTo]   = useState('')
  const [items, setItems] = useState<TxItem[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Summary[]>([])

  const fetchReport = async () => {
    try {
      const res = await axios.get('/api/reports/transactions', {
        params: { from, to }
      })
      setItems(res.data.items)
      setTotal(res.data.totalAmount)
      setSummary(res.data.summaryByDay || [])
    } catch {
      toast.error('Gagal memuat laporan')
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Laporan Transaksi</h1>

      {/* Filter Tanggal */}
      <div className="flex gap-4 mb-6">
        <div>
          <label>Dari:</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label>Sampai:</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        <Button onClick={fetchReport}>Muat Ulang</Button>
      </div>

      {/* Ringkasan Total */}
      <div className="mb-8">
        <p className="text-lg">Total Pendapatan: <strong>Rp {total.toLocaleString()}</strong></p>
      </div>

      {/* Grafik Pendapatan Harian */}
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={summary.map(s => ({
            date: new Date(s.createdAt).toLocaleDateString(),
            amount: s._sum.totalAmount,
          }))}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="#4f46e5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabel Detail Transaksi */}
      <table className="w-full mt-8 border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Tanggal</th>
            <th className="p-2">ID</th>
            <th className="p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map(tx => (
            <tr key={tx.id} className="odd:bg-white even:bg-gray-50">
              <td className="p-2">{new Date(tx.createdAt).toLocaleString()}</td>
              <td className="p-2">{tx.id}</td>
              <td className="p-2">Rp {tx.totalAmount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

