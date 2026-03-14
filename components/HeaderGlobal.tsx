"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";
import TombolLogout from "./TombolLogout";

export default function HeaderGlobal() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, [pathname]);

  // 1️⃣ SEMBUNYIKAN HEADER DI HALAMAN LOGIN
  if (pathname === "/") return null;

  // 2️⃣ LOGIKA DINAMIS BERDASARKAN URL
  let title = "Dashboard";
  let titleColor = "text-slate-800";
  let subtitle = "Sistem Monitoring";
  let roleDisplay = "Pengguna";
  let roleType = "Akses Sistem";
  let icon = "⚙️";
  let iconBg = "bg-slate-100 text-slate-700";

  if (pathname.startsWith("/admin")) {
    title = "Command Center";
    titleColor = "text-emerald-600";
    subtitle = "Monitoring Bank Sampah 2026";
    roleDisplay = "Admin Utama";
    roleType = "Sragen Regency";
    icon = "DLH";
    iconBg = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  } else if (pathname.startsWith("/peserta")) {
    title = "Portal";
    titleColor = "text-emerald-600";
    subtitle = "Bank Sampah 2026";
    roleDisplay = user?.namaInstansi || user?.username || "Memuat...";
    roleType = "Peserta Lomba";
    icon = "🏦";
    iconBg = "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
  } else if (pathname.startsWith("/juri")) {
    title = "Panel";
    titleColor = "text-amber-500";
    subtitle = "Dewan Juri Lomba";
    roleDisplay = user?.username ? `Juri ${user.username}` : "Memuat...";
    roleType = "Tim Evaluasi";
    icon = "⚖️";
    iconBg = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
  }

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-[70px] md:h-[80px] flex justify-between items-center fixed top-0 left-0 w-full z-[9999] shadow-sm box-border transition-colors">
      <div className="flex flex-col justify-center min-w-0 mr-2">
        <h1 className="text-base sm:text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none truncate">
          {title.split(" ")[0]} <span className={titleColor}>{title.split(" ")[1] || ""}</span>
        </h1>
        <p className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-none truncate">
          {subtitle}
        </p>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />
        <TombolLogout />
        <div className="flex items-center gap-2 md:gap-3 border-l border-slate-200 dark:border-slate-700 pl-2 md:pl-4 ml-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-slate-800 dark:text-white leading-none uppercase truncate max-w-[150px]">
              {roleDisplay}
            </p>
            <p className={`text-[10px] font-bold uppercase mt-1 tracking-wider leading-none ${titleColor}`}>
              {roleType}
            </p>
          </div>
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black border text-xs md:text-xl shrink-0 ${iconBg}`}>
            {icon}
          </div>
        </div>
      </div>
    </header>
  );
}