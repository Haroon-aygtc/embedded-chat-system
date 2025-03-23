# WebSocket Implementation

## Overview

The WebSocket implementation in the Context-Aware Embeddable Chat System provides real-time communication between clients and the server. This document details the WebSocket architecture, message types, and usage patterns.

## WebSocket Service

The WebSocket service is implemented in `src/services/websocketService.ts` and provides a client-side interface for WebSocket communication.

### Connection Management

The WebSocket service handles connection establishment, reconnection, and heartbeat:

```typescript
public connect(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      resolve();
      return;
    }

    try {
      this.connectionState = ConnectionState.CONNECTING;
      this.socket = new WebSocket(this.config.url);

      // Set up connection timeout
      const connectionTimeout = window.setTimeout(() => {
        if (this.connectionState === ConnectionState.CONNECTING) {
          this.connectionState = ConnectionState.FAILED;
          this.socket?.close();
          this.socket = null;
          this.handleReconnect();
          reject(new Error("Connection timeout"));
        }
      }, this.config.connectionTimeout);

      this.socket.onopen = () => {
        clearTimeout(connectionTimeout);
        this.connectionState = ConnectionState.CONNECTED;
        this.reconnectAttempts = 0;
        this.processQueue();
        this.startHeartbeat();

        // Notify all connect callbacks
        this.connectCallbacks.forEach((callback) => callback());

        if (this.config.debug) {
          logger.info("WebSocket connected");
        }

        resolve();
      };

      // Additional event handlers...
    } catch (error) {
      this.connectionState = ConnectionState.FAILED;
      logger.error("Error connecting to WebSocket", error);
      this.handleReconnect();
      reject(error);
    }
  });
}
```

### Message Handling

The WebSocket service provides methods for sending and receiving messages:

```typescript
public send(message: WebSocketMessage): Promise<void> {
  return new Promise((resolve, reject) => {
    // Rate limiting
    this.messageCountLastMinute++;
    if (this.messageCountLastMinute > this.config.rateLimitPerSecond * 60) {
      logger.warn("WebSocket message rate limit exceeded");
      reject(new Error("Rate limit exceeded"));
      return;
    }

    if (this.isConnected()) {
      try {
        // Add client ID and timestamp if not provided
        const enrichedMessage: WebSocketMessage = {
          ...message,
          clientId: message.clientId || this.clientId,
          timestamp: message.timestamp || new Date().toISOString(),
        };

        this.socket?.send(JSON.stringify(enrichedMessage));

        if (this.config.debug) {
          logger.info("WebSocket message sent", { extra: enrichedMessage });
        }

        resolve();
      } catch (error) {
        logger.error("Error sending WebSocket message", error);
        this.queueMessage(message);
        reject(error);
      }
    } else {
      this.queueMessage(message);
      this.connect().catch(reject);
      resolve(); // Resolve anyway since the message is queued
    }
  });
}

public addMessageHandler(handler: MessageHandler): void {
  this.messageHandlers.add(handler);
}

public removeMessageHandler(handler: MessageHandler): void {
  this.messageHandlers.delete(handler);
}
```

### Reconnection Logic

The WebSocket service implements reconnection logic with exponential backoff:

```typescript
private handleReconnect(): void {
  if (
    this.config.autoReconnect &&
    this.reconnectAttempts < this.config.maxReconnectAttempts
  ) {
    this.connectionState = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;

    // Exponential backoff with jitter
    const baseBackoff = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      30000, // Max 30 seconds
    );
    const jitter = 0.1 * baseBackoff * Math.random(); // 10% jitter
    const backoffTime = baseBackoff + jitter;

    if (this.config.debug) {
      logger.info(
        `WebSocket reconnecting in ${Math.round(backoffTime)}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
      );
    }

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect().catch((error) => {
        logger.error("Error reconnecting to WebSocket", error);
      });
    }, backoffTime);
  } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
    this.connectionState = ConnectionState.FAILED;
    logger.error(
      `WebSocket reconnection failed after ${this.reconnectAttempts} attempts`,
    );
  }
}
```

### Heartbeat Mechanism

The WebSocket service implements a heartbeat mechanism to detect and clean up broken connections:

```typescript
private startHeartbeat(): void {
  this.stopHeartbeat();
  this.heartbeatInterval = window.setInterval(() => {
    if (this.isConnected()) {
      this.send({
        type: MessageType.PING,
        sentAt: new Date().toISOString(),
      }).catch((error) => {
        logger.error("Error sending heartbeat", error);
      });
    }
  }, this.config.heartbeatIntervalMs);
}

private stopHeartbeat(): void {
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }
}
```

## Realtime Service

The Realtime service (`src/services/realtimeService.ts`) builds on top of the WebSocket service to provide a higher-level API for real-time updates.

### Table Subscriptions

The Realtime service allows subscribing to changes on database tables:

```typescript
subscribeToTable<T = any>(
  tableName: TableName,
  callback: TableChangeCallback,
  events: ChangeEvent[] = ["INSERT", "UPDATE", "DELETE"],
  filter?: string,
): RealtimeSubscription {
  try {
    const channelId = `${tableName}-${events.join("-")}-${filter || "all"}`;

    // Add to subscriptions map
    const callbacks = this.subscriptions.get(channelId) || [];
    callbacks.push(callback);
    this.subscriptions.set(channelId, callbacks);

    // Subscribe to WebSocket messages
    const unsubscribe = websocketService.onMessage((message) => {
      if (
        message.type === "database_change" &&
        message.table === tableName &&
        events.includes(message.event)
      ) {
        // Check if the filter matches
        if (filter) {
          const [column, op, value] = filter.split(/=|>|<|!=/);
          const operator = filter.match(/=|>|<|!=/)?.[0] || "=";

          // Simple filter implementation
          if (column && operator && value) {
            const rowValue = message.data[column.trim()];
            const filterValue = value.trim();

            let matches = false;
            switch (operator) {
              case "=":
                matches = rowValue == filterValue;
                break;
              case "!=":
                matches = rowValue != filterValue;
                break;
              case ">":
                matches = rowValue > filterValue;
                break;
              case "<":
                matches = rowValue < filterValue;
                break;
              default:
                matches = false;
            }

            if (!matches) return;
          }
        }

        callback(message);
      }
    });

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        unsubscribe();
        const callbacks = this.subscriptions.get(channelId) || [];
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
          if (callbacks.length === 0) {
            this.subscriptions.delete(channelId);
          } else {
            this.subscriptions.set(channelId, callbacks);
          }
        }
      },
    };
  } catch (error) {
    logger.error(
      "Error subscribing to real-time changes",
      error instanceof Error ? error : new Error(String(error)),
    );

    // Return a no-op unsubscribe function
    return { unsubscribe: () => {} };
  }
}
```

### Specialized Subscriptions

The Realtime service provides specialized subscription methods for common use cases:

```typescript
subscribeToChatMessages(
  sessionId: string,
  callback: TableChangeCallback,
): RealtimeSubscription {
  return this.subscribeToTable(
    "chat_messages",
    callback,
    ["INSERT"],
    `session_id=${sessionId}`,
  );
}

subscribeToChatSession(
  sessionId: string,
  callback: TableChangeCallback,
): RealtimeSubscription {
  return this.subscribeToTable(
    "chat_sessions",
    callback,
    ["UPDATE"],
    `session_id=${sessionId}`,
  );
}

subscribeToContextRules(callback: TableChangeCallback): RealtimeSubscription {
  return this.subscribeToTable("context_rules", callback, [
    "INSERT",
    "UPDATE",
    "DELETE",
  ]);
}

subscribeToWidgetConfigs(
  userId: string,
  callback: TableChangeCallback,
): RealtimeSubscription {
  return this.subscribeToTable(
    "widget_configs",
    callback,
    ["INSERT", "UPDATE", "DELETE"],
    `user_id=${userId}`,
  );
}

subscribeToNotifications(
  userId: string,
  callback: NotificationCallback,
): () => void {
  if (!userId) return () => {};

  return this.subscribeToTable(
    "notifications",
    (payload) => {
      if (payload.data && payload.data.user_id === userId) {
        callback(payload.data);
      }
    },
    ["INSERT"],
    `user_id=${userId}`,
  ).unsubscribe;
}
```

## Server-Side WebSocket Implementation

The server-side WebSocket implementation is in `server/unified-server.js` and handles client connections, message routing, and broadcasting.

### Connection Handling

```javascript
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
          // Authentication logic
          break;

        case "chat":
          // Chat message handling
          break;

        default:
          // Default message handling
          break;
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
```

### Message Types

The WebSocket server handles several message types:

1. **ping/pong**: Heartbeat messages
   ```javascript
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
   ```

2. **auth**: Authentication messages
   ```javascript
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
   ```

3. **chat**: Chat messages
   ```javascript
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
   ```

### Heartbeat Mechanism

The server implements a heartbeat mechanism to detect and clean up broken connections:

```javascript
// Implement heartbeat to detect and clean up broken connections
function heartbeat() {
  this.isAlive = true;
}

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
```

## Usage in Components

### Chat Widget

The Chat Widget component uses the WebSocket service for real-time communication:

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isConnected, setIsConnected] = useState(false);

useEffect(() => {
  // Connect to WebSocket
  websocketService.connect().then(() => {
    setIsConnected(true);
  }).catch(error => {
    console.error("Failed to connect to WebSocket", error);
  });

  // Add message handler
  const handleMessage = (message: WebSocketMessage) => {
    if (message.type === "chat") {
      setMessages(prev => [...prev, message.payload]);
    }
  };

  websocketService.addMessageHandler(handleMessage);

  // Clean up
  return () => {
    websocketService.removeMessageHandler(handleMessage);
  };
}, []);

const sendMessage = (content: string) => {
  if (!isConnected) return;

  websocketService.send({
    type: "chat",
    payload: {
      content,
      sender: "user",
      timestamp: new Date().toISOString(),
    },
  }).catch(error => {
    console.error("Failed to send message", error);
  });
};
```

### Admin Dashboard

The Admin Dashboard uses the Realtime service to subscribe to changes in context rules:

```typescript
const [contextRules, setContextRules] = useState<ContextRule[]>([]);

useEffect(() => {
  // Fetch initial data
  fetchContextRules().then(setContextRules);

  // Subscribe to changes
  const subscription = realtimeService.subscribeToContextRules((payload) => {
    if (payload.eventType === "INSERT") {
      setContextRules(prev => [...prev, payload.new]);
    } else if (payload.eventType === "UPDATE") {
      setContextRules(prev => prev.map(rule => 
        rule.id === payload.new.id ? payload.new : rule
      ));
    } else if (payload.eventType === "DELETE") {
      setContextRules(prev => prev.filter(rule => 
        rule.id !== payload.new.id
      ));
    }
  });

  // Clean up
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Best Practices

1. **Connection Management**: Always handle connection errors and implement reconnection logic
2. **Message Validation**: Validate messages on both client and server
3. **Error Handling**: Implement proper error handling for WebSocket operations
4. **Resource Cleanup**: Unsubscribe from events and close connections when components unmount
5. **Rate Limiting**: Implement rate limiting to prevent abuse
6. **Heartbeat**: Use heartbeat mechanism to detect and clean up broken connections
7. **Security**: Implement proper authentication and authorization for WebSocket connections
