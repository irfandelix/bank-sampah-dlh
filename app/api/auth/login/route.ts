import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User"; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Bersihkan inputan dari spasi nakal
    const username = body.username?.trim();
    const password = body.password?.trim();

    // 2. Bersihkan password Vercel dari kutip (") dan spasi
    const envAdmin = process.env.ADMIN_PASSWORD?.replace(/['"]/g, '').trim();
    const envJuriDLH = process.env.JURI_DLH_PASSWORD?.replace(/['"]/g, '').trim();
    const envJuriDKK = process.env.JURI_DKK_PASSWORD?.replace(/['"]/g, '').trim();
    const envJuriBSI = process.env.JURI_BSI_PASSWORD?.replace(/['"]/g, '').trim();
    const envJuriPMD = process.env.JURI_PMD_PASSWORD?.replace(/['"]/g, '').trim();

    // ==========================================
    // JALUR VIP: CEK LOGIN ADMIN & JURI
    // (Aman dari koneksi database yang lemot)
    // ==========================================
    if (username === "admin" && password === envAdmin) {
      return NextResponse.json({ message: "Login sukses", role: "admin" }, { status: 200 });
    }
    if (username === "juri_dlh" && password === envJuriDLH) {
      return NextResponse.json({ message: "Login sukses", role: "juri_dlh" }, { status: 200 });
    }
    if (username === "juri_dkk" && password === envJuriDKK) {
      return NextResponse.json({ message: "Login sukses", role: "juri_dkk" }, { status: 200 });
    }
    if (username === "juri_bsi" && password === envJuriBSI) {
      return NextResponse.json({ message: "Login sukses", role: "juri_bsi" }, { status: 200 });
    }
    if (username === "juri_pmd" && password === envJuriPMD) {
      return NextResponse.json({ message: "Login sukses", role: "juri_pmd" }, { status: 200 });
    }

    // ==========================================
    // JALUR PESERTA: CEK MONGODB
    // ==========================================
    try {
      await connectMongoDB();
      const peserta = await User.findOne({ username });
      
      if (peserta && peserta.password === password) { 
        return NextResponse.json({ 
          message: "Login sukses", 
          role: "peserta", 
          namaInstansi: peserta.namaInstansi 
        }, { status: 200 });
      }
      
      // Jika sampai di sini, berarti password/username Peserta salah
      return NextResponse.json({ error: "Username atau Password salah!" }, { status: 401 });

    } catch (dbError) {
      console.error("Database Error:", dbError);
      return NextResponse.json({ error: "Database sibuk. Coba lagi dalam beberapa detik." }, { status: 500 });
    }

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}