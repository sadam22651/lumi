'use client'
import { useEffect } from 'react'
import { onIdTokenChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function AuthSync() {
  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (fbUser) => {
      if (!fbUser) return
      const token = await fbUser.getIdToken(true)
      fetch('/api/user/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(console.error)
    })
    return () => unsub()
  }, [])
  return null
}
