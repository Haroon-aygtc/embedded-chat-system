/**
 * Unified server starter
 * Starts the appropriate server(s) based on environment
 * - Development: Starts both Vite dev server and WebSocket server
 * - Production: Starts Express static server and WebSocket server
 */
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Environment detection
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// Configuration with fallbacks
const VITE_PORT = process.env.PORT || 5173;
const WS_PORT = process.env.WS_PORT || 8080;
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
  websocket: null,
  frontend: null,
};

// Check if the dist directory exists for production mode
if (isProd && !fs.existsSync(path.join(__dirname, "dist"))) {
  logger.error(
    "Server",
    "Production mode requires a built application. Run 'npm run build' first.",
  );
  process.exit(1);
}

// Start WebSocket server
function startWebSocketServer() {
  logger.info("WebSocket", `Starting server on port ${WS_PORT}...`);

  const wsServer = spawn("node", ["server/websocket-server.js"], {
    env: { ...process.env, PORT: WS_PORT },
    stdio: "pipe",
  });

  servers.websocket = wsServer;

  wsServer.stdout.on("data", (data) => {
    logger.info("WebSocket", data.toString().trim());
  });

  wsServer.stderr.on("data", (data) => {
    logger.error("WebSocket", data.toString().trim());
  });

  wsServer.on("error", (error) => {
    logger.error("WebSocket", `Failed to start: ${error.message}`);
  });

  wsServer.on("close", (code) => {
    logger.info("WebSocket", `Server exited with code ${code}`);

    // Restart WebSocket server if it crashes in production
    if (isProd && code !== 0 && !shuttingDown) {
      logger.warn("WebSocket", "Server crashed. Restarting in 5 seconds...");
      setTimeout(startWebSocketServer, 5000);
    }
  });

  return wsServer;
}

// Start frontend server (Vite dev in development, Express static in production)
function startFrontendServer() {
  if (isProd) {
    // In production, serve the static files using a simple Express server
    logger.info("Express", `Starting static server on port ${VITE_PORT}...`);

    // Create a simple express server file if it doesn't exist
    const expressServerPath = path.join(__dirname, "server/express-server.js");
    if (!fs.existsSync(expressServerPath)) {
      const expressServerContent = `
        const express = require('express');
        const path = require('path');
        const compression = require('compression');
        const app = express();
        const PORT = process.env.PORT || 5173;
        
        // Enable gzip compression
        app.use(compression());
        
        // Serve static files with cache headers
        app.use(express.static(path.join(__dirname, '../dist'), {
          maxAge: '1d',
          etag: true,
        }));
        
        // SPA fallback - serve index.html for all routes
        app.get('*', (req, res) => {
          res.sendFile(path.join(__dirname, '../dist/index.html'));
        });
        
        app.listen(PORT, () => {
          console.log(\`Server running on port \${PORT}\`);
        });
      `;
      fs.writeFileSync(expressServerPath, expressServerContent.trim());

      // Install express and compression if not already installed
      try {
        require.resolve("express");
        require.resolve("compression");
      } catch (e) {
        logger.warn("Express", "Installing required dependencies...");
        spawn.sync("npm", ["install", "--save", "express", "compression"], {
          stdio: "inherit",
        });
      }
    }

    const expressServer = spawn("node", [expressServerPath], {
      env: { ...process.env, PORT: VITE_PORT },
      stdio: "pipe",
    });

    servers.frontend = expressServer;

    expressServer.stdout.on("data", (data) => {
      logger.info("Express", data.toString().trim());
    });

    expressServer.stderr.on("data", (data) => {
      logger.error("Express", data.toString().trim());
    });

    expressServer.on("error", (error) => {
      logger.error("Express", `Failed to start: ${error.message}`);
    });

    expressServer.on("close", (code) => {
      logger.info("Express", `Server exited with code ${code}`);

      // Restart Express server if it crashes in production
      if (code !== 0 && !shuttingDown) {
        logger.warn("Express", "Server crashed. Restarting in 5 seconds...");
        setTimeout(startFrontendServer, 5000);
      }
    });

    return expressServer;
  } else {
    // In development, use Vite dev server
    logger.info("Vite", `Starting dev server on port ${VITE_PORT}...`);

    const viteServer = spawn(
      "npm",
      ["run", "dev", "--", "--port", VITE_PORT, "--host", HOST],
      {
        stdio: "pipe",
      },
    );

    servers.frontend = viteServer;

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
}

// Flag to prevent restarting servers during shutdown
let shuttingDown = false;

// Start all servers
startWebSocketServer();
startFrontendServer();

// Handle process termination
process.on("SIGINT", () => {
  shuttingDown = true;
  logger.warn("Server", "Shutting down all servers...");

  Object.values(servers).forEach((server) => {
    if (server) {
      server.kill();
    }
  });

  // Force exit after a timeout in case some processes don't terminate cleanly
  setTimeout(() => {
    logger.error("Server", "Forcing exit after timeout");
    process.exit(1);
  }, 5000);
});

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

logger.success("Server", `Started in ${NODE_ENV} mode`);
