import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    challengeHash: { type: String, required: true, unique: true },
    encryptedCode: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    nextAttemptAt: { type: Date, default: Date.now },
    attempts: { type: Number, default: 0 },
    lockedUntil: Date,
    leaseToken: String,
  },
  { timestamps: true },
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ nextAttemptAt: 1 });
export default mongoose.model("RecoveryMail", schema);
