// src/app/checkout/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Script from 'next/script'
import { useRouter } from 'next/navigation'
import { getAuth } from 'firebase/auth'
import { app } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import axios from 'axios'
import LocationSelector from '@/components/LocationSelector'

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface ShippingOption {
  shipping_name: string
  service_name: string
  shipping_cost_net: number
  etd: string
  type: 'reguler' | 'cargo' | 'instant'
  is_cod: boolean
}

interface DistrictResult {
  id: number
  subdistrict_name: string
  city_name: string
}

/** =========================
 *  Mapping nama kurir → kode kurir (untuk API tracking)
 *  ========================= */
const COURIER_CODE_MAP: Record<string, string> = {
  'JNE': 'jne',
  'POS': 'pos',
  'POS INDONESIA': 'pos',
  'TIKI': 'tiki',
  'J&T': 'jnt',
  'J&T EXPRESS': 'jnt',
  'SICEPAT': 'sicepat',
  'SICEPAT EXPRESS': 'sicepat',
  'ANTERAJA': 'anteraja',
  'WAHANA': 'wahana',
  'LION PARCEL': 'lion',
  'NINJA': 'ninja',
  'NINJA XPRESS': 'ninja',
  'SAP': 'sap',
  'SAP EXPRESS': 'sap',
  'JET': 'jet',
  'JET EXPRESS': 'jet',
  'RPX': 'rex',
  'REX': 'rex',
}
function toCourierCode(shippingName?: string) {
  if (!shippingName) return ''
  const key = shippingName.trim().toUpperCase()
  return COURIER_CODE_MAP[key] ?? key.toLowerCase() // fallback aman
}

export default function CheckoutPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [items, setItems] = useState<CartItem[]>([])
  const [destination, setDestination] = useState<DistrictResult | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [shippingCost, setShippingCost] = useState(0)
  const [isCod, setIsCod] = useState(false)

  // alamat
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [address, setAddress] = useState('')

  // ✨ simpan kode kurir
  const [courierCode, setCourierCode] = useState<string>('')

  const originId = 48724
  const defaultWeight = 1
  const defaultItemValue = 5000

  useEffect(() => {
    const auth = getAuth(app)
    const user = auth.currentUser
    if (!user) return

    user.getIdToken().then(async (token) => {
      setUserId(user.uid)
      try {
        const res = await axios.get('/api/cart', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const cartItems = (res.data.items || []).map((i: any) => ({
          id: i.product?.id ?? i.id,
          name: i.product?.name ?? i.name,
          price: i.product?.price ?? i.price ?? 0,
          quantity: i.quantity ?? 1,
        }))
        setItems(cartItems)
      } catch {
        toast.error('Gagal mengambil keranjang')
      }
    })
  }, [])

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  const fetchShippingCost = async () => {
    if (!destination) return toast.error('Pilih tujuan pengiriman')

    try {
      const res = await axios.post('/api/shipping/cost', {
        origin: originId,
        destination: destination.id,
        weight: defaultWeight,
        item_value: total || defaultItemValue,
        cod: isCod ? 'yes' : 'no',
      })

      const reguler = (res.data?.data?.calculate_reguler ?? []).map((item: any) => ({
        ...item, type: 'reguler',
      }))
      const cargo = (res.data?.data?.calculate_cargo ?? []).map((item: any) => ({
        ...item, type: 'cargo',
      }))
      const instant = (res.data?.data?.calculate_instant ?? []).map((item: any) => ({
        ...item, type: 'instant',
      }))

      setShippingOptions([...reguler, ...cargo, ...instant])
      toast.success('Ongkir berhasil diambil!')
    } catch (err) {
      console.error('Gagal ambil ongkir:', err)
      toast.error('Gagal mengambil ongkir')
    }
  }

  const handleCheckout = async () => {
    if (!userId) return toast.error('Silakan login terlebih dahulu')
    if (items.length === 0) return toast.error('Keranjang kosong')
    if (!selectedShipping) return toast.error('Pilih metode pengiriman')
    if (shippingCost <= 0) return toast.error('Harap pilih metode pengiriman terlebih dahulu')
    if (!recipientName || !recipientPhone || !address || !destination) {
      return toast.error('Isi semua data pengiriman')
    }
    if (!courierCode) {
      return toast.error('Gagal menentukan kode kurir. Silakan pilih metode pengiriman ulang.')
    }

    try {
      const auth = getAuth(app)
      const user = auth.currentUser
      const token = await user?.getIdToken()

      // (opsional) simpan ringkas ke Cart
      await axios.patch(
        '/api/cart/shipping',
        {
          courier_name: selectedShipping.shipping_name,
          service_name: selectedShipping.service_name,
          shipping_cost: selectedShipping.shipping_cost_net,
          etd: selectedShipping.etd,
          is_cod: selectedShipping.is_cod,
          courier_code: courierCode, // opsional aja
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Ambil token Midtrans
      const { data } = await axios.post('/api/tokenizer', {
        userId,
        items: [
          ...items.map((i) => ({
            id: i.id, productName: i.name, price: i.price, quantity: i.quantity,
          })),
          { id: 'ongkir', productName: 'Biaya Pengiriman', price: shippingCost, quantity: 1 },
        ],
      })

      const tokenMidtrans = data.token
      ;(window as any).snap.pay(tokenMidtrans, {
        onSuccess: async () => {
          try {
            await axios.post(
              '/api/transactions',
              {
                items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
                courierName: selectedShipping.shipping_name,
                serviceName: selectedShipping.service_name,
                shippingCost: selectedShipping.shipping_cost_net,
                etd: selectedShipping.etd,
                isCod,
                totalAmount: total + shippingCost,

                // ✨ penting untuk tracking ke depan
                courierCode,

                // alamat
                recipientName,
                recipientPhone,
                address,
                subdistrictId: destination.id,
                subdistrictName: `${destination.subdistrict_name}, ${destination.city_name}`,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            )
            toast.success('Pembayaran & transaksi berhasil!')
            router.push('/transactions/history')
          } catch (err) {
            console.error('Gagal simpan transaksi:', err)
            toast.error('Pembayaran berhasil, tapi gagal simpan transaksi.')
          }
        },
        onError: () => toast.error('Pembayaran gagal.'),
      })
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat checkout.')
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_CLIENT}
        strategy="afterInteractive"
      />

      <h1 className="text-2xl font-bold">Checkout</h1>

      {items.length === 0 ? (
        <p className="text-center text-gray-600">Keranjangmu kosong.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between">
                <div>
                  <p className="font-medium">{i.name}</p>
                  <p className="text-sm text-gray-600">
                    {i.quantity} × Rp {i.price.toLocaleString()}
                  </p>
                </div>
                <p>Rp {(i.price * i.quantity).toLocaleString()}</p>
              </li>
            ))}
          </ul>

          <div className="space-y-2">
            <Input
              placeholder="Nama penerima"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
            <Input
              placeholder="Nomor HP"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
            />
            <textarea
              className="w-full border rounded p-2"
              placeholder="Alamat lengkap (jalan, no rumah, RT/RW, patokan)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <LocationSelector
            label="Kota/Kecamatan Tujuan"
            value={destination?.id ?? null}
            onChange={setDestination}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isCod}
              onChange={(e) => setIsCod(e.target.checked)}
            />
            Kirim dengan COD?
          </label>

          <Button onClick={fetchShippingCost}>Cek Ongkir</Button>

          {shippingOptions.length > 0 && (
            <div className="space-y-3 border p-4 rounded">
              <h2 className="font-semibold">Pilih Metode Pengiriman:</h2>
              <ul className="space-y-2">
                {shippingOptions.map((opt, idx) => {
                  const selected =
                    selectedShipping?.shipping_name === opt.shipping_name &&
                    selectedShipping?.service_name === opt.service_name
                  const codePreview = toCourierCode(opt.shipping_name)
                  return (
                    <li
                      key={idx}
                      className={`cursor-pointer border p-3 rounded ${
                        selected ? 'bg-green-100 border-green-500' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        setSelectedShipping(opt)
                        setShippingCost(opt.shipping_cost_net)
                        setCourierCode(codePreview) // ✨ simpan kode kurir
                      }}
                    >
                      <p className="font-bold">
                        {opt.shipping_name} - {opt.service_name}{' '}
                        <span className="text-sm text-gray-500">({opt.type})</span>
                      </p>
                      <p>
                        Rp {opt.shipping_cost_net.toLocaleString()} (Estimasi:{' '}
                        {opt.etd === '-' ? 'Tidak tersedia' : opt.etd})
                      </p>
                      <p className="text-xs text-gray-500">
                        Kode kurir: {selected ? courierCode : codePreview}
                      </p>
                      <p className="text-sm text-gray-500">
                        COD: {opt.is_cod ? 'Ya' : 'Tidak'}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm">Ongkir: Rp {shippingCost.toLocaleString()}</p>
            <p className="text-lg font-semibold">
              Total Bayar: Rp {(total + shippingCost).toLocaleString()}
            </p>
          </div>

          <Button onClick={handleCheckout} className="w-full">
            Konfirmasi & Bayar
          </Button>
        </>
      )}
    </div>
  )
}
