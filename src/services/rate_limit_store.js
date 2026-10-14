import { createHash } from "node:crypto";
import Counter from "../models/rateLimitCounter.js";
import { connectDB } from "../config/db.js";
import { ensureOperationalIndexes } from "./operational_indexes.js";

export class MongoRateLimitStore {
  localKeys = false;
  constructor(prefix = "auth:") {
    this.prefix = prefix;
  }
  init({ windowMs }) {
    this.windowMs = windowMs;
  }
  key(value) {
    return this.prefix + createHash("sha256").update(value).digest("hex");
  }
  async increment(key) {
    try {
      await connectDB();
      await ensureOperationalIndexes();
      const now = new Date();
      const expired = { $lte: [{ $ifNull: ["$expiresAt", new Date(0)] }, now] };
      const document = await Counter.collection.findOneAndUpdate(
        { _id: this.key(key) },
        [
          {
            $set: {
              totalHits: { $cond: [expired, 1, { $add: ["$totalHits", 1] }] },
              expiresAt: {
                $cond: [
                  expired,
                  new Date(now.getTime() + this.windowMs),
                  "$expiresAt",
                ],
              },
            },
          },
        ],
        { upsert: true, returnDocument: "after" },
      );
      return { totalHits: document.totalHits, resetTime: document.expiresAt };
    } catch (cause) {
      throw Object.assign(new Error("Database unavailable", { cause }), {
        status: 503,
      });
    }
  }
  async decrement(key) {
    await Counter.updateOne(
      {
        _id: this.key(key),
        expiresAt: { $gt: new Date() },
        totalHits: { $gt: 0 },
      },
      { $inc: { totalHits: -1 } },
    );
  }
  async resetKey(key) {
    await Counter.deleteOne({ _id: this.key(key) });
  }
}
