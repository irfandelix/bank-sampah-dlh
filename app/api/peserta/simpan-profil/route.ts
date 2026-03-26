import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User"; // 👈 Ganti importnya ke User

const MONGODB_URI = process.env.MONGODB_URI || "";

export async function POST(req: Request) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const data = await req.json();

    if (!data.username) {
      return NextResponse.json({ error: "Data tidak lengkap!" }, { status: 400 });
    }

    // 👈 Gunakan model User untuk update data
    const profilDisimpan = await User.findOneAndUpdate(
      { username: data.username },
      {
        namaInstansi: data.namaBank, // Update nama instansi sekalian
        namaBankSampah: data.namaBankSampah,
        alamat: data.alamat,
        koordinat: data.koordinat,
        waktuPendirian: data.waktuPendirian,
        namaKetua: data.namaKetua,
        noHp: data.noHp
      },
      { new: true } 
    );

    return NextResponse.json({ message: "Profil berhasil disimpan!", data: profilDisimpan }, { status: 200 });

  } catch (error: any) {
    console.error("Error simpan profil:", error);
    return NextResponse.json({ error: "Gagal menyimpan data ke server." }, { status: 500 });
  }
}