import express from "express";
import auth_routes from "./routes/auth_routes.js";
import folders_routes from "./routes/folders_routes.js";
import books_routes from "./routes/books_routes.js";

const app = express();

// Middleware
app.use(express.json());

// Add routes with /api prefix
app.use("/api/auth", auth_routes);
app.use("/api/folders", folders_routes);
app.use("/api/books", books_routes);

export default app;
