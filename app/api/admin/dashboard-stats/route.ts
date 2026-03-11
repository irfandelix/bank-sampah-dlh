import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await connectMongoDB();

    // 1. Ambil semua peserta, urutkan skor dari besar ke kecil (descending)
    const klasemen = await User.find({ role: "peserta" })
      .select("namaInstansi username skor kecamatan") // ✅ TAMBAHKAN 'kecamatan' DI SINI!
      .sort({ skor: -1 });

    // 2. Hitung statistik ringkas
    const totalPeserta = klasemen.length;
    const sudahDinilai = klasemen.filter(p => p.skor > 0).length;
    const tertinggi = klasemen.length > 0 ? klasemen[0] : null;

    return NextResponse.json({
      klasemen,
      stats: {
        totalPeserta,
        sudahDinilai,
        tertinggi: tertinggi ? `${tertinggi.skor} (${tertinggi.namaInstansi})` : "-"
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data dashboard" }, { status: 500 });
  }
}