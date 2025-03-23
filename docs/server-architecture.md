# Server Architecture

## Overview

The server architecture for the Context-Aware Embeddable Chat System is built on a unified server approach that combines all server components into a single process. This design simplifies deployment, improves resource sharing, and makes the application more maintainable.

## Unified Server Architecture

The unified server (`server/unified-server.js`) integrates three main components:

1. **HTTP/Express Server**
   - Handles both API requests and serves static files in production
   - Uses a single HTTP server instance for both REST API and static file serving
   - Implements proper middleware for security, compression, and CORS

2. **WebSocket Server**
   - Attached to the same HTTP server instance
   - Handles real-time communication
   - Implements heartbeat mechanism for connection management

3. **Vite Dev Server (Development Only)**
   - In development mode, starts the Vite dev server as a child process
   - Proxies requests between the main server and Vite

## Server Components

### Express Server

The Express server handles HTTP requests and serves static files:

```javascript
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
```

### WebSocket Server

The WebSocket server handles real-time communication:

```javascript
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

    // Handle incoming messages
    ws.on("message", (message) => {
      // Message handling logic
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
```

## API Routes

API routes are defined directly in the unified server:

```javascript
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
    // Registration logic
  });

  app.post("/api/auth/login", async (req, res) => {
    // Login logic
  });

  // Context Rules API
  app.get("/api/context-rules", async (req, res) => {
    // Context rules logic
  });

  // Add more API routes as needed...
  // This is a simplified version - in production, you would import route modules

  return app;
}
```

## WebSocket Message Types

The WebSocket server handles several message types:

1. **ping/pong**: Heartbeat messages to keep the connection alive
2. **auth**: Authentication messages
3. **chat**: Chat messages to be broadcast to clients
4. **system**: System messages
5. **error**: Error messages
6. **echo**: Echo messages for testing
7. **subscribe**: Subscribe to real-time updates
8. **unsubscribe**: Unsubscribe from real-time updates
9. **database_change**: Notifications of database changes

## Configuration

The server uses a centralized configuration approach:

```javascript
// Environment detection
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";

// Configuration with fallbacks
const FRONTEND_PORT = process.env.PORT || 5173;
const WS_PORT = process.env.WS_PORT || 8080;
const API_PORT = process.env.API_PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
```

## Error Handling

The unified server implements comprehensive error handling:

1. **Graceful Shutdown**: Properly closes all servers on SIGINT signal
2. **Uncaught Exceptions**: Logs and handles uncaught exceptions
3. **Unhandled Promise Rejections**: Logs and handles unhandled promise rejections
4. **Server Crash Recovery**: In production, automatically restarts if it crashes

```javascript
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
```

## Starting the Server

### Development Mode

```bash
npm run start:dev
# or
npm run dev:all
```

In development mode, the server:
1. Starts the unified HTTP/WebSocket server
2. Starts the Vite dev server as a child process

### Production Mode

```bash
npm run start
# or
NODE_ENV=production node server.js
```

In production mode, the server:
1. Starts the unified HTTP/WebSocket server
2. Serves static files from the `dist` directory

## Database Integration

The server integrates with MySQL using Sequelize ORM:

```javascript
// Initialize Sequelize client
const sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
  host: env.MYSQL_HOST || "localhost",
  port: parseInt(env.MYSQL_PORT || "3306"),
  dialect: "mysql",
  logging: env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});
```

## Real-time Communication

The WebSocket server is attached directly to the main HTTP server:

```javascript
// Create HTTP server
const server = http.createServer(app);

// Configure WebSocket server
const wss = configureWebSocketServer(server);
```

This approach:
1. Eliminates the need for a separate WebSocket port
2. Simplifies client configuration (same host/port for HTTP and WebSocket)
3. Improves resource utilization

## Best Practices

1. **Single Process**: All server components run in a single Node.js process
2. **Resource Sharing**: Components share resources like database connections
3. **Simplified Deployment**: Only one process to monitor and manage
4. **Consistent Logging**: Centralized logging for all components

## Potential Improvements

1. Add HTTPS support for secure connections
2. Implement clustering for better performance on multi-core systems
3. Add more robust authentication for WebSocket connections
4. Implement rate limiting and other security measures
5. Add monitoring and health check endpoints
