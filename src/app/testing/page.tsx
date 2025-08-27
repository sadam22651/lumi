'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DistrictResult {
  id: number
  subdistrict_name: string
  city_name: string
}

interface CostResult {
  shipping_name: string
  service_name: string
  weight: number
  is_cod: boolean
  shipping_cost: number
  etd: string
  type: 'reguler' | 'cargo' | 'instant'
}

export default function ShippingCostPage() {
  const [searchOrigin, setSearchOrigin] = useState('')
  const [searchDest, setSearchDest] = useState('')
  const [originResults, setOriginResults] = useState<DistrictResult[]>([])
  const [destResults, setDestResults] = useState<DistrictResult[]>([])
  const [origin, setOrigin] = useState<DistrictResult | null>(null)
  const [destination, setDestination] = useState<DistrictResult | null>(null)
  const [weight, setWeight] = useState('')
  const [itemValue, setItemValue] = useState('')
  const [isCod, setIsCod] = useState(false)
  const [costs, setCosts] = useState<CostResult[]>([])

  async function fetchDistrict(keyword: string, setList: any, setSelected: any, setSearch: any) {
    if (!keyword) return
    try {
      const res = await fetch(`/api/shipping/search-district?keyword=${encodeURIComponent(keyword)}`)
      const data = await res.json()
      if (data.data && Array.isArray(data.data)) {
        setList(data.data)
        setSelected(data.data[0])
        setSearch(`${data.data[0].subdistrict_name}, ${data.data[0].city_name}`)
      } else {
        setList([])
        setSelected(null)
      }
    } catch (err) {
      console.error('Gagal fetch district:', err)
    }
  }

  const handleCheckShipping = async () => {
    if (!origin || !destination || !weight || !itemValue) {
      alert('Lengkapi semua input terlebih dahulu.')
      return
    }

    try {
      const res = await fetch('/api/shipping/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin.id,
          destination: destination.id,
          weight: Number(weight),
          item_value: Number(itemValue),
          cod: isCod ? 'yes' : 'no',
        }),
      })

      const data = await res.json()

      const reguler = (data?.data?.calculate_reguler ?? []).map((item: any) => ({
        ...item,
        type: 'reguler',
      }))
      const cargo = (data?.data?.calculate_cargo ?? []).map((item: any) => ({
        ...item,
        type: 'cargo',
      }))
      const instant = (data?.data?.calculate_instant ?? []).map((item: any) => ({
        ...item,
        type: 'instant',
      }))

      setCosts([...reguler, ...cargo, ...instant])
    } catch (error) {
      console.error('Gagal cek ongkir:', error)
    }
  }

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-start bg-gray-50">
      <div className="w-full max-w-xl bg-white p-6 rounded shadow space-y-6">
        <h1 className="text-xl font-bold text-center">Cek Ongkir</h1>

        {/* Asal */}
        <form onSubmit={(e) => { e.preventDefault(); fetchDistrict(searchOrigin, setOriginResults, setOrigin, setSearchOrigin) }} className="space-y-2">
          <p className="font-medium">Kota/Kecamatan Asal</p>
          <div className="flex gap-2">
            <Input placeholder="Ketik asal" value={searchOrigin} onChange={(e) => setSearchOrigin(e.target.value)} />
            <Button type="submit">Cari</Button>
          </div>
          {originResults.length > 0 && (
            <Select value={origin ? String(origin.id) : ''} onValueChange={(val) => {
              const found = originResults.find((r) => String(r.id) === val)
              if (found) {
                setOrigin(found)
                setSearchOrigin(`${found.subdistrict_name}, ${found.city_name}`)
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih asal" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto z-[9999]">
                {originResults.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.subdistrict_name}, {item.city_name} (ID: {item.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form>

        {/* Tujuan */}
        <form onSubmit={(e) => { e.preventDefault(); fetchDistrict(searchDest, setDestResults, setDestination, setSearchDest) }} className="space-y-2">
          <p className="font-medium">Kota/Kecamatan Tujuan</p>
          <div className="flex gap-2">
            <Input placeholder="Ketik tujuan" value={searchDest} onChange={(e) => setSearchDest(e.target.value)} />
            <Button type="submit">Cari</Button>
          </div>
          {destResults.length > 0 && (
            <Select value={destination ? String(destination.id) : ''} onValueChange={(val) => {
              const found = destResults.find((r) => String(r.id) === val)
              if (found) {
                setDestination(found)
                setSearchDest(`${found.subdistrict_name}, ${found.city_name}`)
              }
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tujuan" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-auto z-[9999]">
                {destResults.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.subdistrict_name}, {item.city_name} (ID: {item.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </form>

        {/* Berat, Nilai Barang, COD */}
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="Berat Barang (gram)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Nilai Barang (Rp)"
            value={itemValue}
            onChange={(e) => setItemValue(e.target.value)}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isCod}
              onChange={(e) => setIsCod(e.target.checked)}
            />
            Kirim dengan COD?
          </label>
        </div>

        <Button className="w-full" onClick={handleCheckShipping}>
          Cek Ongkir
        </Button>

        {costs.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h2 className="text-lg font-semibold">Hasil Ongkir:</h2>
            <ul className="space-y-2">
              {costs.map((item, idx) => (
                <li key={idx}>
                  <p className="font-bold">
                    {item.shipping_name} - {item.service_name}{' '}
                    <span className="text-sm text-gray-500">({item.type})</span>
                  </p>
                  <p>Rp {item.shipping_cost.toLocaleString()} (Estimasi: {item.etd === '-' ? 'Tidak tersedia' : item.etd})</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
