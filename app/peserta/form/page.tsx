"use client";

import { useState } from "react";
import ModalNotif from "@/components/ModalNotif"; // Memanggil Modal Global

export default function FormUploadPeserta() {
  // State untuk menyimpan nama file yang dipilih peserta (Simulasi)
  const [fileSK, setFileSK] = useState<string | null>(null);
  const [fileFoto, setFileFoto] = useState<string | null>(null);

  // State untuk mengontrol Modal
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  // Fungsi simulasi saat file dipilih
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (name: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0].name);
    }
  };

  // Kalkulasi Progress Bar Otomatis
  const jumlahFileTerisi = (fileSK ? 1 : 0) + (fileFoto ? 1 : 0);
  const progressPersen = (jumlahFileTerisi / 2) * 100;

  // Fungsi saat tombol Kirim ditekan
  const handleSubmit = () => {
    // Validasi: Cek apakah ada file yang masih kosong
    if (!fileSK || !fileFoto) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Berkas Belum Lengkap!",
        message: "Mohon unggah semua dokumen yang diminta (SK Kepengurusan & Foto Area) sebelum mengirim berkas.",
      });
      return;
    }

    // Simulasi Sukses Terkirim
    setModal({
      isOpen: true,
      type: "success",
      title: "Berhasil Terkirim! 🚀",
      message: "Seluruh berkas Anda telah berhasil masuk dengan aman ke laci Google Drive Panitia DLH Sragen.",
    });
  };

  const tutupModal = () => setModal({ ...modal, isOpen: false });

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 relative">
      
      {/* --- MODAL POP-UP GLOBAL --- */}
      <ModalNotif 
        isOpen={modal.isOpen} 
        type={modal.type as "success" | "error" | ""} 
        title={modal.title}
        message={modal.message} 
        onClose={tutupModal} 
      />

      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Form */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
            📁
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Portal Unggah Berkas</h1>
          <p className="text-slate-500 mt-2 font-medium">Lomba Bank Sampah DLH Kab. Sragen 2026</p>
          <div className="mt-5 py-2.5 px-5 bg-slate-100/80 rounded-xl inline-block text-sm font-medium text-slate-700 border border-slate-200">
            Peserta: <span className="font-extrabold text-slate-800">Bank Sampah Maju Jaya (Kec. Gemolong)</span>
          </div>
        </div>

        {/* Progress Bar Dinamis */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between text-sm font-bold mb-3">
            <span className="text-slate-600">Kelengkapan Berkas</span>
            <span className={jumlahFileTerisi === 2 ? "text-emerald-600" : "text-amber-500"}>
              {progressPersen}% ({jumlahFileTerisi} dari 2)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-700 ease-out ${jumlahFileTerisi === 2 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
              style={{ width: `${progressPersen}%` }}
            ></div>
          </div>
        </div>

        {/* Daftar Syarat Upload */}
        <div className="space-y-4">
          
          {/* Card Upload 1: SK Kepengurusan */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border transition-all duration-300 ${fileSK ? 'border-emerald-300 border-l-4 border-l-emerald-400 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-300'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className={fileSK ? "text-emerald-500" : "text-slate-300 opacity-50"}>✅</span> 
                  1. SK Kepengurusan (PDF)
                </h3>
                <p className="text-sm text-slate-500 mt-1.5 font-medium">Surat Keputusan dari Kepala Desa/Lurah setempat.</p>
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  id="upload-sk" 
                  accept=".pdf"
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, setFileSK)}
                />
                <label 
                  htmlFor="upload-sk" 
                  className={`cursor-pointer font-bold py-2.5 px-5 rounded-xl border inline-block text-sm transition-all w-full sm:w-auto text-center shadow-sm active:scale-95 ${
                    fileSK ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  {fileSK ? "Ganti File PDF" : "Pilih File PDF"}
                </label>
              </div>
            </div>
            {fileSK && (
              <div className="mt-4 pt-4 border-t border-slate-100/60 text-sm font-bold text-emerald-700 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
                📄 <span className="truncate">{fileSK}</span>
              </div>
            )}
          </div>

          {/* Card Upload 2: Foto Fasilitas */}
          <div className={`bg-white p-6 rounded-3xl shadow-sm border transition-all duration-300 ${fileFoto ? 'border-emerald-300 border-l-4 border-l-emerald-400 bg-emerald-50/20' : 'border-slate-200 hover:border-amber-300 border-l-4 border-l-amber-400'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                  <span className={fileFoto ? "text-emerald-500" : "text-amber-500"}>
                    {fileFoto ? "✅" : "⚠️"}
                  </span> 
                  2. Foto Area Pemilahan (JPG/PNG)
                </h3>
                <p className="text-sm text-slate-500 mt-1.5 font-medium">Foto kondisi ruang pemilahan sampah saat ini.</p>
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  id="upload-foto" 
                  accept="image/jpeg, image/png"
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, setFileFoto)}
                />
                <label 
                  htmlFor="upload-foto" 
                  className={`cursor-pointer font-bold py-2.5 px-5 rounded-xl border inline-block text-sm transition-all w-full sm:w-auto text-center shadow-sm active:scale-95 ${
                    fileFoto ? 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {fileFoto ? "Ganti Foto" : "Pilih Foto"}
                </label>
              </div>
            </div>
            {fileFoto && (
              <div className="mt-4 pt-4 border-t border-slate-100/60 text-sm font-bold text-emerald-700 flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
                🖼️ <span className="truncate">{fileFoto}</span>
              </div>
            )}
          </div>

        </div>

        {/* Tombol Submit Utama */}
        <div className="pt-6">
          <button 
            onClick={handleSubmit}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            Kirim Berkas ke DLH Sragen 🚀
          </button>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium px-4">
            Pastikan semua file sudah benar sebelum menekan tombol kirim. Data akan otomatis masuk ke Google Drive Panitia.
          </p>
        </div>

      </div>
    </main>
  );
}