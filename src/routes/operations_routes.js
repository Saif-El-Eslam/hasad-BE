import express from "express";
import mongoose from "mongoose";
import { config } from "../config/index.js";
import { connectDB } from "../config/db.js";
import { operationsAuth } from "../middlewares/operationsAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Cleanup from "../models/assetCleanup.js";
import { processCleanup } from "../services/asset_cleanup_service.js";
import { ensureOperationalIndexes } from "../services/operational_indexes.js";
import Mail from "../models/recoveryMail.js";
import { processRecoveryMail } from "../services/recovery_mail_service.js";

const router = express.Router();
router.get("/health/live", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({ status: "ok" });
});
router.get(
  "/health/ready",
  operationsAuth(config.operationsSecret),
  asyncHandler(async (_req, res) => {
    try {
      await connectDB();
      await mongoose.connection.db.command({ ping: 1 });
      res.json({ status: "ready" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  }),
);
router.get(
  "/metrics",
  operationsAuth(config.operationsSecret),
  asyncHandler(async (_req, res) => {
    await connectDB();
    const [pending, oldest, retried, recoveryPending] = await Promise.all([
      Cleanup.countDocuments(),
      Cleanup.findOne().sort({ createdAt: 1 }).select("createdAt"),
      Cleanup.countDocuments({ attempts: { $gt: 0 } }),
      Mail.countDocuments({ expiresAt: { $gt: new Date() } }),
    ]);
    res.json({
      uptimeSeconds: Math.floor(process.uptime()),
      recoveryMail: { pending: recoveryPending },
      assetCleanup: {
        pending,
        retried,
        oldestAgeSeconds: oldest?.createdAt
          ? Math.max(
              0,
              Math.floor((Date.now() - oldest.createdAt.getTime()) / 1000),
            )
          : 0,
      },
    });
  }),
);
const cleanup = asyncHandler(async (_req, res) => {
  await connectDB();
  await ensureOperationalIndexes();
  const stats = await processCleanup({
    limit: 20,
    budgetMs: 25000,
    throwOnError: true,
  });
  const recoveryMail = await processRecoveryMail();
  res
    .status(stats.failed || recoveryMail.failed ? 503 : 200)
    .json({ ...stats, recoveryMail, pending: await Cleanup.countDocuments() });
});
router.get("/jobs/asset-cleanup", operationsAuth(config.cronSecret), cleanup);
router.post("/jobs/asset-cleanup", operationsAuth(config.cronSecret), cleanup);
export default router;
