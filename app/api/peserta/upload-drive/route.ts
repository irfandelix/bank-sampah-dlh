import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    // 1. Tangkap data dari form (Sekarang kita juga minta nama folder & nama peserta)
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const namaFolderKat = formData.get("namaFolder") as string; // Contoh: "Kat. III No. 6"
    const namaPeserta = formData.get("namaPeserta") as string;  // Contoh: "Bank Sampah Maju Jaya"

    if (!file || !namaFolderKat || !namaPeserta) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 2. Ubah file menjadi format Buffer -> Stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    // 3. Masukkan 3 Kunci Sakti dari file .env
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID as string;

    // ==========================================
    // 🎯 FITUR BARU: CARI ATAU BIKIN FOLDER OTOMATIS
    // ==========================================
    
    // Cek apakah folder "Kat. III No. 6" sudah ada di dalam folder utama DLH
    const cekFolder = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaFolderKat}' and '${mainFolderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    let targetFolderId = "";

    if (cekFolder.data.files && cekFolder.data.files.length > 0) {
      // Foldernya udah ada, ambil ID-nya
      targetFolderId = cekFolder.data.files[0].id as string;
    } else {
      // Foldernya belum ada, sistem bikinin otomatis!
      const buatFolder = await drive.files.create({
        requestBody: {
          name: namaFolderKat,
          mimeType: "application/vnd.google-apps.folder",
          parents: [mainFolderId],
        },
        fields: "id",
      });
      targetFolderId = buatFolder.data.id as string;
    }

    // ==========================================
    // 🎯 UPLOAD KE FOLDER YANG TEPAT & UBAH NAMA FILE
    // ==========================================
    
    // Biar gak ketuker, nama file digabung sama nama peserta
    const namaFileRapi = `[${namaPeserta}] - ${file.name}`;

    const response = await drive.files.create({
      requestBody: {
        name: namaFileRapi,
        parents: [targetFolderId], // 👈 Masuk ke folder kategori, bukan folder utama
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
    });

    return NextResponse.json({ 
      pesan: "Berhasil upload ke Google Drive!", 
      fileId: response.data.id 
    }, { status: 200 });

  } catch (error) {
    console.error("Gagal Upload:", error);
    return NextResponse.json({ error: "Gagal mengirim file ke server Google" }, { status: 500 });
  }
}