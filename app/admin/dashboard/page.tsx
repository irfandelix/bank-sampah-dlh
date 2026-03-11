"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";

const PetaSragen = dynamic(() => import("@/components/PetaSragen"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-tighter text-xs">Memuat Peta...</div>
});

export default function AdminDashboard() {
  const [klasemen, setKlasemen] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPeserta: 0, sudahDinilai: 0, tertinggi: "-" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  
  const prevKlasemenRef = useRef<any[]>([]);
  const [changedIds, setChangedIds] = useState<string[]>([]);

  const fetchDashboardData = async (isManual = false) => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();
      if (res.ok) {
        if (prevKlasemenRef.current.length > 0) {
          const newChangedIds: string[] = [];
          data.klasemen.forEach((item: any, index: number) => {
            const oldIndex = prevKlasemenRef.current.findIndex(p => p.username === item.username);
            if (oldIndex !== -1 && index < oldIndex) newChangedIds.push(item.username);
          });
          if (newChangedIds.length > 0) {
            setChangedIds(newChangedIds);
            setTimeout(() => setChangedIds([]), 5000);
          }
        }
        setKlasemen(data.klasemen);
        setStats(data.stats);
        prevKlasemenRef.current = data.klasemen;
        if (isManual) {
          setModal({ isOpen: true, type: "success", title: "Data Terupdate", message: "Data klasemen terbaru berhasil ditarik." });
        }
      }
    } catch (err) { console.error("Gagal refresh data"); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* --- HEADER LIGHT --- */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-[50] shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Command Center <span className="text-emerald-600">DLH</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Monitoring Bank Sampah 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <TombolLogout />
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-black text-slate-800 leading-none">Admin Utama</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1 tracking-wider">Sragen Regency</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black border border-emerald-200">DLH</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* --- STATS CARDS LIGHT --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Peserta", val: stats.totalPeserta, color: "text-slate-800", bg: "bg-white" },
            { label: "Selesai Dinilai", val: stats.sudahDinilai, color: "text-emerald-600", bg: "bg-emerald-50/50" },
            { label: "Menunggu", val: stats.totalPeserta - stats.sudahDinilai, color: "text-amber-600", bg: "bg-amber-50/50" },
            { label: "Skor Tertinggi", val: typeof stats.tertinggi === 'string' ? stats.tertinggi.replace(/(\d+\.\d{2})\d+/, '$1') : stats.tertinggi, color: "text-slate-600", bg: "bg-white", small: true }
          ].map((item, i) => (
            <div key={i} className={`${item.bg} p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md`}>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
              <p className={`${item.small ? 'text-lg' : 'text-4xl'} font-black mt-2 ${item.color} leading-tight`}>{item.val}</p>
            </div>
          ))}
        </div>

        {/* --- PETA & KLASEMEN LIGHT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="hidden lg:block lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden h-[550px] relative shadow-sm">
             <PetaSragen dataKlasemen={klasemen} />
             <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-4 py-2 rounded-full border border-slate-200 text-[10px] font-bold text-slate-600 tracking-widest uppercase shadow-sm">
                Peta Sebaran Real-Time
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 p-6 lg:col-span-1 h-[550px] flex flex-col overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-slate-800">Klasemen</h2>
               <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Live Update</span>
               </div>
            </div>
            
            <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar-light scroll-smooth">
              {loading ? (
                <div className="flex items-center justify-center h-full opacity-50">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                klasemen.map((kec, index) => {
                  const isTop3 = index < 3;
                  const isHighlight = changedIds.includes(kec.username);
                  return (
                    <div key={kec.username} className={`p-4 rounded-2xl border transition-all duration-700 ${
                        isHighlight ? "bg-emerald-50 border-emerald-400 scale-[1.02] shadow-sm" :
                        index === 0 ? "bg-amber-50 border-amber-200 shadow-sm" :
                        index === 1 ? "bg-slate-50 border-slate-200" :
                        index === 2 ? "bg-orange-50 border-orange-200" :
                        "bg-white border-slate-100 hover:border-slate-300"
                      }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                            index === 0 ? "bg-amber-400 text-white shadow-inner" : 
                            index === 1 ? "bg-slate-300 text-slate-700" : 
                            index === 2 ? "bg-orange-400 text-white" : 
                            "bg-slate-100 text-slate-400"
                          }`}>{index + 1}</div>
                          <div>
                            <h3 className="font-black text-sm text-slate-800">{kec.namaInstansi}</h3>
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Kec. {kec.kecamatan}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-black ${isHighlight ? 'text-emerald-600 animate-bounce' : 'text-slate-800'}`}>
                            {Number(kec.skor).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* --- PANEL KENDALI LIGHT --- */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl border border-slate-200 shadow-inner">🛠️</div>
            <div>
              <h3 className="font-black text-xl text-slate-800">Panel Kendali Utama</h3>
              <p className="text-sm text-slate-500 font-medium">Manajemen basis data dan konfigurasi sistem</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/akun" className="bg-slate-900 hover:bg-black text-white font-black py-4 px-10 rounded-2xl transition-all active:scale-95 shadow-md uppercase text-xs tracking-widest">
               Kelola Peserta
            </Link>
            <button onClick={() => fetchDashboardData(true)} className="bg-white hover:bg-slate-50 text-slate-700 font-black py-4 px-8 rounded-2xl transition-all uppercase text-xs tracking-widest border border-slate-200 shadow-sm">
               Refresh
            </button>
          </div>
        </div>

        {/* ✅ TABEL RINCIAN KLASEMEN & JURI (VERSI TERANG) ✅ */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm mt-6">
          <div className="p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-800">Daftar Akun Bank Sampah</h2>
              <p className="text-sm text-slate-500 font-medium mt-1 uppercase tracking-widest text-[10px]">Monitoring Progres Juri 2026</p>
            </div>
            <span className="bg-white text-slate-500 font-black px-5 py-2 rounded-full text-[10px] border border-slate-200 tracking-widest uppercase shadow-sm">
              {klasemen.length} Entitas
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                <tr>
                  <th className="py-6 px-8 text-center">No</th>
                  <th className="py-6 px-6">Identitas Bank Sampah</th>
                  <th className="py-6 px-4 text-center">DLH <span className="text-[8px] block opacity-70">(40)</span></th>
                  <th className="py-6 px-4 text-center">DKK <span className="text-[8px] block opacity-70">(20)</span></th>
                  <th className="py-6 px-4 text-center">BSI <span className="text-[8px] block opacity-70">(25)</span></th>
                  <th className="py-6 px-4 text-center">PMD <span className="text-[8px] block opacity-70">(15)</span></th>
                  <th className="py-6 px-6 text-center text-emerald-600">Total</th>
                  <th className="py-6 px-8 text-right">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {klasemen.map((peserta, idx) => {
                  const sDlh = Number(peserta.skorDLH || 0);
                  const sDkk = Number(peserta.skorDKK || 0);
                  const sBsi = Number(peserta.skorBSI || 0);
                  const sPmd = Number(peserta.skorPMD || 0);
                  const totalSkor = Number(peserta.skor || 0);

                  const juriSelesai = [sDlh, sDkk, sBsi, sPmd].filter(s => s > 0).length;
                  
                  let statusUi = <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-slate-50 text-slate-500 border-slate-200 font-black text-[9px] tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> PENDING</div>;
                  
                  if (juriSelesai === 4) {
                    statusUi = <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200 font-black text-[9px] tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm"></span> COMPLETE</div>;
                  } else if (juriSelesai > 0) {
                    statusUi = <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-amber-50 text-amber-600 border-amber-200 font-black text-[9px] tracking-widest"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> {juriSelesai}/4 JURI</div>;
                  }

                  return (
                    <tr key={peserta.username} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-8 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-4 px-6">
                         <p className="font-black text-slate-800 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{peserta.namaInstansi}</p>
                         <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">KEC. {peserta.kecamatan} • ID: <span className="text-slate-500">{peserta.username}</span></p>
                      </td>
                      
                      {/* KOLOM SKOR JURI (TERANG) */}
                      <td className="py-4 px-4 text-center">
                        {sDlh > 0 ? <span className="bg-slate-50 px-3 py-1 rounded text-emerald-700 font-black text-xs border border-slate-200">{sDlh}</span> : <span className="text-slate-300 font-bold">-</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {sDkk > 0 ? <span className="bg-slate-50 px-3 py-1 rounded text-emerald-700 font-black text-xs border border-slate-200">{sDkk}</span> : <span className="text-slate-300 font-bold">-</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {sBsi > 0 ? <span className="bg-slate-50 px-3 py-1 rounded text-emerald-700 font-black text-xs border border-slate-200">{sBsi}</span> : <span className="text-slate-300 font-bold">-</span>}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {sPmd > 0 ? <span className="bg-slate-50 px-3 py-1 rounded text-emerald-700 font-black text-xs border border-slate-200">{sPmd}</span> : <span className="text-slate-300 font-bold">-</span>}
                      </td>

                      {/* KOLOM TOTAL */}
                      <td className="py-4 px-6 text-center">
                         <span className={`text-lg font-black ${totalSkor > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                           {totalSkor > 0 ? totalSkor.toFixed(1) : "0.0"}
                         </span>
                      </td>

                      <td className="py-4 px-8 text-right">
                        {statusUi}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </main>
  );
}