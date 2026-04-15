import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

// Matikan cache biar data yang ditarik selalu fresh real-time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectMongoDB();
    
    // Ambil semua data akun yang role-nya "PESERTA"
    const daftarPeserta = await User.find({ role: { $regex: /peserta/i } }).lean();

    // Petakan dan siapkan datanya untuk dikirim ke Dashboard
    const klasemen = daftarPeserta
      .map((p: any) => ({
        username: p.username,
        namaInstansi: p.namaInstansi,
        kecamatan: p.kecamatan,
        skor: p.skor || 0, // Ini Total Nilai Administrasi
        skorDLH: p.skorDLH || 0,
        skorDKK: p.skorDKK || 0,
        skorBSI: p.skorBSI || 0,
        skorPMD: p.skorPMD || 0,
        
        // 🔥 TAMBAHAN WAJIB: Biar Frontend bisa baca nilai Verlap & Detailnya!
        nilai_verlap: p.nilai_verlap || 0,       // Total Skor Verlap
        detail_verlap: p.detail_verlap || {},   // Rincian kuesioner per poin
        tingkat_verlap: p.tingkat_verlap || "RW" // Tingkat wilayahnya
      }));

    // Hitung statistik untuk kotak-kotak di atas Dashboard
    const totalPeserta = klasemen.length;
    
    // Statistik berdasarkan Administrasi (biar tetep stabil)
    const sudahDinilai = klasemen.filter((k) => k.skor > 0).length;
    
    // Klasemen Tertinggi (Default Administrasi buat header stats)
    const klasemenSortedAdm = [...klasemen].sort((a, b) => b.skor - a.skor);
    const tertinggi = klasemenSortedAdm.length > 0 && klasemenSortedAdm[0].skor > 0 
      ? { skor: klasemenSortedAdm[0].skor.toFixed(2), nama: klasemenSortedAdm[0].namaInstansi } 
      : { skor: "-", nama: "Belum Ada Data" };

    return NextResponse.json({
      // Kita kirim klasemen mentah, nanti urusan sorting biar diurus 2 Tab di Frontend
      klasemen, 
      stats: { totalPeserta, sudahDinilai, tertinggi }
    }, { status: 200 });

  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return NextResponse.json({ error: "Gagal menarik data klasemen" }, { status: 500 });
  }
}