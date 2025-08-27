// src/app/pesan/cincin/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function PesanCincinPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    ringSize: "",
    engraveText: "",
    quantity: 1,
    notes: "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // kirim ke API backend
      const res = await fetch("/api/orders/ring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error("Gagal menyimpan pesanan")

      toast.success("Pesanan cincin berhasil dibuat!")
      router.push("/riwayat-pesanan") // arahkan ke halaman riwayat
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <a href="/" className="hover:underline">Beranda</a>
        <span className="mx-2">/</span>
        <a href="/pesan" className="hover:underline">Pesan</a>
        <span className="mx-2">/</span>
        <span className="font-medium text-foreground">Cincin</span>
      </nav>

      <h1 className="text-3xl font-bold mb-6">Pesan Cincin Perak</h1>

      <Card>
        <CardHeader>
          <CardTitle>Form Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Data Pemesan */}
            <div>
              <Label htmlFor="customerName">Nama Pemesan</Label>
              <Input
                id="customerName"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon / WhatsApp</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>

            <hr className="my-6" />

            {/* Detail Cincin */}
            <div>
              <Label htmlFor="ringSize">Ukuran Cincin</Label>
              <Input
                id="ringSize"
                name="ringSize"
                type="number"
                placeholder="Contoh: 16"
                value={form.ringSize}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="engraveText">Teks Ukiran (opsional)</Label>
              <Input
                id="engraveText"
                name="engraveText"
                placeholder="Contoh: Widuri 2025"
                value={form.engraveText}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                value={form.quantity}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Contoh: untuk lamaran"
                value={form.notes}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Pesan Sekarang"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
