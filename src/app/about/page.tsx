// /src/app/about/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Tentang Kami — Widuri Perak",
  description:
    "Widuri Perak — bengkel perhiasan perak berpengalaman 20+ tahun. Spesialis cincin custom, couple ring, kalung nama, dan pesanan khusus.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        Tentang <span className="text-emerald-600">Widuri Perak</span>
      </h1>

      <section className="space-y-4 text-black/80">
        <p>
          Selama <strong>20+ tahun</strong>, Widuri Perak membantu pelanggan
          mewujudkan perhiasan impian—dari <strong>cincin tunangan &amp; nikah</strong>,{" "}
          <strong>couple ring</strong>, <strong>kalung/liontin nama</strong>, hingga
          pesanan khusus lain. Berbasis di <strong>Payakumbuh, Sumatera Barat</strong>,
          kami mengutamakan pengerjaan teliti dengan material <strong>perak </strong>.
        </p>
        <p>
          Kami percaya pada <strong>transparansi proses</strong>, <strong>harga jujur</strong>,
          dan <strong>layanan ramah</strong>. Konsultasi desain gratis serta revisi ringan sebelum
          produksi (S&amp;K berlaku).
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Kenapa memilih Widuri</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Custom penuh</strong> — desain bebas, ukir nama/tanggal/logo.</li>
          <li><strong>Kualitas rapi</strong> — finishing halus, sizing akurat.</li>
          <li><strong>Harga jelas</strong> — tanpa biaya tersembunyi.</li>
          <li><strong>Update progres</strong> — sketsa → produksi → QC → kirim.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Layanan</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <p>• Cincin (single/couple/engrave)</p>
          <p>• Kalung &amp; liontin nama/inisial</p>
          <p>• Gelang, anting, &amp; pesanan custom</p>
          
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Proses Pemesanan</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>Konsultasi</strong> via WhatsApp — kirim contoh/gagasan &amp; ukuran.</li>
          <li><strong>Desain &amp; Approve</strong> — estimasi &amp; sketsa; lanjut setelah setuju (DP).</li>
          <li><strong>Produksi &amp; Kirim</strong> — pengerjaan <em>x–y hari kerja</em>, QC, lalu kirim ke seluruh Indonesia.</li>
        </ol>
      </section>

      <section className="mt-10 flex flex-wrap items-center gap-3">
        <a
          href="https://wa.me/6281374570507"
          className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 text-white font-medium shadow hover:bg-emerald-700 transition"
        >
          Chat via WhatsApp
        </a>
        <Link
          href="/products"
          className="inline-flex items-center rounded-xl border px-5 py-3 font-medium hover:bg-gray-50 transition"
        >
          Lihat Katalog
        </Link>
        <span className="text-sm text-black/60">
          Alamat workshop: <em>Jl. Arisun, Nunang, Kec. Payakumbuh Bar., Kota Payakumbuh, Sumatera Barat 26218</em>
        </span>
      </section>
    </main>
  );
}
