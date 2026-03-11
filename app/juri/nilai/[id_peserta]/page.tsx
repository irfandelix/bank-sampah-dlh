"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif";

export default function HalamanPenilaian() {
  const params = useParams();
  const router = useRouter();
  const idPeserta = params.id_peserta; 

  const [namaBankSampah, setNamaBankSampah] = useState("Memuat...");
  const [kecamatan, setKecamatan] = useState("");
  const [nilai, setNilai] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  // 1. Ambil Data saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userJson = sessionStorage.getItem("user");
        if (!userJson) {
          router.push("/"); // Usir kalau belum login
          return;
        }
        const user = JSON.parse(userJson);

        const res = await fetch(`/api/juri/cek-nilai?id=${idPeserta}&role=${user.role}`);
        const data = await res.json();

        if (res.ok) {
          setNamaBankSampah(data.namaInstansi);
          setKecamatan(data.kecamatan);
          
          // KUNCI JIKA DARI DATABASE BILANG SUDAH TERKUNCI
          if (data.isLocked) {
            setNilai(data.nilaiLama);
            setIsLocked(true);
          }
        } else {
          console.error("Gagal load:", data.error);
        }
      } catch (err) {
        console.error("Gagal koneksi ke server");
      }
    };
    fetchData();
  }, [idPeserta, router]);

  // 2. Fungsi Simpan Nilai
  const handleSimpan = async () => {
    if (nilai === null || isLocked) return;

    setLoading(true);
    try {
      const user = JSON.parse(sessionStorage.getItem("user") || "{}");
      const res = await fetch("/api/juri/simpan-nilai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idPeserta: idPeserta,
          skorBaru: nilai,
          juriRole: user.role
        }),
      });

      if (res.ok) {
        setIsLocked(true); // Langsung Kunci UI-nya
        setModal({
          isOpen: true, 
          type: "success",
          title: "Sistem Terkunci 🔒",
          message: `Nilai ${nilai} poin berhasil diamankan. Anda tidak dapat mengubahnya lagi.`
        });
      } else {
        const errData = await res.json();
        setModal({ isOpen: true, type: "error", title: "Akses Ditolak", message: errData.error || "Gagal menyimpan." });
        
        // Kalau ternyata API menolak (karena sudah dinilai di tab lain), paksa UI terkunci
        if (res.status === 403) setIsLocked(true); 
      }
    } catch (error) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Koneksi server terputus." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 relative font-sans text-slate-900">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      <header className="bg-emerald-700 text-white p-6 shadow-lg rounded-b-[2rem] sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-[10px] font-black opacity-80 mb-3 uppercase tracking-widest flex items-center gap-2 hover:opacity-100 transition-opacity">
           ← Kembali
        </button>
        <h1 className="text-xl font-black tracking-tight">{namaBankSampah}</h1>
        <div className="flex items-center gap-2 mt-3">
          <span className="px-3 py-1 bg-emerald-800/60 rounded-lg text-[10px] font-bold border border-emerald-600 shadow-inner">
            📍 KEC. {kecamatan.toUpperCase()}
          </span>
          {isLocked && (
            <span className="px-3 py-1 bg-white text-emerald-700 rounded-lg text-[10px] font-black uppercase shadow-md tracking-tighter flex items-center gap-1">
              🔒 Terkunci
            </span>
          )}
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6 mt-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 relative overflow-hidden">
          
          {/* Efek Garis kalau terkunci */}
          {isLocked && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>}

          <h2 className="text-slate-800 font-bold text-lg leading-tight mb-6">
            1. Bagaimana kualitas pengolahan sampah dan sarana prasarana di lokasi?
          </h2>
          
          <div className="grid grid-cols-5 gap-2 pt-6 border-t border-slate-100">
            {[6, 7, 8, 9, 10].map((angka) => (
              <button
                key={angka}
                disabled={isLocked}
                onClick={() => setNilai(angka)}
                className={`py-4 text-xl font-black rounded-2xl transition-all duration-300 ${
                  nilai === angka 
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105" 
                    : "bg-slate-50 text-slate-300 border border-slate-100"
                } ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-100"}`}
              >
                {angka}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSimpan}
          disabled={loading || isLocked || nilai === null}
          className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.1em] transition-all shadow-lg ${
            isLocked 
              ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
              : "bg-slate-900 text-white hover:bg-black active:scale-95 shadow-slate-300"
          }`}
        >
          {loading ? "Menyimpan Data..." : isLocked ? "🔒 NILAI TELAH DIKUNCI" : "Kirim & Kunci Nilai →"}
        </button>

        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start shadow-sm">
             <span className="text-amber-500 text-lg">🛡️</span>
             <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
               Pemberitahuan: Sistem telah mengunci nilai ini untuk menjaga keadilan kompetisi. Anda tidak dapat mengubahnya kembali.
             </p>
          </div>
        )}
      </div>
    </main>
  );
}