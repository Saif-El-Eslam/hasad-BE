import { config, validateConfig } from "../src/config/index.js";
import { verifyMailer } from "../src/config/mailer.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { connectDB } from "../src/config/db.js";

const results = [];
const check = async (name, work) => {
  try {
    await work();
    results.push({ name, status: "ok" });
  } catch (error) {
    results.push({
      name,
      status: "failed",
      error: error.name,
      code: error.code,
    });
    process.exitCode = 1;
  }
};
config.environment = "production";
try {
  await check("configuration", () => validateConfig());
  await check("database", async () => {
    await connectDB();
    await mongoose.connection.db.command({ ping: 1 });
  });
  if (process.argv.includes("--providers")) {
    // These verify credentials/connectivity without sending email or modifying assets.
    await check("gmail", verifyMailer);
    cloudinary.config({
      cloud_name: config.cloud_name,
      api_key: config.api_key,
      api_secret: config.api_secret,
    });
    await check("cloudinary", () => cloudinary.api.ping({ timeout: 10000 }));
  }
  results.push({
    name: "scheduler",
    status: config.cronSecret ? "configured" : "not_configured",
  });
  results.push({
    name: "monitoring",
    status: config.operationsSecret ? "configured" : "not_configured",
  });
  console.log(JSON.stringify(results, null, 2));
} finally {
  await mongoose.disconnect();
}
