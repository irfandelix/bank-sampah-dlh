"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Mencegah Hydration Mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10"></div>;
  }

  // Gunakan resolvedTheme biar lebih akurat mendeteksi mode asli (dark/light)
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-90"
      title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
    >
      <span className="text-xl">
        {/* 🌙 Kalau sekarang gelap, kasih ikon Bulan (atau Matahari jika ingin sebaliknya) */}
        {/* Biasanya: Ikon yang tampil adalah TUJUAN atau status saat ini */}
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}