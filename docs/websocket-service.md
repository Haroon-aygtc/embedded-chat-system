# WebSocket Service Documentation

## Overview

The WebSocket service provides real-time communication capabilities for the chat functionality. It's implemented in `server/websocket-server.js` and is managed by the unified server.

## Features

### Connection Management

- **Client Tracking**: Maintains a set of connected clients
- **Heartbeat**: Implements a ping/pong mechanism to detect broken connections
- **Connection Events**: Handles connection, disconnection, and error events

### Message Handling

The service handles different types of messages:

1. **Ping/Pong**: For connection health checks
2. **Authentication**: Mock authentication response
3. **Chat**: Broadcasts messages to all connected clients
4. **Echo**: Echoes back other message types

### Error Handling

- Handles WebSocket errors
- Validates message format
- Provides error responses for invalid messages

## Implementation Details

### Server Initialization

```javascript
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const wss = new WebSocket.Server({ server });
```

### Client Connection

```javascript
wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);
  
  // Set up heartbeat
  ws.isAlive = true;
  ws.on("pong", heartbeat);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: "system",
    payload: { message: "Connected to WebSocket server" },
    timestamp: new Date().toISOString(),
  }));
  
  // Handle messages, disconnection, errors...
});
```

### Message Broadcasting

```javascript
clients.forEach((client) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(broadcastMessage);
  }
});
```

### Heartbeat Mechanism

```javascript
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);
```

## Client Integration

The client-side WebSocket service (`src/services/websocketService.ts`) connects to this server and provides:

1. Automatic reconnection with exponential backoff
2. Message queuing for offline/disconnected periods
3. Connection state management
4. Comprehensive error handling and logging

## Usage Example

### Server-side

The WebSocket server is automatically started by the unified server:

```javascript
// In server.js
startWebSocketServer();
```

### Client-side

```javascript
// Connect to WebSocket
websocketService.connect();

// Send a message
websocketService.sendMessage({
  type: "chat",
  payload: { message: "Hello, world!" },
});

// Listen for messages
websocketService.onMessage((data) => {
  console.log("Received message:", data);
});
```

## Security Considerations

1. The current implementation uses a simple welcome message and doesn't implement authentication
2. In a production environment, consider adding proper authentication and authorization
3. Implement rate limiting to prevent abuse
4. Consider using secure WebSocket (wss://) for encrypted communication

## Potential Improvements

1. Add proper authentication and authorization
2. Implement message persistence
3. Add support for private messaging
4. Implement channels/rooms for group communication
5. Add support for binary messages (e.g., file transfers)
