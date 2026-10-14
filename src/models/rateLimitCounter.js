import mongoose from "mongoose";

const schema = new mongoose.Schema({
  _id: String,
  totalHits: Number,
  expiresAt: Date,
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.model("RateLimitCounter", schema);
