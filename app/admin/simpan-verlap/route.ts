import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb"; 
import User from "@/lib/models/User"; 

export async function POST(req: Request) {
  try {
    // 1. Buka koneksi ke MongoDB
    await connectMongoDB();

    // 2. Tangkap data yang dikirim dari Pop-up form
    const body = await req.json();
    const { username, verlapDLH, verlapDKK, verlapBSI, verlapPMD, nilai_verlap } = body;

    if (!username) {
      return NextResponse.json({ message: "ID Peserta tidak ditemukan!" }, { status: 400 });
    }

    // 3. Update data peserta (User) di MongoDB
    const updatedPeserta = await User.findOneAndUpdate(
      { username: username }, // Cari berdasarkan username/ID
      { 
        $set: {
          verlapDLH: verlapDLH,
          verlapDKK: verlapDKK,
          verlapBSI: verlapBSI,
          verlapPMD: verlapPMD,
          nilai_verlap: nilai_verlap
        } 
      },
      { new: true } // Biar ngembaliin data yang udah paling update
    );

    if (!updatedPeserta) {
      return NextResponse.json({ message: "Peserta tidak ditemukan di database." }, { status: 404 });
    }

    // 4. Kirim jawaban sukses ke tampilan web
    return NextResponse.json({ 
      message: "Data Verifikasi Lapangan berhasil disimpan!", 
      data: updatedPeserta 
    }, { status: 200 });

  } catch (error) {
    console.error("Error Simpan Verlap:", error);
    return NextResponse.json({ message: "Terjadi kesalahan di server." }, { status: 500 });
  }
}