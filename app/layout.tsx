import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import HeaderGlobal from "@/components/HeaderGlobal";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Command Center DLH | Bank Sampah 2026",
  description: "Sistem Monitoring & Penilaian Bank Sampah Kabupaten Sragen",
  icons: { icon: "/waste.ico", apple: "/waste.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <HeaderGlobal />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}