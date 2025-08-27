"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/useAuth"
import { getAuth } from "firebase/auth"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"

type RingRow = {
  id: string; createdAt: string; status: string;
  customerName: string; phone: string; ringSize: number;
  engraveText?: string | null; quantity: number; notes?: string | null;
}
type NecklaceRow = {
  id: string; createdAt: string; status: string;
  customerName: string; phone: string; nameText: string;
  chainLength: number; fontStyle?: string | null; quantity: number; notes?: string | null;
}

const STATUSES = ["PENDING","REVIEW","CONFIRMED","PRODUCING","SHIPPED","DONE","CANCELLED"] as const
type TypeFilter = "all" | "ring" | "necklace"

export default function AdminPesanPage() {
  const user = useAuth()
  const [type, setType] = useState<TypeFilter>("all")
  const [status, setStatus] = useState<string>("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const [rings, setRings] = useState<RingRow[]>([])
  const [necklaces, setNecklaces] = useState<NecklaceRow[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const pageSize = 10

  const auth = getAuth()
  const fmt = (d: string) => new Date(d).toLocaleString("id-ID")

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      setLoading(true)
      try {
        const token = await auth.currentUser?.getIdToken()
        const qs = new URLSearchParams({
          type,
          ...(status ? { status } : {}),
          page: String(page),
          pageSize: String(pageSize),
        })
        const res = await fetch(`/api/dashboard/pesan/cincin?${qs.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) throw new Error("Gagal memuat data")
        const data = await res.json()

        if (type === "ring") {
          setRings(data.rows || [])
          setNecklaces([])
          setTotal(data.total ?? null)
        } else if (type === "necklace") {
          setNecklaces(data.rows || [])
          setRings([])
          setTotal(data.total ?? null)
        } else {
          setRings(data.rows.rings || [])
          setNecklaces(data.rows.necklaces || [])
          setTotal(null)
        }
      } catch (e: any) {
        toast.error(e.message || "Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user, type, status, page])

  useEffect(() => { setPage(1) }, [type, status])

  const hasPrev = page > 1
  const hasNext = total ? page * pageSize < total : false

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Pesanan Masuk</h1>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button variant={type === "all" ? "default" : "outline"} onClick={() => setType("all")}>Semua</Button>
              <Button variant={type === "ring" ? "default" : "outline"} onClick={() => setType("ring")}>Cincin</Button>
              <Button variant={type === "necklace" ? "default" : "outline"} onClick={() => setType("necklace")}>Kalung</Button>
            </div>
            <Separator orientation="vertical" className="mx-2 h-6" />
            <div className="flex items-center gap-1">
              <Button variant={!status ? "default" : "outline"} onClick={() => setStatus("")}>Semua Status</Button>
              {STATUSES.map(s => (
                <Button key={s} variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>{s}</Button>
              ))}
            </div>
            {typeof total === "number" && (
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(p => p-1)} disabled={!hasPrev || loading}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">Hal {page}</span>
                <Button variant="outline" size="icon" onClick={() => setPage(p => p+1)} disabled={!hasNext || loading}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat…</p>
      ) : (
        <>
          {(type === "all" || type === "ring") && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Cincin</h2>
              {rings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada pesanan cincin.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {rings.map(r => (
                    <Card key={r.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{fmt(r.createdAt)}</span>
                          <Badge>{r.status}</Badge>
                        </div>
                        <div className="font-medium">{r.customerName} · {r.phone}</div>
                        <div className="text-sm">
                          Ukuran: <span className="font-medium">{r.ringSize}</span> · Jumlah: <span className="font-medium">{r.quantity}</span>
                        </div>
                        {r.engraveText && (
                          <div className="text-sm">Ukiran: “{r.engraveText}”</div>
                        )}
                        {r.notes && <div className="text-sm italic text-muted-foreground">Catatan: {r.notes}</div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}

          {(type === "all" || type === "necklace") && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Kalung Nama</h2>
              {necklaces.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada pesanan kalung.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {necklaces.map(n => (
                    <Card key={n.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{fmt(n.createdAt)}</span>
                          <Badge>{n.status}</Badge>
                        </div>
                        <div className="font-medium">{n.customerName} · {n.phone}</div>
                        <div className="text-sm">
                          Nama: <span className="font-medium">{n.nameText}</span> · Panjang: <span className="font-medium">{n.chainLength} cm</span> · Jumlah: <span className="font-medium">{n.quantity}</span>
                        </div>
                        {n.fontStyle && <div className="text-sm">Font: {n.fontStyle}</div>}
                        {n.notes && <div className="text-sm italic text-muted-foreground">Catatan: {n.notes}</div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  )
}
