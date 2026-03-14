import type { Config } from "tailwindcss";

const config: Config = {
  // 🟢 INI KUNCI RAHASIANYA! 
  // Biar Tailwind tahu kita mau kontrol dark mode manual lewat tombol
  darkMode: "class", 
  
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;