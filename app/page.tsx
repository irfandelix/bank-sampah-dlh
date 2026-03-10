"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif"; 

export default function HalamanLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setModal({ isOpen: false, type: "", title: "", message: "" });

    if (!username || !password) {
      setModal({ isOpen: true, type: "error", title: "Data Belum Lengkap", message: "Mohon isi Username dan Password Anda dengan benar." });
      setLoading(false);
      return;
    }

    try {
      // 🚀 HANYA 1 PINTU TEMBAK KE SERVER!
      // Biar server API yang mikir ini Admin, Juri, atau Peserta.
      const res = await fetch("/api/auth/login", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Jika Server bilang OK, simpan data user ke memori
        sessionStorage.setItem("user", JSON.stringify(data.user));
        setModal({ isOpen: true, type: "success", title: "Login Berhasil! 🎉", message: `Selamat datang, ${data.user.namaInstansi}!` });
        
        // ✈️ TERBANGKAN SESUAI JABATAN (ROLE) DARI SERVER
        setTimeout(() => {
          if (data.user.role === "admin") {
            router.push("/admin/dashboard");
          } else if (data.user.role.startsWith("juri")) { // Menangkap juri_dlh, juri_bapperida, juri_pmd
            router.push("/juri");
          } else {
            router.push("/peserta");
          }
        }, 1500);

      } else {
        // Jika Server menolak (password salah / username tidak ada)
        setModal({ isOpen: true, type: "error", title: "Akses Ditolak ⚠️", message: data.error || "Username/Password salah." });
        setLoading(false);
      }
    } catch (error) {
      setModal({ isOpen: true, type: "error", title: "Koneksi Terputus", message: "Tidak dapat terhubung ke server database." });
      setLoading(false);
    }
  };

  const tutupModal = () => setModal({ ...modal, isOpen: false });

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as "success" | "error" | ""} title={modal.title} message={modal.message} onClose={tutupModal} />

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl shadow-inner mb-4">🌱</div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sistem DLH Sragen</h2>
          <p className="mt-2 text-sm text-slate-500 font-medium">Portal Login Lomba Bank Sampah 2026</p>
        </div>

        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Username</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all text-slate-800" placeholder="Masukkan username Anda" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all text-slate-800" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {loading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>
        </div>
        
        <p className="text-center text-xs text-slate-400 font-medium">&copy; 2026 Dinas Lingkungan Hidup Kab. Sragen.</p>
      </div>
    </main>
  );
}