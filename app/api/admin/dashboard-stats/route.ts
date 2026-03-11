import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongoDB();

    // 🕵️‍♂️ DETEKTIF: Cari SEMUA data tanpa filter role
    const semuaUser = await User.find({}).lean();
    console.log("ISI DATABASE SAAT INI:", semuaUser);

// 1. Ambil Klasemen (Gunakan Regex agar "PESERTA" atau "peserta" dua-duanya ketemu)
    const klasemen = await User.find({ role: { $regex: /^peserta$/i } })
      .select("namaInstansi username skor kecamatan")
      .sort({ skor: -1 })
      .lean();

    // 2. Hitung Statistik (Sama, pakai Regex 'i' untuk case-insensitive)
    const totalPeserta = await User.countDocuments({ role: { $regex: /^peserta$/i } });
    const sudahDinilai = await User.countDocuments({ 
      role: { $regex: /^peserta$/i }, 
      skor: { $gt: 0 } 
    });

    return NextResponse.json({
      debug_total_semua_user: semuaUser.length, // Tambahan buat ngecek
      klasemen: klasemen || [],
      stats: {
        totalPeserta: totalPeserta,
        sudahDinilai: sudahDinilai,
        tertinggi: klasemen.length > 0 ? `${klasemen[0].skor} (${klasemen[0].namaInstansi})` : "-"
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}