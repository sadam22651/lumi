'use client'

import { useState } from 'react'
import axios from 'axios'

export default function CategoryPage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setMessage('Nama kategori tidak boleh kosong')
      return
    }

    try {
      await axios.post('/api/categories', { name })
      setMessage('Kategori berhasil ditambahkan')
      setName('')
    } catch (error) {
      console.error(error)
      setMessage('Gagal menambahkan kategori')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Tambah Kategori</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '4px' }}>Nama Kategori</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <button
          type="submit"
          style={{ padding: '10px 16px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Simpan
        </button>
      </form>
      {message && <p style={{ marginTop: '16px' }}>{message}</p>}
    </div>
  )
}
