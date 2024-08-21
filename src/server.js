// import { config } from "./config/index.js";
// import logger from "./utils/logger.js";
// import { connectDB } from "./config/db.js";
// import app from "./app.js";

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

import logger from "../utils/logger.js";
import { connectDB } from "../config/db.js";
import app from "../app.js";

// Convert your Express server into a serverless function for Vercel
const handler = async (req, res) => {
  try {
    await connectDB();

    // Handle the request with your Express app
    return app(req, res);
  } catch (error) {
    logger.error("Failed to handle request:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export default handler;
