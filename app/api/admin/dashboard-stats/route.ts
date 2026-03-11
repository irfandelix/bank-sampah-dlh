import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

// Matikan cache biar data yang ditarik selalu fresh real-time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongoDB();
    
    // Ambil semua data akun yang role-nya "PESERTA"
    const daftarPeserta = await User.find({ role: { $regex: /peserta/i } }).lean();

    // Petakan dan siapkan datanya untuk dikirim ke Dashboard
    const klasemen = daftarPeserta
      .map((p: any) => ({
        username: p.username,
        namaInstansi: p.namaInstansi,
        kecamatan: p.kecamatan,
        skor: p.skor || 0,
        // 🔥 INI RAHASIANYA: Pastikan nilai juri ini ikut dikirim ke depan!
        skorDLH: p.skorDLH || 0,
        skorDKK: p.skorDKK || 0,
        skorBSI: p.skorBSI || 0,
        skorPMD: p.skorPMD || 0,
      }))
      .sort((a, b) => b.skor - a.skor); // Urutkan dari skor tertinggi ke terendah

    // Hitung statistik untuk kotak-kotak di atas Dashboard
    const totalPeserta = klasemen.length;
    const sudahDinilai = klasemen.filter((k) => k.skor > 0).length;
    const tertinggi = klasemen.length > 0 && klasemen[0].skor > 0 ? klasemen[0].skor.toFixed(2) : "-";

    return NextResponse.json({
      klasemen,
      stats: { totalPeserta, sudahDinilai, tertinggi }
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Gagal menarik data klasemen" }, { status: 500 });
  }
}