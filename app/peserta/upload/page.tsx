"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif"; 
import TombolLogout from "@/components/TombolLogout";

// 📦 DATABASE PERSYARATAN BERKAS
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
  const [user, setUser] = useState<any>(null); // State untuk simpan data peserta
  const [uploadIndex, setUploadIndex] = useState(0); // State untuk animasi progress upload

  // Ambil identitas peserta yang sedang login
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const totalSyarat = DAFTAR_BERKAS.reduce((total, kat) => total + kat.items.length, 0);
  const jumlahFileTerisi = Object.keys(files).length;
  const progressPersen = (jumlahFileTerisi / totalSyarat) * 100;

  // 🛡️ VALIDASI FILE: Max 5MB & Cegah Video
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, idBerkas: string) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (selectedFile.size > maxSize) {
        setModal({ isOpen: true, type: "error", title: "Ukuran File Terlalu Besar", message: `Gagal! File "${selectedFile.name}" melebihi batas 5 MB. Silakan kompres foto/pdf Anda terlebih dahulu.` });
        e.target.value = ''; 
        return;
      }

      if (selectedFile.type.startsWith("video/")) {
        setModal({ isOpen: true, type: "error", title: "Format Ditolak", message: "Sistem tidak menerima format video. Silakan unggah dalam bentuk Foto (JPG/PNG) atau Dokumen (PDF)." });
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

  // 🚀 FUNGSI UTAMA: JAHITAN KE GOOGLE DRIVE API
  const handleSubmit = async () => {
    if (jumlahFileTerisi < totalSyarat) {
      setModal({ isOpen: true, type: "error", title: "Berkas Belum Lengkap!", message: `Anda baru mengunggah ${jumlahFileTerisi} dari ${totalSyarat} berkas wajib. Mohon lengkapi sebelum mengirim.` });
      return;
    }

    if (!user) {
      setModal({ isOpen: true, type: "error", title: "Sesi Habis", message: "Silakan login kembali untuk mengirim berkas." });
      return;
    }

    setLoading(true);
    setUploadIndex(0);

    const namaPeserta = user.namaInstansi || user.username || "Peserta NN";
    let prosesKe = 0;

    try {
      // Loop satu per satu biar server gak meledak (Sequential Upload)
      for (const [idBerkas, fileObj] of Object.entries(files)) {
        prosesKe++;
        setUploadIndex(prosesKe); // Update UI: "Mengunggah 1 dari 19..."

        const formData = new FormData();
        formData.append("file", fileObj);
        formData.append("namaFolder", idBerkas); // Contoh: "Kat. III No. 6"
        formData.append("namaPeserta", namaPeserta);

        const res = await fetch("/api/peserta/upload-gdrive", {
          method: "POST",
          body: formData, // fetch otomatis set multipart/form-data
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Gagal mengunggah berkas ${idBerkas}`);
        }
      }

      // Kalau semua loop selesai tanpa error:
      setModal({ 
        isOpen: true, 
        type: "success", 
        title: "Berhasil Terkirim! 🚀", 
        message: "Luar biasa! Seluruh dokumen bukti Anda telah tersimpan dengan aman di dalam folder Google Drive Panitia DLH Sragen." 
      });
      
      // (Opsional) Hapus file dari layar setelah sukses
      // setFiles({}); 

    } catch (error: any) {
      console.error("Error Upload:", error);
      setModal({ isOpen: true, type: "error", title: "Upload Terhenti", message: error.message || "Koneksi terputus saat mengunggah berkas." });
    } finally {
      setLoading(false);
      setUploadIndex(0);
    }
  };

  const tutupModal = () => setModal({ ...modal, isOpen: false });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={tutupModal} />

      {/* --- HEADER BAJA ANTI-PENYOK --- */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border">
        <div className="flex flex-col justify-center min-w-0 mr-4">
          <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none truncate">
            Lengkapi <span className="text-emerald-600">Dokumen Bukti</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 leading-none truncate">
            Monitoring Bank Sampah 2026
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <TombolLogout />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Banner Identitas (Sekarang Dinamis) */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 text-3xl shadow-inner border border-emerald-100">📁</div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Portal Unggah Dokumen</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Lomba Bank Sampah DLH Kabupaten Sragen 2026</p>
          <div className="mt-5 py-3 px-6 bg-slate-50 rounded-2xl inline-block text-xs font-medium text-slate-500 border border-slate-200">
            Peserta: <span className="font-extrabold text-emerald-700 uppercase tracking-wide">
              {user ? (user.namaInstansi || user.username) : "Memuat Data..."}
            </span>
          </div>
        </div>

        {/* Progress Bar Dinamis */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200 sticky top-[95px] z-40">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Kelengkapan</p>
              <p className="text-lg font-extrabold text-slate-800 mt-1">{progressPersen.toFixed(0)}% Selesai</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-black px-4 py-2 rounded-xl ${jumlahFileTerisi === totalSyarat ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {jumlahFileTerisi} / {totalSyarat} Berkas
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner border border-slate-200">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${jumlahFileTerisi === totalSyarat ? 'bg-emerald-500' : 'bg-amber-400'}`} 
              style={{ width: `${progressPersen}%` }}
            ></div>
          </div>
        </div>

        {/* Loop Daftar Kategori & Syarat Berkas */}
        <div className="space-y-8 mt-8">
          {DAFTAR_BERKAS.map((kategori, idxKat) => (
            <div key={idxKat} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-xl font-black text-emerald-700">{kategori.kategori}</h3>
                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">Pastikan ukuran file maksimal 5 MB</p>
              </div>

              <div className="space-y-4">
                {kategori.items.map((item, idxItem) => {
                  const hasFile = !!files[item.id];
                  const fileData = files[item.id];
                  const acceptFormat = item.format.includes('.pdf') && item.format.includes('.jpg') 
                    ? "application/pdf, image/jpeg, image/png" 
                    : item.format.includes('.pdf') ? "application/pdf" : "image/jpeg, image/png";

                  return (
                    <div key={item.id} className={`p-5 rounded-2xl border-2 transition-all duration-300 ${hasFile ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 hover:border-emerald-100 hover:bg-slate-50'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm leading-snug flex items-start gap-2">
                            <span className={hasFile ? "text-emerald-500" : "text-amber-400"}>{hasFile ? "✅" : "⚠️"}</span> 
                            {item.label}
                          </h4>
                          <div className="flex gap-2 mt-2">
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase">{item.id}</span>
                            <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase">Format: {item.format}</span>
                          </div>
                        </div>
                        
                        <div className="flex-none flex items-center gap-3">
                          {hasFile && !loading && (
                            <button onClick={() => hapusFile(item.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors" title="Hapus File">🗑️</button>
                          )}
                          
                          <div className="relative w-full md:w-auto">
                            <input 
                              type="file" 
                              id={`upload-${item.id}`} 
                              accept={acceptFormat}
                              className="hidden" 
                              disabled={loading}
                              onChange={(e) => handleFileChange(e, item.id)}
                            />
                            <label 
                              htmlFor={`upload-${item.id}`} 
                              className={`cursor-pointer font-black py-3 px-6 rounded-xl border text-xs transition-all flex items-center justify-center w-full shadow-sm uppercase tracking-widest ${
                                loading ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200' :
                                hasFile ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50 active:scale-95' : 'bg-slate-900 text-white border-slate-800 hover:bg-black active:scale-95'
                              }`}
                            >
                              {hasFile ? "Ganti" : "Pilih File"}
                            </label>
                          </div>
                        </div>
                      </div>

                      {hasFile && (
                        <div className="mt-4 pt-3 border-t border-emerald-100/50 text-[11px] font-bold text-emerald-700 flex items-center gap-2">
                          <span>{fileData.type.includes('pdf') ? '📄' : '🖼️'}</span> 
                          <span className="truncate max-w-[250px] sm:max-w-md">{fileData.name}</span>
                          <span className="text-emerald-500 font-medium">({(fileData.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- PANEL BAWAH (Tombol Kirim) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 sm:p-5 shadow-[0_-15px_30px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center px-4 sm:px-8">
        <div className="hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syarat Terpenuhi</p>
          <p className="text-xl font-black text-slate-800 mt-0.5">{jumlahFileTerisi} <span className="text-slate-400 text-sm">/ {totalSyarat}</span></p>
        </div>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full sm:w-auto flex-1 sm:flex-none font-black py-4 px-10 rounded-2xl shadow-lg transition-all text-xs uppercase tracking-widest flex justify-center items-center gap-2 ${
            loading ? 'bg-amber-500 hover:bg-amber-600 text-white cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
          }`}
        >
          {loading ? (
            <>
              <span className="animate-spin text-lg">⏳</span> MENGUNGGAH {uploadIndex} DARI {jumlahFileTerisi}...
            </>
          ) : (
            "🚀 KIRIM SEMUA DOKUMEN KE GOOGLE DRIVE"
          )}
        </button>
      </div>
    </main>
  );
}