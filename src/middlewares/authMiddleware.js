import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import logger from "../utils/logger.js";

export const authenticate = (req, res, next) => {
  logger.info("Middleware: authenticate");

  const token = req?.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  logger.info("Token:", token);

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    req.user_id = decoded.user_id;
    req.email = decoded.email;

    logger.info("User ID:", req.user_id);

    next();
  });
};
