"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";

const PetaSragen = dynamic(() => import("@/components/PetaSragen"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-500 font-bold uppercase tracking-tighter text-xs">Memuat Peta...</div>
});

export default function AdminDashboard() {
  const [klasemen, setKlasemen] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPeserta: 0, sudahDinilai: 0, tertinggi: "-" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  const fetchDashboardData = async (isManual = false) => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();
      if (res.ok) {
        setKlasemen(data.klasemen);
        setStats(data.stats);
        if (isManual) {
          setModal({ isOpen: true, type: "success", title: "Data Terupdate", message: "Data klasemen terbaru berhasil ditarik." });
        }
      }
    } catch (err) {
      console.error("Gagal refresh data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 font-sans pb-16 relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* --- HEADER DARK --- */}
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-[50]">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Command Center <span className="text-emerald-400">DLH</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Monitoring Bank Sampah 2026</p>
        </div>
        
        <div className="flex items-center gap-4">
          <TombolLogout />
          <div className="h-8 w-px bg-slate-800 mx-1 hidden md:block"></div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-black text-white leading-none">Admin Utama</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase mt-1 tracking-wider">Sragen Regency</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              DLH
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* --- STATS CARDS DARK --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Peserta", val: stats.totalPeserta, color: "text-white" },
            { label: "Selesai Dinilai", val: stats.sudahDinilai, color: "text-emerald-400" },
            { label: "Menunggu", val: stats.totalPeserta - stats.sudahDinilai, color: "text-amber-400" },
            { label: "Skor Tertinggi", val: stats.tertinggi, color: "text-slate-300", small: true }
          ].map((item, i) => (
            <div key={i} className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
              <p className={`${item.small ? 'text-lg' : 'text-4xl'} font-black mt-2 ${item.color} leading-tight`}>{item.val}</p>
            </div>
          ))}
        </div>

        {/* --- PETA & KLASEMEN DARK --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="hidden lg:block lg:col-span-2 bg-[#1e293b] rounded-[2.5rem] border border-slate-800 overflow-hidden h-[550px] relative shadow-2xl shadow-black/50">
             <PetaSragen dataKlasemen={klasemen} />
             <div className="absolute top-4 left-4 z-10 bg-[#0f172a]/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700 text-[10px] font-bold text-slate-300 tracking-widest uppercase">
                Peta Sebaran Real-Time
             </div>
          </div>

          <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 p-6 lg:col-span-1 h-[550px] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-white">Klasemen</h2>
               <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Live</span>
               </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar-dark">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                </div>
              ) : (
                klasemen.map((kec, index) => {
                  const isTop3 = index < 3;
                  return (
                    <div 
                      key={index} 
                      className={`p-4 rounded-2xl border transition-all group ${
                        index === 0 ? "bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5" :
                        index === 1 ? "bg-slate-500/5 border-slate-500/20" :
                        index === 2 ? "bg-orange-500/5 border-orange-500/20" :
                        "bg-[#0f172a]/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            index === 0 ? "bg-amber-500 text-black" :
                            index === 1 ? "bg-slate-400 text-black" :
                            index === 2 ? "bg-orange-500 text-black" :
                            "bg-slate-800 text-slate-500"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className={`font-black text-sm ${isTop3 ? 'text-white' : 'text-slate-300'}`}>{kec.namaInstansi}</h3>
                            <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5 tracking-tighter">USER: {kec.username}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black leading-none ${
                            index === 0 ? "text-amber-400" :
                            index === 1 ? "text-slate-300" :
                            index === 2 ? "text-orange-400" :
                            "text-emerald-400"
                          }`}>{kec.skor}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* --- PANEL KENDALI DARK --- */}
        <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-8 rounded-[2.5rem] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-800">🛠️</div>
            <div>
              <h3 className="font-black text-xl text-white">Panel Kendali Utama</h3>
              <p className="text-sm text-slate-500 font-medium">Manajemen basis data dan konfigurasi sistem</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Link href="/admin/akun" className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 uppercase text-xs tracking-widest">
               Kelola Peserta
            </Link>
            <button onClick={() => fetchDashboardData(true)} className="flex-1 md:flex-none flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 px-8 rounded-2xl transition-all uppercase text-xs tracking-widest border border-slate-700">
               Refresh
            </button>
          </div>
        </div>

        {/* --- TABEL DARK --- */}
        <div className="bg-[#1e293b] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-white">Daftar Akun Bank Sampah</h2>
              <p className="text-sm text-slate-500 font-medium mt-1 tracking-tight text-xs uppercase tracking-widest">Database Terintegrasi 2026</p>
            </div>
            <span className="bg-[#0f172a] text-slate-400 font-black px-5 py-2 rounded-full text-[10px] border border-slate-800 tracking-widest uppercase">
              {klasemen.length} Entitas
            </span>
          </div>
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0f172a]/50 text-slate-500 font-black uppercase text-[10px] tracking-widest border-b border-slate-800">
                <tr>
                  <th className="py-6 px-10 italic">No</th>
                  <th className="py-6 px-6">Identitas Bank Sampah</th>
                  <th className="py-6 px-6">Login ID</th>
                  <th className="py-6 px-10 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {klasemen.map((peserta, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="py-6 px-10 font-bold text-slate-700 group-hover:text-slate-500">{idx + 1}</td>
                    <td className="py-6 px-6">
                       <p className="font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{peserta.namaInstansi}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Sektor Sragen</p>
                    </td>
                    <td className="py-6 px-6">
                      <code className="bg-[#0f172a] text-emerald-500 px-4 py-2 rounded-xl text-xs font-bold border border-slate-800">
                        {peserta.username}
                      </code>
                    </td>
                    <td className="py-6 px-10 text-right">
                      {peserta.skor > 0 ? (
                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 font-black text-[10px] tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> VERIFIED
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-slate-800/50 text-slate-500 px-4 py-2 rounded-xl border border-slate-800 font-black text-[10px] tracking-widest">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse"></span> PENDING
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </main>
  );
}