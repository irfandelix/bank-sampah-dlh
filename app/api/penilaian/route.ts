import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User"; // Sesuaikan path ini dengan lokasimu

export async function POST(req: Request) {
  try {
    const { usernamePeserta, skorBaru, juriRole } = await req.json();

    await connectMongoDB();

    // 1. Cari peserta di database
    const peserta = await User.findOne({ username: usernamePeserta });
    if (!peserta) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // 2. Tentukan field mana yang diisi berdasarkan role Juri
    let updateData: any = {};
    if (juriRole === "juri_dlh") updateData.skorDLH = skorBaru;
    else if (juriRole === "juri_dkk") updateData.skorDKK = skorBaru;
    else if (juriRole === "juri_bsi") updateData.skorBSI = skorBaru;
    else if (juriRole === "juri_pmd") updateData.skorPMD = skorBaru;
    else {
      return NextResponse.json({ error: "Role juri tidak valid" }, { status: 400 });
    }

    // 3. Simpan nilai spesifik dari juri tersebut
    await User.findOneAndUpdate({ username: usernamePeserta }, updateData);

    // 4. Hitung ulang total (ambil data paling baru setelah di-update)
    const userUpdate = await User.findOne({ username: usernamePeserta });
    const totalBaru = 
      (userUpdate.skorDLH || 0) + 
      (userUpdate.skorDKK || 0) + 
      (userUpdate.skorBSI || 0) + 
      (userUpdate.skorPMD || 0);

    // 5. Simpan Skor Akhir untuk Klasemen
    await User.findOneAndUpdate(
      { username: usernamePeserta }, 
      { skorTotal: totalBaru, skor: totalBaru } 
    );

    return NextResponse.json({ 
      message: "Penilaian berhasil disimpan!", 
      totalSekarang: totalBaru 
    }, { status: 200 });

  } catch (error) {
    console.error("Gagal simpan nilai:", error);
    return NextResponse.json({ error: "Gagal memproses penilaian" }, { status: 500 });
  }
}