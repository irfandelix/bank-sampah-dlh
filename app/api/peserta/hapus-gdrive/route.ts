import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { namaPeserta, namaFolder } = await req.json();

    // 1. Validasi Input
    if (!namaPeserta || !namaFolder) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 2. Setup OAuth2 Client (Sesuai ENV kamu)
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 3. Cari Folder Utama Peserta (Contoh: "Bank Sampah Zigi Zaga")
    // Kita cari di dalam Parent Folder ID yang kamu punya di env
    const folderPeserta = await drive.files.list({
      q: `name = '${namaPeserta}' and '${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "files(id)",
    });

    const parentId = folderPeserta.data.files?.[0]?.id;
    if (!parentId) {
      return NextResponse.json({ error: "Folder utama peserta tidak ditemukan" }, { status: 404 });
    }

    // 4. Cari Subfolder Berkas (Contoh: "Kat. I No. 1")
    const subFolder = await drive.files.list({
      q: `name = '${namaFolder}' and '${parentId}' in parents and trashed = false`,
      fields: "files(id)",
    });

    const targetFolderId = subFolder.data.files?.[0]?.id;
    if (!targetFolderId) {
      return NextResponse.json({ error: "Folder kategori berkas tidak ditemukan" }, { status: 404 });
    }

    // 5. Cari Semua File di dalam Subfolder tersebut
    const listFile = await drive.files.list({
      q: `'${targetFolderId}' in parents and trashed = false`,
      fields: "files(id, name)",
    });

    const files = listFile.data.files || [];

    // 6. Eksekusi Penghapusan
    if (files.length > 0) {
      for (const file of files) {
        await drive.files.delete({ fileId: file.id! });
      }
      return NextResponse.json({ message: `Berhasil menghapus ${files.length} file.` });
    } else {
      return NextResponse.json({ message: "Folder sudah kosong." });
    }

  } catch (error: any) {
    console.error("DRIVE_DELETE_ERROR:", error.message);
    return NextResponse.json(
      { error: "Gagal hapus: " + (error.response?.data?.error_description || error.message) }, 
      { status: 500 }
    );
  }
}