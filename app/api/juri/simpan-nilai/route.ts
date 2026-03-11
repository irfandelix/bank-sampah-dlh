import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { idPeserta, skorBaru, juriRole } = await req.json();
    
    if (!idPeserta || !skorBaru || !juriRole) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await connectMongoDB();
    const user = await User.findById(idPeserta);
    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // Paksa huruf kecil
    const roleInput = juriRole.toLowerCase(); 

    const mappingField: Record<string, string> = {
      "juri_dlh": "skorDLH",
      "juri_dkk": "skorDKK",
      "juri_bsi": "skorBSI",
      "juri_pmd": "skorPMD",
    };

    const targetField = mappingField[roleInput];
    if (!targetField) return NextResponse.json({ error: "Role juri tidak valid" }, { status: 400 });

    // 🔒 PERTAHANAN UTAMA: Tolak jika nilai di database sudah ada (Lebih dari 0)
    if (user[targetField] && user[targetField] > 0) {
      return NextResponse.json(
        { error: "AKSES DITOLAK! Nilai sudah dikunci dan tidak dapat diubah." }, 
        { status: 403 }
      );
    }

    // Jika aman (masih 0 atau kosong), simpan nilainya!
    const userUpdate = await User.findByIdAndUpdate(
      idPeserta,
      { [targetField]: Number(skorBaru) },
      { new: true }
    );

    // Hitung ulang total skor
    const totalBaru = 
      (userUpdate.skorDLH || 0) + 
      (userUpdate.skorDKK || 0) + 
      (userUpdate.skorBSI || 0) + 
      (userUpdate.skorPMD || 0);

    // Simpan ke total
    await User.findByIdAndUpdate(idPeserta, { skor: totalBaru, skorTotal: totalBaru });

    return NextResponse.json({ message: "Berhasil disimpan dan dikunci!" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan ke database" }, { status: 500 });
  }
}