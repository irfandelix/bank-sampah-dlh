import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema({
  kunci: { type: String, required: true, unique: true }, // contoh: "DEADLINE_UPLOAD"
  nilai: { type: String, required: true }, // contoh: "2026-04-30T23:59:00"
});

export default mongoose.models.Setting || mongoose.model("Setting", SettingSchema);