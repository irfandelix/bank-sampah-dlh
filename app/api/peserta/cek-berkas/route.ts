import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const { folderIdPeserta } = await request.json();
    if (!folderIdPeserta) return NextResponse.json({ berkasTerisi: [] });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. Ambil semua folder kategori di dalam folder peserta
    const resFolder = await drive.files.list({
      q: `'${folderIdPeserta}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: "files(id, name)",
    });

    const folderKategori = resFolder.data.files || [];
    const berkasTerisi: string[] = [];

    // 2. Cek satu-satu apakah di dalam folder kategori ada filenya
    for (const folder of folderKategori) {
      const resFile = await drive.files.list({
        q: `'${folder.id}' in parents and trashed=false`,
        fields: "files(id)",
      });
      if (resFile.data.files && resFile.data.files.length > 0) {
        berkasTerisi.push(folder.name!); // Masukkan nama kategori (misal: "Kat. I No. 1")
      }
    }

    return NextResponse.json({ berkasTerisi });
  } catch (error) {
    return NextResponse.json({ error: "Gagal cek drive" }, { status: 500 });
  }
}