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
          router.push("/juri"); // ✅ Langsung tembus ke form penilaian Juri!
        } else if (data.role === "peserta") {
          router.push("/peserta"); // ✅ Langsung tembus ke halaman Peserta!
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
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 relative transition-colors duration-500 overflow-hidden">
      
      {/* --- EFEK GLOWING BACKGROUND (PREMIUM LOOK) --- */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none"></div>

      <ModalNotif 
        isOpen={pesan.isOpen} 
        type={pesan.type as "success" | "error" | ""} 
        message={pesan.text} 
        onClose={() => setPesan({ ...pesan, isOpen: false })} 
      />

      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 z-10 transition-colors backdrop-blur-sm">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl sm:text-4xl shadow-inner transition-colors">
            🌱
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Portal Akses</h1>
          <p className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-widest">Sistem DLH Kab. Sragen</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Username Akses</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan ID Anda..." 
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-sm"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Password Rahasia</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-5 pr-14 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-sm tracking-widest" 
              />
              {/* ✅ TOMBOL MATA */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title={showPassword ? "Sembunyikan Sandi" : "Tampilkan Sandi"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:shadow-none flex justify-center items-center"
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  VERIFIKASI...
                </span>
              ) : "MASUK SISTEM 🚀"}
            </button>
          </div>
        </form>

        {/* Footer Kecil di bawah Card */}
        <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
             Evaluasi Kinerja Bank Sampah<br/>© 2026 DLH Sragen
           </p>
        </div>

      </div>
    </main>
  );
}