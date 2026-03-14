import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Setting from "@/lib/models/Setting";

// 📥 METHOD GET: Untuk mengambil batas waktu (Dipakai Admin & Peserta)
export async function GET() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    const tenggat = await Setting.findOne({ kunci: "DEADLINE_UPLOAD" });
    
    // Kalau admin belum pernah nyetting, kita kasih default kosong
    return NextResponse.json({ deadline: tenggat ? tenggat.nilai : null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 📤 METHOD POST: Untuk menyimpan/mengubah batas waktu (Khusus Admin)
export async function POST(request: Request) {
  try {
    const { deadline } = await request.json();

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Update atau Buat baru kalau belum ada
    await Setting.findOneAndUpdate(
      { kunci: "DEADLINE_UPLOAD" },
      { nilai: deadline },
      { upsert: true, new: true }
    );

    return NextResponse.json({ pesan: "Batas waktu berhasil disimpan!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}