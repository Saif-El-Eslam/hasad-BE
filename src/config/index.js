import dotenv from "dotenv";

dotenv.config();

export const config = {
  environment: process.env.ENVIRONMENT || "development",
  port: process.env.PORT || 3000,
  dbUrl:
    process.env.ENVIRONMENT === "production"
      ? process.env.PROD_DB_URL
      : process.env.DEV_DB_URL,
  jwtSecret: process.env.JWT_SECRET,
};
