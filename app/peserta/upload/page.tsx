"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif"; 
import TombolLogout from "@/components/TombolLogout";
import Link from "next/link";

// 📦 DATABASE PERSYARATAN BERKAS (Tetap sama)
const DAFTAR_BERKAS = [
  {
    kategori: "Kategori I: Pengelolaan Sampah",
    items: [
      { id: "Kat. I No. 1", label: "1. Laporan hasil penimbangan berdasarkan jenis sampah", format: ".pdf, .jpg, .png" },
      { id: "Kat. I No. 2", label: "2. SK, Laporan Jml Nasabah, Laporan Jml KK RT/RW", format: ".pdf" },
      { id: "Kat. I No. 3", label: "3. Laporan kegiatan tiap penimbangan (jml nasabah hadir)", format: ".pdf, .jpg, .png" },
      { id: "Kat. I No. 4", label: "4. Laporan Nasabah, penimbangan, neraca, buku tabungan & tamu", format: ".pdf, .jpg, .png" },
      { id: "Kat. I No. 5", label: "5. Foto/Dokumentasi kegiatan, buku catatan/laporan", format: ".pdf, .jpg, .png" },
      { id: "Kat. I No. 6", label: "6. Pencatatan sampah organik (Foto/Buku Catatan)", format: ".jpg, .png" },
      { id: "Kat. I No. 7", label: "7. Surat pengantar/Screenshot laporan (Japri/Grup)", format: ".pdf, .jpg, .png" },
    ]
  },
  {
    kategori: "Kategori II: Fasilitas & Infrastruktur",
    items: [
      { id: "Kat. II No. 1", label: "1. Foto/Dokumentasi Ruang Pelayanan", format: ".jpg, .png" },
      { id: "Kat. II No. 2", label: "2. Foto/Dokumentasi Area Penyimpanan", format: ".jpg, .png" },
      { id: "Kat. II No. 3", label: "3. Foto/Dokumentasi Peralatan", format: ".jpg, .png" },
      { id: "Kat. II No. 4", label: "4. Foto/Dokumentasi Kebersihan & Keamanan", format: ".jpg, .png" },
    ]
  },
  {
    kategori: "Kategori III: Tata Kelola & Administrasi",
    items: [
      { id: "Kat. III No. 1", label: "1. SK Pendirian Bank Sampah", format: ".pdf" },
      { id: "Kat. III No. 2", label: "2. Foto Papan Nama, SK, Struktur", format: ".jpg, .png" },
      { id: "Kat. III No. 3", label: "3. Foto/Bukti Pembagian tugas tertulis", format: ".jpg, .png" },
      { id: "Kat. III No. 4", label: "4. Foto/Bukti SOP tertulis & diterapkan", format: ".jpg, .png" },
      { id: "Kat. III No. 5", label: "5. Foto/Dokumentasi dan Laporan Penimbangan", format: ".pdf, .jpg, .png" },
      { id: "Kat. III No. 6", label: "6. Foto/Dokumentasi Administrasi", format: ".jpg, .png" },
    ]
  },
  {
    kategori: "Kategori IV: Inovasi Bank Sampah",
    items: [
      { id: "Kat. IV No. 1", label: "1. SK dan Foto/Dokumentasi Inovasi", format: ".pdf, .jpg, .png" },
    ]
  },
  {
    kategori: "Kategori V: Dukungan & Keterlibatan Desa",
    items: [
      { id: "Kat. V No. 1", label: "1. DPA Desa dan Foto/Dokumentasi", format: ".pdf, .jpg, .png" },
    ]
  }
];

export default function FormUploadPeserta() {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [sudahAdaDiDrive, setSudahAdaDiDrive] = useState<string[]>([]);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchExistingFiles(parsedUser.driveFolderId);
    }
  }, []);

  const fetchExistingFiles = async (folderId: string) => {
    if (!folderId) return;
    try {
      const res = await fetch("/api/peserta/cek-berkas", {
        method: "POST",
        body: JSON.stringify({ folderIdPeserta: folderId }),
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
  
  // 🟢 LOGIKA BARU: Gabungkan file yang baru dipilih + yang sudah di Drive
  const totalTerpenuhi = DAFTAR_BERKAS.flatMap(k => k.items).filter(item => 
    files[item.id] || sudahAdaDiDrive.includes(item.id)
  ).length;

  const progressPersen = (totalTerpenuhi / totalSyarat) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
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

  const hapusFile = (idBerkas: string) => {
    const newFiles = { ...files };
    delete newFiles[idBerkas];
    setFiles(newFiles);
  };

  const handleSubmit = async () => {
    // Validasi hanya jika ingin mengirim, pastikan minimal 1 file baru dipilih
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
        formData.append("folderId", user.driveFolderId);
        formData.append("namaPeserta", user.namaInstansi || user.username);

        const res = await fetch("/api/peserta/upload-gdrive", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Gagal upload berkas.");
      }

      setModal({ isOpen: true, type: "success", title: "Sukses!", message: "File baru berhasil ditambahkan." });
      
      // 🟢 PENTING: Panggil ulang Drive untuk mendapatkan data terbaru
      await fetchExistingFiles(user.driveFolderId);
      
      // 🟢 PENTING: Kosongkan antrean file agar progress bar menggunakan data Drive murni
      setFiles({}); 

    } catch (error: any) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: error.message });
    } finally {
      setLoading(false);
      setUploadIndex(0);
    }
  };

  const handleLihatBerkas = (idBerkas: string) => {
      setModal({
          isOpen: true,
          type: "info",
          title: "Akses Berkas",
          message: `Berkas ${idBerkas} telah tersimpan aman di Google Drive Panitia DLH. Jika Anda perlu mengubahnya, silakan hubungi Admin.`
      });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({...modal, isOpen: false})} />

      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/peserta" className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center border border-slate-200 hover:bg-slate-100 transition-all shadow-sm">
            <span className="text-xl font-bold">←</span>
          </Link>
          <div className="flex flex-col justify-center">
            <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">Lengkapi <span className="text-emerald-600">Dokumen</span></h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">MONITORING BANK SAMPAH 2026</p>
          </div>
        </div>
        <TombolLogout />
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 text-3xl mx-auto border border-emerald-100 shadow-inner">📁</div>
          <h2 className="text-2xl font-black text-slate-800">Portal Unggah Dokumen</h2>
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
                  const existsInDrive = sudahAdaDiDrive.includes(item.id);
                  const isSelected = !!files[item.id];
                  const active = existsInDrive || isSelected;

                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border-2 transition-all ${active ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm flex gap-2 leading-tight">
                            <span>{existsInDrive ? "🔒" : isSelected ? "✅" : "⚠️"}</span>
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
                              <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase tracking-tighter shadow-sm">
                                Terekam di Sistem
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          {/* 🟢 LOGIKA TAMPILAN: JIKA SUDAH ADA DI DRIVE, KUNCI. JIKA BELUM, MUNCULKAN INPUT */}
                          {existsInDrive ? (
                              <button 
                                onClick={() => handleLihatBerkas(item.id)}
                                className="font-black py-3 px-6 rounded-xl border text-[10px] uppercase tracking-widest block text-center shadow-sm bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 transition-all"
                              >
                                Lihat Berkas
                              </button>
                          ) : (
                              <>
                                {isSelected && (
                                  <button onClick={() => hapusFile(item.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl border border-red-100 hover:bg-red-100 transition-colors">🗑️</button>
                                )}
                                <div className="relative">
                                  <input 
                                    type="file" 
                                    id={`f-${item.id}`} 
                                    className="hidden" 
                                    onChange={(e) => handleFileChange(e, item.id)} 
                                    disabled={loading}
                                    accept={item.format.includes('.pdf') && item.format.includes('.jpg') ? ".pdf,.jpg,.jpeg,.png" : item.format.includes('.pdf') ? ".pdf" : ".jpg,.jpeg,.png"}
                                  />
                                  <label htmlFor={`f-${item.id}`} className={`cursor-pointer font-black py-3 px-6 rounded-xl border text-[10px] uppercase tracking-widest block text-center shadow-sm transition-all ${isSelected ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                    {isSelected ? "Ganti File" : "Pilih File"}
                                  </label>
                                </div>
                              </>
                          )}
                        </div>
                      </div>
                      {isSelected && !existsInDrive && (
                        <p className="mt-3 text-[10px] font-bold text-emerald-600 italic">📎 Menunggu Kirim: {files[item.id].name}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tombol Kirim */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-5 shadow-lg flex justify-between items-center px-8 z-40">
        <div className="hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Syarat</p>
          <p className="text-xl font-black text-slate-800">{totalTerpenuhi} <span className="text-slate-300 text-sm">/ {totalSyarat}</span></p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={loading || Object.keys(files).length === 0} 
          className={`w-full sm:w-auto font-black py-4 px-10 rounded-2xl shadow-lg uppercase text-[10px] tracking-widest flex gap-2 items-center justify-center transition-all ${loading ? 'bg-amber-500 text-white' : Object.keys(files).length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'}`}
        >
          {loading ? `⏳ MENGUNGGAH ${uploadIndex}...` : Object.keys(files).length === 0 ? "TIDAK ADA FILE BARU" : "🚀 KIRIM PERUBAHAN KE DRIVE"}
        </button>
      </div>
    </main>
  );
}