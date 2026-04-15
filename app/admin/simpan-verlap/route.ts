import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb"; // Pastikan path ini sesuai dengan file DB kamu
import User from "@/lib/models/User"; // Pastikan path ini sesuai dengan model Mongoose kamu

export async function POST(req: Request) {
  try {
    // 1. Buka gerbang ke MongoDB
    await connectMongoDB();

    // 2. Tangkap paket data dari Modal Dashboard tadi
    const body = await req.json();
    const { username, nilai_verlap, detail_verlap, tingkat_verlap } = body;

    // Pastikan ID/username ada
    if (!username) {
      return NextResponse.json({ error: "Username/ID Peserta tidak ditemukan!" }, { status: 400 });
    }

    // 3. Cari peserta dan Update datanya di Database
    const updatedPeserta = await User.findOneAndUpdate(
      { username: username }, // Cari berdasarkan username
      { 
        $set: {
          nilai_verlap: nilai_verlap,       // Total Skor Verlap (misal: 85.5)
          detail_verlap: detail_verlap,     // Rekap ketikan per poin (JSON)
          tingkat_verlap: tingkat_verlap    // "RT" atau "RW"
        } 
      },
      { new: true } // Return data yang paling fresh
    );

    // Kalau peserta nggak ketemu di database
    if (!updatedPeserta) {
      return NextResponse.json({ error: "Data Bank Sampah tidak ditemukan di database." }, { status: 404 });
    }

    // 4. Kirim sinyal sukses balik ke Dashboard!
    return NextResponse.json({ 
      message: "Data Verifikasi Lapangan sukses disimpan!", 
      data: updatedPeserta 
    }, { status: 200 });

  } catch (error) {
    console.error("Error API Simpan Verlap:", error);
    return NextResponse.json({ error: "Gagal menyimpan data ke server." }, { status: 500 });
  }
}