# Unified Server Architecture

## Overview

The project now uses a truly unified server architecture that combines all server components into a single process. This approach simplifies deployment, improves resource sharing, and makes the application more maintainable.

## Key Components

### 1. Entry Point

The main entry point is `server.js`, which starts the unified server process:

```javascript
// Start the unified server
const unifiedServer = spawn("node", ["server/unified-server.js"], {
  stdio: "inherit",
});
```

### 2. Unified Server

The unified server (`server/unified-server.js`) integrates three main components:

#### HTTP/Express Server
- Handles both API requests and serves static files in production
- Uses a single HTTP server instance for both REST API and static file serving
- Implements proper middleware for security, compression, and CORS

#### WebSocket Server
- Attached to the same HTTP server instance
- Handles real-time communication
- Implements heartbeat mechanism for connection management

#### Vite Dev Server (Development Only)
- In development mode, starts the Vite dev server as a child process
- Proxies requests between the main server and Vite

## Configuration

The server uses a centralized configuration approach:

```javascript
// Environment detection
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// Configuration with fallbacks
const FRONTEND_PORT = process.env.PORT || 5173;
const API_PORT = process.env.API_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
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

## Error Handling

The unified server implements comprehensive error handling:

1. **Graceful Shutdown**: Properly closes all servers on SIGINT signal
2. **Uncaught Exceptions**: Logs and handles uncaught exceptions
3. **Unhandled Promise Rejections**: Logs and handles unhandled promise rejections
4. **Server Crash Recovery**: In production, automatically restarts if it crashes

## API Routes

API routes are now defined directly in the unified server, eliminating the need for a separate API server process. This approach:

1. Reduces overhead from multiple Node.js processes
2. Simplifies deployment and monitoring
3. Allows for better resource sharing between components

## WebSocket Implementation

The WebSocket server is now attached directly to the main HTTP server:

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
