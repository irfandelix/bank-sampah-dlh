import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // =======================================
  // 1. DATA OTENTIKASI & IDENTITAS DASAR
  // =======================================
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['ADMIN', 'JURI', 'PESERTA'] },
  namaInstansi: { type: String, required: true },
  kecamatan: { type: String },
  driveFolderId: { type: String, default: "" },

  // =======================================
  // 2. DATA PROFIL LENGKAP PESERTA (Baru Digabung!)
  // =======================================
  // Kita set default "" (string kosong) agar tidak error saat Admin/Juri login
  namaBankSampah: { type: String, default: "" },
  alamat: { type: String, default: "" },
  koordinat: { type: String, default: "" },
  waktuPendirian: { type: String, default: "" },
  namaKetua: { type: String, default: "" },
  noHp: { type: String, default: "" },

  // =======================================
  // 3. DATA REKAM JEJAK PENILAIAN JURI
  // =======================================
  skorDLH: { type: Number, default: 0 },
  skorDKK: { type: Number, default: 0 },
  skorBSI: { type: Number, default: 0 },
  skorPMD: { type: Number, default: 0 },
  detail_juri_dlh: { type: Object, default: {} },
  detail_juri_dkk: { type: Object, default: {} },
  detail_juri_bsi: { type: Object, default: {} },
  detail_juri_pmd: { type: Object, default: {} },
  skorTotal: { type: Number, default: 0 },
  skor: { type: Number, default: 0 },

  // =======================================
  // 4. DATA VERIFIKASI LAPANGAN
  // =======================================
  nilai_verlap: { type: Number, default: 0 },
  detail_verlap: { type: Object, default: {} }, // Pakai Object biar bisa nyimpen rincian {"1.1": 15, "1.2": 20, ...}
  tingkat_verlap: { type: String, default: "RW" },

}, { timestamps: true });

// Mencegah Next.js membuat model ganda saat server di-restart
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;