import { useState } from "react";
import heroBackground from "../assets/background_image.jpg";

/**
 * HeroSection
 * -----------
 * Replika layout dari halaman utama (navbar + hero) sesuai referensi.
 *
 * CARA MENGGANTI LOGO:
 *  1. Taruh file logo kamu (contoh: logo.svg / logo.png) di folder `public/`
 *  2. Ganti bagian yang ditandai "GANTI LOGO DI SINI" di bawah,
 *     dari <div placeholder> menjadi:
 *       <img src="/logo.svg" alt="Nama Brand" className="h-8 w-auto" />
 *
 * CARA MENGGANTI BACKGROUND:
 *  1. Taruh file gambar background kamu (contoh: hero-bg.png) di folder `public/`
 *  2. Cari bagian yang ditandai "GANTI BACKGROUND DI SINI" di bawah (tag <section>)
 *  3. Ganti className `bg-[#1447E6]` dengan style background image, contoh:
 *       style={{ backgroundImage: "url('/hero-bg.png')", backgroundSize: "cover", backgroundPosition: "center" }}
 *     atau kalau mau pakai Tailwind arbitrary value:
 *       className="bg-[url('/hero-bg.png')] bg-cover bg-center"
 */

const navLinks = [
  { label: "Layanan", dropdown: true },
  { label: "Hardware", dropdown: false },
  { label: "Harga", dropdown: false },
  { label: "Hubungi Kami", dropdown: false },
  { label: "Blog", dropdown: false },
  { label: "Solusi Bisnis", dropdown: true },
  { label: "Tambahan", dropdown: true },
];

function ChevronDown() {
  return (
    <svg
      className="ml-1 h-3.5 w-3.5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HeroSection() {
  const [langOpen, setLangOpen] = useState(false);

  return (
    <section
      className="relative min-h-screen w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="absolute inset-0 bg-[#07142f]/50" />
      {/* NAVBAR */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-10">
          {/* ======= GANTI LOGO DI SINI =======
              Ganti div placeholder di bawah dengan:
              <img src="/logo.svg" alt="Nama Brand" className="h-8 w-auto" />
          */}
          <div className="flex items-center justify-center h-8 w-28 border border-dashed border-white/40 rounded text-white/60 text-xs font-medium select-none">
            LOGO
          </div>

          <ul className="hidden lg:flex items-center gap-7">
            {navLinks.map((item) => (
              <li key={item.label}>
                <button className="flex items-center text-white text-[15px] font-semibold hover:text-white/80 transition-colors">
                  {item.label}
                  {item.dropdown && <ChevronDown />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <button className="text-white text-[15px] font-semibold hover:text-white/80 transition-colors">
            Log In
          </button>
          <button className="bg-[#4FC3F7] hover:bg-[#3fb8ee] text-[#0B2E82] text-[15px] font-bold px-6 py-2.5 rounded-full transition-colors">
            Coba gratis
          </button>
          <button
            onClick={() => setLangOpen((o) => !o)}
            className="flex items-center text-white text-[15px] font-semibold hover:text-white/80 transition-colors"
          >
            ID
            <ChevronDown />
          </button>
        </div>
      </nav>

      <div className="relative z-20 border-b border-white/10 max-w-[1600px] mx-auto" />

      {/* HERO CONTENT */}
      <div className="relative z-20 max-w-[1600px] mx-auto px-6 md:px-10 pt-15 md:pt-29 lg:pt-33 pb-24 lg:pb-32 grid grid-cols-1 lg:grid-cols-2 items-center gap-10">
        <div className="max-w-155 lg:ml-100 xl:ml-70 ">
          <h1 className="text-white font-extrabold leading-[1.08] text-[2.15rem] sm:text-5xl md:text-[46px] lg:text-[50px]">
            Satu Aplikasi POS
            <br />
            untuk Semua
            <br />
            Kebutuhan Bisnis
          </h1>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button className="bg-linear-to-r from-[#2E8FF0] to-[#4FC3F7] hover:opacity-90 text-white text-[14px] font-bold px-6.5 py-3 rounded-full transition-opacity">
              Jadwalkan Demo
            </button>
            <button className="border-2 border-white/70 hover:bg-white/10 text-white text-[14px] font-bold px-6.5 py-3 rounded-full transition-colors">
              WhatsApp Kami Sekarang!
            </button>
          </div>
        </div>

        {/* Area gambar produk (tablet/printer) — termasuk bagian dari background
            referensi. Kosongkan dulu / hapus placeholder ini setelah kamu
            memasang background final di <section> di atas. */}
      </div>

      {/* Carousel dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-white" />
        <span className="h-2 w-2 rounded-full bg-white/40" />
        <span className="h-2 w-2 rounded-full bg-white/40" />
        <span className="h-2 w-2 rounded-full bg-white/40" />
      </div>

      {/* Left arrow */}
      <button className="absolute bottom-8 left-6 md:left-10 z-20 h-11 w-11 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1447E6]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6L9 12L15 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Right arrow */}
      <button className="absolute bottom-8 right-6 md:right-10 z-20 h-11 w-11 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#1447E6]" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 6L15 12L9 18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Floating chat button */}
      <button className="absolute bottom-6 right-6 md:right-10 z-30 flex items-center gap-2 bg-[#0B1C3D] text-white text-sm font-semibold px-4 py-3 rounded-lg shadow-lg hover:bg-[#0f234d] transition-colors">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.03 2 11c0 2.4 1.06 4.57 2.82 6.17-.1.98-.5 2.6-1.5 4.06 1.63-.16 3.4-.75 4.68-1.53A11.6 11.6 0 0 0 12 20c5.52 0 10-4.03 10-9s-4.48-9-10-9z" />
        </svg>
        Hubungi kami
      </button>
    </section>
  );
}