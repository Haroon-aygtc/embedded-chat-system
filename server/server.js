/**
 * Unified Server
 *
 * This file serves as the single entry point for all server components:
 * - Frontend (Vite dev server in development, Express in production)
 * - WebSocket server for real-time communication
 * - API server for REST endpoints
 */

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import cors from "cors";
import bodyParser from "body-parser";
import { spawn } from "child_process";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import apiRoutes from "./api/routes/index.js";
import authRoutes from "./api/routes/authRoutes.js";
import userRoutes from "./api/routes/userRoutes.js";
import widgetRoutes from "./api/routes/widgetRoutes.js";
import contextRuleRoutes from "./api/routes/contextRuleRoutes.js";
import knowledgeBaseRoutes from "./api/routes/knowledgeBaseRoutes.js";
import chatRoutes from "./api/routes/chatRoutes.js";
import uploadRoutes from "./api/routes/uploadRoutes.js";
import aiConfigRoutes from "./api/routes/aiConfigRoutes.js";
import analyticsRoutes from "./api/routes/analyticsRoutes.js";
import scrapeRoutes from "./api/routes/scrapeRoutes.js";

// Import middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import requestLogger from "./middleware/requestLogger.js";
import {
  authenticateJWT,
  authenticateOptional,
} from "./middleware/authMiddleware.js";
import logger from "./utils/logger.js";
import { getMySQLClient } from "./services/mysqlClient.js";
import initializeSocketIO from "./services/socketService.js";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Environment detection
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// Configuration with fallbacks
const FRONTEND_PORT = process.env.PORT || 5173;
const API_PORT = parseInt(process.env.API_PORT || 3001);
const HOST = process.env.HOST || "0.0.0.0";

// Track active server processes
const servers = {
  vite: null,
};

// Flag to prevent restarting servers during shutdown
let shuttingDown = false;

// Import migration runner
import migrationRunner from "./utils/migrationRunner.js";

// Initialize database connection and run migrations
async function initDatabase() {
  try {
    await getMySQLClient();
    logger.success("Database", "Database connection established");

    // Run migrations automatically on server start
    await migrationRunner.runMigrations();
    logger.success("Database", "Migrations completed successfully");
  } catch (error) {
    logger.error("Database", `Database initialization error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create and configure the Express app
 */
function createExpressApp() {
  const app = express();

  // Rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "production" ? 50 : 100, // More strict in production
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

  // Common middleware
  app.use(helmet()); // Security headers
  app.use(cors());
  app.use(compression());
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
  app.use(cookieParser()); // Parse cookies

  // Add request ID middleware
  app.use((req, res, next) => {
    req.headers["x-request-id"] =
      req.headers["x-request-id"] || crypto.randomUUID();
    res.setHeader("X-Request-ID", req.headers["x-request-id"]);
    next();
  });

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

  // Add request logger
  app.use(requestLogger);

  // Apply rate limiting to API routes
  app.use("/api/", apiLimiter);

  // API Routes
  app.use("/api", apiRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/users", authenticateJWT, userRoutes);
  app.use("/api/widget-configs", authenticateJWT, widgetRoutes);
  app.use("/api/context-rules", authenticateJWT, contextRuleRoutes);
  app.use("/api/knowledge-base", authenticateJWT, knowledgeBaseRoutes);
  app.use("/api/chat", authenticateOptional, chatRoutes);
  app.use("/api/uploads", authenticateJWT, uploadRoutes);
  app.use("/api/ai-config", authenticateJWT, aiConfigRoutes);
  app.use("/api/analytics", authenticateJWT, analyticsRoutes);
  app.use("/api/scrape", authenticateJWT, scrapeRoutes);

  // Public widget route (no auth required)
  app.use("/api/widget-configs/public", widgetRoutes);

  // In production, serve static files
  if (isProd) {
    // Serve static files with cache headers
    app.use(
      express.static(path.join(rootDir, "dist"), {
        maxAge: "7d", // Increase cache time for production
        etag: true,
        immutable: true, // Add immutable for hashed assets
      }),
    );

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }
      res.sendFile(path.join(rootDir, "dist/index.html"));
    });
  }

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    });
  });

  // Error handling middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Configure WebSocket server
 */
function configureWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  // Track connected clients
  const clients = new Set();

  // Implement heartbeat to detect and clean up broken connections
  function heartbeat() {
    this.isAlive = true;
  }

  // Handle new connections
  wss.on("connection", (ws) => {
    logger.info("WebSocket", "Client connected");
    clients.add(ws);

    // Set up heartbeat
    ws.isAlive = true;
    ws.on("pong", heartbeat);

    // Send welcome message
    ws.send(
      JSON.stringify({
        type: "system",
        payload: { message: "Connected to WebSocket server" },
        timestamp: new Date().toISOString(),
      }),
    );

    // Handle incoming messages
    ws.on("message", (message) => {
      try {
        // Convert Buffer or ArrayBuffer to string if needed
        const messageStr =
          message instanceof Buffer || message instanceof ArrayBuffer
            ? message.toString()
            : message;
        const data = JSON.parse(messageStr);
        logger.info("WebSocket", `Received: ${JSON.stringify(data.type)}`);

        // Handle different message types
        switch (data.type) {
          case "ping":
            // Respond to ping with pong
            ws.send(
              JSON.stringify({
                type: "pong",
                sentAt: data.sentAt,
                timestamp: new Date().toISOString(),
              }),
            );
            break;

          case "auth":
            // Mock authentication response
            ws.send(
              JSON.stringify({
                type: "auth_response",
                payload: {
                  success: true,
                  userId: "user_" + Math.random().toString(36).substring(2, 9),
                  permissions: ["read", "write"],
                },
                timestamp: new Date().toISOString(),
              }),
            );
            break;

          case "chat":
            // Broadcast chat messages to all clients
            const broadcastMessage = JSON.stringify({
              type: "chat",
              payload: data.payload,
              timestamp: new Date().toISOString(),
              clientId: data.clientId || "unknown",
            });

            clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(broadcastMessage);
              }
            });
            break;

          default:
            // Echo back other message types
            ws.send(
              JSON.stringify({
                type: "echo",
                originalType: data.type,
                payload: data.payload,
                timestamp: new Date().toISOString(),
              }),
            );
        }
      } catch (error) {
        logger.error("WebSocket", `Error processing message: ${error.message}`);
        ws.send(
          JSON.stringify({
            type: "error",
            payload: { message: "Invalid message format" },
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      logger.info("WebSocket", "Client disconnected");
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      logger.error("WebSocket", `WebSocket error: ${error.message}`);
      clients.delete(ws);
    });
  });

  // Ping all clients every 30 seconds to detect broken connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Clean up interval on server close
  wss.on("close", () => {
    clearInterval(interval);
  });

  return wss;
}

/**
 * Start Vite dev server in development mode
 */
function startViteDevServer() {
  if (!isProd) {
    logger.info("Vite", `Starting dev server on port ${FRONTEND_PORT}...`);

    // Use cross-platform path to npm executable
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

    const viteServer = spawn(
      npmCmd,
      ["run", "dev", "--", "--port", FRONTEND_PORT, "--host", HOST],
      {
        stdio: "pipe",
        env: { ...process.env, VITE_TEMPO: "true" },
      },
    );

    servers.vite = viteServer;

    viteServer.stdout.on("data", (data) => {
      logger.info("Vite", data.toString().trim());
    });

    viteServer.stderr.on("data", (data) => {
      logger.error("Vite", data.toString().trim());
    });

    viteServer.on("error", (error) => {
      logger.error("Vite", `Failed to start: ${error.message}`);
    });

    viteServer.on("close", (code) => {
      logger.info("Vite", `Server exited with code ${code}`);
    });

    return viteServer;
  }
  return null;
}

/**
 * Start the unified server
 */
async function startUnifiedServer() {
  // Initialize database connection
  await initDatabase();

  // Create Express app
  const app = createExpressApp();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.IO if available
  if (typeof initializeSocketIO === "function") {
    const io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    initializeSocketIO(io);
  }

  // Configure WebSocket server
  const wss = configureWebSocketServer(server);

  // Start the server with error handling for port conflicts
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      logger.error(
        "Server",
        `Port ${API_PORT} is already in use. Try a different port or stop the process using this port.`,
      );
      // Try another port
      const newPort = API_PORT + 1;
      logger.info("Server", `Attempting to use port ${newPort} instead...`);
      server.listen(newPort, HOST);
    } else {
      logger.error("Server", `Server error: ${error.message}`);
      process.exit(1);
    }
  });

  server.listen(API_PORT, HOST, () => {
    logger.success(
      "Server",
      `Unified server running on http://${HOST}:${server.address().port}`,
    );
    logger.success(
      "WebSocket",
      `WebSocket server available at ws://${HOST}:${server.address().port}`,
    );
  });

  // In development mode, also start the Vite dev server
  if (!isProd) {
    startViteDevServer();
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    shuttingDown = true;
    logger.warn("Server", "Shutting down all servers...");

    // Close the HTTP/WebSocket server
    server.close(() => {
      logger.info("Server", "HTTP/WebSocket server closed");
    });

    // Kill Vite dev server if running
    if (servers.vite) {
      servers.vite.kill();
    }

    // Force exit after a timeout in case some processes don't terminate cleanly
    setTimeout(() => {
      logger.error("Server", "Forcing exit after timeout");
      process.exit(1);
    }, 5000);
  });
}

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Server", `Uncaught exception: ${error.message}`);
  logger.error("Server", error.stack);

  // In production, keep the server running despite uncaught exceptions
  if (!isProd) {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason) => {
  logger.error("Server", `Unhandled promise rejection: ${reason}`);

  // In production, keep the server running despite unhandled rejections
  if (!isProd) {
    process.exit(1);
  }
});

// Start the unified server
startUnifiedServer().catch((error) => {
  logger.error("Server", `Failed to start unified server: ${error.message}`);
  process.exit(1);
});

logger.success("Server", `Started in ${NODE_ENV} mode`);

export default server;
