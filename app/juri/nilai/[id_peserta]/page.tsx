"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle";
import React from "react";

export default function HalamanPenilaianSpesifik() {
  const params = useParams();
  const router = useRouter();
  const idPeserta = params.id_peserta;

  const [user, setUser] = useState<any>(null);
  const [namaBankSampah, setNamaBankSampah] = useState("Memuat...");
  const [kecamatan, setKecamatan] = useState("");
  const [tingkat, setTingkat] = useState<"RT" | "RW">("RW");
  const [skor, setSkor] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  // 1. Ambil Data Awal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userJson = sessionStorage.getItem("user");
        if (!userJson) {
          router.push("/");
          return;
        }
        const parsedUser = JSON.parse(userJson);
        setUser(parsedUser);

        const res = await fetch(`/api/juri/cek-nilai?id=${idPeserta}&role=${parsedUser.role}`);
        const data = await res.json();

        if (res.ok) {
          setNamaBankSampah(data.namaInstansi);
          setKecamatan(data.kecamatan);
          if (data.isLocked) {
            setIsLocked(true);
            if (data.detailLama) setSkor(data.detailLama);
          }
        }
      } catch (err) {
        console.error("Gagal load data");
      }
    };
    fetchData();
  }, [idPeserta, router]);

  const handleInputClick = (id: string, value: number) => {
    if (isLocked) return;
    setSkor(prev => ({ ...prev, [id]: value }));
  };

  const hitungSkorAkhir = () => {
    if (!user || !user.role) return 0;
    let total = 0;
    const role = user.role.toLowerCase();

    if (role === "juri_dlh") {
      const cat1 = (skor["1.1"] || 0) + (skor["1.2"] || 0) + (skor["1.3"] || 0) + (skor["1.4"] || 0) + (skor["1.5"] || 0) + (skor["1.6"] || 0) + (skor["1.7"] || 0);
      const cat1Max = tingkat === "RT" ? 110 : 150;
      total = (cat1 / cat1Max) * 40;
    } 
    else if (role === "juri_dkk") {
      total = (((skor["2.1"] || 0) + (skor["2.2"] || 0) + (skor["2.3"] || 0) + (skor["2.4"] || 0)) / 40) * 20;
    } 
    else if (role === "juri_bsi") {
      total = (((skor["3.1"] || 0) + (skor["3.2"] || 0) + (skor["3.3"] || 0) + (skor["3.4"] || 0) + (skor["3.5"] || 0) + (skor["3.6"] || 0)) / 80) * 25;
    }
    else if (role === "juri_pmd") {
      total = (((skor["4.1"] || 0) / 20) * 7.5) + (((skor["5.1"] || 0) / 20) * 7.5);
    }
    return Math.round(total * 10) / 10;
  };

  const handleSimpan = async () => {
    if (isLocked) return;
    const nilaiAkhir = hitungSkorAkhir();
    if (nilaiAkhir === 0) return setModal({ isOpen: true, type: "error", title: "Form Kosong", message: "Isi minimal satu indikator penilaian." });

    setLoading(true);
    try {
      const res = await fetch("/api/juri/simpan-nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idPeserta: idPeserta, skorBaru: nilaiAkhir, juriRole: user.role, detailSkor: skor }),
      });

      if (res.ok) {
        setIsLocked(true);
        setModal({ isOpen: true, type: "success", title: "Sistem Terkunci 🔒", message: `Nilai ${nilaiAkhir} berhasil diamankan.` });
      } else {
        const err = await res.json();
        setModal({ isOpen: true, type: "error", title: "Gagal", message: err.error });
        if (res.status === 403) setIsLocked(true);
      }
    } catch (e) {
      setModal({ isOpen: true, type: "error", title: "Error", message: "Koneksi terputus." });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-32 pt-[100px] relative transition-colors duration-300">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* --- HEADER MODERN --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-all">←</button>
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm sm:text-base font-black text-slate-800 dark:text-white truncate uppercase">{namaBankSampah}</h1>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest leading-none mt-1 truncate">Kec. {kecamatan}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TombolLogout />
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 mt-2 space-y-6">
        
        {/* TINGKAT WILAYAH (KHUSUS DLH) */}
        {user.role === "juri_dlh" && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-3">Tingkat Wilayah Binaan:</label>
            <div className="flex gap-2">
              <button disabled={isLocked} onClick={() => setTingkat("RT")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RT" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>Tingkat RT</button>
              <button disabled={isLocked} onClick={() => setTingkat("RW")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RW" ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>Tingkat RW / Desa</button>
            </div>
          </div>
        )}

        {isLocked && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-3xl flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Arsip Terkunci. Penilaian ini sudah diamankan secara permanen.</p>
          </div>
        )}

        {/* INDIKATOR PENILAIAN SESUAI ROLE */}
        <div className={`space-y-6 ${isLocked ? 'opacity-80' : ''}`}>
          {user.role === "juri_dlh" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6 border-b dark:border-slate-800 pb-3">Kategori I: Pengelolaan Sampah</h2>
              <div className="space-y-6">
                <ItemSoal id="1.1" judul="1. Pemilahan jenis sampah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"5-10 jenis", r:"1-5", min:1, max:5}, {l:"11-20 Jenis", r:"6-10", min:6, max:10}, {l:"21-30 Jenis", r:"11-15", min:11, max:15}, {l:"> 31 jenis", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="1.2" judul="2. Pengumpulan & pencatatan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={tingkat === "RT" ? [{l:"20-30 KK", r:"1-5", min:1, max:5}, {l:"31-50 KK", r:"6-10", min:6, max:10}, {l:"> 51 KK", r:"11-15", min:11, max:15}] : [{l:"< 40 Nasabah", r:"16-20", min:16, max:20}, {l:"41-70 Nasabah", r:"21-25", min:21, max:25}, {l:"71-100 Nasabah", r:"26-30", min:26, max:30}, {l:"> 100 Nasabah", r:"31-40", min:31, max:40}]} />
                <ItemSoal id="1.3" judul="3. Keaktifan nasabah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={tingkat === "RT" ? [{l:"< 50%", r:"1-5", min:1, max:5}, {l:"51-75%", r:"6-10", min:6, max:10}, {l:"76-100%", r:"11-15", min:11, max:15}] : [{l:"< 50%", r:"16-20", min:16, max:20}, {l:"51-75%", r:"21-25", min:21, max:25}, {l:"76-100%", r:"26-30", min:26, max:30}]} />
                <ItemSoal id="1.4" judul="4. Kelengkapan Pembukuan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Lengkap", r:"1-5", min:1, max:5}, {l:"Lengkap", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="1.5" judul="5. Pengolahan/Pemanfaatan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Mandiri", r:"1-5", min:1, max:5}, {l:"1 Kegiatan", r:"6-10", min:6, max:10}, {l:"2 Kegiatan", r:"11-15", min:11, max:15}, {l:"3 Kegiatan", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="1.6" judul="6. Pencatatan sampah organik" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada & Lengkap", r:"10-20", min:11, max:20}]} />
                <ItemSoal id="1.7" judul="7. Laporan pengurangan sampah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak melapor", r:"1-5", min:1, max:5}, {l:"Melapor", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          )}

          {user.role === "juri_dkk" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6 border-b dark:border-slate-800 pb-3">Kategori II: Fasilitas & Infrastruktur</h2>
              <div className="space-y-6">
                <ItemSoal id="2.1" judul="1. Ruang pelayanan layak" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.2" judul="2. Area penyimpanan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada & Rapi", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.3" judul="3. Peralatan memadai" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.4" judul="4. Kebersihan & Keamanan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ya, Aman", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          )}

          {user.role === "juri_bsi" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white mb-6 border-b dark:border-slate-800 pb-3">Kategori III: Tata Kelola</h2>
              <div className="space-y-6">
                <ItemSoal id="3.1" judul="1. Usia Pendirian" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"< 1 thn", r:"1-5", min:1, max:5}, {l:"1-4 thn", r:"6-10", min:6, max:10}, {l:"> 5 thn", r:"11-15", min:11, max:15}]} />
                <ItemSoal id="3.2" judul="2. Papan nama, SK, Struktur" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Tidak lengkap", r:"6-10", min:6, max:10}, {l:"Lengkap", r:"11-15", min:11, max:15}]} />
                <ItemSoal id="3.3" judul="3. Pembagian tugas tertulis" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="3.4" judul="4. SOP tertulis" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="3.5" judul="5. Jadwal Penimbangan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"> 1 bln sekali", r:"1-5", min:1, max:5}, {l:"1 bln sekali", r:"6-10", min:6, max:10}, {l:"1-2 kali/bln", r:"11-15", min:11, max:15}, {l:"1-4 kali/bln", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="3.6" judul="6. Dokumentasi" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          )}

          {user.role === "juri_pmd" && (
            <>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                <h2 className="font-extrabold dark:text-white mb-4">Kategori IV: Inovasi</h2>
                <ItemSoal id="4.1" judul="Inovasi Pengelolaan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada", r:"11-20", min:11, max:20}]} />
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 mt-6">
                <h2 className="font-extrabold dark:text-white mb-4">Kategori V: Dukungan Desa</h2>
                <ItemSoal id="5.1" judul="Keterlibatan Desa" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Tanpa Dana", r:"6-10", min:6, max:10}, {l:"Didanai Desa", r:"11-20", min:11, max:20}]} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* PANEL BAWAH FIXED */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-[0_-15px_30px_rgba(0,0,0,0.08)] z-20 flex justify-between items-center px-6 rounded-t-3xl">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Kontribusi Nilai</p>
          <p className="text-3xl font-black text-emerald-600 leading-none mt-1">{hitungSkorAkhir()}</p>
        </div>
        <div className="flex gap-2">
          {!isLocked && (
            <button className="bg-slate-100 dark:bg-slate-800 text-slate-600 p-4 rounded-2xl" onClick={() => setSkor({})}>🗑️</button>
          )}
          <button 
            onClick={handleSimpan} 
            disabled={loading || isLocked} 
            className={`px-8 font-black py-4 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest ${isLocked ? "bg-slate-200 dark:bg-slate-800 text-slate-400" : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 active:scale-95"}`}
          >
            {isLocked ? "TERKUNCI" : "Kirim Skor"}
          </button>
        </div>
      </div>
    </main>
  );
}

function ItemSoal({ id, judul, options, skor, onChange, isLocked }: any) {
  const activeIndex = options.findIndex((opt: any) => skor[id] >= opt.min && skor[id] <= opt.max);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
      <h3 className="font-extrabold text-slate-800 dark:text-white text-base mb-4">{judul}</h3>
      <div className={`grid gap-3 ${options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {options.map((opt: any, i: number) => {
          const isSelected = activeIndex === i;
          return (
            <button key={i} disabled={isLocked} onClick={() => onChange(id, opt.max)} className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[95px] ${isSelected ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-md" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"}`}>{opt.l}<span className={`text-xs mt-3 font-black px-3 py-1.5 rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>{opt.r}</span></button>
          );
        })}
      </div>
      {activeIndex !== -1 && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex flex-wrap gap-2.5">
          {Array.from({ length: options[activeIndex].max - options[activeIndex].min + 1 }, (_, i) => options[activeIndex].min + i).map((val) => (
            <button key={val} disabled={isLocked} onClick={() => onChange(id, val)} className={`w-11 h-11 flex items-center justify-center rounded-xl font-black transition-all ${skor[id] === val ? "bg-emerald-600 text-white scale-110" : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800"}`}>{val}</button>
          ))}
        </div>
      )}
    </div>
  );
}