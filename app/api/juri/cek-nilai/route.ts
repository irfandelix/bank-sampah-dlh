import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role")?.toLowerCase() || ""; 

    if (!id || !role) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

    await connectMongoDB();
    const user = await User.findById(id).lean();

    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    const mappingField: Record<string, number> = {
      "juri_dlh": user.skorDLH || 0,
      "juri_dkk": user.skorDKK || 0,
      "juri_bsi": user.skorBSI || 0,
      "juri_pmd": user.skorPMD || 0,
    };

    const nilaiLama = mappingField[role] || 0;
    const detailField = `detail_${role}`; // 👈 Cari jejak jawaban di DB
    const detailLama = (user as any)[detailField] || {}; // Ambil detailnya

    return NextResponse.json({
      namaInstansi: user.namaInstansi,
      kecamatan: user.kecamatan,
      nilaiLama: nilaiLama,
      detailLama: detailLama, // 👈 Kirim detailnya ke Frontend
      isLocked: nilaiLama > 0
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}