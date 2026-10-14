import { randomInt, createHmac } from "node:crypto";
import Challenge from "../models/otpChallenge.js";
import { config } from "../config/index.js";

const digest = (user, purpose, code) =>
  createHmac("sha256", config.jwtSecret)
    .update(`${user}:${purpose}:${code}`)
    .digest("hex");

export const issueChallenge = async (user, purpose) => {
  const code = String(randomInt(0, 10000)).padStart(4, "0");
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

export const consumeChallenge = async (user, purpose, code) => {
  if (typeof code !== "string" || !/^\d{4}$/.test(code)) return false;
  const challenge = await Challenge.findOneAndUpdate(
    { user, purpose, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
    { $inc: { attempts: 1 } },
    { new: true },
  );
  if (!challenge || challenge.hash !== digest(user, purpose, code))
    return false;
  const result = await Challenge.deleteOne({
    _id: challenge._id,
    hash: challenge.hash,
    attempts: { $lte: 5 },
    expiresAt: { $gt: new Date() },
  });
  return result.deletedCount === 1;
};
