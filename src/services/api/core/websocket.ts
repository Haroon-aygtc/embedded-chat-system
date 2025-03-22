/**
 * WebSocket Service Module
 *
 * This module provides functionality for WebSocket communication.
 */

import {
  WebSocketConfig,
  ConnectionState,
  WebSocketStats,
} from "@/types/websocket";
import logger from "@/utils/logger";

type MessageCallback = (data: any) => void;
type ConnectionCallback = () => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private connectCallbacks: Set<ConnectionCallback> = new Set();
  private disconnectCallbacks: Set<ConnectionCallback> = new Set();
  private reconnectAttempts = 0;
  private messageQueue: any[] = [];
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private lastMessageTimestamp = 0;
  private messageCountLastMinute = 0;
  private messageCountResetInterval: number | null = null;
  private config: WebSocketConfig = {
    url: import.meta.env.VITE_WEBSOCKET_URL || "ws://localhost:8080",
    autoReconnect: true,
    maxReconnectAttempts: 5,
    heartbeatIntervalMs: 30000,
    heartbeatTimeoutMs: 5000,
    maxQueueSize: 50,
    debug: false,
    connectionTimeout: 10000,
    rateLimitPerSecond: 10,
  };

  constructor(config?: Partial<WebSocketConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Set up message count reset interval
    this.messageCountResetInterval = window.setInterval(() => {
      this.messageCountLastMinute = 0;
    }, 60000);
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): boolean {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return true;
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
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.lastMessageTimestamp = Date.now();

          // Notify all message callbacks
          this.messageCallbacks.forEach((callback) => callback(data));

          if (this.config.debug) {
            logger.info("WebSocket message received", data);
          }
        } catch (error) {
          logger.error("Error parsing WebSocket message", error);
        }
      };

      this.socket.onclose = () => {
        clearTimeout(connectionTimeout);
        if (this.connectionState !== ConnectionState.FAILED) {
          this.connectionState = ConnectionState.DISCONNECTED;
        }
        this.stopHeartbeat();

        // Notify all disconnect callbacks
        this.disconnectCallbacks.forEach((callback) => callback());

        if (this.config.debug) {
          logger.info("WebSocket disconnected");
        }

        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        logger.error("WebSocket error", error);
        if (this.connectionState === ConnectionState.CONNECTING) {
          clearTimeout(connectionTimeout);
          this.connectionState = ConnectionState.FAILED;
          this.socket?.close();
          this.socket = null;
          this.handleReconnect();
        }
      };

      return true;
    } catch (error) {
      this.connectionState = ConnectionState.FAILED;
      logger.error("Error connecting to WebSocket", error);
      this.handleReconnect();
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    if (this.config.debug) {
      logger.info("WebSocket disconnected by user");
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  sendMessage(message: any): boolean {
    // Rate limiting
    this.messageCountLastMinute++;
    if (this.messageCountLastMinute > this.config.rateLimitPerSecond * 60) {
      logger.warn("WebSocket message rate limit exceeded");
      return false;
    }

    if (this.isConnected()) {
      try {
        this.socket?.send(JSON.stringify(message));
        if (this.config.debug) {
          logger.info("WebSocket message sent", message);
        }
        return true;
      } catch (error) {
        logger.error("Error sending WebSocket message", error);
        this.queueMessage(message);
        return false;
      }
    } else {
      this.queueMessage(message);
      this.connect();
      return false;
    }
  }

  /**
   * Register a callback for WebSocket messages
   */
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for WebSocket connection
   */
  onConnect(callback: ConnectionCallback): () => void {
    this.connectCallbacks.add(callback);
    return () => {
      this.connectCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for WebSocket disconnection
   */
  onDisconnect(callback: ConnectionCallback): () => void {
    this.disconnectCallbacks.add(callback);
    return () => {
      this.disconnectCallbacks.delete(callback);
    };
  }

  /**
   * Check if the WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get WebSocket statistics
   */
  getStats(): WebSocketStats {
    return {
      connectionState: this.connectionState,
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      isConnected: this.isConnected(),
      messageRatePerMinute: this.messageCountLastMinute,
      latency:
        this.lastMessageTimestamp > 0
          ? Date.now() - this.lastMessageTimestamp
          : undefined,
    };
  }

  /**
   * Queue a message to be sent when the connection is established
   */
  private queueMessage(message: any): void {
    if (this.messageQueue.length < this.config.maxQueueSize) {
      this.messageQueue.push(message);
      if (this.config.debug) {
        logger.info("WebSocket message queued", message);
      }
    } else {
      logger.warn("WebSocket message queue full, dropping message", message);
    }
  }

  /**
   * Process the message queue
   */
  private processQueue(): void {
    if (this.messageQueue.length > 0 && this.isConnected()) {
      const queueCopy = [...this.messageQueue];
      this.messageQueue = [];

      queueCopy.forEach((message) => {
        this.sendMessage(message);
      });

      if (this.config.debug) {
        logger.info(`Processed ${queueCopy.length} queued WebSocket messages`);
      }
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (
      this.config.autoReconnect &&
      this.reconnectAttempts < this.config.maxReconnectAttempts
    ) {
      this.connectionState = ConnectionState.RECONNECTING;
      this.reconnectAttempts++;

      const backoffTime = Math.min(
        1000 * Math.pow(2, this.reconnectAttempts - 1),
        30000,
      );

      if (this.config.debug) {
        logger.info(
          `WebSocket reconnecting in ${backoffTime}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`,
        );
      }

      this.reconnectTimeout = window.setTimeout(() => {
        this.connect();
      }, backoffTime);
    } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.connectionState = ConnectionState.FAILED;
      logger.error(
        `WebSocket reconnection failed after ${this.reconnectAttempts} attempts`,
      );
    }
  }

  /**
   * Start the heartbeat interval
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.sendMessage({
          type: "ping",
          sentAt: Date.now(),
          timestamp: new Date().toISOString(),
        });
      }
    }, this.config.heartbeatIntervalMs);
  }

  /**
   * Stop the heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.disconnect();
    this.messageCallbacks.clear();
    this.connectCallbacks.clear();
    this.disconnectCallbacks.clear();
    if (this.messageCountResetInterval) {
      clearInterval(this.messageCountResetInterval);
      this.messageCountResetInterval = null;
    }
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export { websocketService };
export default websocketService;
