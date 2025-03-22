# Unified Server Configuration Documentation

## Overview

The project uses a unified server approach that handles both development and production environments through a single entry point (`server.js`). This server manages both the frontend application and WebSocket services.

## Key Components

### 1. Environment Detection

The server automatically detects whether it's running in development or production mode based on the `NODE_ENV` environment variable.

```javascript
const NODE_ENV = process.env.NODE_ENV || "development";
const isProd = NODE_ENV === "production";
```

### 2. Server Types

The unified server manages three main services:

#### Frontend Server
- **Development**: Uses Vite's dev server
- **Production**: Uses Express to serve static files from the `dist` directory

#### WebSocket Server
- Runs on a separate port (default: 8080)
- Handles real-time communication for the chat functionality
- Implements heartbeat mechanism to detect and clean up broken connections

#### API Server
- Runs on a separate port (default: 3001)
- Provides RESTful endpoints for non-real-time operations
- Connects to Supabase for database operations

### 3. Configuration

The server uses the following configuration with fallbacks:

```javascript
const VITE_PORT = process.env.PORT || 5173;
const WS_PORT = process.env.WS_PORT || 8080;
const API_PORT = process.env.API_PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
```

## Starting the Server

### Development Mode

In development mode, the server starts:
1. Vite dev server for the frontend
2. WebSocket server for real-time communication
3. API server for RESTful endpoints

```bash
npm run dev:all
```

### Production Mode

In production mode, the server starts:
1. Express static server for the frontend (serving from `dist` directory)
2. WebSocket server for real-time communication
3. API server for RESTful endpoints

```bash
NODE_ENV=production node server.js
```

## Error Handling

The server implements comprehensive error handling:

1. **Graceful Shutdown**: Properly closes all servers on SIGINT signal
2. **Uncaught Exceptions**: Logs and handles uncaught exceptions
3. **Unhandled Promise Rejections**: Logs and handles unhandled promise rejections
4. **Server Crash Recovery**: In production, automatically restarts servers if they crash

## WebSocket Implementation

The WebSocket server (`server/websocket-server.js`) provides:

1. Real-time messaging capabilities
2. Connection heartbeat to detect broken connections
3. Message type handling (ping/pong, auth, chat)
4. Client tracking and broadcasting

## Express Server (Production)

In production, an Express server is dynamically created if it doesn't exist. It provides:

1. Static file serving with proper cache headers
2. Gzip compression for better performance
3. SPA fallback (serves index.html for all routes)

## Best Practices

1. **Environment Variables**: Use environment variables for configuration
2. **Logging**: Comprehensive logging with color-coded output
3. **Error Recovery**: Automatic server restart in production
4. **Performance**: Compression and cache headers in production

## Potential Improvements

1. Add HTTPS support for secure connections
2. Implement rate limiting for WebSocket connections
3. Add clustering for better performance on multi-core systems
4. Implement more robust authentication for WebSocket connections
5. Add monitoring and health check endpoints
