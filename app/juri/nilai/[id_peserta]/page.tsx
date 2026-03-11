"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif";

export default function HalamanPenilaian() {
  const params = useParams();
  const router = useRouter();
  const idPeserta = params.id_peserta; // Mengambil ID dari URL

  const [namaBankSampah, setNamaBankSampah] = useState("Memuat...");
  const [kecamatan, setKecamatan] = useState("");
  const [nilai, setNilai] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [sudahDinilai, setSudahDinilai] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  // 1. FUNGSI CEK DATA: Ambil info peserta & nilai lama kalau ada
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil info juri dari storage
        const userJson = sessionStorage.getItem("user");
        if (!userJson) return router.push("/");
        const user = JSON.parse(userJson);

        const res = await fetch(`/api/juri/cek-nilai?id=${idPeserta}&role=${user.role}`);
        const data = await res.json();

        if (res.ok) {
          setNamaBankSampah(data.namaInstansi);
          setKecamatan(data.kecamatan);
          
          // Kalau juri ini sudah pernah ngasih nilai, otomatis nyalakan tombolnya
          if (data.nilaiLama > 0) {
            setNilai(data.nilaiLama);
            setSudahDinilai(true);
          }
        }
      } catch (err) {
        console.error("Gagal sinkronisasi data");
      }
    };
    fetchData();
  }, [idPeserta, router]);

  const handleSimpan = async () => {
    if (nilai === null) {
      setModal({
        isOpen: true, type: "error", title: "Nilai Kosong",
        message: "Pilih angka (6-10) dulu ya sebelum simpan."
      });
      return;
    }

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
        setSudahDinilai(true);
        setModal({
          isOpen: true, type: "success",
          title: sudahDinilai ? "Revisi Berhasil!" : "Berhasil Simpan!",
          message: sudahDinilai 
            ? `Nilai terbaru (${nilai} poin) sudah diperbarui di database.` 
            : `Nilai ${nilai} poin berhasil masuk ke klasemen!`
        });
      }
    } catch (error) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Koneksi server bermasalah." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 relative">
      <ModalNotif 
        isOpen={modal.isOpen} 
        type={modal.type as any} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => setModal({ ...modal, isOpen: false })} 
      />

      <header className="bg-emerald-700 text-white p-5 shadow-lg sticky top-0 z-10 rounded-b-[2rem]">
        <button onClick={() => router.back()} className="text-emerald-200 text-xs mb-2 flex items-center gap-1">
          ← Kembali ke Daftar
        </button>
        <h1 className="text-xl font-black tracking-tight">{namaBankSampah}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-1 bg-emerald-800/50 rounded-lg text-[10px] font-bold border border-emerald-600">
            📍 Kec. {kecamatan}
          </span>
          {sudahDinilai && (
            <span className="px-2 py-1 bg-white text-emerald-700 rounded-lg text-[10px] font-black shadow-sm">
              ✅ TERDATA
            </span>
          )}
        </div>
      </header>

      <div className="p-4 max-w-md mx-auto space-y-6 mt-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
          <div className="mb-6">
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100 mb-3 inline-block">
              Indikator Lapangan
            </span>
            <h2 className="text-slate-800 font-bold text-lg leading-tight">
              1. Bagaimana kualitas pengolahan sampah dan sarana prasarana di lokasi?
            </h2>
            <p className="text-slate-400 text-xs mt-2 italic">* Pilih salah satu angka di bawah sebagai nilai akhir</p>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-6 border-t border-slate-50">
            {[6, 7, 8, 9, 10].map((angka) => (
              <button
                key={angka}
                onClick={() => setNilai(angka)}
                className={`py-4 text-xl font-black rounded-2xl transition-all duration-300 ${
                  nilai === angka
                    ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-110 ring-4 ring-emerald-50"
                    : "bg-slate-50 text-slate-300 border border-slate-100 hover:bg-slate-100"
                }`}
              >
                {angka}
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleSimpan}
          disabled={loading}
          className={`w-full py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.1em] transition-all active:scale-95 shadow-lg ${
            sudahDinilai ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200" : "bg-slate-900 hover:bg-black shadow-slate-300"
          } text-white`}
        >
          {loading ? "Sinkronisasi..." : sudahDinilai ? "Perbarui Penilaian 🔄" : "Simpan Nilai Sekarang →"}
        </button>
      </div>
    </main>
  );
}