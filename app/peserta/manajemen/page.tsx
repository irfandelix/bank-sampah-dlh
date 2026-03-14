"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";
import React from "react";

const DAFTAR_BERKAS = [
  { kategori: "Kategori I: Pengelolaan Sampah", items: [ { id: "Kat. I No. 1", label: "Laporan hasil penimbangan" }, { id: "Kat. I No. 2", label: "SK, Jml Nasabah, KK RT/RW" }, { id: "Kat. I No. 3", label: "Laporan kegiatan penimbangan" }, { id: "Kat. I No. 4", label: "Neraca, buku tabungan & tamu" }, { id: "Kat. I No. 5", label: "Foto dokumentasi kegiatan" }, { id: "Kat. I No. 6", label: "Pencatatan sampah organik" }, { id: "Kat. I No. 7", label: "Surat pengantar/Screenshot" } ] },
  { kategori: "Kategori II: Fasilitas & Infrastruktur", items: [ { id: "Kat. II No. 1", label: "Foto Ruang Pelayanan" }, { id: "Kat. II No. 2", label: "Foto Area Penyimpanan" }, { id: "Kat. II No. 3", label: "Foto Peralatan" }, { id: "Kat. II No. 4", label: "Foto Kebersihan & Keamanan" } ] },
  { kategori: "Kategori III: Tata Kelola & Administrasi", items: [ { id: "Kat. III No. 1", label: "SK Pendirian Bank Sampah" }, { id: "Kat. III No. 2", label: "Foto Papan Nama, SK, Struktur" }, { id: "Kat. III No. 3", label: "Foto Pembagian tugas tertulis" }, { id: "Kat. III No. 4", label: "Foto SOP tertulis" }, { id: "Kat. III No. 5", label: "Foto Dokumentasi Penimbangan" }, { id: "Kat. III No. 6", label: "Foto Administrasi" } ] },
  { kategori: "Kategori IV: Inovasi Bank Sampah", items: [ { id: "Kat. IV No. 1", label: "SK/Foto Inovasi" } ] },
  { kategori: "Kategori V: Dukungan Desa", items: [ { id: "Kat. V No. 1", label: "DPA Desa/Foto Dokumentasi" } ] }
];

export default function ManajemenBerkasPeserta() {
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [prosesId, setProsesId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sudahAdaDiDrive, setSudahAdaDiDrive] = useState<Record<string, string>>({});
  const [isWaktuHabis, setIsWaktuHabis] = useState(false);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchInitialData(parsedUser.namaInstansi || parsedUser.username);
    }
  }, []);

  const fetchInitialData = async (namaPeserta: string) => {
    setLoading(true);
    try {
      const resB = await fetch("/api/peserta/cek-berkas", { method: "POST", body: JSON.stringify({ namaPeserta }) });
      const dataB = await resB.json();
      if (dataB.berkasTerisi) setSudahAdaDiDrive(dataB.berkasTerisi);

      const resD = await fetch("/api/pengaturan");
      const dataD = await resD.json();
      if (dataD.deadline && new Date() > new Date(dataD.deadline)) setIsWaktuHabis(true);
    } catch (err) {
      console.error("Gagal sinkronisasi");
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ FUNGSI HAPUS FILE
  const handleHapus = async (idBerkas: string) => {
    if (isWaktuHabis) return;
    setProsesId(idBerkas);
    try {
      const res = await fetch("/api/peserta/hapus-gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaPeserta: user.namaInstansi || user.username,
          namaFolder: idBerkas
        }),
      });

      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Terhapus!", message: `Berkas ${idBerkas} berhasil dihapus. Silakan unggah file baru.` });
        const updated = { ...sudahAdaDiDrive };
        delete updated[idBerkas];
        setSudahAdaDiDrive(updated);
      } else {
        throw new Error("Gagal menghapus file.");
      }
    } catch (err) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Koneksi ke Drive gagal." });
    } finally {
      setProsesId(null);
    }
  };

  // 📤 FUNGSI UPLOAD LANGSUNG (PENGGANTI)
  const handleUploadLangsung = async (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
    if (!e.target.files?.[0] || isWaktuHabis) return;
    const file = e.target.files[0];

    if (file.size > 5 * 1024 * 1024) {
      setModal({ isOpen: true, type: "error", title: "Terlalu Besar", message: "Maksimal ukuran file adalah 5MB." });
      return;
    }

    setProsesId(idBerkas);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("namaFolder", idBerkas);
    fd.append("namaPeserta", user.namaInstansi || user.username);

    try {
      const res = await fetch("/api/peserta/upload-gdrive", { method: "POST", body: fd });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Berhasil!", message: `Berkas ${idBerkas} telah diperbarui di Google Drive.` });
        // Refresh status berkas
        const resRefresh = await fetch("/api/peserta/cek-berkas", { method: "POST", body: JSON.stringify({ namaPeserta: user.namaInstansi || user.username }) });
        const dataR = await resRefresh.json();
        if (dataR.berkasTerisi) setSudahAdaDiDrive(dataR.berkasTerisi);
      } else {
        throw new Error("Gagal upload");
      }
    } catch (err) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Gagal mengunggah file pengganti." });
    } finally {
      setProsesId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-[100px] transition-colors duration-300">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/peserta" className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700">←</Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-black dark:text-white leading-none">Manajemen <span className="text-amber-500">Berkas</span></h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Kendalikan & Perbaiki Dokumen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TombolLogout />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Banner Info */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4">
          <div className="text-3xl">⚙️</div>
          <div>
            <h2 className="font-black text-amber-800 dark:text-amber-400 uppercase text-sm tracking-tight">Pusat Kendali Dokumen</h2>
            <p className="text-[11px] text-amber-700 dark:text-amber-500 font-medium leading-relaxed">Hapus berkas yang salah untuk memunculkan tombol **Unggah Pengganti**. Seluruh proses terkunci otomatis jika waktu penilaian berakhir.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 opacity-50 font-bold animate-pulse">Menghubungkan ke Google Drive...</div>
        ) : (
          <div className="space-y-8">
            {DAFTAR_BERKAS.map((kat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 border-b dark:border-slate-800 pb-4">{kat.kategori}</h3>
                <div className="grid gap-3">
                  {kat.items.map((item) => {
                    const link = sudahAdaDiDrive[item.id];
                    const isProcessing = prosesId === item.id;
                    
                    return (
                      <div key={item.id} className={`p-5 rounded-2xl border-2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 transition-all ${link ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/5' : 'border-slate-100 dark:border-slate-800 border-dashed opacity-80'}`}>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase mb-1">{item.id}</p>
                          <h4 className={`text-sm font-bold ${link ? 'dark:text-slate-200' : 'text-slate-400'}`}>{item.label}</h4>
                          <p className={`text-[10px] mt-1 font-bold ${link ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isProcessing ? "⏳ Sedang Diproses..." : link ? "✅ Berkas Terkunci di Drive" : "❌ Berkas Kosong"}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full lg:w-auto">
                          {link ? (
                            <>
                              <a href={link} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none text-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm hover:bg-blue-50">Buka</a>
                              <button 
                                onClick={() => handleHapus(item.id)} 
                                disabled={isProcessing || isWaktuHabis}
                                className="flex-1 lg:flex-none bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm disabled:opacity-30"
                              >
                                {isProcessing ? "..." : "Hapus"}
                              </button>
                            </>
                          ) : (
                            // 🟢 TOMBOL UPLOAD PENGGANTI (MUNCUL KALO KOSONG)
                            <div className="relative w-full lg:w-auto">
                              <input 
                                type="file" 
                                id={`up-${item.id}`} 
                                className="hidden" 
                                onChange={(e) => handleUploadLangsung(e, item.id)} 
                                disabled={isProcessing || isWaktuHabis}
                                accept=".pdf,.jpg,.jpeg,.png"
                              />
                              <label 
                                htmlFor={`up-${item.id}`} 
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all cursor-pointer shadow-sm ${isWaktuHabis ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-[1.02]'}`}
                              >
                                {isProcessing ? "⏳ Mengunggah..." : "📤 Unggah Pengganti"}
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER LOCK */}
      {isWaktuHabis && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] shadow-2xl animate-bounce border-2 border-white">
          🚫 Perubahan Dikunci (Batas Waktu Berakhir)
        </div>
      )}
    </main>
  );
}