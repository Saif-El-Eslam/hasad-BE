import { randomUUID } from "node:crypto";
import Cleanup from "../models/assetCleanup.js";
import { deleteFilesFromCloudinary } from "../middlewares/imageUploaderMiddleware.js";
import logger from "../utils/logger.js";

export const enqueueCleanup = async (urls, session = null) => {
  for (const url of new Set(urls.filter(Boolean))) {
    await Cleanup.updateOne(
      { url },
      { $setOnInsert: { url, attempts: 0, nextAttemptAt: new Date() } },
      { upsert: true, session },
    );
  }
};

let running = false;
export const processCleanup = async ({
  limit = 20,
  budgetMs = 25000,
  throwOnError = false,
} = {}) => {
  const stats = { processed: 0, succeeded: 0, failed: 0, skipped: false };
  if (running) return { ...stats, skipped: true };
  running = true;
  const deadline = Date.now() + budgetMs;
  try {
    for (let index = 0; index < limit && Date.now() < deadline; index++) {
      const now = new Date();
      const leaseToken = randomUUID();
      const task = await Cleanup.findOneAndUpdate(
        {
          nextAttemptAt: { $lte: now },
          $or: [
            { lockedUntil: { $exists: false } },
            { lockedUntil: { $lte: now } },
          ],
        },
        { $set: { leaseToken, lockedUntil: new Date(now.getTime() + 90000) } },
        { new: true, sort: { nextAttemptAt: 1 } },
      );
      if (!task) break;
      const results = await deleteFilesFromCloudinary([task.url]);
      stats.processed++;
      const owned = { _id: task._id, leaseToken };
      if (
        results.length &&
        results.every(({ result }) => result === "ok" || result === "not found")
      ) {
        await Cleanup.deleteOne(owned);
        stats.succeeded++;
      } else {
        await Cleanup.updateOne(owned, {
          $inc: { attempts: 1 },
          $set: {
            nextAttemptAt: new Date(
              Date.now() +
                Math.min(3600000, 60000 * 2 ** Math.min(task.attempts, 6)),
            ),
          },
          $unset: { leaseToken: "", lockedUntil: "" },
        });
        stats.failed++;
      }
    }
    if (stats.processed)
      logger.info({ event: "asset_cleanup_batch", ...stats });
    return stats;
  } catch (error) {
    logger.error({
      event: "asset_cleanup_failed",
      name: error.name,
      code: error.code,
    });
    if (throwOnError) throw error;
    return { ...stats, failed: stats.failed + 1 };
  } finally {
    running = false;
  }
};
