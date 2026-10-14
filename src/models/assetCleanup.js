import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    url: { type: String, required: true, unique: true },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    lockedUntil: Date,
    leaseToken: String,
  },
  { timestamps: true },
);
schema.index({ nextAttemptAt: 1 });
export default mongoose.model("AssetCleanup", schema);
