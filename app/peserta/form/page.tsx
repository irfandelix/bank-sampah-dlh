"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle"; // 👈 Tambah ini
import Link from "next/link";

export default function FormProfilPeserta() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  
  const [formData, setFormData] = useState({
    namaBank: "",
    alamat: "",
    koordinat: "",
    waktuPendirian: "", 
    namaKetua: "",
    noHp: ""
  });

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const dapatkanLokasi = () => {
    if (!navigator.geolocation) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Browser tidak mendukung GPS." });
      return;
    }
    setModal({ isOpen: true, type: "info", title: "Mencari Lokasi...", message: "Sedang mengambil koordinat GPS Anda." });
    navigator.geolocation.getCurrentPosition((pos) => {
      setFormData({ ...formData, koordinat: `${pos.coords.latitude}, ${pos.coords.longitude}` });
      setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Koordinat terkunci!" });
    }, () => {
      setModal({ isOpen: true, type: "error", title: "Akses Ditolak", message: "Nyalakan GPS Anda." });
    });
  };

  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/peserta/simpan-profil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, username: user.username }),
      });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Tersimpan!", message: "Profil berhasil masuk ke Database." });
      }
    } catch (error) {
      setModal({ isOpen: true, type: "error", title: "Error", message: "Gagal menyambung ke server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16 pt-[100px] px-4 transition-colors duration-300">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border">
        <div className="flex items-center gap-4">
          <Link 
            href="/peserta" 
            className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-90"
            title="Kembali ke Dashboard"
          >
            <span className="text-xl">←</span>
          </Link>

          <div className="flex flex-col justify-center min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
              Lengkapi <span className="text-emerald-600">Profil</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-none truncate">
              Monitoring Bank Sampah 2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle /> {/* ☀️/🌙 Saklar Dark Mode */}
          <TombolLogout />
        </div>
      </header>

      {/* --- FORM CARD --- */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 mt-8 transition-colors">
        <div className="mb-8 border-b border-slate-100 dark:border-slate-800 pb-4 text-center">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Data Identitas Entitas</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Lomba Bank Sampah Sragen 2026</p>
        </div>

        <form onSubmit={handleSimpan} className="space-y-5">
          {/* 1. Nama */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">1. Nama Bank Sampah</label>
            <input required name="namaBank" value={formData.namaBank} onChange={handleChange} placeholder="Contoh: Bank Sampah Resik Mukti" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-slate-200" />
          </div>

          {/* 2. Alamat */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">2. Alamat Lengkap</label>
            <textarea required name="alamat" value={formData.alamat} onChange={handleChange} placeholder="Jl. Raya..., RT/RW..., Desa..., Kec..." rows={3} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none resize-none dark:text-slate-200" />
          </div>

          {/* 3. Titik Koordinat */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">3. Titik Koordinat Lokasi</label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input readOnly name="koordinat" value={formData.koordinat} placeholder="Klik Ambil Lokasi ->" className="flex-1 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed" />
              <button type="button" onClick={dapatkanLokasi} className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-6 py-4 rounded-xl font-black text-[10px] border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all uppercase tracking-widest shrink-0">📍 Ambil Lokasi</button>
            </div>
          </div>

          {/* 4. Waktu Pendirian */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">4. Waktu Pendirian</label>
            <input required type="date" name="waktuPendirian" value={formData.waktuPendirian} onChange={handleChange} className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-slate-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* 5. Nama Ketua */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">5. Nama Ketua / Direktur</label>
                <input required name="namaKetua" value={formData.namaKetua} onChange={handleChange} placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-slate-200" />
             </div>
             {/* 6. No HP */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">6. No. WhatsApp Ketua</label>
                <input required type="tel" name="noHp" value={formData.noHp} onChange={handleChange} placeholder="0812..." className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none dark:text-slate-200" />
             </div>
          </div>

          <button disabled={loading} className="w-full bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-900 font-black py-5 rounded-2xl shadow-lg hover:bg-emerald-700 dark:hover:bg-emerald-400 active:scale-[0.98] transition-all uppercase text-xs tracking-[0.2em] mt-8 flex justify-center items-center gap-2">
            {loading ? "Menyimpan Data..." : "💾 Simpan Profil Entitas"}
          </button>
        </form>
      </div>
    </main>
  );
}