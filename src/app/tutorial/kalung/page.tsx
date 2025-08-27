import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Cara Mengukur Ukuran Kalung | Widuri Perak",
  description:
    "Panduan singkat mengukur ukuran kalung dengan tali untuk pesanan custom di Widuri Perak.",
  alternates: { canonical: "/tutorial/kalung" },
  openGraph: {
    title: "Cara Mengukur Ukuran Kalung",
    description:
      "Panduan cepat mengukur ukuran kalung hanya dengan tali & penggaris.",
    url: "/tutorial/kalung",
    type: "article",
  },
};

export default function CaraMengukurKalungPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb sederhana */}
      

      {/* Judul */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Cara Mengukur Ukuran Kalung dengan Tali
        </h1>
        <p className="mt-2 text-muted-foreground">
          Praktis, hanya dengan tali & penggaris untuk mengetahui ukuran kalung yang pas.
        </p>
      </header>

      {/* Ilustrasi */}
      <div className="mb-8 overflow-hidden rounded-2xl border bg-card">
        {/* Ganti src dengan file ilustrasi hasil generate, mis: /images/kalung.png */}
        <Image
          src="/images/kalung.png"
          alt="Ilustrasi langkah mengukur kalung dengan tali"
          width={1280}
          height={720}
          className="h-auto w-full"
          priority
        />
      </div>

      {/* Langkah-langkah */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Langkah-langkah</h2>

        <ol className="space-y-5">
          <li className="rounded-2xl border p-5">
            <p className="font-medium">1) Siapkan tali & penggaris</p>
            <p className="text-muted-foreground">
              Gunakan tali tipis atau pita (panjang ±1 meter) dan penggaris / meteran.
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">2) Lingkarkan tali ke leher</p>
            <p className="text-muted-foreground">
              Lingkarkan tali ke leher sesuai panjang kalung yang diinginkan
              (ketat di leher, pas di tulang selangka, atau lebih longgar).
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">3) Tandai ujung tali</p>
            <p className="text-muted-foreground">
              Tandai titik pertemuan ujung tali dengan pulpen atau jepit.
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">4) Ukur dengan penggaris</p>
            <p className="text-muted-foreground">
              Buka tali lalu ukur panjangnya. Angka ini adalah panjang kalung Anda.
            </p>
          </li>
          <li className="rounded-2xl border p-5">
            <p className="font-medium">5) Cocokkan dengan standar panjang</p>
            <p className="text-muted-foreground">
              40 cm (Choker) • 45 cm (Princess) • 50–55 cm (Matinee) •
              60–70 cm (Opera) • 80–100 cm (Rope).
            </p>
          </li>
        </ol>
      </section>

      {/* Tips */}
      <section className="mt-10 space-y-4">
        <h2 className="text-2xl font-semibold">Tips Penting</h2>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>Ukur saat posisi tubuh rileks.</li>
          <li>Jika sering pakai liontin, tambahkan 2–5 cm dari ukuran normal.</li>
          <li>Untuk hadiah, panjang 45–50 cm biasanya pilihan aman.</li>
        </ul>
      </section>

      {/* CTA */}
      <section className="mt-10 rounded-2xl border bg-muted/40 p-6">
        <h3 className="text-lg font-semibold">Butuh bantuan menentukan ukuran?</h3>
        <p className="mb-4 text-muted-foreground">
          Tim Widuri siap membantu merekomendasikan ukuran kalung berdasarkan foto atau
          ukuran tali yang Anda dapatkan.
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
