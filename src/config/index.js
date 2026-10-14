import dotenv from "dotenv";

dotenv.config();

const environment =
  process.env.ENVIRONMENT || process.env.NODE_ENV || "development";

export const config = {
  environment,
  port: process.env.PORT || 3000,
  dbUrl:
    environment === "production"
      ? process.env.PROD_DB_URL
      : process.env.DEV_DB_URL,
  jwtSecret: process.env.JWT_SECRET,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
};

export const validateConfig = () => {
  const required = {
    database: config.dbUrl,
    JWT_SECRET: config.jwtSecret,
    CLOUDINARY_CLOUD_NAME: config.cloud_name,
    CLOUDINARY_API_KEY: config.api_key,
    CLOUDINARY_API_SECRET: config.api_secret,
    EMAIL: process.env.EMAIL,
    GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length)
    throw new Error(`Missing configuration: ${missing.join(", ")}`);
  if (
    !Number.isInteger(Number(config.port)) ||
    Number(config.port) < 1 ||
    Number(config.port) > 65535
  )
    throw new Error("Invalid PORT");
  if (config.environment === "production" && config.jwtSecret.length < 32)
    throw new Error(
      "JWT_SECRET must contain at least 32 characters in production",
    );
};
