import { NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/lib/models/User";
import { google } from "googleapis";

export async function GET() {
  try {
    // 1. Konek Database & Ambil semua peserta
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    const peserta = await User.find({ role: "PESERTA" }).lean();

    // 2. Siapkan Robot GDrive
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 3. Cek progres tiap peserta secara bersamaan (Paralel)
    const dataMonitoring = await Promise.all(
      peserta.map(async (p: any) => {
        let totalBerkas = 0;
        const namaP = p.namaInstansi || p.username;

        try {
          // Cari folder peserta di Drive
          const folderPeserta = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${namaP}' and '${mainFolderId}' in parents and trashed=false`,
            fields: "files(id)",
          });

          if (folderPeserta.data.files && folderPeserta.data.files.length > 0) {
            const pId = folderPeserta.data.files[0].id;
            
            // Hitung sub-folder (kategori) yang ada di dalamnya
            // Asumsi: 1 subfolder = 1 berkas yang sudah diupload
            const subFolders = await drive.files.list({
              q: `'${pId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
              fields: "files(id)",
            });
            totalBerkas = subFolders.data.files ? subFolders.data.files.length : 0;
          }
        } catch (e) {
          console.error(`Gagal cek drive untuk ${namaP}`);
        }

        return {
          id: p._id.toString(),
          namaInstansi: namaP,
          namaKetua: p.namaKetua || "-",
          progres: totalBerkas, // Max 19
        };
      })
    );

    return NextResponse.json(dataMonitoring);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}