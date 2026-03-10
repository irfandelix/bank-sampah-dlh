"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ModalNotif from "./ModalNotif";

export default function TombolLogout() {
  const router = useRouter();
  const [modal, setModal] = useState({ isOpen: false, type: "", title: "", message: "" });

  const handleLogout = () => {
    // 1. Tampilkan Modal Perpisahan
    setModal({
      isOpen: true,
      type: "success",
      title: "Sampai Jumpa!",
      message: "Anda telah berhasil keluar dari sistem. Terima kasih atas kontribusinya untuk kebersihan Sragen! 🌱",
    });

    // 2. Bersihkan Memori Browser
    sessionStorage.removeItem("user");

    // 3. Tunggu sebentar agar user bisa baca modal, lalu pindah halaman
    setTimeout(() => {
      router.push("/");
    }, 2500);
  };

  return (
    <>
      <ModalNotif 
        isOpen={modal.isOpen} 
        type={modal.type as any} 
        title={modal.title} 
        message={modal.message} 
        onClose={() => {}} // Sengaja dikosongkan agar user tidak bisa menutup manual saat redirect
      />
      
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border border-red-100"
      >
        🚪 Keluar
      </button>
    </>
  );
}