import { NextResponse } from "next/server";
import { google } from "googleapis";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ✅ 1. Tangkap 'kecamatan' dari form Admin
    const { username, password, role, namaInstansi, kecamatan } = body;

    // ✅ 2. Tambahkan validasi agar kecamatan wajib diisi
    if (!username || !password || !role || !namaInstansi || !kecamatan) {
      return NextResponse.json({ error: "Semua data wajib diisi, termasuk Kecamatan!" }, { status: 400 });
    }

    await connectMongoDB();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: "Username sudah terdaftar, gunakan yang lain!" }, { status: 400 });
    }

    let driveFolderId = "";

    if (role === "PESERTA") {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      const drive = google.drive({ version: "v3", auth: oauth2Client });

      const folderMetadata = {
        name: namaInstansi,
        mimeType: "application/vnd.google-apps.folder",
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID as string],
      };

      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: "id",
      });

      driveFolderId = folder.data.id || "";
      console.log(`📁 Folder Google Drive berhasil dibuat untuk ${namaInstansi}`);
    }

    // ✅ 3. Simpan 'kecamatan' ke MongoDB
    const newUser = new User({
      username,
      password, 
      role,
      namaInstansi,
      kecamatan, // <--- INI TAMBAHANNYA
      driveFolderId, 
    });

    await newUser.save();
    console.log(`✅ Akun ${username} berhasil disimpan ke MongoDB di Kecamatan ${kecamatan}!`);

    return NextResponse.json({ 
      pesan: "Akun dan Folder berhasil dibuat!",
      data: { username, role, driveFolderId, kecamatan }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Detail Error Google Drive:", error.response?.data || error.message);
    return NextResponse.json(
      { error: "Gagal membuat akun peserta." },
      { status: 500 }
    );
  }
}