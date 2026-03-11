import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const role = searchParams.get("role")?.toLowerCase(); // Paksa kecil di sini juga

  await connectMongoDB();
  const user = await User.findById(id).lean();

  if (!user) return NextResponse.json({ error: "Gak ketemu" }, { status: 404 });

  const mappingField: any = {
    "juri_dlh": user.skorDLH || 0,
    "juri_dkk": user.skorDKK || 0,
    "juri_bsi": user.skorBSI || 0,
    "juri_pmd": user.skorPMD || 0,
  };

  return NextResponse.json({
    namaInstansi: user.namaInstansi,
    kecamatan: user.kecamatan,
    nilaiLama: mappingField[role || ""] || 0
  });
}