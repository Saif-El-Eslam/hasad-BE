import { config } from "./config/index.js";
import logger from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const startServer = async () => {
  try {
    // Connect to Database
    await connectDB();

    // Start Server
    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
