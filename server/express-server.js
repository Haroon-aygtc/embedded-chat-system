/**
 * Express static server for production
 * Serves the built frontend assets and handles SPA routing
 */
const express = require("express");
const path = require("path");
const compression = require("compression");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5173;
const HOST = process.env.HOST || "0.0.0.0";

// Enable gzip compression
app.use(compression());

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

// Serve static files with cache headers
app.use(
  express.static(path.join(__dirname, "../dist"), {
    maxAge: "1d", // Cache static assets for 1 day
    etag: true,
  }),
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for all routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

// Start the server
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(`Uncaught exception: ${error.message}`);
  console.error(error.stack);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  console.error(`Unhandled promise rejection: ${reason}`);
});
