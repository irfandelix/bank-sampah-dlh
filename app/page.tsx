"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif"; 

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState({ isOpen: false, type: "", text: "" });
  
  // ✅ STATE BARU UNTUK MENGONTROL IKON MATA (LIHAT PASSWORD)
  const [showPassword, setShowPassword] = useState(false);

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

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server gagal merespon dengan benar.");
      }

      const data = await res.json();

      if (res.ok) {
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
        setPesan({ isOpen: true, type: "error", text: data.error || "Gagal masuk. Periksa kembali data Anda." });
      }
    } catch (err) {
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
      
      <ModalNotif 
        isOpen={pesan.isOpen} 
        type={pesan.type as "success" | "error" | ""} 
        message={pesan.text} 
        onClose={() => setPesan({ ...pesan, isOpen: false })} 
      />

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
              placeholder="Masukkan username Anda..." // ✅ DIUBAH JADI AMAN DAN RAHASIA
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-semibold"
              autoComplete="off"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password Akses</label>
            {/* ✅ BUNGKUS INPUT PASSWORD DENGAN RELATIVE UNTUK MENARUH IKON */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} // <-- Tipe input berubah secara dinamis
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password rahasia..."
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all font-semibold" // pr-12 agar teks tidak nabrak ikon
              />
              {/* ✅ TOMBOL MATA */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
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