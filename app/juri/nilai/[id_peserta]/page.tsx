"use client";

import { useState } from "react";
import ModalNotif from "@/components/ModalNotif"; // Memanggil Modal Global

export default function FormPenilaianJuri() {
  // State untuk menyimpan nilai yang di-tap oleh juri
  const [nilai, setNilai] = useState<number | null>(null);
  
  // State untuk mengontrol Modal
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  const handleSimpan = () => {
    // Validasi: Cegah simpan jika belum ada nilai yang dipilih
    if (nilai === null) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Nilai Belum Diisi!",
        message: "Mohon pilih angka penilaian (6-10) terlebih dahulu sebelum melanjutkan ke pertanyaan berikutnya.",
      });
      return;
    }

    // Simulasi sukses menyimpan
    setModal({
      isOpen: true,
      type: "success",
      title: "Tersimpan!",
      message: `Nilai ${nilai} poin untuk kategori "Fasilitas & Infrastruktur" berhasil diamankan ke sistem.`,
    });
  };

  const tutupModal = () => setModal({ ...modal, isOpen: false });

  return (
    <main className="min-h-screen bg-slate-50 pb-20 relative">
      
      {/* --- MODAL POP-UP GLOBAL --- */}
      <ModalNotif 
        isOpen={modal.isOpen} 
        type={modal.type as "success" | "error" | ""} 
        title={modal.title}
        message={modal.message} 
        onClose={tutupModal} 
      />

      {/* Header Mobile (Tetap menempel di atas saat di-scroll) */}
      <header className="bg-emerald-700 text-white p-4 shadow-md sticky top-0 z-10">
        <p className="text-sm text-emerald-100">Penilaian Lapangan</p>
        <h1 className="text-xl font-bold">Bank Sampah Maju Jaya</h1>
        <div className="mt-2 inline-block px-2 py-1 bg-emerald-800/50 rounded-md text-xs font-medium border border-emerald-600/50">
          📍 Kec. Gemolong
        </div>
      </header>

      {/* Area Konten (Diberi max-width agar tetap rapi kalau terpaksa dibuka di tablet) */}
      <div className="p-4 space-y-6 max-w-md mx-auto mt-2">
        
        {/* Card Pertanyaan 1 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="mb-4">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md mb-3 inline-block">
              Fasilitas & Infrastruktur
            </span>
            <h2 className="text-slate-800 font-semibold leading-snug">
              1. Bagaimana kondisi ruang pelayanan nasabah / penimbangan di lokasi?
            </h2>
          </div>

          {/* Opsi Observasi (Radio Button Besar) */}
          <div className="space-y-3 mb-6">
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
              <input type="radio" name="q1" className="mt-1 w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-600" />
              <span className="text-sm text-slate-700 font-medium">a. Bangunan permanen milik sendiri / difasilitasi desa</span>
            </label>
            <label className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors">
              <input type="radio" name="q1" className="mt-1 w-5 h-5 text-emerald-600 border-slate-300 focus:ring-emerald-600" />
              <span className="text-sm text-slate-700 font-medium">b. Menumpang di fasilitas umum (Balai Desa/Posyandu)</span>
            </label>
          </div>

          {/* Deretan Tombol Angka (Fitur Zero-Typing) */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-3 font-medium">Beri Nilai Akhir (Tap angka):</p>
            <div className="flex gap-2 justify-between">
              {[6, 7, 8, 9, 10].map((angka) => (
                <button
                  key={angka}
                  onClick={() => setNilai(angka)}
                  className={`flex-1 py-3 text-lg font-bold rounded-xl transition-all duration-200 ${
                    nilai === angka
                      ? "bg-emerald-600 text-white shadow-md scale-105 ring-2 ring-emerald-200" // Desain saat tombol aktif ditekan
                      : "bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100" // Desain normal
                  }`}
                >
                  {angka}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tombol Simpan (Sekarang pakai event onClick) */}
        <button 
          onClick={handleSimpan}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          Simpan & Lanjut 
          <span className="text-xl">→</span>
        </button>

      </div>
    </main>
  );
}