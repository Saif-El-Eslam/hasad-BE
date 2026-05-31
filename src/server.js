import { config } from "./config/index.js";
import logger from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

const startServer = async () => {
  try {
    await connectDB();

    app.listen(config.port, () => {
      logger.info(`Server running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
