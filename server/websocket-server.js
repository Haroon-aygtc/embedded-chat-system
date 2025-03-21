/**
 * Simple WebSocket server for development
 */
const WebSocket = require("ws");
const http = require("http");

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

// Create WebSocket server instance
const wss = new WebSocket.Server({ server });

// Track connected clients
const clients = new Set();

// Implement heartbeat to detect and clean up broken connections
function heartbeat() {
  this.isAlive = true;
}

// Handle new connections
wss.on("connection", (ws) => {
  console.log("Client connected");
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
      const data = JSON.parse(message);
      console.log("Received:", data);

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
      console.error("Error processing message:", error);
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
    console.log("Client disconnected");
    clients.delete(ws);
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
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

// Add graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing WebSocket server");
  wss.close(() => {
    console.log("WebSocket server closed");
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(
    `WebSocket URL: ${process.env.NODE_ENV === "production" ? "wss://<your-domain>" : `ws://localhost:${PORT}`}`,
  );
});
