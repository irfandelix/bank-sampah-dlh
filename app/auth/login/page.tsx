"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [kataKunci, setKataKunci] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengecek kata kunci saat tombol "Masuk" ditekan
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setLoading(true);

    // Simulasi pengecekan database (nanti diganti dengan Auth.js / Passkey)
    setTimeout(() => {
      const sandi = kataKunci.toUpperCase(); // Ubah ke huruf besar semua agar tidak sensitif huruf kecil

      if (sandi === "ADMIN-DLH") {
        router.push("/admin/dashboard"); // Arahkan ke Peta Admin
      } else if (sandi === "JURI-LAPANGAN") {
        router.push("/juri/nilai/contoh-id-peserta"); // Arahkan ke Tombol Juri
      } else if (sandi === "BANK-SAMPAH") {
        router.push("/peserta/form"); // Arahkan ke Form Upload Peserta
      } else {
        setError(true); // Jika sandi salah
        setLoading(false);
      }
    }, 800); // Simulasi loading selama 0.8 detik biar terasa realistis
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      
      {/* Kotak Login */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
            🌱
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Portal Masuk</h1>
          <p className="text-sm text-slate-500 mt-1">Lomba Bank Sampah Sragen 2026</p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="kata-kunci" className="block text-sm font-bold text-slate-700 mb-2">
              Masukkan Kata Kunci Akses
            </label>
            <input
              type="text"
              id="kata-kunci"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Contoh: ADMIN-DLH"
              className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                error 
                  ? "border-red-300 focus:ring-red-200 focus:border-red-500" 
                  : "border-slate-200 focus:ring-emerald-200 focus:border-emerald-500"
              }`}
              autoComplete="off"
            />
            {/* Pesan Error */}
            {error && (
              <p className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1">
                ⚠️ Kata kunci tidak terdaftar. Silakan coba lagi.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || kataKunci.trim() === ""}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {loading ? "Memeriksa..." : "Masuk Sistem"}
          </button>
        </form>

        {/* Info Bantuan Tambahan */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            *Kata kunci diberikan oleh panitia DLH Kabupaten Sragen. Hubungi admin jika Anda lupa kata kunci.
          </p>
        </div>
        
      </div>

      {/* Catatan Rahasia untuk Developer (Hanya Sementara) */}
      <div className="mt-8 text-xs text-slate-400 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
        <span className="font-bold text-slate-600">Cheat Code (Untuk Tes):</span> ADMIN-DLH | JURI-LAPANGAN | BANK-SAMPAH
      </div>

    </main>
  );
}