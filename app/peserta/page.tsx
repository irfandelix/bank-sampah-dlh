"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle"; // 👈 Tambah ini

export default function DashboardPeserta() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  // Ambil data user saat login
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) {
      router.push("/"); // Lempar ke halaman login kalau belum masuk
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  if (!user) return <div className="p-10 text-center font-bold text-slate-500 flex items-center justify-center h-screen dark:bg-slate-950">Memuat Dashboard...</div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 pt-[100px] relative transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border transition-colors">
        <div className="flex flex-col justify-center min-w-0 mr-4">
          <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
            Dashboard <span className="text-emerald-600">Peserta</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-none truncate">
            Monitoring Bank Sampah 2026
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle /> {/* 👈 Saklar Mode Malam */}
          <TombolLogout />
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 ml-1">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 dark:text-white leading-none uppercase truncate max-w-[150px]">{user.namaInstansi || user.username}</p>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-1 tracking-wider leading-none">Peserta Lomba</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black border border-emerald-200 dark:border-emerald-800 text-xl shrink-0">
              🏦
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        
        {/* Banner Ucapan Selamat Datang */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Selamat Datang,</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{user.namaInstansi || user.username}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium max-w-xl leading-relaxed">
              Ini adalah pusat kendali Anda. Silakan lengkapi data profil entitas dan unggah seluruh dokumen persyaratan lomba sesuai dengan kategori yang telah ditentukan oleh Dinas Lingkungan Hidup Kabupaten Sragen.
            </p>
          </div>
        </div>

        {/* Menu Navigasi Utama */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          {/* Menu 1: Form Profil */}
          <Link href="/peserta/form" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden transition-colors">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100 dark:border-blue-900/30 mb-6 group-hover:scale-110 transition-transform">
              📝
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">1. Profil Bank Sampah</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">
              Lengkapi identitas Bank Sampah Anda, termasuk penguncian titik koordinat lokasi, nama ketua, dan waktu pendirian.
            </p>
            <div className="mt-6 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest gap-2">
              Isi Profil Sekarang <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </Link>

          {/* Menu 2: Upload Dokumen */}
          <Link href="/peserta/upload" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden transition-colors">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-100 dark:border-emerald-900/30 mb-6 group-hover:scale-110 transition-transform">
              📁
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">2. Unggah Dokumen Bukti</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">
              Unggah 19 berkas persyaratan lomba (PDF/JPG/PNG) sesuai dengan 5 kategori penilaian secara online dan aman.
            </p>
            <div className="mt-6 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest gap-2">
              Mulai Unggah Berkas <span className="group-hover:translate-x-2 transition-transform">→</span>
            </div>
          </Link>

        </div>

      </div>
    </main>
  );
}