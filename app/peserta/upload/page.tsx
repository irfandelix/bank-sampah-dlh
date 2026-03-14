"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif"; 
import TombolLogout from "@/components/TombolLogout";
import Link from "next/link";

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
  
  // 🟢 STATE DEADLINE WAKTU
  const [isWaktuHabis, setIsWaktuHabis] = useState(false);
  const [teksDeadline, setTeksDeadline] = useState("Memuat waktu...");

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchExistingFiles(parsedUser.namaInstansi || parsedUser.username);
    }

    // 🟢 FUNGSI CEK WAKTU KE DATABASE
    const cekDeadline = async () => {
      try {
        const res = await fetch("/api/pengaturan");
        if (res.ok) {
          const data = await res.json();
          if (data.deadline) {
            const tglBatas = new Date(data.deadline);
            const tglSekarang = new Date();
            
            // Format Teks biar enak dibaca
            const formatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeStyle: 'short' });
            setTeksDeadline(`Batas Waktu: ${formatter.format(tglBatas)} WIB`);

            // Gembok semua input jika sudah lewat waktunya
            if (tglSekarang > tglBatas) {
              setIsWaktuHabis(true);
            }
          } else {
            setTeksDeadline("Batas Waktu Belum Ditentukan Admin");
          }
        }
      } catch (err) {
        setTeksDeadline("Gagal memuat batas waktu");
      }
    };
    cekDeadline();
  }, []);

  const fetchExistingFiles = async (namaPeserta: string) => {
    if (!namaPeserta) return;
    try {
      const res = await fetch("/api/peserta/cek-berkas", {
        method: "POST",
        body: JSON.stringify({ namaPeserta: namaPeserta }),
      });
      const data = await res.json();
      if (data.berkasTerisi) {
        setSudahAdaDiDrive(data.berkasTerisi);
      }
    } catch (err) {
      console.error("Gagal cek berkas di Drive:", err);
    }
  };

  const totalSyarat = DAFTAR_BERKAS.reduce((total, kat) => total + kat.items.length, 0);
  const totalTerpenuhi = DAFTAR_BERKAS.flatMap(k => k.items).filter(item => files[item.id] || !!sudahAdaDiDrive[item.id]).length;
  const progressPersen = (totalSyarat === 0) ? 0 : (totalTerpenuhi / totalSyarat) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
    // 🟢 CEGAT JIKA WAKTU HABIS
    if (isWaktuHabis) {
      setModal({ isOpen: true, type: "error", title: "Waktu Habis", message: "Maaf, batas waktu pengunggahan dokumen telah ditutup oleh Admin DLH." });
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const maxSize = 5 * 1024 * 1024; 

      if (selectedFile.size > maxSize) {
        setModal({ isOpen: true, type: "error", title: "File Terlalu Besar", message: `Gagal! File melebihi batas 5 MB.` });
        e.target.value = ''; 
        return;
      }
      if (selectedFile.type.startsWith("video/")) {
        setModal({ isOpen: true, type: "error", title: "Format Ditolak", message: "Sistem tidak menerima format video." });
        e.target.value = ''; 
        return;
      }
      setFiles(prev => ({ ...prev, [idBerkas]: selectedFile }));
    }
  };

  const hapusFilePilihan = (idBerkas: string) => {
    const newFiles = { ...files };
    delete newFiles[idBerkas];
    setFiles(newFiles);
  };

  const handleSubmit = async () => {
    // 🟢 CEGAT PENGIRIMAN JIKA WAKTU HABIS
    if (isWaktuHabis) {
       setModal({ isOpen: true, type: "error", title: "Waktu Habis", message: "Maaf, Anda tidak bisa mengirim karena batas waktu telah berakhir." });
       return;
    }

    if (Object.keys(files).length === 0) {
       setModal({ isOpen: true, type: "error", title: "Tidak ada file baru", message: `Pilih minimal satu file baru untuk diunggah.` });
       return;
    }

    setLoading(true);
    let prosesKe = 0;

    try {
      for (const [idBerkas, fileObj] of Object.entries(files)) {
        prosesKe++;
        setUploadIndex(prosesKe);

        const formData = new FormData();
        formData.append("file", fileObj);
        formData.append("namaFolder", idBerkas);
        formData.append("namaPeserta", user.namaInstansi || user.username);

        const res = await fetch("/api/peserta/upload-gdrive", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Gagal upload berkas.");
      }

      setModal({ isOpen: true, type: "success", title: "Berhasil!", message: "File berhasil disetor dan dikunci." });
      await fetchExistingFiles(user.namaInstansi || user.username);
      setFiles({}); 
    } catch (error: any) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: error.message });
    } finally {
      setLoading(false);
      setUploadIndex(0);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/peserta" className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
            <span className="text-xl font-bold">←</span>
          </Link>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Setor <span className="text-emerald-600">Dokumen</span></h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">MONITORING BANK SAMPAH 2026</p>
          </div>
        </div>
        <TombolLogout />
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* 🟢 TAMPILAN BANNER JIKA WAKTU HABIS */}
        {isWaktuHabis && (
          <div className="bg-red-50 border-2 border-red-500 rounded-[2.5rem] p-6 flex flex-col items-center text-center shadow-md animate-pulse mt-4">
            <span className="text-4xl mb-2">⏳</span>
            <h2 className="text-2xl font-black text-red-600 uppercase tracking-tight">Batas Waktu Telah Berakhir</h2>
            <p className="text-sm text-red-500 font-bold mt-2">Sistem pengunggahan dokumen telah dikunci secara otomatis oleh Admin DLH.</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 text-center relative overflow-hidden">
          <div className={`absolute top-0 right-0 font-black text-[9px] px-4 py-2 rounded-bl-2xl border-b border-l uppercase tracking-widest ${isWaktuHabis ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
             {isWaktuHabis ? 'Akses Ditutup' : 'Mode Setor'}
          </div>
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 text-3xl mx-auto border border-emerald-100 shadow-inner mt-4">📁</div>
          <h2 className="text-2xl font-black text-slate-800">Portal Unggah Dokumen</h2>
          <p className="text-xs text-slate-500 mt-2 font-bold bg-slate-50 p-2 rounded-lg inline-block border">{teksDeadline}</p>
          <div className="mt-4 py-2 px-6 bg-slate-50 rounded-2xl inline-block text-[10px] font-bold text-slate-400 uppercase tracking-widest border">
            Peserta: <span className="text-emerald-700">{user?.namaInstansi || user?.username}</span>
          </div>
        </div>

        {/* Progress Bar Dinamis */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 sticky top-[95px] z-40">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Progres Kelengkapan</p>
              <p className="text-lg font-extrabold text-slate-800">{progressPersen.toFixed(0)}% Selesai</p>
            </div>
            <div className={`text-sm font-black px-4 py-2 rounded-xl ${totalTerpenuhi === totalSyarat ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {totalTerpenuhi} / {totalSyarat} Berkas
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border">
            <div className={`h-full transition-all duration-1000 ${totalTerpenuhi === totalSyarat ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${progressPersen}%` }}></div>
          </div>
        </div>

        {/* List Berkas */}
        <div className="space-y-8">
          {DAFTAR_BERKAS.map((kategori, idxKat) => (
            <div key={idxKat} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h3 className="text-xl font-black text-emerald-700 mb-6 border-b pb-4">{kategori.kategori}</h3>
              <div className="space-y-4">
                {kategori.items.map((item) => {
                  const linkDrive = sudahAdaDiDrive[item.id]; 
                  const existsInDrive = !!linkDrive;
                  const isSelected = !!files[item.id];
                  const active = existsInDrive || isSelected;

                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border-2 transition-all ${existsInDrive ? 'border-slate-200 bg-slate-50/50' : isSelected ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`font-bold text-sm flex gap-2 leading-tight ${existsInDrive ? 'text-slate-500' : 'text-slate-800'}`}>
                            <span>{existsInDrive ? "🔒" : isSelected ? "⏳" : "⚠️"}</span>
                            {item.label}
                          </h4>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-tighter">
                              {item.id}
                            </span>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-md uppercase tracking-tighter">
                              Format: {item.format}
                            </span>
                            {existsInDrive && (
                              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm border border-emerald-200">
                                Sudah Disetor
                              </span>
                            )}
                          </div>
                        </div>

                        {/* KUMPULAN TOMBOL */}
                        <div className="flex flex-wrap items-center gap-2 mt-2 lg:mt-0">
                          {existsInDrive ? (
                            <>
                              <a 
                                href={linkDrive} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
                              >
                                👁️ Lihat
                              </a>
                              <div className="bg-slate-100 text-slate-400 border border-slate-200 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed shadow-inner flex items-center gap-2">
                                <span>🔒</span> Terkunci
                              </div>
                            </>
                          ) : isWaktuHabis ? (
                             // 🟢 TOMBOL JIKA WAKTU HABIS TAPI BELUM UPLOAD
                             <div className="bg-red-50 text-red-400 border border-red-200 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed shadow-inner flex items-center gap-2">
                               <span>⏳</span> Waktu Habis
                             </div>
                          ) : (
                            <>
                              {isSelected && (
                                <button 
                                  onClick={() => hapusFilePilihan(item.id)} 
                                  className="bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm"
                                >
                                  Batal
                                </button>
                              )}
                              <div className="relative">
                                <input 
                                  type="file" 
                                  id={`f-${item.id}`} 
                                  className="hidden" 
                                  onChange={(e) => handleFileChange(e, item.id)} 
                                  disabled={loading || isWaktuHabis}
                                  accept={item.format.includes('.pdf') && item.format.includes('.jpg') ? ".pdf,.jpg,.jpeg,.png" : item.format.includes('.pdf') ? ".pdf" : ".jpg,.jpeg,.png"}
                                />
                                <label 
                                  htmlFor={`f-${item.id}`} 
                                  className={`cursor-pointer font-black py-3 px-6 rounded-xl border text-[10px] uppercase tracking-widest block text-center shadow-sm transition-all ${isSelected ? 'bg-amber-400 text-white border-amber-500' : 'bg-slate-800 text-white border-slate-900 hover:bg-black'}`}
                                >
                                  {isSelected ? "Siap Kirim" : "Pilih File"}
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {isSelected && !existsInDrive && (
                        <p className="mt-3 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 inline-block">
                          📎 File: {files[item.id].name}
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

      {/* SEMBUNYIKAN TOMBOL KIRIM JIKA WAKTU HABIS */}
      {!isWaktuHabis && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-5 shadow-[0_-15px_30px_rgba(0,0,0,0.05)] flex justify-between items-center px-4 md:px-8 z-40">
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Syarat</p>
            <p className="text-xl font-black text-slate-800">{totalTerpenuhi} <span className="text-slate-300 text-sm">/ {totalSyarat}</span></p>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={loading || Object.keys(files).length === 0} 
            className={`w-full sm:w-auto font-black py-4 px-10 rounded-2xl shadow-lg uppercase text-[10px] tracking-widest flex gap-2 items-center justify-center transition-all ${loading ? 'bg-amber-500 text-white' : Object.keys(files).length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}
          >
            {loading ? `⏳ MENGUNGGAH ${uploadIndex}...` : Object.keys(files).length === 0 ? "PILIH FILE UNTUK DIKIRIM" : "🚀 KIRIM DOKUMEN"}
          </button>
        </div>
      )}
    </main>
  );
}