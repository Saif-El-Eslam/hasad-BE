import logger from "../utils/logger.js";

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  logger.error({
    event: "request_failed",
    requestId: req.requestId,
    name: error.name,
    code: error.code,
  });
  if (error.code === 11000)
    return res.status(422).json({ message: "Email already exists" });
  if (error.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message: "File size exceeds 5MB" });
  if (error.name === "MulterError")
    return res.status(400).json({ message: "Invalid upload" });
  const status =
    error.status === 429
      ? 429
      : error.status === 400 || error.type === "entity.parse.failed"
        ? 400
        : error.type === "entity.too.large"
          ? 413
          : 500;
  const message =
    status === 429
      ? "Too many requests"
      : status === 400
        ? "Invalid request"
        : status === 413
          ? "Request too large"
          : "Internal server error";
  return res.status(status).json({ message });
};
