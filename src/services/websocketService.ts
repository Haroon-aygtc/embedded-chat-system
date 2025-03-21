// WebSocket service for real-time messaging

type MessageCallback = (message: any) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: Event) => void;
type DisconnectCallback = (event: CloseEvent) => void;

export enum ConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private disconnectCallbacks: DisconnectCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private url: string;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageQueue: any[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private heartbeatIntervalMs = 30000; // 30 seconds
  private heartbeatTimeoutMs = 10000; // 10 seconds
  private clientId: string =
    localStorage.getItem("ws_client_id") || this.generateClientId();

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.setConnectionState(ConnectionState.CONNECTING);

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.info("WebSocket connection established");
        });
        this.reconnectAttempts = 0;
        this.setConnectionState(ConnectionState.CONNECTED);
        this.connectionCallbacks.forEach((callback) => callback());

        // Process any queued messages
        this.processMessageQueue();

        // Start heartbeat
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle pong response
          if (data.type === "pong") {
            this.handlePong();
            return;
          }

          this.messageCallbacks.forEach((callback) => callback(data));
        } catch (error) {
          import("@/utils/logger").then((module) => {
            const logger = module.default;
            logger.error(
              "Error parsing WebSocket message",
              error instanceof Error ? error : new Error(String(error)),
            );
          });
        }
      };

      this.socket.onclose = (event) => {
        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.info(
            `WebSocket connection closed: ${event.code} ${event.reason}`,
            {
              tags: { code: String(event.code) },
            },
          );
        });
        this.socket = null;
        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.stopHeartbeat();

        // Notify disconnect callbacks
        this.disconnectCallbacks.forEach((callback) => callback(event));

        // Attempt to reconnect if not a normal closure
        if (
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.attemptReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.setConnectionState(ConnectionState.FAILED);
        }
      };

      this.socket.onerror = (error) => {
        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.error(
            "WebSocket error",
            new Error("WebSocket connection error"),
            { extra: error },
          );
        });
        this.errorCallbacks.forEach((callback) => callback(error));
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Failed to establish WebSocket connection",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      this.setConnectionState(ConnectionState.FAILED);
    }
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info(`WebSocket connection state changed to: ${state}`, {
        tags: { state },
      });
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing intervals

    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.sendPing();

        // Set timeout for pong response
        this.pongTimeout = setTimeout(() => {
          import("@/utils/logger").then((module) => {
            const logger = module.default;
            logger.warn("Pong response not received, connection may be dead");
          });
          this.disconnect();
          this.connect(); // Attempt to reconnect
        }, this.heartbeatTimeoutMs);
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private sendPing() {
    this.sendMessage({ type: "ping", timestamp: Date.now() });
  }

  private handlePong() {
    const latency = Date.now() - this.lastPingTime;
    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.debug(`WebSocket heartbeat received, latency: ${latency}ms`, {
        tags: { latency: String(latency) },
      });
    });

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private attemptReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(30000, Math.pow(2, this.reconnectAttempts) * 1000);

    this.setConnectionState(ConnectionState.RECONNECTING);
    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info(
        `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
        {
          tags: {
            attempt: String(this.reconnectAttempts),
            delay: String(delay),
          },
        },
      );
    });

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    this.setConnectionState(ConnectionState.DISCONNECTED);

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  sendMessage(message: any): boolean {
    // Add timestamp and client ID to outgoing messages
    const enhancedMessage = {
      ...message,
      timestamp: message.timestamp || Date.now(),
      clientId: this.getClientId(),
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(enhancedMessage));
      return true;
    } else {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.warn(
          "Cannot send message: WebSocket is not connected, queueing message",
          {
            tags: { messageType: enhancedMessage.type },
          },
        );
      });
      this.queueMessage(enhancedMessage);
      return false;
    }
  }

  private queueMessage(message: any) {
    // Don't queue ping messages
    if (message.type === "ping") return;

    // Add to queue with a maximum size limit
    const MAX_QUEUE_SIZE = 50;
    if (this.messageQueue.length < MAX_QUEUE_SIZE) {
      this.messageQueue.push(message);
    } else {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.warn("Message queue full, dropping oldest message", {
          tags: { queueSize: String(this.messageQueue.length) },
        });
      });
      this.messageQueue.shift(); // Remove oldest message
      this.messageQueue.push(message); // Add new message
    }

    // If we're disconnected, try to reconnect
    if (this.connectionState === ConnectionState.DISCONNECTED) {
      this.connect();
    }
  }

  private processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info(`Processing ${this.messageQueue.length} queued messages`, {
        tags: { queueSize: String(this.messageQueue.length) },
      });
    });

    // Process all queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(message));
      } else {
        // If connection lost during processing, put message back and stop
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onConnect(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  onError(callback: ErrorCallback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  onDisconnect(callback: DisconnectCallback) {
    this.disconnectCallbacks.push(callback);
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    return this.connectionState;
  }

  getQueuedMessageCount() {
    return this.messageQueue.length;
  }

  clearMessageQueue() {
    const count = this.messageQueue.length;
    this.messageQueue = [];
    return count;
  }

  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  setMaxReconnectAttempts(max: number) {
    this.maxReconnectAttempts = max;
  }

  setHeartbeatInterval(intervalMs: number) {
    this.heartbeatIntervalMs = intervalMs;
    if (this.isConnected()) {
      this.startHeartbeat(); // Restart with new interval
    }
  }

  // Generate a unique client ID for this browser session
  private generateClientId(): string {
    const id =
      "client_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    localStorage.setItem("ws_client_id", id);
    return id;
  }

  // Get the client ID for this session
  getClientId(): string {
    return this.clientId;
  }

  // Send authentication data to the server
  authenticate(authData: any): boolean {
    return this.sendMessage({
      type: "auth",
      data: authData,
    });
  }
}

// Create a singleton instance with a configurable URL from environment variables
// Default to a secure WebSocket connection if no URL is provided
const WS_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "wss://api.chatservice.io/ws";

// Initialize the WebSocket service
const websocketService = new WebSocketService(WS_URL);

// Auto-connect when the service is imported (can be disabled by setting VITE_WS_AUTO_CONNECT=false)
if (import.meta.env.VITE_WS_AUTO_CONNECT !== "false") {
  // Small delay to ensure app is fully loaded before connecting
  setTimeout(() => {
    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info("Auto-connecting to WebSocket server", {
        tags: { url: WS_URL },
      });
    });
    websocketService.connect();
  }, 1000);
}

export default websocketService;
