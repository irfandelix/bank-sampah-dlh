"use client";

import { useState, useEffect } from "react";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout";
import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

const DAFTAR_BERKAS = [
  { kategori: "Kategori I: Pengelolaan Sampah", items: [ { id: "Kat. I No. 1", label: "Laporan hasil penimbangan" }, { id: "Kat. I No. 2", label: "SK, Jml Nasabah, KK RT/RW" }, { id: "Kat. I No. 3", label: "Laporan kegiatan penimbangan" }, { id: "Kat. I No. 4", label: "Neraca, buku tabungan & tamu" }, { id: "Kat. I No. 5", label: "Foto dokumentasi kegiatan" }, { id: "Kat. I No. 6", label: "Pencatatan sampah organik" }, { id: "Kat. I No. 7", label: "Surat pengantar/Screenshot" } ] },
  { kategori: "Kategori II: Fasilitas & Infrastruktur", items: [ { id: "Kat. II No. 1", label: "Foto Ruang Pelayanan" }, { id: "Kat. II No. 2", label: "Foto Area Penyimpanan" }, { id: "Kat. II No. 3", label: "Foto Peralatan" }, { id: "Kat. II No. 4", label: "Foto Kebersihan & Keamanan" } ] },
  { kategori: "Kategori III: Tata Kelola & Administrasi", items: [ { id: "Kat. III No. 1", label: "SK Pendirian Bank Sampah" }, { id: "Kat. III No. 2", label: "Foto Papan Nama, SK, Struktur" }, { id: "Kat. III No. 3", label: "Foto Pembagian tugas tertulis" }, { id: "Kat. III No. 4", label: "Foto SOP tertulis" }, { id: "Kat. III No. 5", label: "Foto Dokumentasi Penimbangan" }, { id: "Kat. III No. 6", label: "Foto Administrasi" } ] },
  { kategori: "Kategori IV: Inovasi Bank Sampah", items: [ { id: "Kat. IV No. 1", label: "SK/Foto Inovasi" } ] },
  { kategori: "Kategori V: Dukungan Desa", items: [ { id: "Kat. V No. 1", label: "DPA Desa/Foto Dokumentasi" } ] }
];

export default function ManajemenBerkasPeserta() {
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sudahAdaDiDrive, setSudahAdaDiDrive] = useState<Record<string, string>>({});
  const [isWaktuHabis, setIsWaktuHabis] = useState(false);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchData(parsedUser.namaInstansi || parsedUser.username);
    }
  }, []);

  const fetchData = async (namaPeserta: string) => {
    setLoading(true);
    try {
      // 1. Cek Berkas di Drive
      const resBerkas = await fetch("/api/peserta/cek-berkas", {
        method: "POST",
        body: JSON.stringify({ namaPeserta }),
      });
      const dataB = await resBerkas.json();
      if (dataB.berkasTerisi) setSudahAdaDiDrive(dataB.berkasTerisi);

      // 2. Cek Deadline
      const resDeadline = await fetch("/api/pengaturan");
      const dataD = await resDeadline.json();
      if (dataD.deadline) {
        if (new Date() > new Date(dataD.deadline)) setIsWaktuHabis(true);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data");
    } finally {
      setLoading(false);
    }
  };

  const hapusFile = async (idBerkas: string) => {
    if (isWaktuHabis) return;
    if (!confirm(`Hapus berkas "${idBerkas}"? Anda harus mengunggah ulang setelah dihapus.`)) return;

    setDeletingId(idBerkas);
    try {
      const res = await fetch("/api/peserta/hapus-gdrive", {
        method: "POST",
        body: JSON.stringify({
          namaPeserta: user.namaInstansi || user.username,
          namaFolder: idBerkas,
        }),
      });

      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Terhapus!", message: "Berkas berhasil dihapus dari Google Drive." });
        // Update local state
        const updated = { ...sudahAdaDiDrive };
        delete updated[idBerkas];
        setSudahAdaDiDrive(updated);
      } else {
        throw new Error("Gagal menghapus file di Drive.");
      }
    } catch (err: any) {
      setModal({ isOpen: true, type: "error", title: "Gagal", message: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 pt-[100px] transition-colors duration-300">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/peserta" className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100">←</Link>
          <div className="flex flex-col">
            <h1 className="text-lg font-black dark:text-white leading-none">Manajemen <span className="text-amber-500">Berkas</span></h1>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Audit & Modifikasi Dokumen</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TombolLogout />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Warning Section */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-4">
          <div className="text-3xl">⚙️</div>
          <div>
            <h2 className="font-black text-amber-800 dark:text-amber-400">Pusat Kendali Dokumen</h2>
            <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">Halaman ini digunakan untuk memeriksa kembali file yang sudah Anda kirim. Anda dapat menghapus file yang salah untuk diganti dengan yang baru melalui menu Setor Dokumen.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 opacity-50 font-bold animate-pulse">Menyinkronkan Laci Drive...</div>
        ) : (
          <div className="space-y-8">
            {DAFTAR_BERKAS.map((kat, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 transition-colors">
                <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 border-b dark:border-slate-800 pb-4">{kat.kategori}</h3>
                <div className="grid gap-3">
                  {kat.items.map((item) => {
                    const link = sudahAdaDiDrive[item.id];
                    return (
                      <div key={item.id} className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all ${link ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-900/5' : 'border-slate-100 dark:border-slate-800 opacity-60'}`}>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase mb-1">{item.id}</p>
                          <h4 className="text-sm font-bold dark:text-slate-200">{item.label}</h4>
                          <p className="text-[10px] mt-1 font-bold text-slate-400">{link ? "✅ File Tersimpan di Drive" : "❌ Belum Ada File"}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {link ? (
                            <>
                              <a href={link} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none text-center bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm">Buka</a>
                              <button 
                                onClick={() => hapusFile(item.id)} 
                                disabled={deletingId === item.id || isWaktuHabis}
                                className={`flex-1 sm:flex-none bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-sm ${isWaktuHabis ? 'opacity-30 cursor-not-allowed' : 'hover:bg-red-600 hover:text-white transition-all'}`}
                              >
                                {deletingId === item.id ? "..." : "Hapus"}
                              </button>
                            </>
                          ) : (
                            <Link href="/peserta/upload" className="w-full sm:w-auto text-center bg-slate-100 dark:bg-slate-800 text-slate-400 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-slate-200 dark:border-slate-700">Setor Sekarang</Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isWaktuHabis && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-full font-black uppercase text-xs shadow-2xl animate-bounce border-2 border-white">
          🚫 Perubahan Dikunci (Deadline Lewat)
        </div>
      )}
    </main>
  );
}