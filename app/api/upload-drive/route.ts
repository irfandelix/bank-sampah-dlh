import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    // 1. Tangkap data file yang dikirim dari halaman depan
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // 2. Ubah file menjadi format yang bisa dibaca Google (Buffer -> Stream)
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    // 3. Masukkan 3 Kunci Sakti dari file .env
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground" // URL Redirect wajib
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    // 4. Siapkan koneksi ke Google Drive API
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 5. Proses Kirim File ke Folder Tujuan
    const response = await drive.files.create({
      requestBody: {
        name: file.name, // Nama asli file
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID as string], // ID Folder tujuan
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    // 6. Beri laporan sukses ke halaman depan
    return NextResponse.json({ 
      pesan: "Berhasil upload ke Google Drive!", 
      fileId: response.data.id 
    }, { status: 200 });

  } catch (error) {
    console.error("Gagal Upload:", error);
    return NextResponse.json({ error: "Gagal mengirim file ke server" }, { status: 500 });
  }
}