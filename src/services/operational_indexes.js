import mongoose from "mongoose";
import Challenge from "../models/otpChallenge.js";
import Counter from "../models/rateLimitCounter.js";
import Mail from "../models/recoveryMail.js";

let client;
let pending;
export const ensureOperationalIndexes = async () => {
  if (client !== mongoose.connection.getClient()) {
    client = mongoose.connection.getClient();
    pending = null;
  }
  if (!pending)
    pending = Promise.all([
      Challenge.createIndexes(),
      Counter.createIndexes(),
      Mail.createIndexes(),
    ]).catch((error) => {
      pending = null;
      throw error;
    });
  await pending;
};
