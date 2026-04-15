"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import ModalNotif from "@/components/ModalNotif";
import * as XLSX from "xlsx";
import React from "react"; 

const PetaSragen = dynamic(() => import("@/components/PetaSragen"), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-slate-400 font-bold uppercase tracking-tighter text-xs">Memuat Peta...</div>
});

interface StatsType {
  totalPeserta: number;
  sudahDinilai: number;
  tertinggi: string | { skor: string; nama: string };
}

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

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [berkasLinks, setBerkasLinks] = useState<Record<string, string>>({});
  const [loadingLinks, setLoadingLinks] = useState(false);

  const [deadline, setDeadline] = useState("");
  const [savingDeadline, setSavingDeadline] = useState(false);

  const [stats, setStats] = useState<StatsType>({ totalPeserta: 0, sudahDinilai: 0, tertinggi: "-" });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  
  const prevKlasemenRef = useRef<any[]>([]);
  const [changedIds, setChangedIds] = useState<string[]>([]);

  // ================= 🌟 TAB KLASEMEN 🌟 =================
  const [tabKlasemen, setTabKlasemen] = useState<"adm" | "verlap">("adm");

  const klasemenSorted = [...klasemen].sort((a, b) => {
    if (tabKlasemen === "adm") {
      return (Number(b.skor) || 0) - (Number(a.skor) || 0);
    } else {
      return (Number(b.nilai_verlap) || 0) - (Number(a.nilai_verlap) || 0);
    }
  });
  // ========================================================

  // ================= 🌟 MODAL VERLAP (FULL INDIKATOR) 🌟 =================
  const [modalVerlap, setModalVerlap] = useState({
    isOpen: false,
    username: "",
    namaInstansi: "",
    isSaving: false
  });
  
  const [skorVerlap, setSkorVerlap] = useState<Record<string, number>>({});
  const [tingkatVerlap, setTingkatVerlap] = useState<"RT" | "RW">("RW");

  const bukaModalVerlap = (peserta: any) => {
    setSkorVerlap(peserta.detail_verlap || {}); 
    setTingkatVerlap(peserta.tingkat_verlap || "RW");
    setModalVerlap({
      isOpen: true,
      username: peserta.username,
      namaInstansi: peserta.namaInstansi,
      isSaving: false
    });
  };

  const handleInputVerlap = (id: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setSkorVerlap(prev => ({ ...prev, [id]: numValue }));
  };

  const hitungSkorAkhirVerlap = () => {
    // DLH (Kategori 1)
    const cat1 = (skorVerlap["1.1"] || 0) + (skorVerlap["1.2"] || 0) + (skorVerlap["1.3"] || 0) + (skorVerlap["1.4"] || 0) + (skorVerlap["1.5"] || 0) + (skorVerlap["1.6"] || 0) + (skorVerlap["1.7"] || 0);
    const cat1Max = tingkatVerlap === "RT" ? 110 : 150;
    const skorDLH = (cat1 / cat1Max) * 40;

    // DKK (Kategori 2)
    const cat2 = (skorVerlap["2.1"] || 0) + (skorVerlap["2.2"] || 0) + (skorVerlap["2.3"] || 0) + (skorVerlap["2.4"] || 0);
    const skorDKK = (cat2 / 40) * 20;

    // BSI (Kategori 3)
    const cat3 = (skorVerlap["3.1"] || 0) + (skorVerlap["3.2"] || 0) + (skorVerlap["3.3"] || 0) + (skorVerlap["3.4"] || 0) + (skorVerlap["3.5"] || 0) + (skorVerlap["3.6"] || 0);
    const skorBSI = (cat3 / 80) * 25;

    // PMD (Kategori 4 & 5)
    const skorPMD = (((skorVerlap["4.1"] || 0) / 20) * 7.5) + (((skorVerlap["5.1"] || 0) / 20) * 7.5);

    const total = skorDLH + skorDKK + skorBSI + skorPMD;
    return Math.round(total * 10) / 10 || 0;
  };

  const handleSimpanVerlap = async () => {
    const nilaiAkhir = hitungSkorAkhirVerlap();
    if (nilaiAkhir === 0) return setModal({ isOpen: true, type: "error", title: "Form Kosong", message: "Isi minimal satu indikator penilaian." });

    setModalVerlap({ ...modalVerlap, isSaving: true });
    
    try {
      const res = await fetch("/api/admin/simpan-verlap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: modalVerlap.username,
          nilai_verlap: nilaiAkhir,
          detail_verlap: skorVerlap,
          tingkat_verlap: tingkatVerlap
        })
      });

      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Berhasil!", message: `Data Verlap (${nilaiAkhir}) berhasil disimpan.` });
        setModalVerlap({ ...modalVerlap, isOpen: false });
        fetchDashboardData(false);
      } else {
        throw new Error("Gagal menyimpan ke database");
      }
    } catch (err: any) {
      setModal({ isOpen: true, type: "error", title: "Gagal Simpan", message: err.message || "Terjadi kesalahan." });
      setModalVerlap({ ...modalVerlap, isSaving: false });
    }
  };
  // ===============================================================================

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
      const resDeadline = await fetch("/api/pengaturan");
      if (resDeadline.ok) {
        const dataDeadline = await resDeadline.json();
        if (dataDeadline.deadline) setDeadline(dataDeadline.deadline);
      }
      if (isManual) setModal({ isOpen: true, type: "success", title: "Data Terupdate", message: "Seluruh data sistem berhasil disinkronkan." });
    } catch (err) { 
      console.error("Gagal refresh data"); 
    } finally { 
      setLoading(false); setLoadingDrive(false);
    }
  };

  const handleSimpanDeadline = async () => {
    setSavingDeadline(true);
    try {
      const res = await fetch("/api/pengaturan", { method: "POST", body: JSON.stringify({ deadline }) });
      if (!res.ok) throw new Error("Gagal menyimpan waktu");
      setModal({ isOpen: true, type: "success", title: "Berhasil", message: "Batas waktu unggah berkas telah diperbarui!" });
    } catch (err: any) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: err.message });
    } finally { setSavingDeadline(false); }
  };

  const exportToExcel = () => {
    if (klasemen.length === 0) return setModal({ isOpen: true, type: "error", title: "Data Kosong", message: "Belum ada data klasemen untuk diexport." });
    const dataExcel = klasemen.map((item, index) => ({
      "Peringkat": index + 1, "Nama Bank Sampah": item.namaInstansi, "Kecamatan": item.kecamatan, "ID Login": item.username,
      "Nilai DLH (40%)": Number(item.skorDLH || 0), "Nilai DKK (20%)": Number(item.skorDKK || 0), "Nilai BSI (25%)": Number(item.skorBSI || 0), "Nilai PMD (15%)": Number(item.skorPMD || 0), "Total Skor Adm": Number(item.skor || 0).toFixed(2), "Total Verlap": Number(item.nilai_verlap || 0).toFixed(2),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    worksheet["!cols"] = [{ wch: 10 }, { wch: 35 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hasil Evaluasi");
    XLSX.writeFile(workbook, "Laporan_Klasemen_Bank_Sampah_Sragen_2026.xlsx");
  };

  const handleExpandRow = async (namaInstansi: string) => {
    if (expandedRow === namaInstansi) return setExpandedRow(null); 
    setExpandedRow(namaInstansi); setLoadingLinks(true);
    try {
      const res = await fetch("/api/peserta/cek-berkas", { method: "POST", body: JSON.stringify({ namaPeserta: namaInstansi }) });
      const data = await res.json();
      setBerkasLinks(data.berkasTerisi || {});
    } catch (err) { console.error("Gagal load detail berkas", err); } 
    finally { setLoadingLinks(false); }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 30000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="w-full font-sans pb-16 pt-[90px] md:pt-[100px] relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4 sm:space-y-6">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {(() => {
            const isObj = typeof stats.tertinggi === 'object' && stats.tertinggi !== null;
            const valTertinggi = isObj ? (stats.tertinggi as any).skor : stats.tertinggi;
            const namaTertinggi = isObj ? (stats.tertinggi as any).nama : "";

            const cards = [
              { label: "Total Peserta", val: stats.totalPeserta, sub: "Entitas Terdaftar", color: "text-slate-800 dark:text-white", bg: "bg-white dark:bg-slate-900" },
              { label: "Selesai Dinilai", val: stats.sudahDinilai, sub: "Verifikasi Juri", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-900/10" },
              { label: "Menunggu", val: stats.totalPeserta - stats.sudahDinilai, sub: "Antrean Penilaian", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-900/10" },
              { label: "Skor Tertinggi", val: valTertinggi, nama: namaTertinggi, color: "text-slate-900 dark:text-white", bg: "bg-white dark:bg-slate-900" }
            ];

            return cards.map((item, i) => (
              <div key={i} className={`${item.bg} p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-full`}>
                <div>
                  <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest">{item.label}</p>
                  <p className={`text-3xl md:text-4xl font-black mt-2 ${item.color} leading-tight`}>{item.val}</p>
                </div>
                {item.nama ? (
                  <p className="text-[8px] md:text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 md:mt-3 uppercase tracking-tighter line-clamp-1 border-t border-slate-100 dark:border-slate-800 pt-2 md:pt-3">🏆 {item.nama}</p>
                ) : (
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-2 md:mt-3 uppercase tracking-tight line-clamp-1">{item.sub}</p>
                )}
              </div>
            ));
          })()}
        </div>

          {/* PETA & KLASEMEN 2 TAB */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden h-[350px] md:h-[550px] relative shadow-sm">
              {/* Trik: Ganti isi 'skor' otomatis ngikutin Tab yang lagi diklik */}
              <PetaSragen 
                dataKlasemen={klasemen.map(item => ({
                  ...item,
                  skor: tabKlasemen === "adm" ? item.skor : (item.nilai_verlap || 0)
                }))} 
                dataPeserta={profilPeserta} 
              />
              
              {/* Indikator Mode Peta */}
              <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-slate-200 dark:border-slate-700 text-[9px] md:text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-widest uppercase shadow-sm flex items-center gap-2">
                  <span>🗺️ Peta Sebaran</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] md:text-[9px] text-white shadow-inner ${tabKlasemen === 'adm' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                    {tabKlasemen === 'adm' ? 'MODE: ADM' : 'MODE: VERLAP'}
                  </span>
              </div>
            </div>

            {/* TAB SWITCHER KLASEMEN */}
            <div className="flex gap-1.5 mb-4 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl shrink-0">
               <button
                 onClick={() => setTabKlasemen("adm")}
                 className={`flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-extrabold rounded-lg transition-all uppercase tracking-widest ${tabKlasemen === "adm" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
               >
                 Administrasi
               </button>
               <button
                 onClick={() => setTabKlasemen("verlap")}
                 className={`flex-1 py-1.5 md:py-2 text-[10px] md:text-xs font-extrabold rounded-lg transition-all uppercase tracking-widest ${tabKlasemen === "verlap" ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
               >
                 Verifikasi Lpg.
               </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 flex-1 custom-scrollbar-light scroll-smooth">
              {loading ? (
                <div className="flex items-center justify-center h-full opacity-50"><div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div></div>
              ) : klasemenSorted.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 font-bold text-xs">Belum ada data</div>
              ) : (
                klasemenSorted.map((kec, index) => {
                  const isHighlight = changedIds.includes(kec.username);
                  const nilaiTampil = tabKlasemen === "adm" ? Number(kec.skor || 0).toFixed(2) : Number(kec.nilai_verlap || 0).toFixed(2);
                  
                  return (
                    <div key={kec.username} className={`p-3 md:p-4 rounded-2xl border transition-all duration-700 ${
                        isHighlight ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 scale-[1.02] shadow-sm" :
                        index === 0 ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 shadow-sm" :
                        index === 1 ? "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800" :
                        index === 2 ? "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800" :
                        "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                      }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center font-black text-xs ${index === 0 ? "bg-amber-400 text-white" : index === 1 ? "bg-slate-300 text-slate-700" : index === 2 ? "bg-orange-400 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>{index + 1}</div>
                          <div>
                            <h3 className="font-black text-xs md:text-sm text-slate-800 dark:text-white line-clamp-1">{kec.namaInstansi}</h3>
                            <p className="text-[8px] md:text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Kec. {kec.kecamatan}</p>
                          </div>
                        </div>
                        <div className="text-right pl-2">
                          <p className={`text-lg md:text-xl font-black ${isHighlight ? 'text-emerald-600 dark:text-emerald-400 animate-bounce' : 'text-slate-800 dark:text-white'}`}>{nilaiTampil}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* PANEL KENDALI + DEADLINE */}
        <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 md:gap-6 shadow-sm overflow-hidden">
          <div className="flex items-center gap-4 w-full xl:w-auto">
            <div className="flex-none w-12 h-12 md:w-16 md:h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl md:text-3xl border border-slate-200 dark:border-slate-700 shadow-inner">🛠️</div>
            <div className="flex-1">
              <h3 className="font-black text-base md:text-xl text-slate-800 dark:text-white leading-tight">Panel Kendali Utama</h3>
              <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Manajemen basis data dan batas waktu</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-stretch md:items-end xl:items-center">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-1">Batas Waktu Upload Peserta</label>
              <div className="flex items-center gap-2">
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
                <button onClick={handleSimpanDeadline} disabled={savingDeadline || !deadline} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 font-black p-2.5 md:p-3 rounded-xl md:rounded-2xl shadow-sm disabled:opacity-50 shrink-0" title="Simpan Waktu">{savingDeadline ? "⏳" : "💾"}</button>
              </div>
            </div>
            <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 hidden xl:block mx-2"></div>
            <div className="grid grid-cols-3 gap-2 md:gap-3 w-full xl:w-auto">
              <Link href="/admin/akun" className="bg-slate-900 dark:bg-slate-100 hover:bg-black dark:hover:bg-white text-white dark:text-slate-900 font-black py-3 md:py-4 px-2 md:px-5 rounded-xl md:rounded-2xl active:scale-95 shadow-md uppercase text-[9px] md:text-[10px] tracking-widest flex items-center justify-center text-center">Peserta</Link>
              <button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 md:py-4 px-2 md:px-5 rounded-xl md:rounded-2xl active:scale-95 shadow-md uppercase text-[9px] md:text-[10px] tracking-widest flex items-center justify-center gap-1.5 md:gap-2"><span>📊</span> Excel</button>
              <button onClick={() => fetchDashboardData(true)} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black py-3 md:py-4 px-2 md:px-5 rounded-xl md:rounded-2xl uppercase text-[9px] md:text-[10px] tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">Refresh</button>
            </div>
          </div>
        </div>

        {/* MONITORING GDRIVE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-6">
          <div className="p-5 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><span>📁</span> Monitoring Berkas GDrive</h2>
              <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest">Klik baris peserta untuk melihat dokumen</p>
            </div>
            <div className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black border tracking-widest uppercase shadow-sm flex items-center gap-2 ${loadingDrive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span className={loadingDrive ? "animate-pulse" : ""}>{loadingDrive ? "⏳" : "✅"}</span> {loadingDrive ? "Menyinkronkan..." : "Data Live Drive"}
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar-light">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-[700px]">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                <tr><th className="py-4 md:py-6 px-4 md:px-8">Entitas Bank Sampah</th><th className="py-4 md:py-6 px-4">Ketua / Direktur</th><th className="py-4 md:py-6 px-4 md:px-6 text-center">Progres Unggah</th><th className="py-4 md:py-6 px-4 md:px-8 text-right">Status GDrive</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {dataMonitoring.length === 0 && !loadingDrive && (<tr><td colSpan={4} className="py-8 text-center text-slate-400 font-bold">Belum ada peserta yang mendaftar.</td></tr>)}
                {dataMonitoring.map((item, index) => {
                  const jumlah = item.progres;
                  const total = 19;
                  const isExpanded = expandedRow === item.namaInstansi;
                  return (
                    <React.Fragment key={index}>
                      <tr onClick={() => handleExpandRow(item.namaInstansi)} className={`transition-colors cursor-pointer group ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/30' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}>
                        <td className="py-3 md:py-4 px-4 md:px-8 font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 flex items-center gap-2 whitespace-normal min-w-[200px]">
                          <span className={`text-[10px] transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>▶</span> {item.namaInstansi}
                        </td>
                        <td className="py-3 md:py-4 px-4 font-bold text-slate-500 dark:text-slate-400">{item.namaKetua}</td>
                        <td className="py-3 md:py-4 px-4 md:px-6">
                          <div className="flex items-center justify-center gap-2 md:gap-3">
                            <div className="w-full max-w-[80px] md:max-w-[120px] bg-slate-200 dark:bg-slate-800 rounded-full h-2 md:h-2.5 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${jumlah === total ? 'bg-emerald-500' : jumlah > 0 ? 'bg-amber-400' : 'bg-slate-300 dark:bg-slate-700'}`} style={{ width: `${(jumlah / total) * 100}%` }}></div></div>
                            <span className="text-[9px] md:text-[10px] font-black text-slate-600 dark:text-slate-400 min-w-[30px] md:min-w-[40px] text-right">{jumlah}/{total}</span>
                          </div>
                        </td>
                        <td className="py-3 md:py-4 px-4 md:px-8 text-right">
                          <span className={`inline-block px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${jumlah === total ? "bg-emerald-100 text-emerald-700 border-emerald-200" : jumlah === 0 ? "bg-red-50 text-red-600 border-red-100" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                            {jumlah === total ? "Lengkap" : jumlah === 0 ? "Belum Unggah" : `Kurang ${total - jumlah} Berkas`}
                          </span>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 shadow-inner">
                          <td colSpan={4} className="p-4 md:p-8">
                            {loadingLinks ? (
                              <div className="flex justify-center items-center py-4 md:py-6 opacity-60 animate-pulse"><span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] md:text-xs tracking-widest uppercase">Membuka Laci Google Drive... 🔍</span></div>
                            ) : (
                              <div className="flex flex-wrap gap-2 md:gap-3">
                                {DAFTAR_BERKAS.flatMap(kat => kat.items).map(syarat => {
                                  const link = berkasLinks[syarat.id];
                                  return link ? (
                                    <a key={syarat.id} href={link} target="_blank" rel="noreferrer" title={syarat.label} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white shadow-sm"><span>👁️</span> {syarat.id}</a>
                                  ) : (
                                    <span key={syarat.id} title={`Belum Upload: ${syarat.label}`} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-3 bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 rounded-lg md:rounded-xl font-bold text-[9px] md:text-[10px] uppercase tracking-widest cursor-not-allowed"><span>🔒</span> {syarat.id}</span>
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

        {/* TABEL AKUN PESERTA (2 BARIS + TOMBOL VERLAP) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mt-6">
          <div className="p-5 md:p-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-800 dark:text-white">Daftar Akun Bank Sampah</h2>
              <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 uppercase tracking-widest">Monitoring Progres Juri 2026</p>
            </div>
            <span className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black px-4 md:px-5 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] border border-slate-200 dark:border-slate-700 shadow-sm uppercase tracking-widest">
              {klasemen.length} Entitas
            </span>
          </div>
          <div className="overflow-x-auto custom-scrollbar-light">
            <table className="w-full text-left text-xs md:text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-white dark:bg-slate-900 text-slate-400 font-black uppercase text-[9px] md:text-[10px] tracking-widest border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-4 md:py-6 px-4 md:px-8 text-center">No</th>
                  <th className="py-4 md:py-6 px-4 md:px-6">Identitas Bank Sampah</th>
                  <th className="py-4 md:py-6 px-2 md:px-4 text-center">DLH</th>
                  <th className="py-4 md:py-6 px-2 md:px-4 text-center">DKK</th>
                  <th className="py-4 md:py-6 px-2 md:px-4 text-center">BSI</th>
                  <th className="py-4 md:py-6 px-2 md:px-4 text-center">PMD</th>
                  <th className="py-4 md:py-6 px-4 md:px-6 text-center text-emerald-600">Total Adm</th>
                  <th className="py-4 md:py-6 px-4 md:px-8 text-right">Status Evaluasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {klasemen.map((peserta, idx) => {
                  const juriSelesai = [peserta.skorDLH, peserta.skorDKK, peserta.skorBSI, peserta.skorPMD].filter(s => Number(s) > 0).length;
                  
                  return (
                    <React.Fragment key={peserta.username}>
                      {/* === BARIS 1: NILAI ADMINISTRASI === */}
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td rowSpan={2} className="py-3 md:py-4 px-4 md:px-8 text-center font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800 align-top pt-6">{idx + 1}</td>
                        <td rowSpan={2} className="py-3 md:py-4 px-4 md:px-6 whitespace-normal min-w-[200px] border-b border-slate-200 dark:border-slate-800 align-top pt-6">
                           <p className="font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{peserta.namaInstansi}</p>
                           <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase mt-1">KEC. {peserta.kecamatan} • ID: {peserta.username}</p>
                        </td>
                        {[peserta.skorDLH, peserta.skorDKK, peserta.skorBSI, peserta.skorPMD].map((s, i) => (
                          <td key={i} className="py-3 md:py-4 px-2 md:px-4 text-center pt-5">{Number(s) > 0 ? <span className="bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded text-emerald-700 dark:text-emerald-400 font-black text-[10px] md:text-xs border border-slate-200 dark:border-slate-700">{s}</span> : <span className="text-slate-300 dark:text-slate-700 font-bold">-</span>}</td>
                        ))}
                        <td className="py-3 md:py-4 px-4 md:px-6 text-center pt-5"><span className={`text-base md:text-lg font-black ${Number(peserta.skor) > 0 ? 'text-amber-500' : 'text-slate-400'}`}>{Number(peserta.skor) > 0 ? Number(peserta.skor).toFixed(1) : "0.0"}</span></td>
                        <td rowSpan={2} className="py-3 md:py-4 px-4 md:px-8 text-right border-b border-slate-200 dark:border-slate-800 align-middle">
                          {juriSelesai === 4 ? <div className="inline-flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-black text-[8px] md:text-[9px] tracking-widest">COMPLETE</div> : juriSelesai > 0 ? <div className="inline-flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-black text-[8px] md:text-[9px] tracking-widest">{juriSelesai}/4 JURI</div> : <div className="inline-flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 font-black text-[8px] md:text-[9px] tracking-widest">PENDING</div>}
                        </td>
                      </tr>

                      {/* === BARIS 2: TOMBOL FORM VERLAP === */}
                      <tr className="bg-emerald-50/30 dark:bg-emerald-900/10 border-b border-slate-200 dark:border-slate-800 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-900/20 transition-colors">
                        <td colSpan={4} className="text-right py-2 md:py-3 pr-4 text-[10px] md:text-xs font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest align-middle">
                          STATUS VERIFIKASI LAPANGAN :
                        </td>
                        <td className="py-2 md:py-3 pb-3 md:pb-4 text-center">
                          {peserta.nilai_verlap ? (
                            <button
                              onClick={() => bukaModalVerlap(peserta)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-1.5 px-4 rounded-xl text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto min-w-[80px] border-2 border-emerald-500"
                              title="Klik untuk Edit Nilai Verlap"
                            >
                              <span className="text-[10px] opacity-80 font-bold uppercase tracking-tighter">Skor:</span>
                              <span className="text-base">{peserta.nilai_verlap}</span>
                              <span className="text-[10px]">✏️</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => bukaModalVerlap(peserta)}
                              className="bg-white hover:bg-emerald-50 text-emerald-600 font-bold py-1.5 px-3 md:px-4 rounded-lg text-[10px] md:text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 border-2 border-emerald-400 mx-auto w-32"
                            >
                              <span>📋</span> Isi Form
                            </button>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= MODAL FORM VERIFIKASI LAPANGAN (FULL KUESIONER) ================= */}
      {modalVerlap.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-emerald-600 p-5 text-center relative shrink-0">
              <button 
                onClick={() => setModalVerlap({ ...modalVerlap, isOpen: false })}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
              >
                ✕
              </button>
              <h3 className="font-black text-white text-lg tracking-wide uppercase">REKAP VERIFIKASI LAPANGAN</h3>
              <p className="text-emerald-100 text-xs font-bold mt-1">{modalVerlap.namaInstansi}</p>
            </div>

            {/* Isi Scrollable */}
            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar-light flex-1 space-y-6">
              
              {/* PILIHAN TINGKAT (Buat Rumus DLH) */}
              <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-widest">Tingkat Wilayah Binaan:</label>
                <div className="flex gap-2">
                  <button onClick={() => setTingkatVerlap("RT")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tingkatVerlap === "RT" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>Tingkat RT</button>
                  <button onClick={() => setTingkatVerlap("RW")} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tingkatVerlap === "RW" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>Tingkat RW / Desa</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                
                {/* KOLOM KIRI (DLH & DKK) */}
                <div className="space-y-6">
                  {/* DLH */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-black text-emerald-600 dark:text-emerald-400 text-sm mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">JURI DLH (Kategori I)</h4>
                    <div className="space-y-2">
                      {[ { id: "1.1", lbl: "1. Pemilahan Sampah" }, { id: "1.2", lbl: "2. Pengumpulan" }, { id: "1.3", lbl: "3. Keaktifan Nasabah" }, { id: "1.4", lbl: "4. Kelengkapan Buku" }, { id: "1.5", lbl: "5. Pemanfaatan" }, { id: "1.6", lbl: "6. Catat Organik" }, { id: "1.7", lbl: "7. Laporan" } ].map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-600 dark:text-slate-300">{item.lbl}</label>
                          <input type="number" min="0" value={skorVerlap[item.id] || ""} onChange={(e) => handleInputVerlap(item.id, e.target.value)} className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-center font-black focus:border-emerald-500 outline-none" placeholder="0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DKK */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-black text-emerald-600 dark:text-emerald-400 text-sm mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">JURI DKK (Kategori II)</h4>
                    <div className="space-y-2">
                      {[ { id: "2.1", lbl: "1. Ruang Pelayanan" }, { id: "2.2", lbl: "2. Area Penyimpanan" }, { id: "2.3", lbl: "3. Peralatan Memadai" }, { id: "2.4", lbl: "4. Kebersihan & Aman" } ].map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-600 dark:text-slate-300">{item.lbl}</label>
                          <input type="number" min="0" value={skorVerlap[item.id] || ""} onChange={(e) => handleInputVerlap(item.id, e.target.value)} className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-center font-black focus:border-emerald-500 outline-none" placeholder="0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* KOLOM KANAN (BSI & PMD) */}
                <div className="space-y-6">
                  {/* BSI */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-black text-emerald-600 dark:text-emerald-400 text-sm mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">JURI BSI (Kategori III)</h4>
                    <div className="space-y-2">
                      {[ { id: "3.1", lbl: "1. Usia Pendirian" }, { id: "3.2", lbl: "2. Papan Nama/SK" }, { id: "3.3", lbl: "3. Pembagian Tugas" }, { id: "3.4", lbl: "4. SOP Tertulis" }, { id: "3.5", lbl: "5. Jadwal Timbang" }, { id: "3.6", lbl: "6. Dokumentasi" } ].map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-600 dark:text-slate-300">{item.lbl}</label>
                          <input type="number" min="0" value={skorVerlap[item.id] || ""} onChange={(e) => handleInputVerlap(item.id, e.target.value)} className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-center font-black focus:border-emerald-500 outline-none" placeholder="0" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PMD */}
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h4 className="font-black text-emerald-600 dark:text-emerald-400 text-sm mb-3 border-b border-slate-100 dark:border-slate-700 pb-2">JURI PMD (Kat IV & V)</h4>
                    <div className="space-y-2">
                      {[ { id: "4.1", lbl: "Inovasi Pengelolaan" }, { id: "5.1", lbl: "Keterlibatan Desa" } ].map(item => (
                        <div key={item.id} className="flex justify-between items-center text-xs">
                          <label className="font-bold text-slate-600 dark:text-slate-300">{item.lbl}</label>
                          <input type="number" min="0" value={skorVerlap[item.id] || ""} onChange={(e) => handleInputVerlap(item.id, e.target.value)} className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-900 text-center font-black focus:border-emerald-500 outline-none" placeholder="0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer / Tombol Simpan & Kalkulasi Live */}
            <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kalkulasi Skor Verlap:</span>
                <span className="text-3xl font-black text-emerald-600 leading-none mt-1">
                  {hitungSkorAkhirVerlap()} <span className="text-sm text-slate-400">/ 100</span>
                </span>
              </div>
              <button 
                onClick={handleSimpanVerlap}
                disabled={modalVerlap.isSaving}
                className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black py-3 md:py-4 rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-xs flex justify-center items-center gap-2"
              >
                {modalVerlap.isSaving ? "MENYIMPAN..." : "💾 SIMPAN & KUNCI VERLAP"}
              </button>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar-light::-webkit-scrollbar { width: 4px; height: 6px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>
    </main>
  );
}