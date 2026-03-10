import { NextResponse } from "next/server";
import { google } from "googleapis";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    // 1. Tangkap data yang dikirim dari form Admin
    const body = await request.json();
    const { username, password, role, namaInstansi } = body;

    if (!username || !password || !role || !namaInstansi) {
      return NextResponse.json({ error: "Semua data wajib diisi!" }, { status: 400 });
    }

    // 2. Hubungkan ke Brankas MongoDB
    await connectMongoDB();

    // Cek apakah username sudah dipakai
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: "Username sudah terdaftar, gunakan yang lain!" }, { status: 400 });
    }

    let driveFolderId = "";

    // 3. JIKA PERANNYA PESERTA, BUATKAN FOLDER KHUSUS DI GOOGLE DRIVE
    if (role === "PESERTA") {
      // Siapkan kunci Google dari .env
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Perintahkan Google Drive membuat folder baru
      const folderMetadata = {
        name: namaInstansi, // Nama folder sama dengan nama Instansi (Misal: BS Gemolong)
        mimeType: "application/vnd.google-apps.folder",
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID as string], // Masukkan ke dalam folder Database utama
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      // Simpan ID Folder yang baru dibuat
      driveFolderId = folder.data.id || "";
      console.log(`📁 Folder Google Drive berhasil dibuat untuk ${namaInstansi}`);
    }

    // 4. SIMPAN SEMUA DATA KE MONGODB
    const newUser = new User({
      username,
      password, // Ingat: Untuk versi produksi sungguhan nanti, password ini wajib di-hash (enkripsi)
      role,
      namaInstansi,
      driveFolderId, // ID Folder Drive akan tersimpan di sini (jika dia peserta)
    });

    await newUser.save();
    console.log(`✅ Akun ${username} berhasil disimpan ke MongoDB!`);

    // 5. Berikan laporan sukses ke Admin
    return NextResponse.json({ 
      pesan: "Akun dan Folder berhasil dibuat!",
      data: { username, role, driveFolderId }
    }, { status: 201 });

    } catch (error: any) {
    // KODE DETEKTIF: Menampilkan pesan error asli dari Google
        console.error("Detail Error Google Drive:", error.response?.data || error.message);
    
        return NextResponse.json(
            { error: "Gagal membuat akun peserta." },
            { status: 500 }
        );
    }
}