import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import auth_routes from "./routes/auth_routes.js";
import folders_routes from "./routes/folders_routes.js";
import books_routes from "./routes/books_routes.js";
import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";
import logger from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { MongoRateLimitStore } from "./services/rate_limit_store.js";
import operations_routes from "./routes/operations_routes.js";

const app = express();
app.disable("x-powered-by");
// Configure only known reverse proxies; never trust arbitrary forwarding headers.
if (process.env.TRUST_PROXY_HOPS)
  app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
app.use(helmet());
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  if (config.environment !== "test")
    res.on("finish", () =>
      logger.info({
        event: "request",
        requestId: req.requestId,
        method: req.method,
        route: req.route?.path || "unmatched",
        status: res.statusCode,
      }),
    );
  next();
});
app.use("/internal", operations_routes);
const authLimiter = rateLimit({
  windowMs: 15 * 60000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests" },
  store: new MongoRateLimitStore(),
});
app.use("/api/auth", authLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({ message: "Database unavailable" });
  }
});
app.use("/api/auth", auth_routes);
app.use("/api/folders", folders_routes);
app.use("/api/books", books_routes);
app.get("/", (_req, res) => res.send("ًWelcome to Hasad API!"));
app.use(errorHandler);
export default app;
