"use client";

import { useState } from "react";
import Link from "next/link";
import ModalNotif from "@/components/ModalNotif"; // Memanggil komponen Modal Global

export default function ManajemenAkun() {
  const [namaInstansi, setNamaInstansi] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State untuk mengontrol Modal
  const [pesan, setPesan] = useState({ isOpen: false, type: "", text: "" });

  const handleBuatAkun = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPesan({ isOpen: false, type: "", text: "" });

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaInstansi,
          username,
          password,
          role: "PESERTA",
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPesan({ 
          isOpen: true, 
          type: "success", 
          text: `Folder Drive untuk ${namaInstansi} berhasil dibuat dan akun siap digunakan!` 
        });
        setNamaInstansi("");
        setUsername("");
        setPassword("");
      } else {
        setPesan({ isOpen: true, type: "error", text: data.error || "Gagal membuat akun." });
      }
    } catch (error) {
      setPesan({ isOpen: true, type: "error", text: "Terjadi kesalahan koneksi ke server." });
    } finally {
      setLoading(false);
    }
  };

  const tutupModal = () => {
    setPesan({ ...pesan, isOpen: false });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 p-6 sm:p-10 relative">
      
      {/* --- INI DIA MODAL GLOBALNYA (Hanya 1 Baris!) --- */}
      <ModalNotif 
        isOpen={pesan.isOpen} 
        type={pesan.type as "success" | "error" | ""} 
        message={pesan.text} 
        onClose={tutupModal} 
      />

      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/dashboard" className="text-emerald-600 hover:text-emerald-700 text-sm font-bold flex items-center gap-2 mb-4 transition-colors w-max">
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Manajemen Akun Peserta</h1>
          <p className="text-slate-500 mt-1">Buat akun akses dan folder otomatis untuk Bank Sampah baru.</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
          <form onSubmit={handleBuatAkun} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Bank Sampah (Instansi)</label>
              <input
                type="text"
                required
                value={namaInstansi}
                onChange={(e) => setNamaInstansi(e.target.value)}
                placeholder="Contoh: Bank Sampah Gemolong Jaya"
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Username Akses</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: bs_gemolong"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password Akses</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Memproses Folder...
                </span>
              ) : "Buat Akun & Folder Drive 🚀"}
            </button>
            
          </form>
        </div>
      </div>
    </main>
  );
}