import { config } from "./config/index.js";
import logger from "./utils/logger.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

// const startServer = async () => {
//   try {
//     // Connect to Database
//     await connectDB();

//     // Start Server
//     app.listen(config.port, () => {
//       logger.info(`Server running on port ${config.port}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error);
//     process.exit(1);
//   }
// };

// startServer();

const handler = async (req, res) => {
  try {
    // Connect to Database
    await connectDB();

    // Use Express app to handle the request
    return app(req, res);
  } catch (error) {
    logger.error("Failed to handle request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default handler;
