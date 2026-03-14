"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif"; 
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle"; 
import Link from "next/link";
import React from "react";

const DAFTAR_BERKAS = [
  { kategori: "Kategori I: Pengelolaan Sampah", items: [ { id: "Kat. I No. 1", label: "1. Laporan hasil penimbangan berdasarkan jenis sampah", format: ".pdf, .jpg, .png" }, { id: "Kat. I No. 2", label: "2. SK, Laporan Jml Nasabah, Laporan Jml KK RT/RW", format: ".pdf" }, { id: "Kat. I No. 3", label: "3. Laporan kegiatan tiap penimbangan (jml nasabah hadir)", format: ".pdf, .jpg, .png" }, { id: "Kat. I No. 4", label: "4. Laporan Nasabah, penimbangan, neraca, buku tabungan & tamu", format: ".pdf, .jpg, .png" }, { id: "Kat. I No. 5", label: "5. Foto/Dokumentasi kegiatan, buku catatan/laporan", format: ".pdf, .jpg, .png" }, { id: "Kat. I No. 6", label: "6. Pencatatan sampah organik (Foto/Buku Catatan)", format: ".jpg, .png" }, { id: "Kat. I No. 7", label: "7. Surat pengantar/Screenshot laporan (Japri/Grup)", format: ".pdf, .jpg, .png" } ] },
  { kategori: "Kategori II: Fasilitas & Infrastruktur", items: [ { id: "Kat. II No. 1", label: "1. Foto/Dokumentasi Ruang Pelayanan", format: ".jpg, .png" }, { id: "Kat. II No. 2", label: "2. Foto/Dokumentasi Area Penyimpanan", format: ".jpg, .png" }, { id: "Kat. II No. 3", label: "3. Foto/Dokumentasi Peralatan", format: ".jpg, .png" }, { id: "Kat. II No. 4", label: "4. Foto/Dokumentasi Kebersihan & Keamanan", format: ".jpg, .png" } ] },
  { kategori: "Kategori III: Tata Kelola & Administrasi", items: [ { id: "Kat. III No. 1", label: "1. SK Pendirian Bank Sampah", format: ".pdf" }, { id: "Kat. III No. 2", label: "2. Foto Papan Nama, SK, Struktur", format: ".jpg, .png" }, { id: "Kat. III No. 3", label: "3. Foto/Bukti Pembagian tugas tertulis", format: ".jpg, .png" }, { id: "Kat. III No. 4", label: "4. Foto/Bukti SOP tertulis & diterapkan", format: ".jpg, .png" }, { id: "Kat. III No. 5", label: "5. Foto/Dokumentasi dan Laporan Penimbangan", format: ".pdf, .jpg, .png" }, { id: "Kat. III No. 6", label: "6. Foto/Dokumentasi Administrasi", format: ".jpg, .png" } ] },
  { kategori: "Kategori IV: Inovasi Bank Sampah", items: [ { id: "Kat. IV No. 1", label: "1. SK dan Foto/Dokumentasi Inovasi", format: ".pdf, .jpg, .png" } ] },
  { kategori: "Kategori V: Dukungan & Keterlibatan Desa", items: [ { id: "Kat. V No. 1", label: "1. DPA Desa dan Foto/Dokumentasi", format: ".pdf, .jpg, .png" } ] }
];

export default function FormUploadPeserta() {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [sudahAdaDiDrive, setSudahAdaDiDrive] = useState<Record<string, string>>({});
  
  const [isWaktuHabis, setIsWaktuHabis] = useState(false);
  const [teksDeadline, setTeksDeadline] = useState("Memuat waktu...");

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchSyncData(parsedUser.namaInstansi || parsedUser.username);
    }
  }, []);

  const fetchSyncData = async (namaPeserta: string) => {
    try {
      const resDrive = await fetch("/api/peserta/cek-berkas", { method: "POST", body: JSON.stringify({ namaPeserta }) });
      const dataD = await resDrive.json();
      if (dataD.berkasTerisi) setSudahAdaDiDrive(dataD.berkasTerisi);

      const resTime = await fetch("/api/pengaturan");
      const dataT = await resTime.json();
      if (dataT.deadline) {
        const tglBatas = new Date(dataT.deadline);
        const formatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' });
        setTeksDeadline(`Batas Waktu: ${formatter.format(tglBatas)} WIB`);
        if (new Date() > tglBatas) setIsWaktuHabis(true);
      } else {
        setTeksDeadline("Batas Waktu Belum Ditentukan");
      }
    } catch (err) { console.error("Sync Error"); }
  };

  const totalSyarat = DAFTAR_BERKAS.reduce((total, kat) => total + kat.items.length, 0);
  const totalTerpenuhi = DAFTAR_BERKAS.flatMap(k => k.items).filter(item => files[item.id] || !!sudahAdaDiDrive[item.id]).length;
  const progressPersen = (totalSyarat === 0) ? 0 : (totalTerpenuhi / totalSyarat) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
    if (isWaktuHabis) return setModal({ isOpen: true, type: "error", title: "Waktu Habis", message: "Batas waktu pengunggahan telah ditutup." });
    if (sudahAdaDiDrive[idBerkas]) return; 

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return setModal({ isOpen: true, type: "error", title: "Terlalu Besar", message: "Maksimal file 5 MB." });
      setFiles(prev => ({ ...prev, [idBerkas]: file }));
    }
  };

  const handleSubmit = async () => {
    if (isWaktuHabis || Object.keys(files).length === 0) return;
    setLoading(true);
    let count = 0;
    try {
      for (const [id, f] of Object.entries(files)) {
        count++; setUploadIndex(count);
        const fd = new FormData(); fd.append("file", f); fd.append("namaFolder", id); fd.append("namaPeserta", user.namaInstansi || user.username);
        const res = await fetch("/api/peserta/upload-gdrive", { method: "POST", body: fd });
        if (!res.ok) throw new Error("Gagal upload.");
      }
      setModal({ isOpen: true, type: "success", title: "Berhasil!", message: "Dokumen berhasil disetor & dikunci secara otomatis." });
      await fetchSyncData(user.namaInstansi || user.username);
      setFiles({});
    } catch (e: any) { setModal({ isOpen: true, type: "error", title: "Gagal", message: e.message }); }
    finally { setLoading(false); setUploadIndex(0); }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-[100px] transition-colors duration-300">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/peserta" className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all">←</Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-black dark:text-white leading-none">Pendaftaran <span className="text-emerald-600">Berkas</span></h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Lomba Bank Sampah 2026</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TombolLogout />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {isWaktuHabis && (
          <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-500 rounded-[2.5rem] p-6 text-center animate-pulse">
            <span className="text-3xl">⏳</span>
            <h2 className="text-xl font-black text-red-600 dark:text-red-400 uppercase mt-2">Batas Waktu Berakhir</h2>
            <p className="text-xs text-red-500 font-bold">Sistem terkunci otomatis oleh Admin DLH.</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-colors">
          <div className={`absolute top-0 right-0 font-black text-[9px] px-4 py-2 rounded-bl-2xl border-b border-l uppercase tracking-widest ${isWaktuHabis ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-red-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 border-emerald-200'}`}>
             {isWaktuHabis ? 'Akses Ditutup' : 'Mode Setor'}
          </div>
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 text-3xl mx-auto border border-emerald-100 dark:border-emerald-800 shadow-inner mt-4">📁</div>
          <h2 className="text-2xl font-black dark:text-white">Portal Unggah Dokumen</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-bold bg-slate-50 dark:bg-slate-800 p-2 rounded-lg inline-block border dark:border-slate-700">{teksDeadline}</p>
        </div>

        {/* PROGRESS BAR */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 sticky top-[95px] z-40 transition-colors">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Progres Kelengkapan</p>
              <p className="text-lg font-extrabold dark:text-white">{progressPersen.toFixed(0)}% Selesai</p>
            </div>
            <div className={`text-sm font-black px-4 py-2 rounded-xl ${totalTerpenuhi === totalSyarat ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {totalTerpenuhi} / {totalSyarat} Berkas
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden border dark:border-slate-700">
            <div className={`h-full transition-all duration-1000 ${totalTerpenuhi === totalSyarat ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${progressPersen}%` }}></div>
          </div>
        </div>

        {/* LIST BERKAS */}
        <div className="space-y-8">
          {DAFTAR_BERKAS.map((kategori, idxKat) => (
            <div key={idxKat} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-500 mb-6 border-b dark:border-slate-800 pb-4">{kategori.kategori}</h3>
              <div className="space-y-4">
                {kategori.items.map((item) => {
                  const linkDrive = sudahAdaDiDrive[item.id]; 
                  const exists = !!linkDrive;
                  const isSelected = !!files[item.id];

                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border-2 transition-all ${exists ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 grayscale' : isSelected ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 dark:border-slate-800 border-dashed'}`}>
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`font-bold text-sm flex gap-2 leading-tight ${exists ? 'text-slate-400' : 'dark:text-slate-200'}`}>
                            <span>{exists ? "🔒" : isSelected ? "⏳" : "📄"}</span> {item.label}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md uppercase">{item.id}</span>
                            {exists && <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded-md uppercase">Tersimpan</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {exists ? (
                            <div className="bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase cursor-not-allowed border dark:border-slate-700 shadow-inner">🔒 Terkunci</div>
                          ) : isWaktuHabis ? (
                             <div className="bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-600 border border-red-200 dark:border-red-900/50 px-6 py-3 rounded-xl font-black text-[10px] uppercase cursor-not-allowed">Habis</div>
                          ) : (
                            <>
                              {isSelected && <button onClick={() => { const nf = {...files}; delete nf[item.id]; setFiles(nf); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm">Batal</button>}
                              <div className="relative">
                                <input type="file" id={`up-${item.id}`} className="hidden" onChange={(e) => handleFileChange(e, item.id)} disabled={loading || isWaktuHabis} accept=".pdf,.jpg,.jpeg,.png" />
                                <label htmlFor={`up-${item.id}`} className={`cursor-pointer font-black py-3 px-6 rounded-xl border text-[10px] uppercase transition-all shadow-sm block text-center ${isSelected ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-[1.02]'}`}>
                                  {isSelected ? "Siap Kirim" : "Pilih File"}
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && !exists && <p className="mt-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">📎 {files[item.id].name}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isWaktuHabis && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-5 shadow-[0_-15px_30px_rgba(0,0,0,0.1)] z-50 flex justify-center px-4">
          <button 
            onClick={handleSubmit} 
            disabled={loading || Object.keys(files).length === 0} 
            className={`w-full max-w-md font-black py-4 rounded-2xl shadow-lg uppercase text-[10px] tracking-[0.2em] transition-all ${loading ? 'bg-amber-50 text-white' : Object.keys(files).length === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:scale-[1.02] active:scale-95'}`}
          >
            {loading ? `⏳ MENGUNGGAH KE-${uploadIndex}...` : "🚀 SETOR DOKUMEN SEKARANG"}
          </button>
        </div>
      )}
    </main>
  );
}