import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    const { namaPeserta, namaKategori } = await request.json();

    if (!namaPeserta || !namaKategori) {
      return NextResponse.json({ error: "Data kurang" }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    const drive = google.drive({ version: "v3", auth: oauth2Client });
    const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // 1. Cari Folder Peserta
    const cekFolderPeserta = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaPeserta}' and '${mainFolderId}' in parents and trashed=false`,
      fields: 'files(id)'
    });
    if (!cekFolderPeserta.data.files || cekFolderPeserta.data.files.length === 0) return NextResponse.json({ pesan: "Aman" });
    const folderPesertaId = cekFolderPeserta.data.files[0].id;

    // 2. Cari Folder Kategori
    const cekFolderKat = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${namaKategori}' and '${folderPesertaId}' in parents and trashed=false`,
      fields: 'files(id)'
    });
    if (!cekFolderKat.data.files || cekFolderKat.data.files.length === 0) return NextResponse.json({ pesan: "Aman" });
    const targetFolderId = cekFolderKat.data.files[0].id;

    // 3. Masukkan semua file di laci kategori itu ke tong sampah (Trash)
    const fileLama = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed=false`,
      fields: 'files(id)'
    });
    
    if (fileLama.data.files) {
      for (const old of fileLama.data.files) {
        // Pindahkan ke Trash (tidak dihapus permanen, biar aman kalau gak sengaja kepencet)
        await drive.files.update({ fileId: old.id!, requestBody: { trashed: true } });
      }
    }

    return NextResponse.json({ pesan: "Berhasil dihapus" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}