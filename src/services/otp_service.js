import { randomInt, createHmac } from "node:crypto";
import Challenge from "../models/otpChallenge.js";
import { config } from "../config/index.js";

export const digest = (user, purpose, code) =>
  createHmac("sha256", config.jwtSecret)
    .update(`${user}:${purpose}:${code}`)
    .digest("hex");

export const issueChallenge = async (user, purpose) => {
  const digits = purpose === "recover" ? 6 : 4;
  const code = String(randomInt(0, 10 ** digits)).padStart(digits, "0");
  const now = new Date();
  try {
    await Challenge.findOneAndUpdate(
      {
        user,
        purpose,
        requestedAt: { $lte: new Date(now.getTime() - 60000) },
      },
      {
        $set: {
          hash: digest(user, purpose, code),
          requestedAt: now,
          expiresAt: new Date(now.getTime() + 10 * 60000),
          attempts: 0,
        },
      },
      { upsert: true, runValidators: true },
    );
  } catch (error) {
    if (error.code === 11000) {
      const limited = new Error("Too many requests");
      limited.status = 429;
      throw limited;
    }
    throw error;
  }
  return code;
};

export const cancelChallenge = (user, purpose, code) =>
  Challenge.deleteOne({ user, purpose, hash: digest(user, purpose, code) });

export const consumeChallenge = async (user, purpose, code, session = null) => {
  const pattern = purpose === "recover" ? /^\d{6}$/ : /^\d{4}$/;
  if (typeof code !== "string" || !pattern.test(code)) return false;
  const challenge = await Challenge.findOneAndUpdate(
    { user, purpose, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
    { $inc: { attempts: 1 } },
    { new: true, session },
  );
  if (!challenge || challenge.hash !== digest(user, purpose, code))
    return false;
  const result = await Challenge.deleteOne(
    {
      _id: challenge._id,
      hash: challenge.hash,
      attempts: { $lte: 5 },
      expiresAt: { $gt: new Date() },
    },
    { session },
  );
  return result.deletedCount === 1;
};
