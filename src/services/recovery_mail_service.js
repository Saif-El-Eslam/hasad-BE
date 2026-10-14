import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { waitUntil } from "@vercel/functions";
import Mail from "../models/recoveryMail.js";
import Challenge from "../models/otpChallenge.js";
import User from "../models/user.js";
import { config } from "../config/index.js";
import { digest } from "./otp_service.js";
import { sendRecoveryEmail } from "../config/mailer.js";
import logger from "../utils/logger.js";

const key = () =>
  createHash("sha256")
    .update(config.jwtSecret)
    .update(":recovery-mail")
    .digest();
const encrypt = (code) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  return Buffer.concat([
    iv,
    cipher.update(code, "utf8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
};
const decrypt = (value) => {
  const encrypted = Buffer.from(value, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    encrypted.subarray(0, 12),
  );
  decipher.setAuthTag(encrypted.subarray(-16));
  return Buffer.concat([
    decipher.update(encrypted.subarray(12, -16)),
    decipher.final(),
  ]).toString("utf8");
};

export const enqueueRecoveryMail = (user, code) =>
  Mail.create({
    user,
    challengeHash: digest(user, "recover", code),
    encryptedCode: encrypt(code),
    expiresAt: new Date(Date.now() + 10 * 60000),
  });

let running = false;
export const processRecoveryMail = async ({
  limit = 10,
  budgetMs = 25000,
} = {}) => {
  const stats = { processed: 0, sent: 0, failed: 0 };
  if (running) return stats;
  running = true;
  const deadline = Date.now() + budgetMs;
  try {
    for (let index = 0; index < limit && Date.now() < deadline; index++) {
      const now = new Date();
      const leaseToken = randomUUID();
      const task = await Mail.findOneAndUpdate(
        {
          nextAttemptAt: { $lte: now },
          expiresAt: { $gt: now },
          $or: [
            { lockedUntil: { $exists: false } },
            { lockedUntil: { $lte: now } },
          ],
        },
        {
          $set: {
            leaseToken,
            lockedUntil: new Date(now.getTime() + 5 * 60000),
          },
        },
        { new: true, sort: { nextAttemptAt: 1 } },
      );
      if (!task) break;
      const owned = { _id: task._id, leaseToken };
      stats.processed++;
      try {
        const [user, active] = await Promise.all([
          User.findById(task.user),
          Challenge.exists({
            user: task.user,
            purpose: "recover",
            hash: task.challengeHash,
            expiresAt: { $gt: new Date() },
          }),
        ]);
        if (user && active) {
          await sendRecoveryEmail({ user, code: decrypt(task.encryptedCode) });
          stats.sent++;
        }
        await Mail.deleteOne(owned);
      } catch (error) {
        stats.failed++;
        await Mail.updateOne(owned, {
          $inc: { attempts: 1 },
          $set: {
            nextAttemptAt: new Date(
              Date.now() +
                Math.min(60000, 5000 * 2 ** Math.min(task.attempts, 4)),
            ),
          },
          $unset: { leaseToken: "", lockedUntil: "" },
        });
        logger.error({
          event: "recovery_email_failed",
          name: error.name,
          code: error.code,
        });
      }
    }
  } catch (error) {
    stats.failed++;
    logger.error({
      event: "recovery_worker_failed",
      name: error.name,
      code: error.code,
    });
  } finally {
    running = false;
  }
  return stats;
};

export const scheduleRecoveryMail = () => {
  const work = processRecoveryMail();
  if (process.env.VERCEL) waitUntil(work);
  else void work;
};
