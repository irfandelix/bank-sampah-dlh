"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ModalNotif from "@/components/ModalNotif";
import React from "react";

export default function FormProfilPeserta() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  
  // ✅ STATE FORM (Nomor Telepon Sudah Kembali!)
  const [formData, setFormData] = useState({
    namaKetua: "",
    noTelepon: "", // 👈 Ini dia yang tadi ngilang hehe
    tahunBerdiri: "",
    alamat: "",
    latitude: "",
    longitude: ""
  });

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchProfil(parsedUser.username);
    }
  }, [router]);

  const fetchProfil = async (username: string) => {
    try {
      const res = await fetch(`/api/peserta/profil?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        if (data) setFormData({ ...formData, ...data });
      }
    } catch (err) {
      console.error("Gagal mengambil profil", err);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Browser Anda tidak mendukung GPS." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        });
      },
      () => setModal({ isOpen: true, type: "error", title: "Akses Ditolak", message: "Gagal mendapatkan lokasi. Pastikan GPS aktif." })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/peserta/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.username, ...formData })
      });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Tersimpan!", message: "Profil Bank Sampah berhasil diperbarui." });
      } else {
        throw new Error("Gagal menyimpan profil.");
      }
    } catch (err) {
      setModal({ isOpen: true, type: "error", title: "Error", message: "Terjadi kesalahan sistem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full pb-24 pt-[90px] md:pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

      <div className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* Navigasi Kembali */}
        <div className="flex items-center gap-4">
          <Link href="/peserta" className="w-10 h-10 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 transition-all">←</Link>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white leading-none">Profil Identitas</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Lengkapi Data Bank Sampah</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 transition-colors">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NAMA BANK SAMPAH (FULL) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Bank Sampah (Terkunci)</label>
              <input type="text" disabled value={user?.namaInstansi || ""} className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 px-5 py-4 rounded-2xl font-bold cursor-not-allowed" />
            </div>

            {/* NAMA KETUA (SEPARUH) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nama Ketua / Direktur</label>
              <input required type="text" value={formData.namaKetua} onChange={(e) => setFormData({...formData, namaKetua: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-5 py-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Contoh: Budi Santoso" />
            </div>

            {/* NOMOR TELEPON (SEPARUH) ✅ */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nomor Telepon (WA)</label>
              <input required type="tel" value={formData.noTelepon} onChange={(e) => setFormData({...formData, noTelepon: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-5 py-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Contoh: 081234567890" />
            </div>

            {/* TAHUN BERDIRI (SEPARUH) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Tahun Berdiri</label>
              <input required type="number" value={formData.tahunBerdiri} onChange={(e) => setFormData({...formData, tahunBerdiri: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-5 py-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Contoh: 2021" />
            </div>

            {/* ALAMAT (FULL) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Alamat Lengkap</label>
              <textarea required rows={3} value={formData.alamat} onChange={(e) => setFormData({...formData, alamat: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 px-5 py-4 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="Contoh: Jl. Raya Sukowati No. 12, RT 01/RW 02..." />
            </div>
          </div>

          {/* KORDINAT GPS */}
          <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl space-y-4">
             <div>
                <h3 className="font-black text-blue-800 dark:text-blue-400">Penguncian Koordinat GPS</h3>
                <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mt-1">Pastikan Anda berada di lokasi Bank Sampah saat mengklik tombol ini agar titik akurat di peta.</p>
             </div>
             <div className="flex flex-col md:flex-row gap-4">
                <input readOnly type="text" placeholder="Latitude" value={formData.latitude} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300" />
                <input readOnly type="text" placeholder="Longitude" value={formData.longitude} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300" />
                <button type="button" onClick={handleGetLocation} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-xl shadow-sm transition-all active:scale-95 text-xs uppercase tracking-widest">📍 Lacak Lokasi</button>
             </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
             <button type="submit" disabled={loading} className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white font-black py-5 rounded-2xl shadow-lg uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50">
               {loading ? "Menyimpan Data..." : "💾 Simpan Profil Identitas"}
             </button>
          </div>

        </form>
      </div>
    </main>
  );
}