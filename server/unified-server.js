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
import fs from "fs";
import { fileURLToPath } from "url";
import compression from "compression";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load environment variables
dotenv.config({ path: path.resolve(rootDir, ".env") });

// Environment detection
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// Configuration with fallbacks
const FRONTEND_PORT = process.env.PORT || 5173;
const WS_PORT = process.env.WS_PORT || 8080;
const API_PORT = process.env.API_PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

// Logging utility
const logger = {
  info: (tag, message) => console.log(`\x1b[36m[${tag}] ${message}\x1b[0m`),
  success: (tag, message) => console.log(`\x1b[32m[${tag}] ${message}\x1b[0m`),
  warn: (tag, message) => console.log(`\x1b[33m[${tag}] ${message}\x1b[0m`),
  error: (tag, message) =>
    console.error(`\x1b[31m[${tag} Error] ${message}\x1b[0m`),
};

// Track active server processes
const servers = {
  vite: null,
};

// Flag to prevent restarting servers during shutdown
let shuttingDown = false;

// Initialize Supabase client (if credentials are available)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Check if the dist directory exists for production mode
if (isProd && !fs.existsSync(path.join(rootDir, "dist"))) {
  logger.error(
    "Server",
    "Production mode requires a built application. Run 'npm run build' first.",
  );
  process.exit(1);
}

/**
 * Create and configure the Express app
 */
function createExpressApp() {
  const app = express();

  // Common middleware
  app.use(cors());
  app.use(bodyParser.json());

  // API Routes
  configureApiRoutes(app);

  // In production, serve static files
  if (isProd) {
    // Enable gzip compression
    app.use(compression());

    // Serve static files with cache headers
    app.use(
      express.static(path.join(rootDir, "dist"), {
        maxAge: "1d",
        etag: true,
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

  // Error handling middleware
  app.use((err, req, res, next) => {
    logger.error("Express", `Unhandled error: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

/**
 * Configure API routes
 */
function configureApiRoutes(app) {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      supabaseConnected: !!supabase,
      environment: NODE_ENV,
    });
  });

  // Auth API
  app.post("/api/auth/register", async (req, res) => {
    try {
      if (!supabase) {
        return res
          .status(503)
          .json({ error: "Database connection not available" });
      }

      const { email, password, name } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
            role: "user",
          },
        },
      });

      if (error) throw error;

      res.status(201).json({ success: true, user: data.user });
    } catch (error) {
      logger.error("Auth", `Error registering user: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      if (!supabase) {
        return res
          .status(503)
          .json({ error: "Database connection not available" });
      }

      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      res.status(200).json({
        success: true,
        user: data.user,
        session: data.session,
      });
    } catch (error) {
      logger.error("Auth", `Error logging in user: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // Context Rules API
  app.get("/api/context-rules", async (req, res) => {
    try {
      if (!supabase) {
        return res
          .status(503)
          .json({ error: "Database connection not available" });
      }

      const { data, error } = await supabase
        .from("context_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;

      res.status(200).json(data);
    } catch (error) {
      logger.error("API", `Error fetching context rules: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  });

  // Add more API routes as needed...
  // This is a simplified version - in production, you would import route modules

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

    const viteServer = spawn(
      "npm",
      ["run", "dev", "--", "--port", FRONTEND_PORT, "--host", HOST],
      {
        stdio: "pipe",
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
function startUnifiedServer() {
  // Create Express app
  const app = createExpressApp();

  // Create HTTP server
  const server = http.createServer(app);

  // Configure WebSocket server
  const wss = configureWebSocketServer(server);

  // Start the server
  server.listen(API_PORT, HOST, () => {
    logger.success(
      "Server",
      `Unified server running on http://${HOST}:${API_PORT}`,
    );
    logger.success(
      "WebSocket",
      `WebSocket server available at ws://${HOST}:${API_PORT}`,
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
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Server", `Unhandled promise rejection: ${reason}`);

  // In production, keep the server running despite unhandled rejections
  if (!isProd) {
    process.exit(1);
  }
});

// Start the unified server
startUnifiedServer();

logger.success("Server", `Started in ${NODE_ENV} mode`);
