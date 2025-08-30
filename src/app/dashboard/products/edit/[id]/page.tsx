// src/app/dashboard/products/[id]/edit/page.tsx
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import axios from 'axios'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/* =========================
 * Types & utils
 * ========================= */
type Category = { id: string; name: string }

type Product = {
  id: string
  name: string
  price: number
  stock: number
  weight: number | null
  size: string | null
  detail: string | null
  imageUrl: string | null
  categoryId: string | null
}

interface FormState {
  name: string
  price: string
  stock: string
  weight: string
  size: string
  detail: string
  imageUrl: string // simpan URL publik dari Supabase
  categoryId: string
}

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e) {
    const m = (e as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return 'Terjadi kesalahan'
}

async function uploadToSupabase(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `products/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  // bucket "products" publik → URL file
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [form, setForm] = useState<FormState>({
    name: '',
    price: '',
    stock: '',
    weight: '',
    size: '',
    detail: '',
    imageUrl: '',
    categoryId: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [productRes, categoryRes] = await Promise.all([
          axios.get<Product>(`/api/dashboard/products/${id}`),
          axios.get<Category[]>('/api/categories'),
        ])
        const product = productRes.data
        setForm({
          name: product.name ?? '',
          price: String(product.price ?? ''),
          stock: String(product.stock ?? ''),
          weight: product.weight != null ? String(product.weight) : '',
          size: product.size ?? '',
          detail: product.detail ?? '',
          imageUrl: product.imageUrl ?? '',
          categoryId: product.categoryId ?? '',
        })
        setCategories(categoryRes.data)
      } catch (error: unknown) {
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

  type ChangeTarget = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  type FormField = keyof FormState

  const handleChange = (e: React.ChangeEvent<ChangeTarget>) => {
    const { name, value } = e.target as { name: FormField; value: string }
    setForm((f) => ({ ...f, [name]: value }))
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      let imageUrl = form.imageUrl

      // Jika user upload file baru → upload ke Supabase lalu pakai URL baru
      if (file) {
        imageUrl = await uploadToSupabase(file)
      }

      await axios.patch(`/api/dashboard/products/${id}`, {
        name: form.name.trim(),
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        weight: form.weight ? Number(form.weight) : null,
        size: form.size?.trim() || null,
        detail: form.detail?.trim() || 'detail belum ditambahkan',
        categoryId: form.categoryId || null,
        imageUrl, // gunakan field imageUrl (bukan filename lokal)
      })

      toast.success('Produk berhasil diperbarui')
      router.push('/dashboard/products')
    } catch (error: unknown) {
      console.error(error)
      toast.error(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const currentImgSrc = useMemo(() => form.imageUrl || '', [form.imageUrl])

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
                  min="0"
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
                  min="0"
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
              <Input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
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
