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
      if (res.ok) setModal({ isOpen: true, type: "success", title: "Tersimpan!", message: "Profil berhasil masuk ke Database." });
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-[100px] px-4">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />
      <header className="bg-white border-b border-slate-200 px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <h1 className="text-xl font-black">Profil <span className="text-emerald-600">Bank Sampah</span></h1>
        <TombolLogout />
      </header>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 mt-8">
        <form onSubmit={handleSimpan} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Nama Bank Sampah</label>
            <input required name="namaBank" value={formData.namaBank} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border font-bold mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">2. Alamat Lengkap</label>
            <textarea required name="alamat" value={formData.alamat} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border font-bold mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">3. Titik Koordinat</label>
            <div className="flex gap-2 mt-1">
              <input readOnly name="koordinat" value={formData.koordinat} className="flex-1 p-4 bg-slate-100 rounded-xl border font-bold" />
              <button type="button" onClick={dapatkanLokasi} className="bg-amber-100 text-amber-700 px-4 rounded-xl font-black text-xs border border-amber-200">📍 AMBIL LOKASI</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">5. Nama Ketua</label>
                <input required name="namaKetua" value={formData.namaKetua} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border font-bold mt-1" />
             </div>
             <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">6. No. WA Ketua</label>
                <input required name="noHp" value={formData.noHp} onChange={handleChange} className="w-full p-4 bg-slate-50 rounded-xl border font-bold mt-1" />
             </div>
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg uppercase text-xs tracking-widest mt-6">
            {loading ? "Menyimpan..." : "💾 Simpan Profil"}
          </button>
        </form>
      </div>
    </main>
  );
}