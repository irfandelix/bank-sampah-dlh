import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User"; 

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // 1. JALUR VIP: Cek Login Admin Utama
    if (username === "admin" && password === process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Login sukses", role: "admin" }, { status: 200 });
    }

    // 2. JALUR JURI: Cek Login 4 Instansi Penilai
    if (username === "juri_dlh" && password === process.env.JURI_DLH_PASSWORD) {
      return NextResponse.json({ message: "Login sukses", role: "juri_dlh" }, { status: 200 });
    }
    if (username === "juri_dkk" && password === process.env.JURI_DKK_PASSWORD) {
      return NextResponse.json({ message: "Login sukses", role: "juri_dkk" }, { status: 200 });
    }
    if (username === "juri_bsi" && password === process.env.JURI_BSI_PASSWORD) {
      return NextResponse.json({ message: "Login sukses", role: "juri_bsi" }, { status: 200 });
    }
    if (username === "juri_pmd" && password === process.env.JURI_PMD_PASSWORD) {
      return NextResponse.json({ message: "Login sukses", role: "juri_pmd" }, { status: 200 });
    }

    // 3. JALUR PESERTA: Cek Login Bank Sampah (Cari di Database)
    await connectMongoDB();
    const peserta = await User.findOne({ username });
    
    // Asumsi password tidak di-hash. Jika kamu pakai bcrypt, gunakan bcrypt.compare()
    if (peserta && peserta.password === password) { 
      return NextResponse.json({ 
        message: "Login sukses", 
        role: "peserta", 
        namaInstansi: peserta.namaInstansi 
      }, { status: 200 });
    }

    // Jika username/password tidak ada yang cocok di 3 jalur atas
    return NextResponse.json({ error: "Username atau password salah!" }, { status: 401 });

  } catch (error) {
    console.error("Error saat login:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}