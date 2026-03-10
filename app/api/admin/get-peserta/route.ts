import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await connectMongoDB();
    const peserta = await User.find({ role: "PESERTA" }).select("username namaInstansi");
    return NextResponse.json({ peserta });
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil data" }, { status: 500 });
  }
}