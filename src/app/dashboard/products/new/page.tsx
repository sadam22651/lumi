'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AddProductPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    stock: '1',
    detail: '',
    weight: '',
    size: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get('/api/categories')
        setCategories(res.data)
      } catch (error) {
        console.error(error)
        toast.error('Gagal mengambil kategori')
      }
    }
    fetchCategories()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      toast.error('Format gambar tidak didukung (jpeg/png/webp)')
      return
    }
    setFile(selectedFile)
  }

  async function uploadToSupabase(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const path = `products/${crypto.randomUUID()}.${ext}`

    const { error } = await supabase.storage.from('products').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (error) throw new Error(error.message)

    // bucket public → bangun public URL
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1) upload gambar (opsional)
      let imageUrl: string | null = null
      if (file) imageUrl = await uploadToSupabase(file)

      // 2) kirim data produk ke API kamu
      await axios.post('/api/dashboard/products', {
        name: form.name.trim(),
        price: Number(form.price || 0),
        stock: Number(form.stock || 0),
        weight: Number(form.weight || 0),
        size: form.size?.trim() || null,
        categoryId: form.categoryId || null,
        detail: form.detail?.trim() || 'detail belum ditambahkan',
        imageUrl, // ← URL dari Supabase Storage
      })

      toast.success('Produk berhasil ditambahkan')
      router.push('/dashboard/products')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Gagal menambahkan produk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tambah Produk</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nama Produk</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="price">Harga Produk</Label>
          <Input id="price" name="price" type="number" min="0" value={form.price} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="stock">Stok</Label>
          <Input id="stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required />
        </div>

        <div>
          <Label htmlFor="weight">Berat Produk (gram)</Label>
          <Input id="weight" name="weight" type="number" min="0" value={form.weight} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="size">Ukuran Produk</Label>
          <Input id="size" name="size" placeholder="Contoh: 6, 7, M, L, 45cm" value={form.size} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="detail">Detail Produk</Label>
          <textarea
            id="detail"
            name="detail"
            rows={4}
            className="w-full border rounded px-3 py-2"
            value={form.detail}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="image">Gambar Produk</Label>
          <Input id="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
          <p className="text-xs text-muted-foreground mt-1">Maks 2MB. Format: JPG/PNG/WEBP.</p>
        </div>

        <div>
          <Label htmlFor="categoryId">Kategori</Label>
          <select
            id="categoryId"
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">-- Pilih Kategori --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full mt-4" disabled={loading}>
          {loading ? 'Menyimpan…' : 'Simpan Produk'}
        </Button>
      </form>
    </div>
  )
}
