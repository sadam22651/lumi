// src/app/login/page.tsx
'use client'

import React, { useState } from 'react'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

type AuthErrorLike = { code?: string; message?: string }

function getErrorInfo(err: unknown): AuthErrorLike {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>
    return {
      code: typeof obj.code === 'string' ? obj.code : undefined,
      message: typeof obj.message === 'string' ? obj.message : undefined,
    }
  }
  return {}
}

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    if (loading) return
    setLoading(true)
    setError('')

    const provider = new GoogleAuthProvider()
    try {
      const cred = await signInWithPopup(auth, provider)
      const token = await cred.user.getIdToken(true)

      const res = await fetch('/api/user-sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || 'Sinkronisasi user gagal')
      }

      router.push('/')
    } catch (err: unknown) {
      const { code } = getErrorInfo(err)
      // Abaikan cancel-popup agar tidak menampilkan error ke user
      if (code !== 'auth/cancelled-popup-request' && code !== 'auth/popup-closed-by-user') {
        console.error('Login/Sync gagal:', err)
        setError('Login gagal. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted flex items-center justify-center px-4">
      <Card className="w-full max-w-sm border-border shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Masuk ke Widuri
          </CardTitle>
          <p className="text-sm text-muted-foreground">Silakan gunakan akun Google kamu</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tombol Google */}
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses…
              </>
            ) : (
              <>
                <GoogleIcon className="h-4 w-4" />
                Lanjut dengan Google
              </>
            )}
          </Button>

          <Separator />

          {/* Info singkat */}
          <p className="text-xs text-muted-foreground text-center">
            Dengan masuk, kamu menyetujui kebijakan privasi & ketentuan layanan Widuri.
          </p>

          {/* Error box */}
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            Butuh bantuan? Hubungi admin.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

/** Simple Google logo (no extra dependency) */
function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 533.5 544.3" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M533.5 278.4c0-18.5-1.6-37-5.1-54.8H272v103.8h146.9c-6.3 34.5-25.6 63.7-54.6 83.3v68h88.3c51.6-47.5 80.9-117.6 80.9-200.3z"/>
      <path fill="#34A853" d="M272 544.3c73.5 0 135.3-24.3 180.4-66.1l-88.3-68c-24.5 16.5-56 26-92.1 26-70.8 0-130.9-47.7-152.5-112.1H28v70.6c44.8 88.9 136.9 149.6 244 149.6z"/>
      <path fill="#FBBC05" d="M119.5 324.1c-10.4-30.9-10.4-64.6 0-95.5V158H28c-41 81.7-41 178.6 0 260.3l91.5-94.2z"/>
      <path fill="#EA4335" d="M272 106.7c39.9-.6 78.3 14.1 107.6 41.9l80.1-80.1C407.2 23.3 341.8-.1 272 0 164.9 0 72.8 60.7 28 149.6l91.5 70.6C141.1 154.8 201.2 107.1 272 106.7z"/>
    </svg>
  )
}
