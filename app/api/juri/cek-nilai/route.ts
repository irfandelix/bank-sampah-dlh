import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const roleRaw = searchParams.get("role") || "";

    // 🕵️‍♂️ NORMALISASI: Paksa ke HURUF BESAR (JURI_DLH)
    const role = roleRaw.toUpperCase();

    await connectMongoDB();
    const user = await User.findById(id).lean();

    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // Mapping field sesuai model di database
    const mappingField: any = {
      "JURI_DLH": user.skorDLH,
      "JURI_DKK": user.skorDKK,
      "JURI_BSI": user.skorBSI,
      "JURI_PMD": user.skorPMD,
    };

    const nilaiLama = mappingField[role] || 0;

    // LOG UNTUK DEBUG (Muncul di terminal VS Code/Vercel)
    console.log(`DEBUG: ID ${id} | Role ${role} | Nilai Ditemukan: ${nilaiLama}`);

    return NextResponse.json({
      namaInstansi: user.namaInstansi,
      kecamatan: user.kecamatan,
      nilaiLama: Number(nilaiLama) // Pastikan dikirim sebagai angka murni
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal cek data" }, { status: 500 });
  }
}