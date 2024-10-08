import express from "express";
import auth_routes from "./routes/auth_routes.js";
import folders_routes from "./routes/folders_routes.js";
import books_routes from "./routes/books_routes.js";
// import benefits_routes from "./routes/benefits_routes.js";
import { config } from "./config/index.js";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

config.environment === "development" &&
  app.use((req, res, next) => {
    console.log(
      `Method: { ${req.method} } ||`,
      `URL: { ${req.url} } ||`,
      `Body: ${JSON.stringify(req.body)}`
    );

    next();
  });

// Add routes with /api prefix
app.use("/api/auth", auth_routes);
app.use("/api/folders", folders_routes);
app.use("/api/books", books_routes);
// app.use("/api/benefits", benefits_routes); // This route is nested in books_routes

export default app;
