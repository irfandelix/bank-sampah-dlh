"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";

export default function FormProfilPeserta() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  
  const [formData, setFormData] = useState({
    namaBank: "",
    alamat: "",
    koordinat: "",
    waktuPendirian: "", // 📅 Ini dia yang tadi ketinggalan!
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
    <main className="min-h-screen bg-slate-50 pb-16 pt-[100px] px-4">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />
      
      <header className="bg-white border-b border-slate-200 px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <h1 className="text-xl font-black text-slate-800">Profil <span className="text-emerald-600">Bank Sampah</span></h1>
        <TombolLogout />
      </header>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 mt-8">
        <div className="mb-8 border-b border-slate-100 pb-4 text-center">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Data Identitas Entitas</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lomba Bank Sampah Sragen 2026</p>
        </div>

        <form onSubmit={handleSimpan} className="space-y-5">
          {/* 1. Nama */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Nama Bank Sampah</label>
            <input required name="namaBank" value={formData.namaBank} onChange={handleChange} placeholder="Contoh: Bank Sampah Resik Mukti" className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          {/* 2. Alamat */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Alamat Lengkap</label>
            <textarea required name="alamat" value={formData.alamat} onChange={handleChange} placeholder="Jl. Raya..., RT/RW..., Desa..., Kec..." rows={3} className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
          </div>

          {/* 3. Titik Koordinat */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">3. Titik Koordinat Lokasi</label>
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <input readOnly name="koordinat" value={formData.koordinat} placeholder="Klik Ambil Lokasi ->" className="flex-1 p-4 bg-slate-100 rounded-xl border border-slate-200 font-bold text-slate-500" />
              <button type="button" onClick={dapatkanLokasi} className="bg-amber-100 text-amber-700 px-6 py-4 rounded-xl font-black text-[10px] border border-amber-200 hover:bg-amber-200 transition-all uppercase tracking-widest">📍 Ambil Lokasi</button>
            </div>
          </div>

          {/* 4. Waktu Pendirian (BARU!) */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">4. Waktu Pendirian</label>
            <input required type="date" name="waktuPendirian" value={formData.waktuPendirian} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* 5. Nama Ketua */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">5. Nama Ketua / Direktur</label>
                <input required name="namaKetua" value={formData.namaKetua} onChange={handleChange} placeholder="Nama Lengkap" className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" />
             </div>
             {/* 6. No HP */}
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">6. No. WhatsApp Ketua</label>
                <input required type="tel" name="noHp" value={formData.noHp} onChange={handleChange} placeholder="0812..." className="w-full p-4 bg-slate-50 rounded-xl border-slate-200 font-bold mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" />
             </div>
          </div>

          <button disabled={loading} className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-lg hover:bg-emerald-700 active:scale-[0.98] transition-all uppercase text-xs tracking-[0.2em] mt-8 flex justify-center items-center gap-2">
            {loading ? "Menyimpan Data..." : "💾 Simpan Profil Entitas"}
          </button>
        </form>
      </div>
    </main>
  );
}