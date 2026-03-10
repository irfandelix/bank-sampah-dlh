"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "@/components/ModalNotif";
import TombolLogout from "@/components/TombolLogout"; // Import Baru

export default function FormUploadPeserta() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [fileSKObj, setFileSKObj] = useState<File | null>(null);
  const [fileFotoObj, setFileFotoObj] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (!savedUser) router.push("/"); else setUser(JSON.parse(savedUser));
  }, [router]);

  const handleSubmit = async () => {
    if (!fileSKObj || !fileFotoObj) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fileSK", fileSKObj);
      formData.append("fileFoto", fileFotoObj);
      formData.append("folderId", user.driveFolderId);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        setModal({ isOpen: true, type: "success", title: "Berhasil!", message: "Berkas tersimpan di Google Drive." });
        setFileSKObj(null); setFileFotoObj(null);
      }
    } finally { setLoading(false); }
  };

  if (!user) return <div className="p-10 text-center font-bold">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 relative">
      <ModalNotif isOpen={modal.isOpen} type={modal.type as any} title={modal.title} message={modal.message} onClose={() => setModal({ ...modal, isOpen: false })} />

      {/* --- HEADER PESERTA DENGAN LOGOUT --- */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center rounded-full text-xl">👤</div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Login Sebagai:</p>
            <p className="text-sm font-black text-slate-800">{user.namaInstansi}</p>
          </div>
        </div>
        <TombolLogout />
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
          <h1 className="text-2xl font-black text-slate-800">Portal Unggah Berkas</h1>
          <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-widest">Lomba Bank Sampah 2026</p>
        </div>

        {/* Form Upload Tetap Sama */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center">
            <h3 className="font-bold text-slate-800">SK Kepengurusan (PDF)</h3>
            <input type="file" id="sk" accept=".pdf" className="hidden" onChange={(e) => setFileSKObj(e.target.files![0])} />
            <label htmlFor="sk" className="cursor-pointer bg-slate-100 py-2.5 px-6 rounded-xl font-bold text-sm">{fileSKObj ? "Ganti" : "Pilih PDF"}</label>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center">
            <h3 className="font-bold text-slate-800">Foto Area Pemilahan</h3>
            <input type="file" id="foto" accept="image/*" className="hidden" onChange={(e) => setFileFotoObj(e.target.files![0])} />
            <label htmlFor="foto" className="cursor-pointer bg-slate-100 py-2.5 px-6 rounded-xl font-bold text-sm">{fileFotoObj ? "Ganti" : "Pilih Foto"}</label>
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full bg-slate-900 text-white font-black py-4 rounded-3xl shadow-xl active:scale-95 disabled:opacity-50">
          {loading ? "Mengirim ke Drive..." : "Kirim Berkas 🚀"}
        </button>
      </div>
    </main>
  );
}