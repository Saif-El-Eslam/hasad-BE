import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

export const authenticate = (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    req.user_id = decoded.user_id;
    req.email = decoded.email;

    next();
  });
};
