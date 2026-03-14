import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { namaPeserta, namaFolder } = await req.json();

    // 🛑 VALIDASI AWAL (Penyebab Error 400)
    if (!namaPeserta || !namaFolder) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"], // 👈 Pastikan scope-nya full 'drive'
    });

    const drive = google.drive({ version: "v3", auth });

    // 1. Cari folder peserta
    const folderPeserta = await drive.files.list({
      q: `name = '${namaPeserta}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
    });

    const parentId = folderPeserta.data.files?.[0]?.id;
    if (!parentId) return NextResponse.json({ error: "Folder peserta tidak ditemukan" }, { status: 404 });

    // 2. Cari subfolder (id berkas, misal: Kat. I No. 1)
    const subFolder = await drive.files.list({
      q: `name = '${namaFolder}' and '${parentId}' in parents and trashed = false`,
      fields: "files(id)",
    });

    const targetFolderId = subFolder.data.files?.[0]?.id;
    if (!targetFolderId) return NextResponse.json({ error: "Folder berkas tidak ditemukan" }, { status: 404 });

    // 3. Cari file di dalam subfolder tersebut
    const listFile = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: "files(id, name)",
    });

    const files = listFile.data.files || [];

    // 4. Hapus semua file yang ada di folder tersebut
    if (files.length > 0) {
      for (const file of files) {
        await drive.files.delete({ fileId: file.id! });
      }
    }

    return NextResponse.json({ message: "Berkas berhasil dihapus" });
  } catch (error: any) {
    console.error("DRIVE_DELETE_ERROR:", error.message);
    return NextResponse.json({ error: "Gagal menghapus file di Drive" }, { status: 500 });
  }
}