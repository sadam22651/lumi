// src/app/pesan/cincin/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type FormState = {
  customerName: string
  phone: string
  address: string
  ringSize: string // pakai string agar mudah diketik, di-parse saat submit
  engraveText: string
  quantity: number
  notes: string
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message
    if (typeof m === "string") return m
  }
  try {
    return String(err)
  } catch {
    return "Terjadi kesalahan"
  }
}

export default function PesanCincinPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
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
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerName.trim() || !form.phone.trim() || !form.address.trim()) {
      toast.error("Lengkapi data pemesan")
      return
    }
    const sizeNum = Number(form.ringSize)
    if (!Number.isFinite(sizeNum) || sizeNum < 5 || sizeNum > 30) {
      toast.error("Ukuran cincin harus 5–30")
      return
    }
    const qtyNum = Number(form.quantity)
    if (!Number.isFinite(qtyNum) || qtyNum < 1 || qtyNum > 10) {
      toast.error("Jumlah 1–10")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/pesan/cincin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ringSize: sizeNum,
          quantity: qtyNum,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({} as Record<string, unknown>))
        const msg =
          (typeof errJson?.error === "string" && errJson.error) ||
          "Gagal menyimpan pesanan"
        throw new Error(msg)
      }

      toast.success("Pesanan cincin berhasil dibuat!")
      router.push("/riwayat-pesanan")
    } catch (err: unknown) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Beranda</Link>
        <span className="mx-2">/</span>
        <Link href="/pesan" className="hover:underline">Pesan</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-foreground">Cincin</span>
      </nav>

      <h1 className="mb-6 text-3xl font-bold">Pesan Cincin Perak</h1>

      <Card>
        <CardHeader>
          <CardTitle>Form Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="customerName">Nama Pemesan</Label>
              <Input
                id="customerName"
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                required
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <hr className="my-6" />

            <div>
              <Label htmlFor="ringSize">Ukuran Cincin</Label>
              <Input
                id="ringSize"
                name="ringSize"
                type="number"
                inputMode="numeric"
                placeholder="Contoh: 16"
                min={5}
                max={30}
                value={form.ringSize}
                onChange={handleChange}
                required
                disabled={loading}
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
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="quantity">Jumlah</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={form.quantity}
                onChange={handleChange}
                disabled={loading}
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
                disabled={loading}
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
