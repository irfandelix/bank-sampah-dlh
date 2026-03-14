import type { Config } from "tailwindcss";

const config: Config = {
  // 🟢 INI KUNCINYA! Tanpa ini, Tailwind nggak akan ganti warna pas class "dark" ada/hilang
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