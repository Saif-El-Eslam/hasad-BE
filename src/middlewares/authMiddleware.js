import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { config } from "../config/index.js";
import usersService from "../services/users_service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header)
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  const match = /^Bearer (\S+)$/i.exec(header);
  let decoded;
  try {
    if (!match) throw new Error("Invalid token");
    decoded = jwt.verify(match[1], config.jwtSecret, {
      algorithms: ["HS256"],
      maxAge: config.jwtExpiresIn,
    });
    if (
      !decoded ||
      !mongoose.isObjectIdOrHexString(decoded.user_id) ||
      typeof decoded.email !== "string"
    )
      throw new Error("Invalid claims");
  } catch {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
  const user = await usersService.getUserById(decoded.user_id, true);
  const version = user?.session_version || 0;
  const validSession =
    decoded.session_version === undefined
      ? version === 0 && user?.token === match[1]
      : Number.isInteger(decoded.session_version) &&
        decoded.session_version === version;
  if (!user || !validSession || user.email !== decoded.email)
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  req.user_id = decoded.user_id;
  req.email = user.email;
  next();
});
