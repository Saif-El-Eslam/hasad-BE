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
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};
