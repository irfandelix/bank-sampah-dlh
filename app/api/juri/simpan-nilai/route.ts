import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { idPeserta, skorBaru, juriRole } = await req.json();
    await connectMongoDB();

    const user = await User.findById(idPeserta);
    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // Paksa role jadi huruf kecil agar cocok dengan mapping
    const roleInput = juriRole?.toLowerCase();

    const mappingField: any = {
      "juri_dlh": "skorDLH",
      "juri_dkk": "skorDKK",
      "juri_bsi": "skorBSI",
      "juri_pmd": "skorPMD",
    };

    const targetField = mappingField[roleInput];
    if (!targetField) return NextResponse.json({ error: "Role juri tidak valid" }, { status: 400 });

    // 🔒 CEK APAKAH SUDAH ADA NILAI (LOCKING)
    // Kita cek apakah field tersebut sudah ada isinya dan lebih dari 0
    if (user[targetField] && user[targetField] > 0) {
      return NextResponse.json(
        { error: "NILAI TERKUNCI! Anda sudah mengirim nilai sebelumnya." }, 
        { status: 403 }
      );
    }

    // Jika belum ada, baru update
    const userUpdate = await User.findByIdAndUpdate(
      idPeserta,
      { [targetField]: Number(skorBaru) },
      { new: true }
    );

    // Hitung ulang total
    const totalBaru = 
      (userUpdate.skorDLH || 0) + 
      (userUpdate.skorDKK || 0) + 
      (userUpdate.skorBSI || 0) + 
      (userUpdate.skorPMD || 0);

    await User.findByIdAndUpdate(idPeserta, { skor: totalBaru, skorTotal: totalBaru });

    return NextResponse.json({ message: "Berhasil dikunci!" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal simpan" }, { status: 500 });
  }
}