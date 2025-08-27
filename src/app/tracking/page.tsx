// src/app/tracking/page.tsx
'use client'

import { useMemo, useRef, useState } from 'react'

type TrackingResponse = {
  meta: { message: string; code: number; status: string }
  data?: {
    delivered?: boolean
    summary?: any
    details?: any
    delivery_status?: any
    manifest?: Array<{
      manifest_code?: string
      manifest_description?: string
      manifest_date?: string
      manifest_time?: string
      city_name?: string
    }>
  }
  snippet?: string
  raw?: any
}

const COURIERS = [
  'jne','pos','tiki','jnt','sicepat','anteraja',
  'wahana','lion','ninja','sap','jet','rex'
] as const

export default function TrackingPage() {
  const [waybill, setWaybill] = useState('')
  const [courier, setCourier] = useState<(typeof COURIERS)[number]>('wahana')

  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState<TrackingResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const canSubmit = useMemo(
    () => waybill.trim().length >= 5 && !!courier && !loading,
    [waybill, courier, loading]
  )

  const controllerRef = useRef<AbortController | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setErr(null)
    setResp(null)

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ waybill: waybill.trim(), courier }),
        cache: 'no-store' as any,
        signal: controller.signal,
      })

      const ctype = res.headers.get('content-type') || ''
      if (!ctype.includes('application/json')) {
        const text = await res.text().catch(() => '')
        setResp({
          meta: {
            message: `Respons bukan JSON (HTTP ${res.status})`,
            code: res.status,
            status: 'error',
          },
          snippet: text.slice(0, 200),
        })
        return
      }

      const json: TrackingResponse = await res.json()
      setResp(json)
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setErr(e?.message || 'Gagal menghubungi server')
    } finally {
      setLoading(false)
    }
  }

  function loadSample() {
    setWaybill('MT685U91')
    setCourier('wahana')
    setErr(null)
    setResp({
      meta: { message: 'Success Get Waybill', code: 200, status: 'success' },
      data: {
        delivered: true,
        summary: {
          courier_code: 'wahana',
          courier_name: 'Wahana Prestasi Logistik',
          waybill_number: 'MT685U91',
          service_code: '',
          waybill_date: '2024-10-08',
          shipper_name: 'TOKO ALAT LUKIS (08112XXXXXX)',
          receiver_name: 'FIKRI EL SARA (085668XXXXXX)',
          origin: '',
          destination: 'di Kota Sukabumi',
          status: 'DELIVERED',
        },
        details: {
          waybill_number: 'MT685U91',
          waybill_date: '2024-10-08',
          waybill_time: '11:14:29',
          weight: '',
          origin: '',
          destination: 'di Kota Sukabumi',
          shipper_name: 'TOKO ALAT LUKIS (08112XXXXXX)',
          receiver_name: 'FIKRI EL SARA (085668XXXXXX)',
          receiver_city: 'di Kota Sukabumi',
        },
        delivery_status: {
          status: 'DELIVERED',
          pod_receiver: 'FIKRI EL SARA (085668XXXXXX)',
          pod_date: '2024-10-11',
          pod_time: '09:26:13',
        },
        manifest: [
          {
            manifest_description: 'Diterima di Sales Counter AGEN WPL BANTUL NGESTIHARJO MADUMURTI 50',
            manifest_date: '2024-10-08',
            manifest_time: '11:14:29',
          },
          {
            manifest_description: 'Di pick-up oleh petugas WAHANA Bantul',
            manifest_date: '2024-10-08',
            manifest_time: '20:04:18',
          },
          {
            manifest_description: 'Diterima oleh FIKRI EL SARA (Penerima Langsung)',
            manifest_date: '2024-10-11',
            manifest_time: '09:26:13',
          },
        ],
      },
    })
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Tracking Waybill</h1>
        <p className="text-sm text-gray-500">
          Endpoint: <code>/api/tracking</code>
        </p>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border p-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Nomor Resi (AWB)</span>
          <input
            className="h-10 rounded-xl border px-3"
            value={waybill}
            onChange={(e) => setWaybill(e.target.value.replace(/\s+/g, ''))}
            placeholder="Contoh: MT685U91"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Kurir</span>
          <select
            className="h-10 rounded-xl border px-3 bg-white"
            value={courier}
            onChange={(e) => setCourier(e.target.value as any)}
          >
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-3">
          <button
            disabled={!canSubmit}
            className="h-10 rounded-xl bg-black text-white px-4 disabled:opacity-50"
          >
            {loading ? 'Mencari…' : 'Track'}
          </button>

          <button
            type="button"
            onClick={loadSample}
            className="h-10 rounded-xl border px-4 text-sm hover:bg-gray-50"
            title="Isi tampilan dengan data contoh tanpa memanggil API"
          >
            Gunakan Data Contoh
          </button>

          {resp && (
            <button
              type="button"
              onClick={() => setResp(null)}
              className="h-10 rounded-xl border px-4 text-sm hover:bg-gray-50"
            >
              Bersihkan
            </button>
          )}
        </div>

        {err && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {err}
          </div>
        )}
      </form>

      {resp && <ResultBlock resp={resp} />}
    </main>
  )
}

function ResultBlock({ resp }: { resp: TrackingResponse }) {
  const ok = resp.meta?.code === 200 && resp.meta?.status === 'success'
  return (
    <section
      className={`grid gap-3 rounded-2xl border p-4 ${
        ok ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Hasil</h2>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          {ok ? 'Success' : 'Error'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <Info label="Message" value={resp.meta?.message} />
        <Info label="Code" value={resp.meta?.code} />
        <Info label="Status" value={resp.meta?.status} />
      </div>

      {ok && resp.data?.summary && (
        <div className="rounded-xl border bg-white p-3">
          <h3 className="font-medium mb-2">Ringkasan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Info label="Waybill" value={resp.data.summary.waybill_number} />
            <Info label="Kurir" value={resp.data.summary.courier_name} />
            <Info label="Status" value={resp.data.summary.status} />
            <Info label="Tanggal" value={resp.data.summary.waybill_date} />
            <Info label="Pengirim" value={resp.data.summary.shipper_name} />
            <Info label="Penerima" value={resp.data.summary.receiver_name} />
            <Info label="Tujuan" value={resp.data.summary.destination} />
          </div>
        </div>
      )}

      {ok && resp.data?.delivery_status && (
        <div className="rounded-xl border bg-white p-3">
          <h3 className="font-medium mb-2">Delivery Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Info label="Status" value={resp.data.delivery_status.status} />
            <Info label="POD Receiver" value={resp.data.delivery_status.pod_receiver} />
            <Info label="POD Date" value={resp.data.delivery_status.pod_date} />
            <Info label="POD Time" value={resp.data.delivery_status.pod_time} />
          </div>
        </div>
      )}

      {ok && resp.data?.details && (
        <div className="rounded-xl border bg-white p-3">
          <h3 className="font-medium mb-2">Detail</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <Info label="Origin" value={resp.data.details.origin} />
            <Info label="Destination" value={resp.data.details.destination} />
            <Info label="Waybill Time" value={resp.data.details.waybill_time} />
            <Info label="Receiver City" value={resp.data.details.receiver_city} />
          </div>
        </div>
      )}

      {ok && Array.isArray(resp.data?.manifest) && resp.data!.manifest!.length > 0 && (
        <div className="rounded-xl border bg-white p-3">
          <h3 className="font-medium mb-2">Manifest</h3>
          <ul className="text-sm space-y-1">
            {resp.data!.manifest!.map((m, i) => (
              <li key={i} className="grid grid-cols-1 sm:grid-cols-[120px_80px_1fr] gap-2">
                <span className="tabular-nums">{m.manifest_date}</span>
                <span className="tabular-nums">{m.manifest_time}</span>
                <span>{m.manifest_description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!ok && resp.snippet && (
        <div className="rounded-xl border bg-white p-3 text-xs">
          <div className="text-gray-500 mb-1">Snippet</div>
          <pre className="overflow-x-auto">{resp.snippet}</pre>
        </div>
      )}
    </section>
  )
}

function Info({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value ?? '-'}</span>
    </div>
  )
}
