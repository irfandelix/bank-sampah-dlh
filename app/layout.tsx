import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Command Center DLH | Bank Sampah 2026",
  description: "Sistem Monitoring & Penilaian Bank Sampah Kabupaten Sragen",
  icons: {
    // 🛡️ Cara aman: Panggil nama file baru kamu di sini
    icon: "/waste.ico", 
    // Kalau punya versi apple-touch-icon juga bisa ditambah:
    apple: "/waste.ico", 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
