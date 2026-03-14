"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle"; // 👈 Tambah ini
import React from "react";

export default function FormPenilaianJuri() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [daftarPeserta, setDaftarPeserta] = useState<any[]>([]);
  const [pesertaTerpilih, setPesertaTerpilih] = useState("");
  const [tingkat, setTingkat] = useState<"RT" | "RW">("RW");
  const [skor, setSkor] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false); 
  const [skorPaten, setSkorPaten] = useState(0); 
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  // 1. Ambil Data User & Daftar Peserta
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
    } else {
      setUser(JSON.parse(savedUser));
    }
    fetch("/api/admin/get-peserta").then(res => res.json()).then(data => setDaftarPeserta(data.peserta));
  }, [router]);

  // 2. 🔒 CEK STATUS GEMBOK
  useEffect(() => {
    const cekStatusGembok = async () => {
      if (!pesertaTerpilih || !user) {
        setIsLocked(false);
        setSkor({}); 
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/juri/cek-nilai?id=${pesertaTerpilih}&role=${user.role}`);
        const data = await res.json();

        if (res.ok && data.isLocked) {
          setIsLocked(true);
          setSkorPaten(data.nilaiLama); 
          if (data.detailLama) {
            setSkor(data.detailLama); 
          }

          setModal({ 
            isOpen: true, 
            type: "success", 
            title: "Data Ditemukan 🔒", 
            message: "Anda sedang melihat arsip penilaian untuk Bank Sampah ini. Data tidak dapat diubah." 
          });
        } else {
          setIsLocked(false);
          setSkor({}); 
        }
      } catch (err) {
        console.error("Gagal cek gembok:", err);
      } finally {
        setLoading(false);
      }
    };

    cekStatusGembok();
  }, [pesertaTerpilih, user]);

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
      const cat2 = (skor["2.1"] || 0) + (skor["2.2"] || 0) + (skor["2.3"] || 0) + (skor["2.4"] || 0);
      total = (cat2 / 40) * 20;
    } 
    else if (role === "juri_bsi") {
      const cat3 = (skor["3.1"] || 0) + (skor["3.2"] || 0) + (skor["3.3"] || 0) + (skor["3.4"] || 0) + (skor["3.5"] || 0) + (skor["3.6"] || 0);
      total = (cat3 / 80) * 25;
    }
    else if (role === "juri_pmd") {
      const skorKat4 = ((skor["4.1"] || 0) / 20) * 7.5;
      const skorKat5 = ((skor["5.1"] || 0) / 20) * 7.5;
      total = skorKat4 + skorKat5;
    }

    return Math.round(total * 10) / 10; 
  };

  const handleSimpan = async () => {
    if (isLocked) return;
    if (!pesertaTerpilih) return setModal({ isOpen: true, type: "error", title: "Pilih Peserta", message: "Pilih Bank Sampah terlebih dahulu." });
    
    const nilaiAkhir = hitungSkorAkhir();
    if (nilaiAkhir === 0) return setModal({ isOpen: true, type: "error", title: "Form Kosong", message: "Isi minimal satu indikator penilaian." });

    setLoading(true);
    try {
      const res = await fetch("/api/juri/simpan-nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idPeserta: pesertaTerpilih, 
          skorBaru: nilaiAkhir, 
          juriRole: user.role,
          detailSkor: skor 
        }),
      });

      if (res.ok) {
        setIsLocked(true); 
        setModal({ isOpen: true, type: "success", title: "Sistem Terkunci 🔒", message: `Skor ${nilaiAkhir} poin telah diamankan secara permanen.` });
        window.scrollTo(0, 0); 
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

  if (!user) return <div className="p-10 text-center font-bold text-slate-500 flex items-center justify-center h-screen dark:bg-slate-950">Memuat Form Penilaian...</div>;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans pb-32 pt-[100px] relative transition-colors duration-300">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border transition-colors">
        <div className="flex flex-col justify-center min-w-0 mr-4">
          <h1 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate uppercase">
            {user.namaInstansi || user.nama || user.role.replace('_', ' ')}
          </h1>
          <p className="text-[9px] sm:text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-1.5 leading-none truncate">
            Panel Penilaian Juri
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeToggle /> {/* 👈 SAKLAR DARK MODE */}
          <TombolLogout />
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-4 ml-1">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 dark:text-white leading-none uppercase">Tim Penilai</p>
              <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1 tracking-wider leading-none">Sragen Regency</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-black border border-emerald-200 dark:border-emerald-800 text-xs shrink-0">
              JURI
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 mt-2 space-y-6">
        
        {/* PILIH PESERTA */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors">
          {isLocked && <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>}
          
          <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-2 flex justify-between items-center">
            1. Pilih Bank Sampah Sasaran:
            {isLocked && <span className="text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-md text-[10px] uppercase font-black tracking-widest">🔒 Terkunci</span>}
          </label>
          
          <select 
            value={pesertaTerpilih} 
            onChange={(e) => setPesertaTerpilih(e.target.value)} 
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <option value="">-- Ketuk untuk memilih --</option>
            {daftarPeserta.map((p) => <option key={p._id} value={p._id}>{p.namaInstansi}</option>)}
          </select>

          {user.role === "juri_dlh" && (
            <div className="mt-5">
              <label className="block text-sm font-extrabold text-slate-700 dark:text-slate-300 mb-2">2. Tingkat Wilayah Binaan:</label>
              <div className="flex gap-2">
                <button disabled={isLocked} onClick={() => setTingkat("RT")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RT" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-400"} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>Tingkat RT</button>
                <button disabled={isLocked} onClick={() => setTingkat("RW")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RW" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-400"} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>Tingkat RW / Desa</button>
              </div>
            </div>
          )}
        </div>

        {/* FORM PENILAIAN */}
        <div className={`space-y-6 ${isLocked ? 'opacity-80' : ''}`}>
          {user.role === "juri_dlh" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20 transition-colors">
              <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Kategori I (40%)</span>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Pengelolaan Sampah</h2>
              </div>
              <div className="space-y-6">
                <ItemSoal id="1.1" judul="1. Pemilahan jenis sampah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"5-10 jenis", r:"1-5", min:1, max:5}, {l:"11-20 Jenis", r:"6-10", min:6, max:10}, {l:"21-30 Jenis", r:"11-15", min:11, max:15}, {l:"> 31 jenis", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="1.2" judul="2. Pengumpulan & pencatatan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={tingkat === "RT" ? [{l:"20-30 KK", r:"1-5", min:1, max:5}, {l:"31-50 KK", r:"6-10", min:6, max:10}, {l:"> 51 KK", r:"11-15", min:11, max:15}] : [{l:"< 40 Nasabah", r:"16-20", min:16, max:20}, {l:"41-70 Nasabah", r:"21-25", min:21, max:25}, {l:"71-100 Nasabah", r:"26-30", min:26, max:30}, {l:"> 100 Nasabah", r:"31-40", min:31, max:40}]} />
                <ItemSoal id="1.3" judul="3. Keaktifan nasabah menabung" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={tingkat === "RT" ? [{l:"< 50% nasabah", r:"1-5", min:1, max:5}, {l:"51-75% nasabah", r:"6-10", min:6, max:10}, {l:"76-100% nasabah", r:"11-15", min:11, max:15}] : [{l:"< 50% nasabah", r:"16-20", min:16, max:20}, {l:"51-75% nasabah", r:"21-25", min:21, max:25}, {l:"76-100% nasabah", r:"26-30", min:26, max:30}]} />
                <ItemSoal id="1.4" judul="4. Kelengkapan Pembukuan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Lengkap", r:"1-5", min:1, max:5}, {l:"Lengkap", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="1.5" judul="5. Pengolahan/Pemanfaatan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Mandiri/Individu", r:"1-5", min:1, max:5}, {l:"1 Kegiatan", r:"6-10", min:6, max:10}, {l:"2 Kegiatan", r:"11-15", min:11, max:15}, {l:"3 Kegiatan", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="1.6" judul="6. Pencatatan sampah organik" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada & Lengkap", r:"10-20", min:11, max:20}]} />
                <ItemSoal id="1.7" judul="7. Laporan pengurangan sampah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak melapor", r:"1-5", min:1, max:5}, {l:"Melapor (DLH/Pusk)", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          )}

          {user.role === "juri_dkk" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20 transition-colors">
              <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Kategori II (20%)</span>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Fasilitas & Infrastruktur</h2>
              </div>
              <div className="space-y-6">
                <ItemSoal id="2.1" judul="1. Ruang pelayanan layak" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.2" judul="2. Area penyimpanan terpisah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada & Rapi", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.3" judul="3. Peralatan memadai" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.4" judul="4. Kebersihan & Keamanan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ya, Aman", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          )}

          {user.role === "juri_bsi" && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20 transition-colors">
              <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Kategori III (25%)</span>
                <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Tata Kelola & Administrasi</h2>
              </div>
              <div className="space-y-6">
                <ItemSoal id="3.1" judul="1. Usia Pendirian Bank Sampah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"< 1 tahun", r:"1-5", min:1, max:5}, {l:"1 - 4 tahun", r:"6-10", min:6, max:10}, {l:"> 5 tahun", r:"11-15", min:11, max:15}]} />
                <ItemSoal id="3.2" judul="2. Papan nama, SK, Struktur" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Ada tidak lengkap", r:"6-10", min:6, max:10}, {l:"Ada & Lengkap", r:"11-15", min:11, max:15}]} />
                <ItemSoal id="3.3" judul="3. Pembagian tugas tertulis" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="3.4" judul="4. SOP tertulis & diterapkan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="3.5" judul="5. Jadwal Penimbangan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"> 1 bln sekali", r:"1-5", min:1, max:5}, {l:"1 bln sekali", r:"6-10", min:6, max:10}, {l:"1-2 kali/bln", r:"11-15", min:11, max:15}, {l:"1-4 kali/bln", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="3.6" judul="6. Dokumentasi" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          )}

          {user.role === "juri_pmd" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20 transition-colors">
                <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Kategori IV (7.5%)</span>
                  <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Inovasi Bank Sampah</h2>
                </div>
                <ItemSoal id="4.1" judul="Kehadiran Inovasi Pengelolaan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada Inovasi", r:"11-20", min:11, max:20}]} />
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-emerald-100 dark:border-emerald-900/20 transition-colors">
                <div className="mb-5 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Kategori V (7.5%)</span>
                  <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Dukungan & Keterlibatan Desa</h2>
                </div>
                <ItemSoal id="5.1" judul="Keterlibatan Kelurahan/Desa" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Ada (Tanpa Dana)", r:"6-10", min:6, max:10}, {l:"Didanai Desa", r:"11-20", min:11, max:20}]} />
              </div>
            </div>
          )}
        </div>

        {isLocked && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex gap-3 items-start shadow-sm mt-4">
             <span className="text-amber-500 text-lg">🛡️</span>
             <p className="text-xs text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
               Pemberitahuan: Anda sedang melihat arsip penilaian. Sistem telah mengunci data ini untuk menjaga keadilan kompetisi.
             </p>
          </div>
        )}

      </div>

      {/* --- PANEL BAWAH --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-[0_-15px_30px_rgba(0,0,0,0.08)] z-20 flex justify-between items-center px-6 rounded-t-3xl transition-colors">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Kontribusi Nilai</p>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none mt-1">
            {hitungSkorAkhir()} 
            <span className="text-sm text-slate-400 font-bold ml-1"> 
              / {user?.role?.toLowerCase() === "juri_dlh" ? "40" : user?.role?.toLowerCase() === "juri_dkk" ? "20" : user?.role?.toLowerCase() === "juri_bsi" ? "25" : "15"}
            </span>
          </p>
        </div>
        <div className="flex gap-2 w-1/2">
          {!isLocked && (
            <button 
              className="flex-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-black p-4 rounded-2xl transition-all"
              onClick={() => setSkor({})}
            >
              🗑️
            </button>
          )}
          <button 
            onClick={handleSimpan} 
            disabled={loading || isLocked} 
            className={`flex-1 font-black py-4 rounded-2xl shadow-xl transition-all text-sm uppercase tracking-widest ${
              isLocked ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none" : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black active:scale-95"
            }`}
          >
            {loading ? "Proses..." : isLocked ? "TERKUNCI" : "Kirim Skor"}
          </button>
        </div>
      </div>
    </main>
  );
}

// 🔒 KOMPONEN ITEM SOAL
function ItemSoal({ id, judul, options, skor, onChange, isLocked }: { id: string, judul: string, options: any[], skor: any, onChange: any, isLocked?: boolean }) {
  const activeIndex = options.findIndex(opt => skor[id] >= opt.min && skor[id] <= opt.max);
  return (
    <div className="border-b border-slate-100 dark:border-slate-800 pb-6 last:border-0 last:pb-0">
      <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight mb-4">{judul}</h3>
      <div className={`grid gap-3 ${options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {options.map((opt, i) => {
          const isSelected = activeIndex === i;
          return (
            <button 
              key={i} 
              disabled={isLocked} 
              onClick={() => onChange(id, opt.max)} 
              className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[95px] ${
                isLocked ? "cursor-not-allowed" : "active:scale-95"
              } ${
                isSelected 
                  ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-md" 
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"
              }`}
            >
              <span className={`text-sm font-bold leading-snug ${isSelected ? 'text-emerald-800 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>{opt.l}</span>
              <span className={`text-xs mt-3 font-black px-3 py-1.5 inline-block rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{opt.r}</span>
            </button>
          );
        })}
      </div>
      {activeIndex !== -1 && (
        <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-5 rounded-2xl flex flex-col gap-4 transition-all shadow-inner">
          <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-400">Pilih Nilai Spesifik ({options[activeIndex].min} - {options[activeIndex].max}):</span>
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: options[activeIndex].max - options[activeIndex].min + 1 }, (_, i) => options[activeIndex].min + i).map((val) => {
              const isValSelected = skor[id] === val;
              return (
                <button 
                  key={val} 
                  disabled={isLocked} 
                  onClick={() => onChange(id, val)} 
                  className={`w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl text-base font-black transition-all ${
                    isLocked ? "cursor-not-allowed opacity-90" : "active:scale-90"
                  } ${
                    isValSelected 
                      ? "bg-emerald-600 text-white shadow-md border-2 border-emerald-700 scale-105" 
                      : "bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                  }`}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}