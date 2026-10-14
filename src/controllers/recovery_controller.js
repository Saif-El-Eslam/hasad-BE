import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { validationResult } from "express-validator";
import User from "../models/user.js";
import {
  issueChallenge,
  consumeChallenge,
  cancelChallenge,
} from "../services/otp_service.js";
import { databaseWork } from "../services/lifecycle_service.js";
import {
  enqueueRecoveryMail,
  scheduleRecoveryMail,
} from "../services/recovery_mail_service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

const validationErrors = (req, res) => {
  const result = validationResult(req);
  if (result.isEmpty()) return false;
  res.status(400).json({
    errors: result.array().map(({ value: _value, ...error }) => error),
  });
  return true;
};

const request = asyncHandler(async (req, res) => {
  if (validationErrors(req, res)) return;
  const started = Date.now();
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    let otp;
    try {
      otp = await issueChallenge(user._id, "recover");
      await enqueueRecoveryMail(user._id, otp);
    } catch (error) {
      if (otp) await cancelChallenge(user._id, "recover", otp);
      if (error.status !== 429)
        logger.error({
          event: "recovery_email_failed",
          requestId: req.requestId,
          name: error.name,
          code: error.code,
        });
    }
  }
  scheduleRecoveryMail();
  // Same response for unknown accounts, cooldowns and mail failures.
  await delay(Math.max(0, 500 + randomInt(0, 200) - (Date.now() - started)));
  return res.status(200).json({
    message: "If the account exists, a password reset email has been sent",
  });
});

const confirm = asyncHandler(async (req, res) => {
  if (validationErrors(req, res)) return;
  const { email, otp, password } = req.body;
  const user = await User.findOne({ email });
  // Hash even for unknown accounts so the early failure does not trivially enumerate users.
  const password_hash = await bcrypt.hash(password, 10);
  if (!user) return res.status(400).json({ message: "Invalid OTP" });
  const updated = await databaseWork(async (session) => {
    if (!(await consumeChallenge(user._id, "recover", otp, session)))
      return false;
    const result = await User.updateOne(
      { _id: user._id, email },
      {
        $set: { password_hash, token: null, verify_otp: null },
        $inc: { session_version: 1 },
      },
      { session, runValidators: true },
    );
    if (!result.matchedCount)
      throw new Error("Account changed during recovery");
    return true;
  });
  if (!updated) return res.status(400).json({ message: "Invalid OTP" });
  return res.status(200).json({ message: "Password reset successfully" });
});

export default { request, confirm };
