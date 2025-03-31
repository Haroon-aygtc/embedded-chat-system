/**
 * Express static server for production
 * Serves the built frontend assets and handles SPA routing
 */

import express from "express";
import path from "path";
import compression from "compression";
import cors from "cors";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import apiRoutes from "./api/routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import logger from "./utils/logger.js";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const app = express();
const PORT = process.env.PORT || 5173;
const HOST = process.env.HOST || "0.0.0.0";

// Apply middleware
app.use(cors());
app.use(compression());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(requestLogger);

// Security headers
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Strict Transport Security (only in production with HTTPS)
  if (process.env.NODE_ENV === "production" && process.env.HTTPS === "true") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  next();
});

// API routes
app.use("/api", apiRoutes);

// Serve static files with cache headers
app.use(
  express.static(path.join(rootDir, "dist"), {
    maxAge: "1d", // Cache static assets for 1 day
    etag: true,
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// SPA fallback - serve index.html for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "dist/index.html"));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start the server
app.listen(PORT, HOST, () => {
  logger.info(`Server running on http://${HOST}:${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error(`Uncaught exception: ${error.message}`);
  logger.error(error.stack);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});

export default app;
