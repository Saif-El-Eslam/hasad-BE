import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";
import { config } from "../src/config/index.js";
import { processCleanup } from "../src/services/asset_cleanup_service.js";

config.environment = "production";
try {
  await connectDB();
  const stats = await processCleanup({
    limit: 100,
    budgetMs: 50000,
    throwOnError: true,
  });
  console.log(JSON.stringify(stats));
  if (stats.failed) process.exitCode = 1;
} catch (error) {
  console.error(
    JSON.stringify({ status: "failed", name: error.name, code: error.code }),
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
