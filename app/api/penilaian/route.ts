import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { usernamePeserta, skorBaru, juriRole } = body;

    // 1. Validasi Data Masuk
    if (!usernamePeserta || skorBaru === undefined || !juriRole) {
      return NextResponse.json({ error: "Data dari Juri tidak lengkap" }, { status: 400 });
    }

    // 2. Buka Brankas MongoDB (Cara Mongoose)
    await connectMongoDB();

    // 3. Cari Bank Sampah yang sedang dinilai
    const peserta = await User.findOne({ username: usernamePeserta });
    
    if (!peserta) {
      return NextResponse.json({ error: "Bank Sampah tidak ditemukan" }, { status: 404 });
    }

    // 4. Buka laci nilai yang lama (kalau kosong, isi 0)
    let skor_dlh = peserta.skor_dlh || 0;
    let skor_bapperida = peserta.skor_bapperida || 0;
    let skor_pmd = peserta.skor_pmd || 0;

    // 5. Masukkan skor baru dari Juri ke lacinya masing-masing
    if (juriRole === "juri_dlh") {
      skor_dlh = skorBaru;
    } else if (juriRole === "juri_bapperida") {
      skor_bapperida = skorBaru;
    } else if (juriRole === "juri_pmd") {
      skor_pmd = skorBaru;
    }

    // 6. Kalkulasi Nilai Akhir (Maksimal 100)
    const totalSkor = Math.round(skor_dlh + skor_bapperida + skor_pmd);

    // 7. Simpan kembali ke Database
    // (strict: false ditambahkan agar Mongoose tidak menghapus laci baru kita)
    await User.updateOne(
      { username: usernamePeserta },
      { 
        $set: { 
          skor_dlh: skor_dlh,
          skor_bapperida: skor_bapperida,
          skor_pmd: skor_pmd,
          skor: totalSkor // Skor Utama yang dibaca Peta
        } 
      },
      { strict: false } 
    );

    return NextResponse.json({ 
      success: true, 
      message: "Penilaian berhasil digabungkan!", 
      totalSkor: totalSkor 
    });

  } catch (error) {
    console.error("Gagal menyimpan penilaian:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}