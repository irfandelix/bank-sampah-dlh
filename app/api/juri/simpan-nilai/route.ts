import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const { idPeserta, skorBaru, juriRole } = await req.json();

    await connectMongoDB();
    const user = await User.findById(idPeserta);

    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // 1. Tentukan field juri
    const mappingField: any = {
      "juri_dlh": "skorDLH",
      "juri_dkk": "skorDKK",
      "juri_bsi": "skorBSI",
      "juri_pmd": "skorPMD",
    };
    const targetField = mappingField[juriRole];

    // 2. PROTEKSI: Jika nilai sudah ada (di atas 0), TOLAK PERUBAHAN
    if (user[targetField] > 0) {
      return NextResponse.json(
        { error: "Akses Ditolak! Nilai sudah dikunci oleh sistem." }, 
        { status: 403 }
      );
    }

    // 3. Jika belum ada, lakukan Update
    const userUpdate = await User.findByIdAndUpdate(
      idPeserta,
      { [targetField]: Number(skorBaru) },
      { new: true }
    );

    // 4. Hitung Total Akhir secara otomatis
    const totalBaru = 
      (userUpdate.skorDLH || 0) + 
      (userUpdate.skorDKK || 0) + 
      (userUpdate.skorBSI || 0) + 
      (userUpdate.skorPMD || 0);

    // 5. Simpan ke Klasemen
    await User.findByIdAndUpdate(idPeserta, { skor: totalBaru, skorTotal: totalBaru });

    return NextResponse.json({ message: "Nilai berhasil dikunci!" }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}