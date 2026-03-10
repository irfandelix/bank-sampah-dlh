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
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) {
      router.push("/");
    } else {
      setUser(JSON.parse(savedUser));
    }
    fetch("/api/admin/get-peserta").then(res => res.json()).then(data => setDaftarPeserta(data.peserta));
  }, [router]);

  const handleInputClick = (id: string, value: number) => {
    setSkor(prev => ({ ...prev, [id]: value }));
  };

  const hitungSkorAkhir = () => {
    if (!user) return 0;
    let total = 0;

    if (user.role === "juri_dlh") {
      const cat1 = (skor["1.1"] || 0) + (skor["1.2"] || 0) + (skor["1.3"] || 0) + (skor["1.4"] || 0) + (skor["1.5"] || 0) + (skor["1.6"] || 0) + (skor["1.7"] || 0);
      const cat1Max = tingkat === "RT" ? 110 : 150;
      const scoreCat1 = (cat1 / cat1Max) * 40;

      const cat2 = (skor["2.1"] || 0) + (skor["2.2"] || 0) + (skor["2.3"] || 0) + (skor["2.4"] || 0);
      const scoreCat2 = (cat2 / 40) * 20;

      const cat3 = (skor["3.1"] || 0) + (skor["3.2"] || 0) + (skor["3.3"] || 0) + (skor["3.4"] || 0) + (skor["3.5"] || 0) + (skor["3.6"] || 0);
      const scoreCat3 = (cat3 / 80) * 25;

      total = scoreCat1 + scoreCat2 + scoreCat3;
    } 
    else if (user.role === "juri_bapperida") {
      total = ((skor["4.1"] || 0) / 20) * 7.5;
    } 
    else if (user.role === "juri_pmd") {
      total = ((skor["5.1"] || 0) / 20) * 7.5;
    }

    return Math.round(total * 10) / 10; 
  };

  const handleSimpan = async () => {
    if (!pesertaTerpilih) return setModal({ isOpen: true, type: "error", title: "Pilih Peserta", message: "Pilih Bank Sampah terlebih dahulu." });
    
    const nilaiAkhir = hitungSkorAkhir();
    if (nilaiAkhir === 0) return setModal({ isOpen: true, type: "error", title: "Form Kosong", message: "Isi minimal satu indikator penilaian." });

    setLoading(true);
    try {
      const res = await fetch("/api/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          usernamePeserta: pesertaTerpilih, 
          skorBaru: nilaiAkhir, 
          juriRole: user.role 
        }),
      });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Berhasil!", message: `Skor ${nilaiAkhir} poin telah disetor ke Pusat.` });
        setSkor({}); 
        window.scrollTo(0, 0); 
      }
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
          <h1 className="text-lg font-black tracking-tight">{user.namaInstansi || user.nama}</h1>
        </div>
        <TombolLogout />
      </header>

      <div className="max-w-3xl mx-auto p-4 mt-2 space-y-6">
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <label className="block text-sm font-extrabold text-slate-700 mb-2">1. Pilih Bank Sampah Sasaran:</label>
          <select value={pesertaTerpilih} onChange={(e) => setPesertaTerpilih(e.target.value)} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700">
            <option value="">-- Ketuk untuk memilih --</option>
            {daftarPeserta.map((p) => <option key={p._id} value={p.username}>{p.namaInstansi}</option>)}
          </select>

          {user.role === "juri_dlh" && (
            <div className="mt-5">
              <label className="block text-sm font-extrabold text-slate-700 mb-2">2. Tingkat Wilayah Binaan:</label>
              <div className="flex gap-2">
                <button onClick={() => setTingkat("RT")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RT" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>Tingkat RT</button>
                <button onClick={() => setTingkat("RW")} className={`flex-1 py-3 rounded-xl font-bold transition-all ${tingkat === "RW" ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>Tingkat RW / Desa</button>
              </div>
            </div>
          )}
        </div>

        {user.role === "juri_dlh" && (
          <>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <div className="mb-5 border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori I (40%)</span>
                <h2 className="text-lg font-extrabold text-slate-800">Pengelolaan Sampah</h2>
              </div>
              <div className="space-y-6">
                <ItemSoal id="1.1" judul="1. Pemilahan jenis sampah" skor={skor} onChange={handleInputClick} options={[{l:"5-10 jenis", r:"1-5", min:1, max:5}, {l:"11-20 Jenis", r:"6-10", min:6, max:10}, {l:"21-30 Jenis", r:"11-15", min:11, max:15}, {l:"> 31 jenis", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="1.2" judul="2. Pengumpulan & pencatatan" skor={skor} onChange={handleInputClick} options={tingkat === "RT" ? [{l:"20-30 KK", r:"1-5", min:1, max:5}, {l:"31-50 KK", r:"6-10", min:6, max:10}, {l:"> 51 KK", r:"11-15", min:11, max:15}] : [{l:"< 40 Nasabah", r:"16-20", min:16, max:20}, {l:"41-70 Nasabah", r:"21-25", min:21, max:25}, {l:"71-100 Nasabah", r:"26-30", min:26, max:30}, {l:"> 100 Nasabah", r:"31-40", min:31, max:40}]} />
                <ItemSoal id="1.3" judul="3. Keaktifan nasabah menabung" skor={skor} onChange={handleInputClick} options={tingkat === "RT" ? [{l:"< 50% nasabah", r:"1-5", min:1, max:5}, {l:"51-75% nasabah", r:"6-10", min:6, max:10}, {l:"76-100% nasabah", r:"11-15", min:11, max:15}] : [{l:"< 50% nasabah", r:"16-20", min:16, max:20}, {l:"51-75% nasabah", r:"21-25", min:21, max:25}, {l:"76-100% nasabah", r:"26-30", min:26, max:30}]} />
                <ItemSoal id="1.4" judul="4. Kelengkapan Pembukuan" skor={skor} onChange={handleInputClick} options={[{l:"Tidak Lengkap", r:"1-5", min:1, max:5}, {l:"Lengkap", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="1.5" judul="5. Pengolahan/Pemanfaatan" skor={skor} onChange={handleInputClick} options={[{l:"Mandiri/Individu", r:"1-5", min:1, max:5}, {l:"1 Kegiatan", r:"6-10", min:6, max:10}, {l:"2 Kegiatan", r:"11-15", min:11, max:15}, {l:"3 Kegiatan", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="1.6" judul="6. Pencatatan sampah organik" skor={skor} onChange={handleInputClick} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada & Lengkap", r:"10-20", min:11, max:20}]} />
                <ItemSoal id="1.7" judul="7. Laporan pengurangan sampah" skor={skor} onChange={handleInputClick} options={[{l:"Tidak melapor", r:"1-5", min:1, max:5}, {l:"Melapor (DLH/Pusk)", r:"6-10", min:6, max:10}]} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <div className="mb-5 border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori II (20%)</span>
                <h2 className="text-lg font-extrabold text-slate-800">Fasilitas & Infrastruktur</h2>
              </div>
              <div className="space-y-6">
                <ItemSoal id="2.1" judul="1. Ruang pelayanan layak" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.2" judul="2. Area penyimpanan terpisah" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada & Rapi", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.3" judul="3. Peralatan memadai" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="2.4" judul="4. Kebersihan & Keamanan" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ya, Aman", r:"6-10", min:6, max:10}]} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
              <div className="mb-5 border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori III (25%)</span>
                <h2 className="text-lg font-extrabold text-slate-800">Tata Kelola & Administrasi</h2>
              </div>
              <div className="space-y-6">
                <ItemSoal id="3.1" judul="1. Usia Pendirian Bank Sampah" skor={skor} onChange={handleInputClick} options={[{l:"1 - 4 tahun", r:"1-5", min:1, max:5}, {l:"< 1 tahun", r:"6-10", min:6, max:10}, {l:"> 5 tahun", r:"11-15", min:11, max:15}]} />
                <ItemSoal id="3.2" judul="2. Papan nama, SK, Struktur" skor={skor} onChange={handleInputClick} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Ada tidak lengkap", r:"6-10", min:6, max:10}, {l:"Ada & Lengkap", r:"11-15", min:11, max:15}]} />
                <ItemSoal id="3.3" judul="3. Pembagian tugas tertulis" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="3.4" judul="4. SOP tertulis & diterapkan" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
                <ItemSoal id="3.5" judul="5. Jadwal Penimbangan" skor={skor} onChange={handleInputClick} options={[{l:"> 1 bln sekali", r:"1-5", min:1, max:5}, {l:"1 bln sekali", r:"6-10", min:6, max:10}, {l:"1-2 kali/bln", r:"11-15", min:11, max:15}, {l:"1-4 kali/bln", r:"16-20", min:16, max:20}]} />
                <ItemSoal id="3.6" judul="6. Dokumentasi" skor={skor} onChange={handleInputClick} options={[{l:"Tidak", r:"1-5", min:1, max:5}, {l:"Ada", r:"6-10", min:6, max:10}]} />
              </div>
            </div>
          </>
        )}

        {user.role === "juri_bapperida" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
            <div className="mb-5 border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori IV (7.5%)</span>
              <h2 className="text-lg font-extrabold text-slate-800">Inovasi Bank Sampah</h2>
            </div>
            <ItemSoal id="4.1" judul="Kehadiran Inovasi Pengelolaan" skor={skor} onChange={handleInputClick} options={[{l:"Tidak Ada", r:"1-10", min:1, max:10}, {l:"Ada Inovasi", r:"11-20", min:11, max:20}]} />
          </div>
        )}

        {user.role === "juri_pmd" && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100">
            <div className="mb-5 border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Kategori V (7.5%)</span>
              <h2 className="text-lg font-extrabold text-slate-800">Dukungan & Keterlibatan Desa</h2>
            </div>
            <ItemSoal id="5.1" judul="Keterlibatan Kelurahan/Desa" skor={skor} onChange={handleInputClick} options={[{l:"Tidak Ada", r:"1-5", min:1, max:5}, {l:"Ada (Tanpa Dana)", r:"6-10", min:6, max:10}, {l:"Didanai Desa", r:"11-20", min:11, max:20}]} />
          </div>
        )}

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-15px_30px_rgba(0,0,0,0.08)] z-20 flex justify-between items-center px-6 rounded-t-3xl">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Kontribusi Nilai</p>
          <p className="text-3xl font-black text-emerald-600 leading-none mt-1">
            {hitungSkorAkhir()} 
            <span className="text-sm text-slate-400 font-bold"> / {user.role === "juri_dlh" ? "85" : "7.5"}</span>
          </p>
        </div>
        <button onClick={handleSimpan} disabled={loading} className="w-1/2 bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-black active:scale-95 disabled:opacity-50 text-sm transition-all">
          {loading ? "Menyimpan..." : "Kirim Skor 🚀"}
        </button>
      </div>
    </main>
  );
}

// ====================================================================
// KOMPONEN KOTAK PILIHAN (Versi Font Lebih Besar & Mudah Dibaca)
// ====================================================================
function ItemSoal({ id, judul, options, skor, onChange }: { id: string, judul: string, options: any[], skor: any, onChange: any }) {
  
  // Deteksi tombol mana yang sedang aktif berdasarkan rentang nilainya
  const activeIndex = options.findIndex(opt => skor[id] >= opt.min && skor[id] <= opt.max);

  return (
    <div className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
      {/* Judul soal dibesarkan */}
      <h3 className="font-extrabold text-slate-800 text-base leading-tight mb-4">{judul}</h3>
      
      {/* 1. Tombol Pilihan Rentang Utama */}
      <div className={`grid gap-3 ${options.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {options.map((opt, i) => {
          const isSelected = activeIndex === i;
          return (
            <button 
              key={i} 
              onClick={() => onChange(id, opt.max)} 
              // min-h-[90px] dan p-4 agar kotaknya lebih lega
              className={`p-4 rounded-2xl text-left border-2 transition-all flex flex-col justify-between min-h-[95px] active:scale-95 ${isSelected ? "bg-emerald-50 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50"}`}
            >
              {/* Ukuran font teks label dinaikkan menjadi text-sm */}
              <span className={`text-sm font-bold leading-snug ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>{opt.l}</span>
              
              {/* Ukuran font rentang nilai dinaikkan menjadi text-xs */}
              <span className={`text-xs mt-3 font-black px-3 py-1.5 inline-block rounded-lg ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{opt.r}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Jejeran Tombol Nilai Spesifik (Hanya muncul jika rentang sudah dipilih) */}
      {activeIndex !== -1 && (
        <div className="mt-4 bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex flex-col gap-4 transition-all animate-fade-in shadow-inner">
          <span className="text-sm font-extrabold text-emerald-800">
            Pilih Nilai Spesifik ({options[activeIndex].min} - {options[activeIndex].max}):
          </span>
          
          <div className="flex flex-wrap gap-2.5">
            {/* Mesin Pembuat Tombol Angka Dinamis */}
            {Array.from(
              { length: options[activeIndex].max - options[activeIndex].min + 1 }, 
              (_, i) => options[activeIndex].min + i
            ).map((val) => {
              const isValSelected = skor[id] === val;
              return (
                <button
                  key={val}
                  onClick={() => onChange(id, val)}
                  // Tombol diperbesar sedikit (w-14 h-14) & Teks jadi text-base
                  className={`w-14 h-14 flex items-center justify-center rounded-xl text-base font-black transition-all active:scale-90 ${
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