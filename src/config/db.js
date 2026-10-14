import mongoose from "mongoose";
import { config } from "./index.js";
import logger from "../utils/logger.js";

let cached = global._mongooseConnection;
if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;
  if (mongoose.connection.readyState === 0) {
    cached.conn = null;
    cached.promise = null;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(config.dbUrl, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: config.environment !== "production",
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    logger.info("MongoDB connected successfully");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    logger.error("MongoDB connection error:", error);
    throw error;
  }
};
