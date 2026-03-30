"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif"; 
import React from "react";
import imageCompression from "browser-image-compression";

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
  
  // State untuk animasi tombol saat mengkompresi gambar
  const [isCompressing, setIsCompressing] = useState<string | null>(null);

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

  // =========================================================================
  // FUNGSI UTAMA: PENGECEKAN PDF 4MB & KOMPRESI GAMBAR OTOMATIS
  // =========================================================================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
    if (isWaktuHabis) return setModal({ isOpen: true, type: "error", title: "Waktu Habis", message: "Batas waktu pengunggahan telah ditutup." });
    if (sudahAdaDiDrive[idBerkas]) return; 

    if (e.target.files && e.target.files[0]) {
      let file = e.target.files[0];
      
      // 🛑 KHUSUS PDF: Tolak jika lebih dari 4 MB (Aman dari Vercel 4.5MB Payload)
      if (file.type === "application/pdf" && file.size > 4 * 1024 * 1024) {
        return setModal({ 
          isOpen: true, 
          type: "error", 
          title: "File PDF Terlalu Besar!", 
          message: `Ukuran PDF Anda ${(file.size / 1024 / 1024).toFixed(2)} MB. Maksimal hanya boleh 4 MB. Silakan kompres dulu PDF Anda di web gratis seperti ilovepdf.com, lalu coba lagi.` 
        });
      }

      // 🔄 KHUSUS GAMBAR: Kompres otomatis jadi di bawah 1 MB
      if (file.type.startsWith("image/")) {
        try {
          setIsCompressing(idBerkas); 
          
          const options = {
            maxSizeMB: 0.9,          // Target ukuran maksimal 0.9 MB
            maxWidthOrHeight: 1600,  // Resolusi tetap aman dibaca
            useWebWorker: true,
            fileType: "image/jpeg"   // Format diringankan jadi JPG
          };
          
          const compressedBlob = await imageCompression(file, options);
          file = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          
        } catch (error) {
          console.error("Gagal kompresi:", error);
          setModal({ isOpen: true, type: "error", title: "Gagal Kompres", message: "Sistem gagal memperkecil ukuran gambar. Silakan coba gambar lain." });
          setIsCompressing(null);
          return;
        } finally {
          setIsCompressing(null); 
        }
      }

      // 💾 Simpan file yang sudah aman ke State
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
    <main className="w-full pb-24 pt-[90px] md:pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

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

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 sticky top-[75px] md:top-[90px] z-40 transition-colors">
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

        <div className="space-y-8">
          {DAFTAR_BERKAS.map((kategori, idxKat) => (
            <div key={idxKat} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
              <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-500 mb-6 border-b dark:border-slate-800 pb-4">{kategori.kategori}</h3>
              <div className="space-y-4">
                {kategori.items.map((item) => {
                  const linkDrive = sudahAdaDiDrive[item.id]; 
                  const exists = !!linkDrive;
                  const isSelected = !!files[item.id];
                  const isThisCompressing = isCompressing === item.id;

                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border-2 transition-all ${exists ? 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 grayscale' : isSelected ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-100 dark:border-slate-800 border-dashed'}`}>
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`font-bold text-sm flex gap-2 leading-tight ${exists ? 'text-slate-400' : 'dark:text-slate-200'}`}>
                            <span>{exists ? "🔒" : isSelected ? "✅" : "📄"}</span> {item.label}
                          </h4>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md uppercase">{item.id}</span>
                            <span className="text-[9px] font-black bg-slate-50 dark:bg-slate-800 text-slate-400 border dark:border-slate-700 px-2 py-1 rounded-md">{item.format}</span>
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
                              {isSelected && <button onClick={() => { const nf = {...files}; delete nf[item.id]; setFiles(nf); }} className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-4 py-3 rounded-xl font-black text-[10px] uppercase shadow-sm hover:bg-red-100 hover:text-red-600 transition-colors">Batal</button>}
                              <div className="relative">
                                <input type="file" id={`up-${item.id}`} className="hidden" onChange={(e) => handleFileChange(e, item.id)} disabled={loading || isWaktuHabis || isThisCompressing} accept=".pdf,.jpg,.jpeg,.png" />
                                
                                <label htmlFor={`up-${item.id}`} className={`cursor-pointer font-black py-3 px-6 rounded-xl border text-[10px] uppercase transition-all shadow-sm block text-center ${isThisCompressing ? 'bg-amber-500 text-white cursor-wait animate-pulse' : isSelected ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:scale-[1.02]'}`}>
                                  {isThisCompressing ? "🔄 Mengecilkan..." : isSelected ? "Siap Kirim" : "Pilih File"}
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && !exists && (
                        <p className="mt-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg inline-block">
                          📎 {files[item.id].name} <span className="text-emerald-500">({(files[item.id].size / 1024 / 1024).toFixed(2)} MB)</span>
                        </p>
                      )}
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
            className={`w-full max-w-md font-black py-4 rounded-2xl shadow-lg uppercase text-[10px] tracking-[0.2em] transition-all flex justify-center items-center gap-2 ${loading ? 'bg-amber-500 text-white cursor-wait' : Object.keys(files).length === 0 ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}
          >
            {loading ? (
               <>
                 <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 MENGUNGGAH FILE KE-{uploadIndex}...
               </>
            ) : "🚀 SETOR DOKUMEN SEKARANG"}
          </button>
        </div>
      )}
    </main>
  );
}