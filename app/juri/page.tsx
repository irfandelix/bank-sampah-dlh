"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";

export default function FormPenilaianJuri() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [daftarPeserta, setDaftarPeserta] = useState<any[]>([]);
  const [pesertaTerpilih, setPesertaTerpilih] = useState("");
  const [tingkat, setTingkat] = useState<"RT" | "RW">("RW");
  const [skor, setSkor] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false); // 🔒 STATE GEMBOK BARU
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

  // 2. 🔒 CEK STATUS GEMBOK SETIAP KALI PILIH BANK SAMPAH
  useEffect(() => {
    const cekStatusGembok = async () => {
      if (!pesertaTerpilih || !user) {
        setIsLocked(false);
        setSkor({}); 
        return;
      }

      setLoading(true);
      try {
        // Panggil API Cek Nilai yang Sakti
        const res = await fetch(`/api/juri/cek-nilai?id=${pesertaTerpilih}&role=${user.role}`);
        const data = await res.json();

        if (res.ok && data.isLocked) {
          setIsLocked(true);
          setModal({ 
            isOpen: true, 
            type: "error", 
            title: "Terkunci! 🔒", 
            message: "Anda sudah pernah menilai Bank Sampah ini. Data tidak dapat diubah lagi." 
          });
        } else {
          setIsLocked(false);
          setSkor({}); // Bersihkan skor buat ngisi baru
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
    if (isLocked) return; // Kalau dikunci, cegah klik
    setSkor(prev => ({ ...prev, [id]: value }));
  };

  const hitungSkorAkhir = () => {
    if (!user) return 0;
    let total = 0;

    if (user.role === "juri_dlh") {
      const cat1 = (skor["1.1"] || 0) + (skor["1.2"] || 0) + (skor["1.3"] || 0) + (skor["1.4"] || 0) + (skor["1.5"] || 0) + (skor["1.6"] || 0) + (skor["1.7"] || 0);
      const cat1Max = tingkat === "RT" ? 110 : 150;
      total = (cat1 / cat1Max) * 40;
    } 
    else if (user.role === "juri_dkk") {
      const cat2 = (skor["2.1"] || 0) + (skor["2.2"] || 0) + (skor["2.3"] || 0) + (skor["2.4"] || 0);
      total = (cat2 / 40) * 20;
    } 
    else if (user.role === "juri_bsi") {
      const cat3 = (skor["3.1"] || 0) + (skor["3.2"] || 0) + (skor["3.3"] || 0) + (skor["3.4"] || 0) + (skor["3.5"] || 0) + (skor["3.6"] || 0);
      total = (cat3 / 80) * 25;
    }
    else if (user.role === "juri_pmd") {
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
      // 🔒 UBAH API KE SIMPAN-NILAI YANG PUNYA PERTAHANAN GEMBOK
      const res = await fetch("/api/juri/simpan-nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idPeserta: pesertaTerpilih, // Pakai ID Peserta, bukan username lagi
          skorBaru: nilaiAkhir, 
          juriRole: user.role 
        }),
      });

      if (res.ok) {
        setIsLocked(true); // Langsung kunci layarnya
        setModal({ isOpen: true, type: "success", title: "Sistem Terkunci 🔒", message: `Skor ${nilaiAkhir} poin telah diamankan secara permanen.` });
        window.scrollTo(0, 0); 
      } else {
        const err = await res.json();
        setModal({ isOpen: true, type: "error", title: "Gagal", message: err.error });
        if (res.status === 403) setIsLocked(true); // Kunci kalau ditolak server
      }
    } catch (e) {
      setModal({ isOpen: true, type: "error", title: "Error", message: "Koneksi terputus." });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="p-10 text-center font-bold">Memuat Form...</div>;

  return (
    <main className="min-h-screen bg-slate-50 pb-28 relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      <header className="bg-emerald-700 text-white p-5 shadow-md sticky top-0 z-20 flex justify-between items-center rounded-b-3xl">
        <div>
          <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest">Aplikasi Penilaian</p>
          <h1 className="text-lg font-black tracking-tight">{user.namaInstansi || user.nama || user.role.replace('_', ' ').toUpperCase()}</h1>
        </div>
        <TombolLogout />
      </header>

      <div className="max-w-3xl mx-auto p-4 mt-2 space-y-6">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          {isLocked && <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>}
          
          <label className="block text-sm font-extrabold text-slate-700 mb-2 flex justify-between">
            1. Pilih Bank Sampah Sasaran:
            {isLocked && <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] uppercase">🔒 Dinilai</span>}
          </label>
          
          <select 
            value={pesertaTerpilih} 
            onChange={(e) => setPesertaTerpilih(e.target.value)} 
            className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          >
            <option value="">-- Ketuk untuk memilih --</option>
            {/* 🔒 UBAH VALUE JADI ID AGAR COCOK DENGAN DATABASE */}
            {daftarPeserta.map((p) => <option key={p._id} value={p._id}>{p.namaInstansi}</option>)}
          </select>

          {user.role === "juri_dlh" && (
            <div className="mt-5">
              <label className="block text-sm font-extrabold text-slate-700 mb-2">2. Tingkat Wilayah Binaan:</label>
              <div className="flex gap-2">
                <button disabled={isLocked} onClick={() => setTingkat("RT")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RT" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-400"} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>Tingkat RT</button>
                <button disabled={isLocked} onClick={() => setTingkat("RW")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RW" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-400"} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>Tingkat RW / Desa</button>
              </div>
            </div>
          )}
        </div>

        {/* ==================== FORM JURI DLH ==================== */}
        {user.role === "juri_dlh" && (
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 transition-opacity ${isLocked ? 'opacity-60' : ''}`}>
            <div className="mb-5 border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori I (40%)</span>
              <h2 className="text-lg font-extrabold text-slate-800">Pengelolaan Sampah</h2>
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

        {/* ==================== FORM JURI DKK ==================== */}
        {user.role === "juri_dkk" && (
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 transition-opacity ${isLocked ? 'opacity-60' : ''}`}>
            <div className="mb-5 border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori II (20%)</span>
              <h2 className="text-lg font-extrabold text-slate-800">Fasilitas & Infrastruktur</h2>
            </div>
            <div className="space-y-6">
              <ItemSoal id="2.1" judul="1. Ruang pelayanan layak" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
              <ItemSoal id="2.2" judul="2. Area penyimpanan terpisah" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada & Rapi", r:"6-10", min:6, max:10}]} />
              <ItemSoal id="2.3" judul="3. Peralatan memadai" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
              <ItemSoal id="2.4" judul="4. Kebersihan & Keamanan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ya, Aman", r:"6-10", min:6, max:10}]} />
            </div>
          </div>
        )}

        {/* ==================== FORM JURI BSI ==================== */}
        {user.role === "juri_bsi" && (
          <div className={`bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 transition-opacity ${isLocked ? 'opacity-60' : ''}`}>
            <div className="mb-5 border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori III (25%)</span>
              <h2 className="text-lg font-extrabold text-slate-800">Tata Kelola & Administrasi</h2>
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

        {/* ==================== FORM JURI PMD ==================== */}
        {user.role === "juri_pmd" && (
          <div className={`transition-opacity ${isLocked ? 'opacity-60' : ''}`}>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <div className="mb-5 border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori IV (7.5%)</span>
                <h2 className="text-lg font-extrabold text-slate-800">Inovasi Bank Sampah</h2>
              </div>
              <ItemSoal id="4.1" judul="Kehadiran Inovasi Pengelolaan" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada Inovasi", r:"11-20", min:11, max:20}]} />
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 mt-6">
              <div className="mb-5 border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori V (7.5%)</span>
                <h2 className="text-lg font-extrabold text-slate-800">Dukungan & Keterlibatan Desa</h2>
              </div>
              <ItemSoal id="5.1" judul="Keterlibatan Kelurahan/Desa" skor={skor} onChange={handleInputClick} isLocked={isLocked} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Ada (Tanpa Dana)", r:"6-10", min:6, max:10}, {l:"Didanai Desa", r:"11-20", min:11, max:20}]} />
            </div>
          </div>
        )}

      </div>

      {/* --- PANEL BAWAH --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-15px_30px_rgba(0,0,0,0.08)] z-20 flex justify-between items-center px-6 rounded-t-3xl">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Kontribusi Nilai</p>
          <p className="text-3xl font-black text-emerald-600 leading-none mt-1">
            {isLocked ? "🔒" : hitungSkorAkhir()} 
            {!isLocked && (
              <span className="text-sm text-slate-400 font-bold"> 
                / {user.role === "juri_dlh" ? "40" : user.role === "juri_dkk" ? "20" : user.role === "juri_bsi" ? "25" : "15"}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 w-1/2">
          {!isLocked && (
            <button 
              className="flex-none bg-slate-100 hover:bg-slate-200 text-slate-600 font-black p-4 rounded-2xl transition-all"
              onClick={() => setSkor({})}
            >
              🗑️
            </button>
          )}
          <button 
            onClick={handleSimpan} 
            disabled={loading || isLocked} 
            className={`flex-1 font-black py-4 rounded-2xl shadow-xl transition-all text-sm ${
              isLocked ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none" : "bg-slate-900 text-white hover:bg-black active:scale-95"
            }`}
          >
            {loading ? "Menyimpan..." : isLocked ? "🔒 TERKUNCI" : "Kirim Skor 🚀"}
          </button>
        </div>
      </div>
    </main>
  );
}

// 🔒 UPDATE KOMPONEN ItemSoal (TERIMA isLocked)
function ItemSoal({ id, judul, options, skor, onChange, isLocked }: { id: string, judul: string, options: any[], skor: any, onChange: any, isLocked?: boolean }) {
  const activeIndex = options.findIndex(opt => skor[id] >= opt.min && skor[id] <= opt.max);
  return (
    <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      <h3 className="font-extrabold text-slate-800 text-base leading-tight mb-4">{judul}</h3>
      <div className={`grid gap-3 ${options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {options.map((opt, i) => {
          const isSelected = activeIndex === i;
          return (
            <button 
              key={i} 
              disabled={isLocked} // Matikan tombol
              onClick={() => onChange(id, opt.max)} 
              className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[95px] ${
                isLocked ? "cursor-not-allowed" : "active:scale-95"
              } ${
                isSelected 
                  ? "bg-emerald-50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                  : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50"
              }`}
            >
              <span className={`text-sm font-bold leading-snug ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>{opt.l}</span>
              <span className={`text-xs mt-3 font-black px-3 py-1.5 inline-block rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{opt.r}</span>
            </button>
          );
        })}
      </div>
      {activeIndex !== -1 && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col gap-4 transition-all animate-fade-in shadow-inner">
          <span className="text-sm font-extrabold text-emerald-800">Pilih Nilai Spesifik ({options[activeIndex].min} - {options[activeIndex].max}):</span>
          <div className="flex flex-wrap gap-2.5">
            {Array.from({ length: options[activeIndex].max - options[activeIndex].min + 1 }, (_, i) => options[activeIndex].min + i).map((val) => {
              const isValSelected = skor[id] === val;
              return (
                <button 
                  key={val} 
                  disabled={isLocked} // Matikan tombol angka
                  onClick={() => onChange(id, val)} 
                  className={`w-14 h-14 flex items-center justify-center rounded-xl text-base font-black transition-all ${
                    isLocked ? "cursor-not-allowed" : "active:scale-90"
                  } ${
                    isValSelected 
                      ? "bg-emerald-600 text-white shadow-md border-2 border-emerald-700" 
                      : "bg-white text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100"
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