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
export const processCleanup = async () => {
  if (running) return;
  running = true;
  try {
    const tasks = await Cleanup.find({
      nextAttemptAt: { $lte: new Date() },
    }).limit(20);
    for (const task of tasks) {
      const results = await deleteFilesFromCloudinary([task.url]);
      if (
        results.every(({ result }) => result === "ok" || result === "not found")
      ) {
        await Cleanup.deleteOne({ _id: task._id });
      } else {
        await Cleanup.updateOne(
          { _id: task._id },
          {
            $inc: { attempts: 1 },
            $set: {
              nextAttemptAt: new Date(
                Date.now() +
                  Math.min(3600000, 60000 * 2 ** Math.min(task.attempts, 6)),
              ),
            },
          },
        );
      }
    }
  } catch (error) {
    logger.error({
      event: "asset_cleanup_failed",
      name: error.name,
      code: error.code,
    });
  } finally {
    running = false;
  }
};
