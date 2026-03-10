"use client";

interface ModalProps {
  isOpen: boolean;
  type: "success" | "error" | "";
  title?: string; // Judul opsional
  message: string;
  onClose: () => void;
}

export default function ModalNotif({ isOpen, type, title, message, onClose }: ModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform animate-in zoom-in-95 duration-200">
        
        {/* Ikon */}
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 shadow-inner ${
          isSuccess ? 'bg-emerald-100 text-emerald-500 text-4xl' : 'bg-red-100 text-red-500 text-4xl'
        }`}>
          {isSuccess ? '🎉' : '⚠️'}
        </div>
        
        {/* Judul */}
        <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">
          {title || (isSuccess ? 'Berhasil!' : 'Terjadi Kendala')}
        </h3>
        
        {/* Pesan */}
        <p className="text-slate-600 mb-8 leading-relaxed">
          {message}
        </p>
        
        {/* Tombol Tutup */}
        <button 
          onClick={onClose}
          className={`w-full font-bold py-3.5 rounded-xl shadow-md active:scale-95 transition-all ${
            isSuccess 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Tutup & Lanjut
        </button>
      </div>
    </div>
  );
}