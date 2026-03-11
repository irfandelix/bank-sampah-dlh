"use client";

import { useState, useEffect, useRef } from "react";
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
  
  // 🔍 REF & STATE UNTUK HIGHLIGHT
  const prevKlasemenRef = useRef<any[]>([]);
  const [changedIds, setChangedIds] = useState<string[]>([]);

  const fetchDashboardData = async (isManual = false) => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();
      if (res.ok) {
        // DETEKSI PERUBAHAN POSISI
        if (prevKlasemenRef.current.length > 0) {
          const newChangedIds: string[] = [];
          
          data.klasemen.forEach((item: any, index: number) => {
            const oldIndex = prevKlasemenRef.current.findIndex(p => p.username === item.username);
            // Jika posisi sekarang (index) lebih kecil (naik) dibanding posisi lama (oldIndex)
            if (oldIndex !== -1 && index < oldIndex) {
              newChangedIds.push(item.username);
            }
          });

          if (newChangedIds.length > 0) {
            setChangedIds(newChangedIds);
            // Hilangkan highlight setelah 5 detik
            setTimeout(() => setChangedIds([]), 5000);
          }
        }

        setKlasemen(data.klasemen);
        setStats(data.stats);
        prevKlasemenRef.current = data.klasemen; // Simpan untuk perbandingan berikutnya

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

      {/* --- HEADER --- */}
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-[50]">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Command Center <span className="text-emerald-400">DLH</span></h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Monitoring Bank Sampah 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <TombolLogout />
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold border border-emerald-500/20 shadow-lg shadow-emerald-500/5">DLH</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Peserta", val: stats.totalPeserta, color: "text-white" },
            { label: "Selesai Dinilai", val: stats.sudahDinilai, color: "text-emerald-400" },
            { label: "Menunggu", val: stats.totalPeserta - stats.sudahDinilai, color: "text-amber-400" },
            { label: "Skor Tertinggi", val: typeof stats.tertinggi === 'string' ? stats.tertinggi.replace(/(\d+\.\d{2})\d+/, '$1') : stats.tertinggi, color: "text-slate-300", small: true }
          ].map((item, i) => (
            <div key={i} className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800 shadow-xl">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
              <p className={`${item.small ? 'text-lg' : 'text-4xl'} font-black mt-2 ${item.color} leading-tight`}>{item.val}</p>
            </div>
          ))}
        </div>

        {/* --- PETA & KLASEMEN --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="hidden lg:block lg:col-span-2 bg-[#1e293b] rounded-[2.5rem] border border-slate-800 overflow-hidden h-[550px] relative shadow-2xl">
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
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Live Update</span>
               </div>
            </div>
            
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar-dark scroll-smooth">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                  <div className="w-10 h-10 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                </div>
              ) : (
                klasemen.map((kec, index) => {
                  const isTop3 = index < 3;
                  const isHighlight = changedIds.includes(kec.username); // 🟢 CEK APAKAH LAGI NAIK RANK

                  return (
                    <div 
                      key={kec.username} 
                      className={`p-4 rounded-2xl border transition-all duration-700 group ${
                        isHighlight ? "animate-rank-up border-emerald-500 shadow-lg shadow-emerald-500/20 scale-[1.02]" :
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
                            <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">Kec. {kec.kecamatan}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black leading-none ${isHighlight ? 'text-white animate-pulse' : 'text-emerald-400'}`}>
                            {Number(kec.skor).toFixed(2)}
                          </p>
                          {isHighlight && <p className="text-[8px] font-black text-emerald-400 uppercase mt-1 tracking-tighter">New Rank! ⚡</p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* --- PANEL KENDALI --- */}
        <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-8 rounded-[2.5rem] border border-slate-800 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-6 text-white">
            <div className="w-16 h-16 bg-[#0f172a] rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-800">🛠️</div>
            <div>
              <h3 className="font-black text-xl">Panel Kendali Utama</h3>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Status: Sistem Berjalan Normal</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/akun" className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 uppercase text-xs tracking-widest">
               Kelola Peserta
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-dark::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        
        @keyframes rank-up {
          0% { background-color: rgba(16, 185, 129, 0); }
          50% { background-color: rgba(16, 185, 129, 0.2); }
          100% { background-color: rgba(16, 185, 129, 0); }
        }
        .animate-rank-up {
          animation: rank-up 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}