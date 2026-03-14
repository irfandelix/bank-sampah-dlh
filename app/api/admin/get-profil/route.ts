import { NextResponse } from "next/server";
import mongoose from "mongoose";

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      return NextResponse.json({ error: "Database URI belum diatur" }, { status: 500 });
    }

    // 1. Cek apakah mongoose sudah terkoneksi (biar nggak dobel koneksi di Next.js)
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri);
    }

    // 2. Kita ambil datanya langsung dari collection 'users' tanpa perlu bikin Schema
    const db = mongoose.connection.db;
    
    // Pastikan db tidak undefined sebelum dipakai
    if (!db) {
       throw new Error("Gagal mendapatkan akses database");
    }

    const usersCollection = db.collection("users");
    const semuaPeserta = await usersCollection.find({ role: "peserta" }).toArray();

    // 3. Bersihkan dan siapkan data untuk Peta
    const dataProfil = semuaPeserta.map((peserta: any) => ({
      username: peserta.username,
      namaInstansi: peserta.namaInstansi || peserta.username,
      kecamatan: peserta.kecamatan || "Belum Diisi",
      latitude: peserta.latitude ? parseFloat(peserta.latitude) : null,
      longitude: peserta.longitude ? parseFloat(peserta.longitude) : null,
      namaKetua: peserta.namaKetua || "-",
      noTelepon: peserta.noTelepon || "-", 
      alamat: peserta.alamat || "-",
    }));

    return NextResponse.json({ data: dataProfil }, { status: 200 });

  } catch (error: any) {
    console.error("API GET-PROFIL ERROR:", error.message);
    return NextResponse.json(
      { error: "Gagal mengambil data profil" }, 
      { status: 500 }
    );
  }
}