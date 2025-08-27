'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface DistrictResult {
  id: number
  subdistrict_name: string
  city_name: string
}

interface Props {
  label: string
  value: number | null
  onChange: (val: DistrictResult | null) => void
}

export default function LocationSelector({ label, value, onChange }: Props) {
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<DistrictResult[]>([])

  const handleSearch = async () => {
    if (!search) return
    const res = await fetch(`/api/shipping/search-district?keyword=${encodeURIComponent(search)}`)
    const data = await res.json()
    setOptions(data.data ?? [])
  }

  return (
    <div className="space-y-1">
      <p className="font-medium">{label}</p>
      <div className="flex gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Cari ${label}`} />
        <Button type="button" onClick={handleSearch}>Cari</Button>
      </div>
      {options.length > 0 && (
        <Select
          value={value ? String(value) : ''}
          onValueChange={(val) => {
            const found = options.find((o) => String(o.id) === val)
            onChange(found ?? null)
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Pilih ${label}`} />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-auto">
            {options.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.subdistrict_name}, {item.city_name} (ID: {item.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
