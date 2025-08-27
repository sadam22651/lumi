'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import { toast } from 'sonner'

type Category = { id: string; name: string }

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    weight: '',
    size: '',
    detail: '',
    image: '',
    categoryId: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, categoryRes] = await Promise.all([
          axios.get(`/api/dashboard/products/${id}`),
          axios.get('/api/categories'),
        ])
        const product = productRes.data
        setForm({
          name: product.name ?? '',
          price: (product.price ?? '').toString(),
          stock: (product.stock ?? '').toString(),
          weight: product.weight?.toString() ?? '',
          size: product.size ?? '',
          detail: product.detail ?? '',
          image: product.image ?? '',
          categoryId: product.categoryId ?? '',
        })
        setCategories(categoryRes.data)
      } catch (error) {
        console.error(error)
        toast.error('Gagal memuat data produk')
      }
    }
    fetchData()
  }, [id])

  // Bersihkan object URL saat unmount / ganti file
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      toast.error('Format gambar harus JPG/PNG/WEBP')
      return
    }

    setFile(selectedFile)
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return url
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let filename = form.image

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await axios.post('/api/upload', formData)
        filename = uploadRes.data.filename
      }

      await axios.patch(`/api/products/${id}`, {
        name: form.name,
        price: form.price,
        stock: form.stock,
        weight: form.weight,
        size: form.size,
        detail: form.detail,
        categoryId: form.categoryId,
        image: filename,
      })

      toast.success('Produk berhasil diperbarui')
      router.push('/dashboard/products')
    } catch (error) {
      console.error(error)
      toast.error('Gagal memperbarui produk')
    } finally {
      setSaving(false)
    }
  }

  const currentImgSrc = useMemo(
    () => (form.image ? `/uploads/${form.image}` : ''),
    [form.image]
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Produk</h1>

      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        {/* Grid utama: kiri form dasar, kanan gambar */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Kiri */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Produk</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} />
            </div>

            <div>
              <Label htmlFor="price">Harga Produk</Label>
              <Input
                id="price"
                name="price"
                inputMode="numeric"
                placeholder="contoh: 150000"
                value={form.price}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min="1"
                  value={form.stock}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="weight">Berat (gram)</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min="1"
                  value={form.weight}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="size">Ukuran</Label>
              <Input
                id="size"
                name="size"
                placeholder="Contoh: 6, 7, M, L, 45cm"
                value={form.size}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Kategori</Label>
              <select
                id="categoryId"
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Kanan: perbandingan gambar */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Perbandingan Gambar</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {/* Gambar Saat Ini */}
                <div className="rounded-lg border border-dashed border-border p-2">
                  <p className="mb-2 text-xs text-muted-foreground">Saat ini</p>
                  {currentImgSrc ? (
                    <img
                      src={currentImgSrc}
                      alt="Gambar saat ini"
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="aspect-square w-full rounded-md bg-muted/40" />
                  )}
                </div>

                {/* Gambar Baru */}
                <div className="rounded-lg border border-dashed border-border p-2">
                  <p className="mb-2 text-xs text-muted-foreground">Gambar baru</p>
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview gambar baru"
                      className="aspect-square w-full rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center rounded-md bg-muted/40 text-xs text-muted-foreground">
                      Belum ada file dipilih
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="image">Ubah Gambar</Label>
              <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
              <p className="text-xs text-muted-foreground">
                Format: JPG, PNG, WEBP. Maks 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Detail panjang */}
        <div>
          <Label htmlFor="detail">Detail Produk</Label>
          <textarea
            id="detail"
            name="detail"
            rows={5}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={form.detail}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="sm:w-40"
          >
            Batal
          </Button>
          <Button type="submit" className="sm:w-40" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
