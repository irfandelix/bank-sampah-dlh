"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Mencegah error hydration (kedip pas pertama loading)
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-10 h-10"></div>; 

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-amber-400 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
      title="Ganti Tema"
    >
      <span className="text-xl">{theme === "dark" ? "🌙" : "☀️"}</span>
    </button>
  );
}