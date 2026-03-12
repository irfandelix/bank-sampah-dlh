import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const namaKategori = formData.get("namaFolder") as string;
    const namaPeserta = formData.get("namaPeserta") as string; // Contoh: "ZigiZaga"

    if (!file || !namaKategori || !namaPeserta) {
      return NextResponse.json({ error: "Data tidak lengkap!" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // ID FOLDER UTAMA (Database Bank Sampah) dari .env
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // --- LANGKAH 1: CARI / BUAT FOLDER PESERTA (ZigiZaga) ---
    const cekFolderPeserta = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaPeserta}' and '${mainFolderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    let folderPesertaId = "";
    if (cekFolderPeserta.data.files && cekFolderPeserta.data.files.length > 0) {
      folderPesertaId = cekFolderPeserta.data.files[0].id!;
    } else {
      const buatFolderP = await drive.files.create({
        requestBody: { name: namaPeserta, mimeType: "application/vnd.google-apps.folder", parents: [mainFolderId!] },
        fields: "id",
      });
      folderPesertaId = buatFolderP.data.id!;
    }

    // --- LANGKAH 2: CARI / BUAT FOLDER KATEGORI DI DALAM FOLDER PESERTA ---
    const cekFolderKat = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaKategori}' and '${folderPesertaId}' in parents and trashed=false`,
      fields: 'files(id)',
    });

    let targetFolderId = "";
    if (cekFolderKat.data.files && cekFolderKat.data.files.length > 0) {
      targetFolderId = cekFolderKat.data.files[0].id!;
    } else {
      const buatFolderK = await drive.files.create({
        requestBody: { name: namaKategori, mimeType: "application/vnd.google-apps.folder", parents: [folderPesertaId] },
        fields: "id",
      });
      targetFolderId = buatFolderK.data.id!;
    }

    // --- LANGKAH 3: UPLOAD FILE KE DALAM FOLDER KATEGORI ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: `[${namaPeserta}] - ${file.name}`,
        parents: [targetFolderId],
      },
      media: { mimeType: file.type, body: stream },
    });

    return NextResponse.json({ pesan: "Berhasil!", id: response.data.id }, { status: 200 });

  } catch (error: any) {
    console.error("DRIVE ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}