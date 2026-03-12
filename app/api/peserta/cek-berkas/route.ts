import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const { namaPeserta } = await request.json();

    if (!namaPeserta) {
      return NextResponse.json({ berkasTerisi: {} }); // Sekarang pakai object {}, bukan array []
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 1. Cari folder milik peserta
    const cekFolderPeserta = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaPeserta}' and '${mainFolderId}' in parents and trashed=false`,
      fields: "files(id)",
    });

    if (!cekFolderPeserta.data.files || cekFolderPeserta.data.files.length === 0) {
      return NextResponse.json({ berkasTerisi: {} });
    }

    const folderPesertaId = cekFolderPeserta.data.files[0].id;

    // 2. Ambil semua laci kategori
    const resFolderKategori = await drive.files.list({
      q: `'${folderPesertaId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    const folderKategori = resFolderKategori.data.files || [];
    
    // 🟢 LOGIKA BARU: Simpan nama kategori DAN Link Preview-nya
    const berkasTerisi: Record<string, string> = {};

    for (const folder of folderKategori) {
      const resFile = await drive.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: "files(id, webViewLink)", // 👈 Di sini kita minta Link Preview!
      });
      
      if (resFile.data.files && resFile.data.files.length > 0) {
        // Simpan link file pertama yang ketemu ke dalam object
        berkasTerisi[folder.name!] = resFile.data.files[0].webViewLink!;
      }
    }

    return NextResponse.json({ berkasTerisi });

  } catch (error: any) {
    console.error("Gagal cek berkas:", error.message);
    return NextResponse.json({ error: "Gagal cek drive" }, { status: 500 });
  }
}