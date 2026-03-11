import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    // 🔥 TAMBAH: Terima 'detailSkor' dari frontend
    const { idPeserta, skorBaru, juriRole, detailSkor } = await req.json();
    
    if (!idPeserta || !skorBaru || !juriRole) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await connectMongoDB();
    const user = await User.findById(idPeserta);
    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    const roleInput = juriRole.toLowerCase(); 
    const mappingField: Record<string, string> = {
      "juri_dlh": "skorDLH",
      "juri_dkk": "skorDKK",
      "juri_bsi": "skorBSI",
      "juri_pmd": "skorPMD",
    };

    const targetField = mappingField[roleInput];
    if (!targetField) return NextResponse.json({ error: "Role juri tidak valid" }, { status: 400 });

    if (user[targetField] && user[targetField] > 0) {
      return NextResponse.json({ error: "AKSES DITOLAK! Nilai sudah dikunci." }, { status: 403 });
    }

    // 🔥 BIKIN KOLOM BARU DI DB: 'detail_juri_dlh', dll.
    const detailField = `detail_${roleInput}`;

    const userUpdate = await User.findByIdAndUpdate(
      idPeserta,
      { 
        [targetField]: Number(skorBaru),
        [detailField]: detailSkor // 👈 Simpan jejak tombol yang dipencet
      },
      { new: true }
    );

    const totalBaru = (userUpdate.skorDLH || 0) + (userUpdate.skorDKK || 0) + (userUpdate.skorBSI || 0) + (userUpdate.skorPMD || 0);
    await User.findByIdAndUpdate(idPeserta, { skor: totalBaru, skorTotal: totalBaru });

    return NextResponse.json({ message: "Berhasil disimpan dan dikunci!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menyimpan ke database" }, { status: 500 });
  }
}