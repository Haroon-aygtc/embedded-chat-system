/**
 * Production-ready WebSocket service for real-time messaging
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing for offline/disconnected periods
 * - Heartbeat mechanism to detect dead connections
 * - Connection state management
 * - Comprehensive error handling and logging
 * - Support for authentication
 * - Rate limiting for message sending
 */

import type { WebSocketMessage } from "@/types/chat";

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

interface WebSocketConfig {
  url: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  heartbeatIntervalMs?: number;
  heartbeatTimeoutMs?: number;
  maxQueueSize?: number;
  debug?: boolean;
  connectionTimeout?: number;
  rateLimitPerSecond?: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallbacks: MessageCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private errorCallbacks: ErrorCallback[] = [];
  private disconnectCallbacks: DisconnectCallback[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private url: string;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private messageQueue: any[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private lastPingTime = 0;
  private heartbeatIntervalMs: number;
  private heartbeatTimeoutMs: number;
  private maxQueueSize: number;
  private debug: boolean;
  private connectionTimeoutMs: number;
  private clientId: string;
  private autoReconnect: boolean;
  private rateLimitPerSecond: number;
  private messagesSentTimestamps: number[] = [];
  private connectionAttemptTimestamp = 0;
  private isReconnecting = false;
  private pendingReconnect = false;

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.autoReconnect = config.autoReconnect ?? true;
    this.maxReconnectAttempts = config.maxReconnectAttempts ?? 10;
    this.heartbeatIntervalMs = config.heartbeatIntervalMs ?? 30000; // 30 seconds
    this.heartbeatTimeoutMs = config.heartbeatTimeoutMs ?? 10000; // 10 seconds
    this.maxQueueSize = config.maxQueueSize ?? 100;
    this.debug = config.debug ?? false;
    this.connectionTimeoutMs = config.connectionTimeout ?? 15000; // 15 seconds
    this.rateLimitPerSecond = config.rateLimitPerSecond ?? 10;

    // Generate or retrieve client ID
    try {
      this.clientId =
        localStorage.getItem("ws_client_id") || this.generateClientId();
    } catch (e) {
      // Handle cases where localStorage is not available (e.g., private browsing)
      this.clientId = this.generateClientId();
    }

    // Initialize performance monitoring
    this.initPerformanceMonitoring();
  }

  /**
   * Initialize performance monitoring for the WebSocket connection
   */
  private initPerformanceMonitoring() {
    // Set up periodic performance logging
    if (this.debug) {
      setInterval(() => {
        if (this.isConnected()) {
          const queueSize = this.messageQueue.length;
          const messageRate = this.messagesSentTimestamps.filter(
            (t) => Date.now() - t < 60000, // Messages in the last minute
          ).length;

          import("@/utils/logger").then((module) => {
            const logger = module.default;
            logger.debug("WebSocket performance metrics", {
              tags: {
                queueSize: String(queueSize),
                messageRate: String(messageRate) + "/min",
                connectionState: this.connectionState,
                reconnectAttempts: String(this.reconnectAttempts),
              },
            });
          });
        }
      }, 60000); // Log every minute
    }
  }

  /**
   * Connect to the WebSocket server with connection timeout
   */
  connect() {
    if (this.socket?.readyState === WebSocket.OPEN) return;
    if (this.isReconnecting) return;

    // Clear any existing timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.setConnectionState(ConnectionState.CONNECTING);
    this.connectionAttemptTimestamp = Date.now();

    try {
      this.socket = new WebSocket(this.url);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.connectionState === ConnectionState.CONNECTING) {
          import("@/utils/logger").then((module) => {
            const logger = module.default;
            logger.warn("WebSocket connection timeout", {
              tags: {
                connectionTime:
                  String(Date.now() - this.connectionAttemptTimestamp) + "ms",
              },
            });
          });

          // Force close and reconnect
          if (this.socket) {
            this.socket.close();
            this.socket = null;
          }

          if (this.autoReconnect) {
            this.attemptReconnect();
          } else {
            this.setConnectionState(ConnectionState.FAILED);
          }
        }
      }, this.connectionTimeoutMs);

      this.socket.onopen = () => {
        // Clear connection timeout
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        const connectionTime = Date.now() - this.connectionAttemptTimestamp;
        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.info(
            `WebSocket connection established in ${connectionTime}ms`,
            {
              tags: { connectionTime: String(connectionTime) + "ms" },
            },
          );
        });

        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.setConnectionState(ConnectionState.CONNECTED);
        this.connectionCallbacks.forEach((callback) => callback());

        // Process any queued messages
        this.processMessageQueue();

        // Start heartbeat
        this.startHeartbeat();

        // Send authentication if needed
        this.sendAuthenticationIfNeeded();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle pong response
          if (data.type === "pong") {
            this.handlePong();
            return;
          }

          // Handle auth response
          if (data.type === "auth_response") {
            this.handleAuthResponse(data);
            return;
          }

          // Notify all message callbacks
          this.messageCallbacks.forEach((callback) => callback(data));
        } catch (error) {
          import("@/utils/logger").then((module) => {
            const logger = module.default;
            logger.error(
              "Error parsing WebSocket message",
              error instanceof Error ? error : new Error(String(error)),
              {
                extra: {
                  rawData:
                    typeof event.data === "string"
                      ? event.data.substring(0, 100)
                      : "non-string data",
                },
              },
            );
          });
        }
      };

      this.socket.onclose = (event) => {
        // Clear connection timeout if it exists
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }

        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.info(
            `WebSocket connection closed: ${event.code} ${event.reason}`,
            {
              tags: {
                code: String(event.code),
                wasClean: String(event.wasClean),
                connectionDuration: this.connectionAttemptTimestamp
                  ? String(Date.now() - this.connectionAttemptTimestamp) + "ms"
                  : "unknown",
              },
            },
          );
        });

        this.socket = null;
        this.setConnectionState(ConnectionState.DISCONNECTED);
        this.stopHeartbeat();

        // Notify disconnect callbacks
        this.disconnectCallbacks.forEach((callback) => callback(event));

        // Attempt to reconnect if not a normal closure and auto-reconnect is enabled
        if (
          this.autoReconnect &&
          event.code !== 1000 && // Normal closure
          event.code !== 1001 && // Going away (page close/refresh)
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.attemptReconnect();
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.setConnectionState(ConnectionState.FAILED);
          import("@/utils/logger").then((module) => {
            const logger = module.default;
            logger.error(
              "WebSocket reconnection failed after maximum attempts",
              {
                tags: { maxAttempts: String(this.maxReconnectAttempts) },
              },
            );
          });
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

  /**
   * Send authentication data if needed
   */
  private sendAuthenticationIfNeeded() {
    // Get auth token from localStorage or other secure storage
    try {
      const authToken = localStorage.getItem("auth_token");
      if (authToken) {
        this.authenticate({ token: authToken });
      }
    } catch (e) {
      // Handle localStorage not available
    }
  }

  /**
   * Handle authentication response
   */
  private handleAuthResponse(data: any) {
    if (data.success) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.info("WebSocket authentication successful");
      });
    } else {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.warn("WebSocket authentication failed", {
          extra: { reason: data.reason || "Unknown reason" },
        });
      });
    }
  }

  /**
   * Update and log connection state changes
   */
  private setConnectionState(state: ConnectionState) {
    const previousState = this.connectionState;
    this.connectionState = state;

    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info(
        `WebSocket connection state changed: ${previousState} -> ${state}`,
        {
          tags: { previousState, currentState: state },
        },
      );
    });
  }

  /**
   * Start heartbeat mechanism to detect dead connections
   */
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
            logger.warn("Pong response not received, connection may be dead", {
              tags: { lastPingTime: new Date(this.lastPingTime).toISOString() },
            });
          });

          // Force reconnection
          this.disconnect();
          if (this.autoReconnect) {
            this.connect();
          }
        }, this.heartbeatTimeoutMs);
      }
    }, this.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat mechanism
   */
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

  /**
   * Send ping message to server
   */
  private sendPing() {
    this.sendMessage({ type: "ping", timestamp: Date.now() });
  }

  /**
   * Handle pong response from server
   */
  private handlePong() {
    const latency = Date.now() - this.lastPingTime;

    if (this.debug) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.debug(`WebSocket heartbeat received, latency: ${latency}ms`, {
          tags: { latency: String(latency) + "ms" },
        });
      });
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.isReconnecting) {
      this.pendingReconnect = true;
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff with jitter and max delay
    const baseDelay = Math.min(
      30000,
      Math.pow(2, this.reconnectAttempts) * 1000,
    );
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    const delay = baseDelay + jitter;

    this.setConnectionState(ConnectionState.RECONNECTING);
    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info(
        `Attempting to reconnect in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        {
          tags: {
            attempt: String(this.reconnectAttempts),
            maxAttempts: String(this.maxReconnectAttempts),
            delay: String(Math.round(delay)) + "ms",
          },
        },
      );
    });

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.connect();

      // Handle any pending reconnect requests
      if (this.pendingReconnect) {
        this.pendingReconnect = false;
        this.isReconnecting = false;
        this.attemptReconnect();
      } else {
        this.isReconnecting = false;
      }
    }, delay);
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    this.setConnectionState(ConnectionState.DISCONNECTED);

    if (this.socket) {
      try {
        this.socket.close(1000, "Normal closure");
      } catch (e) {
        // Ignore errors during close
      }
      this.socket = null;
    }

    this.stopHeartbeat();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Check if message sending is rate limited
   */
  private isRateLimited(): boolean {
    const now = Date.now();
    // Remove timestamps older than 1 second
    this.messagesSentTimestamps = this.messagesSentTimestamps.filter(
      (timestamp) => now - timestamp < 1000,
    );

    // Check if we've sent too many messages in the last second
    return this.messagesSentTimestamps.length >= this.rateLimitPerSecond;
  }

  /**
   * Send a message to the WebSocket server
   */
  sendMessage(message: any): boolean {
    // Check rate limiting
    if (this.isRateLimited()) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.warn("Rate limit exceeded, queueing message", {
          tags: {
            messageType: message.type,
            rateLimit: String(this.rateLimitPerSecond) + "/sec",
          },
        });
      });
      this.queueMessage(message);
      return false;
    }

    // Add timestamp and client ID to outgoing messages
    const enhancedMessage = {
      ...message,
      timestamp: message.timestamp || new Date().toISOString(),
      clientId: this.getClientId(),
    };

    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(enhancedMessage));
        // Track message for rate limiting
        this.messagesSentTimestamps.push(Date.now());
        return true;
      } catch (error) {
        import("@/utils/logger").then((module) => {
          const logger = module.default;
          logger.error(
            "Error sending WebSocket message",
            error instanceof Error ? error : new Error(String(error)),
            { tags: { messageType: enhancedMessage.type } },
          );
        });
        this.queueMessage(enhancedMessage);
        return false;
      }
    } else {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.warn(
          "Cannot send message: WebSocket is not connected, queueing message",
          {
            tags: {
              messageType: enhancedMessage.type,
              connectionState: this.connectionState,
            },
          },
        );
      });
      this.queueMessage(enhancedMessage);
      return false;
    }
  }

  /**
   * Queue a message for later sending
   */
  private queueMessage(message: any) {
    // Don't queue ping messages
    if (message.type === "ping") return;

    // Add to queue with a maximum size limit
    if (this.messageQueue.length < this.maxQueueSize) {
      this.messageQueue.push(message);
    } else {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.warn("Message queue full, dropping oldest message", {
          tags: {
            queueSize: String(this.messageQueue.length),
            maxSize: String(this.maxQueueSize),
          },
        });
      });
      this.messageQueue.shift(); // Remove oldest message
      this.messageQueue.push(message); // Add new message
    }

    // If we're disconnected, try to reconnect
    if (
      this.connectionState === ConnectionState.DISCONNECTED &&
      this.autoReconnect
    ) {
      this.connect();
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info(`Processing ${this.messageQueue.length} queued messages`, {
        tags: { queueSize: String(this.messageQueue.length) },
      });
    });

    // Process queued messages with rate limiting
    const processNextBatch = () => {
      const batchSize = Math.min(
        this.rateLimitPerSecond,
        this.messageQueue.length,
      );
      let successCount = 0;

      for (let i = 0; i < batchSize; i++) {
        if (this.messageQueue.length === 0) break;

        const message = this.messageQueue.shift();
        if (this.socket?.readyState === WebSocket.OPEN) {
          try {
            this.socket.send(JSON.stringify(message));
            this.messagesSentTimestamps.push(Date.now());
            successCount++;
          } catch (error) {
            // Put message back and stop processing
            this.messageQueue.unshift(message);
            break;
          }
        } else {
          // Connection lost during processing, put message back and stop
          this.messageQueue.unshift(message);
          break;
        }
      }

      // If we still have messages and connection is open, schedule next batch
      if (this.messageQueue.length > 0 && this.isConnected()) {
        setTimeout(processNextBatch, 1000); // Process next batch after 1 second
      }

      return successCount;
    };

    const processedCount = processNextBatch();

    if (processedCount > 0) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.debug(
          `Processed ${processedCount} queued messages, ${this.messageQueue.length} remaining`,
          {
            tags: {
              processed: String(processedCount),
              remaining: String(this.messageQueue.length),
            },
          },
        );
      });
    }
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Register a callback for connection events
   */
  onConnect(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Register a callback for error events
   */
  onError(callback: ErrorCallback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Register a callback for disconnect events
   */
  onDisconnect(callback: DisconnectCallback) {
    this.disconnectCallbacks.push(callback);
    return () => {
      this.disconnectCallbacks = this.disconnectCallbacks.filter(
        (cb) => cb !== callback,
      );
    };
  }

  /**
   * Check if the WebSocket is connected
   */
  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection state
   */
  getConnectionState() {
    return this.connectionState;
  }

  /**
   * Get the number of queued messages
   */
  getQueuedMessageCount() {
    return this.messageQueue.length;
  }

  /**
   * Clear the message queue
   */
  clearMessageQueue() {
    const count = this.messageQueue.length;
    this.messageQueue = [];
    return count;
  }

  /**
   * Reset reconnect attempts counter
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  /**
   * Set maximum reconnect attempts
   */
  setMaxReconnectAttempts(max: number) {
    this.maxReconnectAttempts = max;
  }

  /**
   * Set heartbeat interval
   */
  setHeartbeatInterval(intervalMs: number) {
    this.heartbeatIntervalMs = intervalMs;
    if (this.isConnected()) {
      this.startHeartbeat(); // Restart with new interval
    }
  }

  /**
   * Set rate limit for message sending
   */
  setRateLimit(messagesPerSecond: number) {
    this.rateLimitPerSecond = messagesPerSecond;
  }

  /**
   * Enable or disable debug logging
   */
  setDebugMode(enabled: boolean) {
    this.debug = enabled;
  }

  /**
   * Generate a unique client ID for this browser session
   */
  private generateClientId(): string {
    const id =
      "client_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    try {
      localStorage.setItem("ws_client_id", id);
    } catch (e) {
      // Ignore localStorage errors
    }

    return id;
  }

  /**
   * Get the client ID for this session
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * Send authentication data to the server
   */
  authenticate(authData: any): boolean {
    return this.sendMessage({
      type: "auth",
      payload: authData,
    });
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      connectionState: this.connectionState,
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      isConnected: this.isConnected(),
      messageRatePerMinute: this.messagesSentTimestamps.filter(
        (t) => Date.now() - t < 60000, // Messages in the last minute
      ).length,
    };
  }
}

// Create a singleton instance with a configurable URL from environment variables
// Default to a secure WebSocket connection if no URL is provided
const WS_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "wss://api.chatservice.io/ws";

// Initialize the WebSocket service with production-ready configuration
const websocketService = new WebSocketService({
  url: WS_URL,
  autoReconnect: true,
  maxReconnectAttempts: 10,
  heartbeatIntervalMs: 30000, // 30 seconds
  heartbeatTimeoutMs: 10000, // 10 seconds
  maxQueueSize: 100,
  debug: import.meta.env.DEV, // Enable debug in development only
  connectionTimeout: 15000, // 15 seconds
  rateLimitPerSecond: 10,
});

// Auto-connect when the service is imported (can be disabled by setting VITE_WS_AUTO_CONNECT=false)
if (import.meta.env.VITE_WS_AUTO_CONNECT !== "false") {
  // Small delay to ensure app is fully loaded before connecting
  setTimeout(() => {
    import("@/utils/logger").then((module) => {
      const logger = module.default;
      logger.info("Auto-connecting to WebSocket server", {
        tags: { url: WS_URL, environment: import.meta.env.MODE },
      });
    });
    websocketService.connect();
  }, 1000);
}

export default websocketService;
