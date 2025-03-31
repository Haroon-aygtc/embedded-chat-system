/**
 * Main Server Entry Point
 *
 * This file initializes the Express server with all necessary middleware
 * and routes for the Chat Widget application.
 */

import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./api/routes/authRoutes.js";
import userRoutes from "./api/routes/userRoutes.js";
import widgetRoutes from "./api/routes/widgetRoutes.js";
import contextRuleRoutes from "./api/routes/contextRuleRoutes.js";
import knowledgeBaseRoutes from "./api/routes/knowledgeBaseRoutes.js";
import chatRoutes from "./api/routes/chatRoutes.js";
import uploadRoutes from "./api/routes/uploadRoutes.js";
import aiConfigRoutes from "./api/routes/aiConfigRoutes.js";
import analyticsRoutes from "./api/routes/analyticsRoutes.js";

// Import middleware
import {
  authenticateJWT,
  authenticateOptional,
} from "./middleware/authMiddleware.js";
import errorHandler from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";

// Import WebSocket handlers
import initializeSocketIO from "./services/socketService.js";

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Initialize WebSocket handlers
initializeSocketIO(io);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "ERR_RATE_LIMIT",
      message: "Too many requests, please try again later.",
    },
  },
});

// Apply middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies
app.use(requestLogger); // Log requests

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../public")));

// Apply rate limiting to API routes
app.use("/api/", apiLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", authenticateJWT, userRoutes);
app.use("/api/widget-configs", authenticateJWT, widgetRoutes);
app.use("/api/context-rules", authenticateJWT, contextRuleRoutes);
app.use("/api/knowledge-base", authenticateJWT, knowledgeBaseRoutes);
app.use("/api/chat", authenticateOptional, chatRoutes);
app.use("/api/uploads", authenticateJWT, uploadRoutes);
app.use("/api/ai-config", authenticateJWT, aiConfigRoutes);
app.use("/api/analytics", authenticateJWT, analyticsRoutes);

// Public widget route (no auth required)
app.use("/api/widget-configs/public", widgetRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Serve React app for all other routes (SPA support)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

export default server;
