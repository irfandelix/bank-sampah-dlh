"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";
import * as XLSX from "xlsx";
import React from "react"; 

const PetaSragen = dynamic(() => import("@/components/PetaSragen"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-tighter text-xs">Memuat Peta...</div>
});

// 🔒 DEFINISI TYPE
interface StatsType {
  totalPeserta: number;
  sudahDinilai: number;
  tertinggi: string | { skor: string; nama: string };
}

// 📦 DAFTAR BERKAS 
const DAFTAR_BERKAS = [
  { kategori: "Kat. I: Pengelolaan Sampah", items: [ { id: "Kat. I No. 1", label: "Laporan hasil penimbangan" }, { id: "Kat. I No. 2", label: "SK, Laporan Nasabah, KK RT/RW" }, { id: "Kat. I No. 3", label: "Laporan kegiatan tiap penimbangan" }, { id: "Kat. I No. 4", label: "Nasabah, neraca, buku tamu" }, { id: "Kat. I No. 5", label: "Dokumentasi kegiatan/buku" }, { id: "Kat. I No. 6", label: "Pencatatan sampah organik" }, { id: "Kat. I No. 7", label: "Surat pengantar/Screenshot" } ] },
  { kategori: "Kat. II: Fasilitas & Infrastruktur", items: [ { id: "Kat. II No. 1", label: "Ruang Pelayanan" }, { id: "Kat. II No. 2", label: "Area Penyimpanan" }, { id: "Kat. II No. 3", label: "Peralatan" }, { id: "Kat. II No. 4", label: "Kebersihan & Keamanan" } ] },
  { kategori: "Kat. III: Tata Kelola & Adm", items: [ { id: "Kat. III No. 1", label: "SK Pendirian Bank Sampah" }, { id: "Kat. III No. 2", label: "Papan Nama, SK, Struktur" }, { id: "Kat. III No. 3", label: "Pembagian tugas tertulis" }, { id: "Kat. III No. 4", label: "SOP tertulis & diterapkan" }, { id: "Kat. III No. 5", label: "Laporan Penimbangan" }, { id: "Kat. III No. 6", label: "Dokumentasi Administrasi" } ] },
  { kategori: "Kat. IV: Inovasi Bank Sampah", items: [ { id: "Kat. IV No. 1", label: "SK dan Dokumentasi Inovasi" } ] },
  { kategori: "Kat. V: Dukungan Desa", items: [ { id: "Kat. V No. 1", label: "DPA Desa dan Dokumentasi" } ] }
];

export default function AdminDashboard() {
  const [klasemen, setKlasemen] = useState<any[]>([]);
  const [profilPeserta, setProfilPeserta] = useState<any[]>([]);
  const [dataMonitoring, setDataMonitoring] = useState<any[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(true);

  // ✅ STATE: Expand Baris
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [berkasLinks, setBerkasLinks] = useState<Record<string, string>>({});
  const [loadingLinks, setLoadingLinks] = useState(false);

  // 🟢 STATE BARU: DEADLINE
  const [deadline, setDeadline] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);

  const [stats, setStats] = useState<StatsType>({ totalPeserta: 0, sudahDinilai: 0, tertinggi: "-" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  
  const prevKlasemenRef = useRef<any[]>([]);
  const [changedIds, setChangedIds] = useState<string[]>([]);

  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setLoadingDrive(true);

      const res = await fetch("/api/admin/dashboard-stats");
      if (res.ok) {
        const data = await res.json();
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
      }

      const resProfil = await fetch("/api/admin/get-profil");
      if (resProfil.ok) setProfilPeserta((await resProfil.json()).data);

      const resDrive = await fetch("/api/admin/monitoring-berkas");
      if (resDrive.ok) setDataMonitoring(await resDrive.json());

      // 🟢 FETCH DEADLINE DARI MONGODB
      const resDeadline = await fetch("/api/pengaturan");
      if (resDeadline.ok) {
        const dataDeadline = await resDeadline.json();
        if (dataDeadline.deadline) setDeadline(dataDeadline.deadline);
      }

      if (isManual) setModal({ isOpen: true, type: "success", title: "Data Terupdate", message: "Data klasemen, peta, dan progres GDrive berhasil disinkronkan." });
    } catch (err) { 
      console.error("Gagal refresh data"); 
    } finally { 
      setLoading(false); setLoadingDrive(false);
    }
  };

  // 🟢 FUNGSI SIMPAN DEADLINE
  const handleSimpanDeadline = async () => {
    setSavingDeadline(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "POST",
        body: JSON.stringify({ deadline })
      });
      if (!res.ok) throw new Error("Gagal menyimpan waktu");
      setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Batas waktu pendaftaran dan unggah berkas telah diperbarui!" });
    } catch (err: any) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: err.message });
    } finally {
      setSavingDeadline(false);
    }
  };

  // 📥 FUNGSI EXPORT EXCEL
  const exportToExcel = () => {
    if (klasemen.length === 0) {
      setModal({ isOpen: true, type: "error", title: "Data Kosong", message: "Belum ada data klasemen untuk diexport." });
      return;
    }

    const dataExcel = klasemen.map((item, index) => ({
      "Peringkat": index + 1,
      "Nama Bank Sampah": item.namaInstansi,
      "Kecamatan": item.kecamatan,
      "ID Login": item.username,
      "Nilai DLH (40%)": Number(item.skorDLH || 0),
      "Nilai DKK (20%)": Number(item.skorDKK || 0),
      "Nilai BSI (25%)": Number(item.skorBSI || 0),
      "Nilai PMD (15%)": Number(item.skorPMD || 0),
      "Total Skor": Number(item.skor || 0).toFixed(2),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    worksheet["!cols"] = [
      { wch: 10 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Evaluasi");
    XLSX.writeFile(workbook, "Laporan_Klasemen_Bank_Sampah_Sragen_2026.xlsx");
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleExpandRow = async (namaInstansi: string) => {
    if (expandedRow === namaInstansi) {
      setExpandedRow(null); 
      return;
    }
    setExpandedRow(namaInstansi);
    setLoadingLinks(true);
    try {
      const res = await fetch("/api/peserta/cek-berkas", {
        method: "POST",
        body: JSON.stringify({ namaPeserta: namaInstansi }),
      });
      const data = await res.json();
      setBerkasLinks(data.berkasTerisi || {});
    } catch (err) {
      console.error("Gagal load detail berkas", err);
    } finally {
      setLoadingLinks(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16 pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border">
        <div className="flex flex-col justify-center">
          <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight leading-none">
            Command Center <span className="text-emerald-600">DLH</span>
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5 leading-none">
            Monitoring Bank Sampah 2026
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <TombolLogout />
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 ml-1">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 leading-none">Admin Utama</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1 tracking-wider leading-none">Sragen Regency</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center font-black border border-emerald-200 text-sm shrink-0">
              DLH
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        
        {/* --- STATS CARDS LIGHT --- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            const isObj = typeof stats.tertinggi === 'object' && stats.tertinggi !== null;
            const valTertinggi = isObj ? (stats.tertinggi as any).skor : stats.tertinggi;
            const namaTertinggi = isObj ? (stats.tertinggi as any).nama : "";

            const cards = [
              { label: "Total Peserta", val: stats.totalPeserta, sub: "Entitas Terdaftar", color: "text-slate-800", bg: "bg-white" },
              { label: "Selesai Dinilai", val: stats.sudahDinilai, sub: "Verifikasi Juri", color: "text-emerald-600", bg: "bg-emerald-50/50" },
              { label: "Menunggu", val: stats.totalPeserta - stats.sudahDinilai, sub: "Antrean Penilaian", color: "text-amber-600", bg: "bg-amber-50/50" },
              { label: "Skor Tertinggi", val: valTertinggi, nama: namaTertinggi, color: "text-slate-900", bg: "bg-white" }
            ];

            return cards.map((item, i) => (
              <div key={i} className={`${item.bg} p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex flex-col justify-between h-full`}>
                <div>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
                  <p className={`text-4xl font-black mt-2 ${item.color} leading-tight`}>{item.val}</p>
                </div>
                {item.nama ? (
                  <p className="text-[10px] font-extrabold text-emerald-600 mt-3 uppercase tracking-tighter line-clamp-1 border-t border-slate-100 pt-3">
                    🏆 {item.nama}
                  </p>
                ) : (
                  <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-tight">{item.sub}</p>
                )}
              </div>
            ));
          })()}
        </div>

        {/* --- PETA & KLASEMEN LIGHT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="hidden lg:block lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden h-[550px] relative shadow-sm">
             <PetaSragen dataKlasemen={klasemen} dataPeserta={profilPeserta} />
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
                            index === 2 ? "bg-orange-400 text-white" : "bg-slate-100 text-slate-400"
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

        {/* --- PANEL KENDALI LIGHT + INPUT DEADLINE --- */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
            <div className="flex-none w-14 h-14 md:w-16 md:h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl md:text-3xl border border-slate-200 shadow-inner">🛠️</div>
            <div className="flex-1">
              <h3 className="font-black text-lg md:text-xl text-slate-800">Panel Kendali Utama</h3>
              <p className="text-xs md:text-sm text-slate-500 font-medium">Manajemen basis data dan konfigurasi sistem</p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto items-end lg:items-center">
            {/* 🟢 INPUT WAKTU DEADLINE */}
            <div className="flex flex-col gap-1 w-full lg:w-auto">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Batas Waktu Upload Peserta</label>
              <div className="flex items-center gap-2">
                <input 
                  type="datetime-local" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all w-full lg:w-auto"
                />
                <button 
                  onClick={handleSimpanDeadline} 
                  disabled={savingDeadline || !deadline}
                  className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-black p-3 rounded-2xl transition-all shadow-sm flex items-center justify-center shrink-0 disabled:opacity-50"
                  title="Simpan Waktu"
                >
                  {savingDeadline ? "⏳" : "💾"}
                </button>
              </div>
            </div>

            <div className="w-px h-10 bg-slate-200 hidden lg:block mx-2"></div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Link href="/admin/akun" className="flex-1 lg:flex-none bg-slate-900 hover:bg-black text-white font-black py-4 px-5 rounded-2xl transition-all active:scale-95 shadow-md uppercase text-[10px] md:text-xs tracking-widest text-center">
                Peserta
              </Link>
              <button onClick={exportToExcel} className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-5 rounded-2xl transition-all active:scale-95 shadow-md uppercase text-[10px] md:text-xs tracking-widest flex items-center justify-center gap-2">
                <span>📊</span> Excel
              </button>
              <button onClick={() => fetchDashboardData(true)} className="flex-1 lg:flex-none bg-white hover:bg-slate-50 text-slate-700 font-black py-4 px-5 rounded-2xl transition-all uppercase text-[10px] md:text-xs tracking-widest border border-slate-200 shadow-sm">
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ✅ PANEL MONITORING BERKAS (BISA DI-EXPAND DENGAN TOMBOL SIMPLE) ✅ */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm mt-6">
          <div className="p-8 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span>📁</span> Monitoring Berkas GDrive
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-widest">Klik baris peserta untuk melihat dokumen</p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black border tracking-widest uppercase shadow-sm flex items-center gap-2 ${loadingDrive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span className={loadingDrive ? "animate-pulse" : ""}>{loadingDrive ? "⏳" : "✅"}</span> 
              {loadingDrive ? "Menyinkronkan Drive..." : "Data Live Drive"}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-400 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
                <tr>
                  <th className="py-6 px-8">Entitas Bank Sampah</th>
                  <th className="py-6 px-4">Ketua / Direktur</th>
                  <th className="py-6 px-6 text-center">Progres Unggah</th>
                  <th className="py-6 px-8 text-right">Status GDrive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataMonitoring.length === 0 && !loadingDrive && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">Belum ada peserta yang mendaftar.</td>
                  </tr>
                )}
                
                {dataMonitoring.map((item, index) => {
                  const jumlah = item.progres;
                  const total = 19;
                  const isLengkap = jumlah === total;
                  const isKosong = jumlah === 0;
                  const isExpanded = expandedRow === item.namaInstansi;

                  return (
                    <React.Fragment key={index}>
                      <tr 
                        onClick={() => handleExpandRow(item.namaInstansi)}
                        className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="py-4 px-8 font-extrabold text-slate-800 group-hover:text-emerald-700 flex items-center gap-2">
                          <span className={`text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>▶</span> 
                          {item.namaInstansi}
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-500">{item.namaKetua}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-full max-w-[120px] bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${isLengkap ? 'bg-emerald-500' : jumlah > 0 ? 'bg-amber-400' : 'bg-slate-300'}`} 
                                style={{ width: `${(jumlah / total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-600 min-w-[40px] text-right">{jumlah}/{total}</span>
                          </div>
                        </td>
                        <td className="py-4 px-8 text-right">
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors ${
                            isLengkap ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                            isKosong ? "bg-red-50 text-red-600 border border-red-100" :
                            "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}>
                            {isLengkap ? "Lengkap" : isKosong ? "Belum Unggah" : `Kurang ${total - jumlah} Berkas`}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200 shadow-inner">
                          <td colSpan={4} className="p-6 md:p-8">
                            {loadingLinks ? (
                              <div className="flex justify-center items-center py-6 opacity-60 animate-pulse">
                                <span className="font-bold text-emerald-600 text-xs tracking-widest uppercase">Membuka Laci Google Drive... 🔍</span>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-3">
                                {DAFTAR_BERKAS.flatMap(kat => kat.items).map(syarat => {
                                  const link = berkasLinks[syarat.id];
                                  
                                  return link ? (
                                    <a 
                                      key={syarat.id} 
                                      href={link} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      title={syarat.label} 
                                      className="flex items-center gap-2 px-4 py-3 bg-white text-blue-600 border border-blue-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                                    >
                                      <span>👁️</span> {syarat.id}
                                    </a>
                                  ) : (
                                    <span 
                                      key={syarat.id} 
                                      title={`Belum Upload: ${syarat.label}`} 
                                      className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest cursor-not-allowed opacity-70"
                                    >
                                      <span>🔒</span> {syarat.id}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ TABEL RINCIAN KLASEMEN & JURI (LAMA) ✅ */}
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
                      <td className="py-4 px-6 text-center">
                         <span className={`text-lg font-black ${totalSkor > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                           {totalSkor > 0 ? totalSkor.toFixed(1) : "0.0"}
                         </span>
                      </td>
                      <td className="py-4 px-8 text-right">{statusUi}</td>
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