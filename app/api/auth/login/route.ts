import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username dan Password wajib diisi!" }, { status: 400 });
    }

    // ==========================================
    // 1. CEK JALUR RAHASIA (BACA DARI FILE .env)
    // ==========================================
    if (username === "admin" && password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ pesan: "Login berhasil!", user: { username: "admin", role: "admin", namaInstansi: "Command Center" } }, { status: 200 });
    }
    if (username === "juri_dlh" && password === process.env.JURI_DLH_PASSWORD) {
      return NextResponse.json({ pesan: "Login berhasil!", user: { username: "juri_dlh", role: "juri_dlh", namaInstansi: "Tim Penilai DLH" } }, { status: 200 });
    }
    if (username === "juri_bapperida" && password === process.env.JURI_BAPPERIDA_PASSWORD) {
      return NextResponse.json({ pesan: "Login berhasil!", user: { username: "juri_bapperida", role: "juri_bapperida", namaInstansi: "Tim Penilai Bapperida" } }, { status: 200 });
    }
    if (username === "juri_pmd" && password === process.env.JURI_PMD_PASSWORD) {
      return NextResponse.json({ pesan: "Login berhasil!", user: { username: "juri_pmd", role: "juri_pmd", namaInstansi: "Tim Penilai PMD" } }, { status: 200 });
    }

    // ==========================================
    // 2. CEK JALUR UMUM (PESERTA DI MONGODB)
    // ==========================================
    
    // 1. Buka koneksi ke brankas MongoDB
    await connectMongoDB();

    // 2. Cari akun berdasarkan username
    const user = await User.findOne({ username });

    // 3. Jika username tidak ditemukan
    if (!user) {
      return NextResponse.json({ error: "Username tidak terdaftar di sistem." }, { status: 401 });
    }

    // 4. Jika password salah (Karena ini versi awal, kita cek teks biasa)
    if (user.password !== password) {
      return NextResponse.json({ error: "Password salah. Silakan coba lagi." }, { status: 401 });
    }

    // 5. Jika sukses! Kembalikan data user (TAPI JANGAN KEMBALIKAN PASSWORD-NYA)
    return NextResponse.json({
      pesan: "Login berhasil!",
      user: {
        username: user.username,
        // Kita ubah role peserta jadi huruf kecil (peserta) agar sinkron dengan routing di halaman depan
        role: "peserta", 
        namaInstansi: user.namaInstansi,
        driveFolderId: user.driveFolderId, // Sangat penting untuk upload peserta nanti!
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Gagal Login:", error);
    return NextResponse.json({ error: "Terjadi gangguan pada server." }, { status: 500 });
  }
}