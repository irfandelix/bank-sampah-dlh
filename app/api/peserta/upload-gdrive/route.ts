import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const namaKategori = formData.get("namaFolder") as string;
    const folderIdPeserta = formData.get("folderId") as string; // Ini ID folder ZigiZaga/PilihPilah
    const namaPeserta = formData.get("namaPeserta") as string;

    // VALIDASI: Pastikan semua variabel tidak ada yang kosong
    if (!file || !namaKategori || !folderIdPeserta) {
      return NextResponse.json({ error: "Data pengiriman tidak lengkap (File/FolderId Kosong)!" }, { status: 400 });
    }

    // KONVERSI: Mengubah file (PDF/JPG/PNG) jadi stream agar bisa dimakan GDrive
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. CARI / BUAT SUB-FOLDER KATEGORI DI DALAM FOLDER PESERTA
    const cekFolder = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaKategori}' and '${folderIdPeserta}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    let targetFolderId = "";
    if (cekFolder.data.files && cekFolder.data.files.length > 0) {
      targetFolderId = cekFolder.data.files[0].id as string;
    } else {
      const buatFolder = await drive.files.create({
        requestBody: {
          name: namaKategori,
          mimeType: "application/vnd.google-apps.folder",
          parents: [folderIdPeserta],
        },
        fields: "id",
      });
      targetFolderId = buatFolder.data.id as string;
    }

    // 2. PROSES UPLOAD (Mendukung file.type untuk PDF, JPG, PNG)
    const response = await drive.files.create({
      requestBody: {
        name: `[${namaPeserta}] - ${file.name}`,
        parents: [targetFolderId],
      },
      media: {
        mimeType: file.type, 
        body: stream,
      },
    });

    return NextResponse.json({ pesan: "Berhasil!", id: response.data.id }, { status: 200 });

  } catch (error: any) {
    console.error("ERROR GOOGLE DRIVE API:", error.message);
    return NextResponse.json({ error: error.message || "Gagal upload ke Drive" }, { status: 500 });
  }
}