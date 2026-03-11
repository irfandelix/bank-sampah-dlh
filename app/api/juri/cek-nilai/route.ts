import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    // Paksa huruf kecil biar aman
    const role = searchParams.get("role")?.toLowerCase() || ""; 

    if (!id || !role) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await connectMongoDB();
    const user = await User.findById(id).lean();

    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // Map role juri ke nama kolom di database kamu
    const mappingField: Record<string, number> = {
      "juri_dlh": user.skorDLH || 0,
      "juri_dkk": user.skorDKK || 0,
      "juri_bsi": user.skorBSI || 0,
      "juri_pmd": user.skorPMD || 0,
    };

    const nilaiLama = mappingField[role] || 0;
    
    // Kirim data ke frontend
    return NextResponse.json({
      namaInstansi: user.namaInstansi,
      kecamatan: user.kecamatan,
      nilaiLama: nilaiLama,
      isLocked: nilaiLama > 0 // Kalau lebih dari 0, statusnya TERKUNCI = true
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}