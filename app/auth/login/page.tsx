"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fungsi untuk mengecek ke API Database saat tombol "Masuk" ditekan
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Menghubungi "otak" API kita di backend
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Simpan "KTP" user ke browser agar halaman Dashboard tahu siapa yang login
        sessionStorage.setItem("user", JSON.stringify({
          username: username,
          role: data.role,
          namaInstansi: data.namaInstansi || data.role.replace('_', ' ').toUpperCase()
        }));

        // 2. Arahkan ke rute yang benar sesuai Role (Identitas)
        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else if (data.role.startsWith("juri_")) {
          router.push("/juri/dashboard"); // Arahkan ke halaman Form Juri
        } else if (data.role === "peserta") {
          router.push("/peserta/dashboard"); // Arahkan ke halaman upload Bank Sampah
        }
      } else {
        // Jika username/password salah
        setError(data.error || "Gagal masuk. Periksa kembali data Anda.");
      }
    } catch (err) {
      // Nah, ini dia pesan error kalau jaringan putus atau database gagal nyambung!
      setError("Koneksi terputus. Tidak dapat terhubung ke server database.");
    } finally {
      setLoading(false);
    }
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

        {/* Form Input (SEKARANG ADA USERNAME & PASSWORD) */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Username Akses</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: juri_dlh / bs_gemolong"
              className="w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password Akses</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password rahasia..."
              className="w-full px-4 py-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Pesan Error Muncul di Sini */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-bold border border-red-100 flex items-start gap-2">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2 mt-4"
          >
            {loading ? "Menghubungkan ke Database..." : "Masuk Sistem 🚀"}
          </button>
        </form>

        {/* Info Bantuan Tambahan */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
            Dikelola oleh DLH Kabupaten Sragen
          </p>
        </div>
      </div>
    </main>
  );
}