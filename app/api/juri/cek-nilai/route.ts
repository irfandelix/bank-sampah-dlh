import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const role = searchParams.get("role"); // juri_dlh, dll

  await connectMongoDB();
  const user = await User.findById(id).lean();

  if (!user) return NextResponse.json({ error: "Gak ada" }, { status: 404 });

  // Ambil nilai lama berdasarkan siapa juri yang nanya
  const fieldMapping: any = {
    "juri_dlh": user.skorDLH,
    "juri_dkk": user.skorDKK,
    "juri_bsi": user.skorBSI,
    "juri_pmd": user.skorPMD,
  };

  return NextResponse.json({
    namaInstansi: user.namaInstansi,
    kecamatan: user.kecamatan,
    nilaiLama: fieldMapping[role as string] || 0
  });
}