import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role");

    await connectMongoDB();
    const user = await User.findById(id).lean();

    if (!user) {
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    // Pemetaan field skor berdasarkan role juri
    const fieldMapping: any = {
      "juri_dlh": user.skorDLH || 0,
      "juri_dkk": user.skorDKK || 0,
      "juri_bsi": user.skorBSI || 0,
      "juri_pmd": user.skorPMD || 0,
    };

    return NextResponse.json({
      namaInstansi: user.namaInstansi,
      kecamatan: user.kecamatan,
      nilaiLama: fieldMapping[role as string] || 0
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}