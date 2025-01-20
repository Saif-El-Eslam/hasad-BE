import { config } from "./config/index.js"; // Adjust the path as needed
import logger from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the Database
    await connectDB();

    // Check if running locally
    const isLocal = !process.env.VERCEL;

    if (isLocal) {
      // Start the Express server locally
      app.listen(config.port, () => {
        logger.info(
          `Server running locally on http://localhost:${config.port}`
        );
      });
    }
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

// Check if the file is being executed directly or as a module
if (!process.env.VERCEL) {
  // Run only in local environments
  startServer();
}

export default app; // Export for Vercel
