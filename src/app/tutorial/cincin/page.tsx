import { Link } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Cara Mengukur Ukuran Cincin | Widuri Perak",
  description:
    "Panduan singkat mengukur ukuran cincin dengan kertas untuk pesanan custom di Widuri Perak.",
  alternates: { canonical: "/cara-mengukur-cincin" },
  openGraph: {
    title: "Cara Mengukur Ukuran Cincin",
    description:
      "Panduan cepat mengukur ukuran cincin hanya dengan kertas & penggaris.",
    url: "/cara-mengukur-cincin",
    type: "article",
  },
};

export default function CaraMengukurCincinPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb sederhana */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">Beranda</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-foreground">Cara Mengukur Cincin</span>
      </nav>

      {/* Judul */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Cara Mengukur Ukuran Cincin dengan Kertas
        </h1>
        <p className="mt-2 text-muted-foreground">
          Simpel, cepat, dan akurat untuk menentukan ukuran cincin pesanan Anda.
        </p>
      </header>

      {/* Ilustrasi langkah (landscape) */}
      <figure className="mb-8 overflow-hidden rounded-2xl border bg-card">
        <Image
          src="/images/cincin.png"
          alt="Ilustrasi langkah mengukur cincin dengan kertas"
          width={1280}
          height={720}
          sizes="(max-width: 768px) 100vw, 1024px"
          className="h-auto w-full"
          priority
        />
        <figcaption className="sr-only">
          Ilustrasi 4 langkah: siapkan kertas, lingkarkan, tandai, ukur.
        </figcaption>
      </figure>

      {/* Langkah-langkah */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Langkah-langkah</h2>

        <ol className="space-y-5">
          <li className="rounded-2xl border p-5">
            <p className="font-medium">1) Siapkan kertas & penggaris</p>
            <p className="text-muted-foreground">
              Potong kertas tipis panjang ±10 cm dan lebar ±0,5 cm.
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">2) Lingkarkan ke jari</p>
            <p className="text-muted-foreground">
              Lilitkan kertas pada jari yang ingin diukur. Pastikan pas namun
              tidak terlalu kencang.
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">3) Tandai pertemuan ujung</p>
            <p className="text-muted-foreground">
              Gunakan pulpen/pensil untuk menandai titik saat ujung kertas bertemu.
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">4) Ukur panjangnya</p>
            <p className="text-muted-foreground">
              Buka kertas lalu ukur dari ujung hingga tanda dengan penggaris.
              Angka ini adalah <strong>keliling jari</strong> (mm).
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">5) Tentukan ukuran cincin</p>
            <p className="text-muted-foreground">
              Cocokkan keliling jari dengan tabel ukuran (contoh umum: 54&nbsp;mm ≈ ukuran 17).
              Jika ragu antara dua ukuran, pilih satu tingkat <em>lebih besar</em>.
            </p>
          </li>
        </ol>
      </section>

      {/* Tabel ukuran dalam gambar (portrait) */}
      <section className="mt-10 space-y-3">
        <h2 className="text-2xl font-semibold">Tabel Perbandingan Ukuran</h2>
        <p className="text-muted-foreground">
          Cocokkan hasil keliling (mm) dengan ukuran cincin. Di Indonesia, ukuran umumnya ≈ diameter dalam (mm).
        </p>

        <figure className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border bg-card">
          {/* Gambar tabel ukuran – nama file: ukuran.png */}
          <Image
            src="/images/ukuran.png"
            alt="Tabel ukuran cincin: Ukuran (ID), Diameter (mm), Keliling (mm)"
            width={600}
            height={900}
            sizes="(max-width: 768px) 100vw, 640px"
            className="h-auto w-full"
          />
          <figcaption className="sr-only">
            Tabel referensi ukuran 10–22 lengkap dengan diameter dan keliling.
          </figcaption>
        </figure>
      </section>

      {/* Tips */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Tips Penting</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Ukur saat suhu tubuh normal (bukan saat jari dingin/panas).</li>
          <li>Pastikan ukuran bisa melewati buku jari dengan nyaman.</li>
          <li>Ukur 2–3 kali untuk hasil yang konsisten.</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="mt-10 rounded-2xl border bg-muted/40 p-6">
        <h3 className="text-lg font-semibold">Butuh bantuan menentukan ukuran?</h3>
        <p className="mb-4 text-muted-foreground">
          Tim Widuri siap membantu merekomendasikan ukuran berdasarkan foto atau
          ukuran keliling yang Anda dapatkan.
        </p>
        <a
          href="https://wa.me/6281374570507"
          className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
        >
          Konsultasi via WhatsApp
        </a>
      </section>
    </main>
  );
}
