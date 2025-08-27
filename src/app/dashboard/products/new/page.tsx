'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import { useRouter } from 'next/navigation'

export default function AddProductPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    price: '',
    categoryId: '',
    stock: '1',
    detail: '',
    weight: '',
    size: '', // ✅ Ukuran umum (bukan cuma untuk cincin)
  })

  const [file, setFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

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
      toast.error('Format gambar tidak didukung')
      return
    }
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let filename = ''
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const uploadRes = await axios.post('/api/upload', formData)
        filename = uploadRes.data.filename
      }

      await axios.post('/api/dashboard/products', {
        name: form.name,
        price: form.price,
        stock: form.stock,
        weight: form.weight,
        size: form.size,
        categoryId: form.categoryId,
        detail: form.detail,
        image: filename,
      })

      toast.success('Produk berhasil ditambahkan')
      router.push('/dashboard/products')
    } catch (error) {
      console.error(error)
      toast.error('Gagal menambahkan produk')
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tambah Produk</h1>
      <form onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
        <div>
          <Label htmlFor="name">Nama Produk</Label>
          <Input id="name" name="name" value={form.name} onChange={handleChange} />
        </div>

        <div>
          <Label htmlFor="price">Harga Produk</Label>
          <Input id="price" name="price" value={form.price} onChange={handleChange} />
        </div>

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
          <Label htmlFor="weight">Berat Produk (gram)</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            min="1"
            value={form.weight}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="size">Ukuran Produk</Label>
          <Input
            id="size"
            name="size"
            placeholder="Contoh: 6, 7, M, L, 45cm"
            value={form.size}
            onChange={handleChange}
          />
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
          <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
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

        <Button type="submit" className="w-full mt-4">
          Simpan Produk
        </Button>
      </form>
    </div>
  )
}
