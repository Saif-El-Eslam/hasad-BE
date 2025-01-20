import mongoose from "mongoose";
import { config } from "./index.js";
import logger from "../utils/logger.js";

// Create a global variable to hold the database connection
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    // If already connected, do nothing
    logger.info("MongoDB connection already established.");
    return;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(config.dbUrl);

    // Mark the connection as established
    isConnected = true;
    logger.info("MongoDB connected successfully.");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
