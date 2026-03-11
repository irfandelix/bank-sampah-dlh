import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Di dunia nyata password harus di-hash (enkripsi), tapi untuk versi awal ini kita buat teks biasa dulu agar mudah dipantau
  role: { type: String, required: true, enum: ['ADMIN', 'JURI', 'PESERTA'] },
  namaInstansi: { type: String, required: true },
  kecamatan: { type: String, required: true }, // ✅ TAMBAHKAN INI
  driveFolderId: { type: String, default: "" }, // Ini tempat menyimpan ID Laci Khusus Google Drive untuk masing-masing peserta
  skorDLH: { type: Number, default: 0 }, // Untuk Indikator 1
  skorDKK: { type: Number, default: 0 }, // Untuk Indikator 2
  skorBSI: { type: Number, default: 0 }, // Untuk Indikator 3
  skorPMD: { type: Number, default: 0 }, // Untuk Indikator 4 & 5 gabungan
  skorTotal: { type: Number, default: 0 },
  skor: { type: Number, default: 0 }, // Dipakai untuk klasemen
}, { timestamps: true });

// Mencegah Next.js membuat model ganda saat server di-restart
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;