"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle";

export default function DashboardPeserta() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
    } else {
      setUser(JSON.parse(savedUser));
    }
  }, [router]);

  if (!user) return <div className="p-10 text-center font-bold text-slate-500 flex items-center justify-center h-screen dark:bg-slate-950">Memuat Dashboard...</div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-24 pt-[100px] relative transition-colors duration-300">
      
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border">
        <div className="flex flex-col justify-center min-w-0 mr-4">
          <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
            Dashboard <span className="text-emerald-600">Peserta</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-none truncate">
            Monitoring Bank Sampah 2026
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle />
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

      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Banner Ucapan */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
          <div className="relative z-10">
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Selamat Datang,</p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{user.namaInstansi || user.username}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 font-medium max-w-2xl leading-relaxed">
              Silakan lengkapi profil dan unggah dokumen bukti. Jika ingin melakukan perbaikan atau penggantian berkas yang sudah terkirim, gunakan menu Manajemen Berkas.
            </p>
          </div>
        </div>

        {/* Menu Navigasi Utama */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          {/* Menu 1: Profil */}
          <Link href="/peserta/form" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100 dark:border-blue-900/30 mb-6 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">1. Profil</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Identitas Bank Sampah, titik koordinat GPS, dan data kepengurusan.</p>
            <div className="mt-6 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest gap-2">Isi Sekarang →</div>
          </Link>

          {/* Menu 2: Setor Dokumen */}
          <Link href="/peserta/upload" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-100 dark:border-emerald-900/30 mb-6 group-hover:scale-110 transition-transform">📤</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">2. Setor Dokumen</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Unggah berkas baru yang belum pernah dikirim ke sistem.</p>
            <div className="mt-6 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest gap-2">Mulai Unggah →</div>
          </Link>

          {/* 🟢 Menu 3: Manajemen Berkas (MODIFIKASI) */}
          <Link href="/peserta/manajemen" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-amber-100 dark:border-amber-900/30 mb-6 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">3. Manajemen Berkas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Lihat, hapus, atau ganti berkas yang sudah berhasil diunggah sebelumnya.</p>
            <div className="mt-6 flex items-center text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest gap-2">Buka Laci Berkas →</div>
          </Link>

        </div>
      </div>
    </main>
  );
}