import mongoose from "mongoose";
import { pathToFileURL } from "node:url";
import { config, validateConfig } from "./config/index.js";
import logger from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import { processCleanup } from "./services/asset_cleanup_service.js";
import Challenge from "./models/otpChallenge.js";
import app from "./app.js";

export const startServer = async () => {
  validateConfig();
  await connectDB();
  // This collection contains only new challenges; no legacy user data is modified.
  await Challenge.createIndexes();
  const server = app.listen(config.port, () =>
    logger.info(`Server running on port ${config.port}`),
  );
  const worker = setInterval(() => {
    void processCleanup();
  }, 60000);
  worker.unref();
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    clearInterval(worker);
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => {
      await mongoose.disconnect();
      clearTimeout(deadline);
      process.exit(0);
    });
    server.closeIdleConnections();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  return server;
};
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href &&
  !process.env.VERCEL
) {
  startServer().catch((error) => {
    logger.error({ event: "startup_failed", message: error.message });
    process.exitCode = 1;
  });
}
export default app;
