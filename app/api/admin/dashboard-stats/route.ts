import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongoDB();
    
    // 1. Ambil data mentah dari MongoDB
    const daftarPeserta = await User.find({ role: { $regex: /peserta/i } }).lean();

    // 2. Bungkus semua data (Adm & Verlap) biar Frontend bisa milih
    const klasemen = daftarPeserta.map((p: any) => ({
      username: p.username,
      namaInstansi: p.namaInstansi,
      kecamatan: p.kecamatan,
      // Data Administrasi (Hasil Input Juri)
      skor: p.skor || 0, 
      skorDLH: p.skorDLH || 0,
      skorDKK: p.skorDKK || 0,
      skorBSI: p.skorBSI || 0,
      skorPMD: p.skorPMD || 0,
      // Data Verifikasi Lapangan (Hasil Input Admin)
      nilai_verlap: p.nilai_verlap || 0,
      detail_verlap: p.detail_verlap || {},
      tingkat_verlap: p.tingkat_verlap || "RW"
    }));

    // 3. Hitung Stats (Default pake Administrasi biar dashboard konsisten)
    const totalPeserta = klasemen.length;
    const sudahDinilai = klasemen.filter((k) => k.skor > 0).length;
    
    // Ambil yang tertinggi dari Administrasi
    const sortedByAdm = [...klasemen].sort((a, b) => b.skor - a.skor);
    const tertinggi = sortedByAdm.length > 0 && sortedByAdm[0].skor > 0 
      ? { skor: sortedByAdm[0].skor.toFixed(2), nama: sortedByAdm[0].namaInstansi } 
      : { skor: "-", nama: "Belum Ada Data" };

    return NextResponse.json({
      klasemen, // Kirim semua data mentah ke Dashboard
      stats: { totalPeserta, sudahDinilai, tertinggi }
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Gagal menarik data" }, { status: 500 });
  }
}