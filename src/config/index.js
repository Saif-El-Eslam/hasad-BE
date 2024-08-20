import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DEV_DB_URL,
  jwtSecret: process.env.JWT_SECRET,
};
