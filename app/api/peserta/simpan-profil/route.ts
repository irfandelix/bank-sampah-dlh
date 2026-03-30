import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "";

// =================================================================
// 1. FUNGSI GET: Untuk Nampilin Data Lama di Form & Dashboard
// =================================================================
export async function GET(req: Request) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) return NextResponse.json({ error: "Username tidak ada" }, { status: 400 });

    const user = await User.findOne({ username });
    if (!user) return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });

    // Pecah koordinat (lat, long) biar form depan gampang bacanya
    let lat = ""; let lng = "";
    if (user.koordinat && user.koordinat.includes(",")) {
      const splitKoord = user.koordinat.split(",");
      lat = splitKoord[0].trim(); lng = splitKoord[1].trim();
    }

    return NextResponse.json({
      namaBankSampah: user.namaBankSampah || "",
      namaInstansi: user.namaInstansi || "",
      namaKetua: user.namaKetua || "",
      noTelepon: user.noHp || "",           // 👈 Nyesuaiin nama state form
      tahunBerdiri: user.waktuPendirian || "", // 👈 Nyesuaiin nama state form
      alamat: user.alamat || "",
      latitude: lat,
      longitude: lng
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error get profil:", error);
    return NextResponse.json({ error: "Gagal mengambil data." }, { status: 500 });
  }
}

// =================================================================
// 2. FUNGSI POST: Kodingan Kamu yang Udah Disinkronkan
// =================================================================
export async function POST(req: Request) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const data = await req.json();

    if (!data.username) {
      return NextResponse.json({ error: "Data tidak lengkap!" }, { status: 400 });
    }

    // Gabungin latitude & longitude dari form jadi satu string "koordinat"
    const titikKoordinat = (data.latitude && data.longitude) 
      ? `${data.latitude}, ${data.longitude}` 
      : "";

    // Gunakan model User untuk update data (Sudah disinkronkan dgn form)
    const profilDisimpan = await User.findOneAndUpdate(
      { username: data.username },
      {
        namaBankSampah: data.namaBankSampah,
        alamat: data.alamat,
        koordinat: titikKoordinat,          // 👈 Gabungan lat & long
        waktuPendirian: data.tahunBerdiri,  // 👈 Nangkep dari form
        namaKetua: data.namaKetua,
        noHp: data.noTelepon                // 👈 Nangkep dari form
      },
      { returnDocument: 'after' } 
    );

    return NextResponse.json({ message: "Profil berhasil disimpan!", data: profilDisimpan }, { status: 200 });

  } catch (error: any) {
    console.error("Error simpan profil:", error);
    return NextResponse.json({ error: "Gagal menyimpan data ke server." }, { status: 500 });
  }
}