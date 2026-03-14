"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif";
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
  const [teksDeadline, setTeksDeadline] = useState("Memuat...");

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
      if (dataD.deadline) {
        const tglBatas = new Date(dataD.deadline);
        const tglSekarang = new Date();
        const formatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' });
        setTeksDeadline(formatter.format(tglBatas));
        if (tglSekarang > tglBatas) setIsWaktuHabis(true);
      }
    } catch (err) { console.error("Sync Error"); } 
    finally { setLoading(false); }
  };

  const handleHapus = async (idBerkas: string) => {
    if (isWaktuHabis) return setModal({ isOpen: true, type: "error", title: "Akses Ditolak", message: "Batas waktu sudah habis." });
    setProsesId(idBerkas);
    try {
      const res = await fetch("/api/peserta/hapus-gdrive", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ namaPeserta: user.namaInstansi || user.username, namaFolder: idBerkas }) });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Berkas lama dihapus. Silakan unggah berkas baru." });
        const updated = { ...sudahAdaDiDrive };
        delete updated[idBerkas];
        setSudahAdaDiDrive(updated);
      } else { throw new Error(); }
    } catch (err) { setModal({ isOpen: true, type: "error", title: "Gagal", message: "Gagal terhubung ke Drive." }); } 
    finally { setProsesId(null); }
  };

  const handleUploadLangsung = async (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
    if (isWaktuHabis) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setProsesId(idBerkas);
    const fd = new FormData(); fd.append("file", file); fd.append("namaFolder", idBerkas); fd.append("namaPeserta", user.namaInstansi || user.username);

    try {
      const res = await fetch("/api/peserta/upload-gdrive", { method: "POST", body: fd });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Berhasil!", message: "Berkas baru berhasil disimpan." });
        const resR = await fetch("/api/peserta/cek-berkas", { method: "POST", body: JSON.stringify({ namaPeserta: user.namaInstansi || user.username }) });
        const dataR = await resR.json();
        if (dataR.berkasTerisi) setSudahAdaDiDrive(dataR.berkasTerisi);
      }
    } catch (err) { setModal({ isOpen: true, type: "error", title: "Gagal", message: "Gagal mengunggah berkas." }); } 
    finally { setProsesId(null); }
  };

  return (
    <main className="w-full pb-24 pt-[90px] md:pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className={`p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 transition-all ${isWaktuHabis ? 'bg-red-50 dark:bg-red-950/20 border-red-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${isWaktuHabis ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-100 text-amber-600'}`}>
                 {isWaktuHabis ? "🔒" : "⏳"}
               </div>
               <div>
                 <h2 className={`font-black uppercase text-[10px] sm:text-xs tracking-widest ${isWaktuHabis ? 'text-red-600' : 'text-slate-400'}`}>
                   {isWaktuHabis ? "Akses Perubahan Ditutup" : "Batas Akhir Perubahan"}
                 </h2>
                 <p className="text-xs sm:text-sm font-bold mt-1">{teksDeadline} WIB</p>
               </div>
            </div>
            {isWaktuHabis && (
              <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-tighter w-full md:w-auto text-center">Sistem Terkunci</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 font-black text-slate-400 animate-pulse tracking-widest uppercase text-xs">Menyinkronkan data...</div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {DAFTAR_BERKAS.map((kat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mb-4 sm:mb-6 border-b dark:border-slate-800 pb-3 sm:pb-4">{kat.kategori}</h3>
                <div className="grid gap-3">
                  {kat.items.map((item) => {
                    const link = sudahAdaDiDrive[item.id];
                    const isProcessing = prosesId === item.id;
                    
                    return (
                      <div key={item.id} className={`p-4 sm:p-5 rounded-2xl border-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all ${link ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/5' : 'border-slate-100 dark:border-slate-800 border-dashed opacity-80'}`}>
                        <div className="w-full md:flex-1">
                          <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase mb-1">{item.id}</p>
                          <h4 className={`text-xs sm:text-sm font-bold ${link ? 'dark:text-slate-200 text-slate-800' : 'text-slate-400 italic'}`}>{item.label}</h4>
                          {link && <p className="text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-1">Sudah Diunggah</p>}
                        </div>
                        <div className="flex w-full md:w-auto items-center gap-2 mt-2 md:mt-0">
                          {link ? (
                            <>
                              <a href={link} target="_blank" rel="noreferrer" className="w-1/2 md:w-auto text-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-4 sm:px-5 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase shadow-sm hover:bg-blue-50 transition-all">Lihat</a>
                              {!isWaktuHabis && (
                                <button onClick={() => handleHapus(item.id)} disabled={isProcessing} className="w-1/2 md:w-auto bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 px-4 sm:px-5 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase shadow-sm disabled:opacity-30 transition-all active:scale-95">
                                  {isProcessing ? "..." : "Hapus"}
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="relative w-full md:w-auto">
                              {!isWaktuHabis ? (
                                <>
                                  <input type="file" id={`up-${item.id}`} className="hidden" onChange={(e) => handleUploadLangsung(e, item.id)} disabled={isProcessing} accept=".pdf,.jpg,.jpeg,.png" />
                                  <label htmlFor={`up-${item.id}`} className="flex items-center justify-center w-full md:w-auto gap-2 px-6 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 cursor-pointer shadow-sm active:scale-95 transition-all text-center">
                                    {isProcessing ? "⏳ Memproses..." : "📤 Unggah"}
                                  </label>
                                </>
                              ) : (
                                <div className="w-full md:w-auto text-center px-6 py-3 rounded-xl font-black text-[9px] sm:text-[10px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed">Kosong</div>
                              )}
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
    </main>
  );
}