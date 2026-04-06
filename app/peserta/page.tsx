"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPeserta() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // State untuk nyimpen profil lengkap dari database
  const [profilLengkap, setProfilLengkap] = useState<any>(null);
  
  // ✅ STATE BARU: Untuk ngitung jumlah berkas yang udah diupload
  const [berkasTerkumpul, setBerkasTerkumpul] = useState<number>(0);
  const TOTAL_BERKAS = 19; // Sesuai total syarat di form upload

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
    } else {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Panggil 2 fungsi sekaligus pas halaman dibuka
      ambilDataProfil(parsedUser.username);
      cekKelengkapanBerkas(parsedUser.namaInstansi || parsedUser.username);
    }
  }, [router]);

  const ambilDataProfil = async (username: string) => {
    try {
      const res = await fetch(`/api/peserta/simpan-profil?username=${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfilLengkap(data);
      }
    } catch (err) {
      console.error("Gagal mengambil profil terbaru", err);
    }
  };

  // ✅ FUNGSI BARU: Nanya ke Google Drive udah berapa berkas yang masuk
  const cekKelengkapanBerkas = async (namaPeserta: string) => {
    try {
      const res = await fetch("/api/peserta/cek-berkas", {
        method: "POST",
        body: JSON.stringify({ namaPeserta }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.berkasTerisi) {
          // Hitung ada berapa ID berkas yang udah tersimpan
          setBerkasTerkumpul(Object.keys(data.berkasTerisi).length);
        }
      }
    } catch (err) {
      console.error("Gagal cek kelengkapan berkas", err);
    }
  };

  if (!user) return <div className="p-10 text-center font-bold text-slate-500 flex items-center justify-center h-screen">Memuat Dashboard...</div>;

  return (
    <main className="w-full font-sans pb-24 pt-[90px] md:pt-[100px] relative transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        
        {/* BANNER SELAMAT DATANG */}
        <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-3xl -mr-20 -mt-20 opacity-60"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            
            <div>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Selamat Datang,</p>
              
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight mb-2">
                {profilLengkap?.namaBankSampah ? profilLengkap.namaBankSampah : user.namaInstansi || user.username}
              </h2>
              
              {profilLengkap?.namaBankSampah && (
                <p className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700 mt-2">
                  📍 {user.namaInstansi}
                </p>
              )}
            </div>

            {/* ✅ DUA LABEL STATUS (PROFIL & BERKAS) */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              {/* Status Profil */}
              <div className={`px-4 py-2 rounded-xl text-[10px] text-center font-black uppercase tracking-widest border ${profilLengkap?.namaBankSampah ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30'} shadow-sm`}>
                {profilLengkap?.namaBankSampah ? "✅ Profil Terisi" : "⚠️ Profil Belum Lengkap"}
              </div>

              {/* Status Berkas */}
              <div className={`px-4 py-2 rounded-xl text-[10px] text-center font-black uppercase tracking-widest border ${berkasTerkumpul === TOTAL_BERKAS ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/30'} shadow-sm`}>
                {berkasTerkumpul === TOTAL_BERKAS 
                  ? `✅ Berkas Lengkap (${berkasTerkumpul}/${TOTAL_BERKAS})` 
                  : `⚠️ Berkas (${berkasTerkumpul}/${TOTAL_BERKAS})`}
              </div>
            </div>

          </div>
          
          <div className="relative z-10 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-3xl leading-relaxed text-sm">
              Silakan lengkapi profil dan unggah dokumen bukti. Jika ingin melakukan perbaikan atau penggantian berkas yang sudah terkirim, gunakan menu <strong className="text-slate-700 dark:text-slate-300">Manajemen Berkas</strong>.
            </p>
          </div>
        </div>

        {/* 3 KOTAK MENU BAWAH TETAP SAMA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/peserta/form" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-blue-100 dark:border-blue-900/30 mb-6 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">1. Profil</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Identitas Bank Sampah, titik koordinat GPS, dan data kepengurusan.</p>
            <div className="mt-6 flex items-center text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest gap-2">Isi Sekarang →</div>
          </Link>

          <Link href="/peserta/upload" className="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all active:scale-95 flex flex-col h-full relative overflow-hidden">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-emerald-100 dark:border-emerald-900/30 mb-6 group-hover:scale-110 transition-transform">📤</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">2. Setor Dokumen</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed flex-1">Unggah berkas baru yang belum pernah dikirim ke sistem.</p>
            <div className="mt-6 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest gap-2">Mulai Unggah →</div>
          </Link>

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