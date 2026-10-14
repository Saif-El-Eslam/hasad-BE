import mongoose from "mongoose";

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  purpose: { type: String, enum: ["verify", "reset"], required: true },
  hash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  requestedAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
});
schema.index({ user: 1, purpose: 1 }, { unique: true });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("OtpChallenge", schema);
