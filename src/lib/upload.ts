// src/lib/upload.ts
import { supabase } from './supabase-client'

export async function uploadProductImage(file: File) {
  if (!file) return null
  if (!file.type.startsWith('image/')) throw new Error('File harus gambar')
  if (file.size > 2 * 1024 * 1024) throw new Error('Maksimal 2MB')

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `products/${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage.from('products').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(`Upload gagal: ${error.message}`)

  // bucket public → bentuk URL publiknya begini:
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`
}
