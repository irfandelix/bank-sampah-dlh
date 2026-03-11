"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif"; // Pastikan path ini benar!

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState({ isOpen: false, type: "", text: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPesan({ isOpen: false, type: "", text: "" });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        }),
      });

      // Deteksi jika Vercel error dan mengembalikan HTML (bukan JSON)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server gagal merespon dengan benar.");
      }

      const data = await res.json();

      if (res.ok) {
        // Simpan sesi dan arahkan ke halaman yang benar
        sessionStorage.setItem("user", JSON.stringify({
          username: username,
          role: data.role,
          namaInstansi: data.namaInstansi || data.role.replace('_', ' ').toUpperCase()
        }));

        if (data.role === "admin") {
          router.push("/admin/dashboard");
        } else if (data.role.startsWith("juri_")) {
          router.push("/juri/dashboard");
        } else if (data.role === "peserta") {
          router.push("/peserta/dashboard");
        }
      } else {
        // Tampilkan error dari API jika username/password salah
        setPesan({ isOpen: true, type: "error", text: data.error || "Gagal masuk. Periksa kembali data Anda." });
      }
    } catch (err) {
      // Menangkap error jika internet putus atau database timeout
      setPesan({ 
        isOpen: true, 
        type: "error", 
        text: "Koneksi ke server terganggu. Pastikan internet stabil dan coba lagi." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
      
      {/* Panggil ModalNotif di sini */}
      <ModalNotif 
        isOpen={pesan.isOpen} 
        type={pesan.type as "success" | "error" | ""} 
        message={pesan.text} 
        onClose={() => setPesan({ ...pesan, isOpen: false })} 
      />

      {/* Kotak Login */}
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200 z-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
            🌱
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Portal Masuk</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem DLH Kabupaten Sragen</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Username Akses</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: admin / juri_dlh"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-semibold"
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
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-semibold"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Menghubungkan...
              </span>
            ) : "Masuk Sistem 🚀"}
          </button>
        </form>
      </div>
    </main>
  );
}