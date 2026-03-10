import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Tolong masukkan MONGODB_URI di dalam file .env");
}

// Teknik "Caching" agar Next.js tidak membuka ribuan koneksi baru setiap kali halaman di-refresh
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectMongoDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((mongoose) => {
      console.log("🟢 Berhasil terhubung ke Brankas MongoDB!");
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}