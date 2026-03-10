import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileSK = formData.get("fileSK") as File;
    const fileFoto = formData.get("fileFoto") as File;
    const folderId = formData.get("folderId") as string; // Kita tangkap ID Folder milik peserta

    if (!fileSK || !fileFoto || !folderId) {
      return NextResponse.json({ error: "Data tidak lengkap!" }, { status: 400 });
    }

    // 1. Konfigurasi Google Drive API
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth });

    // Fungsi Helper untuk upload ke Drive
    const uploadToDrive = async (file: File, customName: string) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      return drive.files.create({
        requestBody: {
          name: `${customName}_${file.name}`,
          parents: [folderId], // File masuk ke laci spesifik peserta!
        },
        media: {
          mimeType: file.type,
          body: stream,
        },
        fields: "id",
      });
    };

    // 2. Eksekusi Upload paralel
    const [resSK, resFoto] = await Promise.all([
      uploadToDrive(fileSK, "SK"),
      uploadToDrive(fileFoto, "FOTO_AREA")
    ]);

    return NextResponse.json({ 
      pesan: "Semua berkas berhasil diunggah ke Google Drive!",
      ids: [resSK.data.id, resFoto.data.id]
    }, { status: 200 });

  } catch (error) {
    console.error("Gagal Upload:", error);
    return NextResponse.json({ error: "Gagal mengirim berkas ke Drive." }, { status: 500 });
  }
}