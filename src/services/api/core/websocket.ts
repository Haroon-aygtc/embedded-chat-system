/**
 * WebSocket Service Module
 *
 * This module provides functionality for WebSocket communication.
 */

import {
  ConnectionState,
  WebSocketConfig,
  WebSocketStats,
} from "@/types/websocket";
import { env } from "@/config/env";
import logger from "@/utils/logger";

// WebSocket message types
export enum MessageType {
  PING = "ping",
  PONG = "pong",
  AUTH = "auth",
  AUTH_RESPONSE = "auth_response",
  CHAT = "chat",
  SYSTEM = "system",
  ERROR = "error",
  ECHO = "echo",
}

// WebSocket message interface
export interface WebSocketMessage {
  type: MessageType | string;
  payload?: any;
  timestamp?: string;
  clientId?: string;
  sentAt?: string;
}

// Message handler type
type MessageHandler = (message: WebSocketMessage) => void;

/**
 * WebSocket service for real-time communication
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectCallbacks: Set<() => void> = new Set();
  private disconnectCallbacks: Set<() => void> = new Set();
  private reconnectAttempts = 0;
  private messageQueue: WebSocketMessage[] = [];
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectTimeout: number | null = null;
  private heartbeatInterval: number | null = null;
  private lastMessageTimestamp = 0;
  private messageCountLastMinute = 0;
  private messageCountResetInterval: number | null = null;
  private clientId: string;
  private config: WebSocketConfig;

  /**
   * Create a new WebSocketService instance
   * @param config WebSocket configuration
   */
  constructor(config?: Partial<WebSocketConfig>) {
    this.clientId = this.generateClientId();

    // Default configuration
    this.config = {
      url: env.WS_PORT
        ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:${env.WS_PORT}`
        : "ws://localhost:8080",
      autoReconnect: true,
      maxReconnectAttempts: 5,
      heartbeatIntervalMs: 30000,
      heartbeatTimeoutMs: 5000,
      maxQueueSize: 50,
      debug: false,
      connectionTimeout: 10000,
      rateLimitPerSecond: 10,
      ...config,
    };

    // Set up message count reset interval
    this.messageCountResetInterval = window.setInterval(() => {
      this.messageCountLastMinute = 0;
    }, 60000);
  }

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
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

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.lastMessageTimestamp = Date.now();

            // Notify all message handlers
            this.messageHandlers.forEach((handler) => handler(data));

            if (this.config.debug) {
              logger.info("WebSocket message received", { extra: data });
            }
          } catch (error) {
            logger.error("Error parsing WebSocket message", error);
          }
        };

        this.socket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          if (this.connectionState !== ConnectionState.FAILED) {
            this.connectionState = ConnectionState.DISCONNECTED;
          }
          this.stopHeartbeat();

          // Notify all disconnect callbacks
          this.disconnectCallbacks.forEach((callback) => callback());

          if (this.config.debug) {
            logger.info(
              `WebSocket disconnected: ${event.code} ${event.reason}`,
            );
          }

          this.handleReconnect();

          if (this.connectionState === ConnectionState.CONNECTING) {
            reject(
              new Error(
                `WebSocket closed during connection: ${event.code} ${event.reason}`,
              ),
            );
          }
        };

        this.socket.onerror = (error) => {
          logger.error("WebSocket error", error);
          if (this.connectionState === ConnectionState.CONNECTING) {
            clearTimeout(connectionTimeout);
            this.connectionState = ConnectionState.FAILED;
            this.socket?.close();
            this.socket = null;
            this.handleReconnect();
            reject(error);
          }
        };
      } catch (error) {
        this.connectionState = ConnectionState.FAILED;
        logger.error("Error connecting to WebSocket", error);
        this.handleReconnect();
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.close(1000, "Client disconnected");
      this.socket = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    if (this.config.debug) {
      logger.info("WebSocket disconnected by user");
    }
  }

  /**
   * Send a message to the WebSocket server
   * @param message Message to send
   * @returns Promise that resolves when the message is sent
   */
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

  /**
   * Add a message handler
   * @param handler Message handler function
   */
  public addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Remove a message handler
   * @param handler Message handler function to remove
   */
  public removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Add a connect callback
   * @param callback Connect callback function
   * @returns Function to remove the callback
   */
  public onConnect(callback: () => void): () => void {
    this.connectCallbacks.add(callback);
    return () => {
      this.connectCallbacks.delete(callback);
    };
  }

  /**
   * Add a disconnect callback
   * @param callback Disconnect callback function
   * @returns Function to remove the callback
   */
  public onDisconnect(callback: () => void): () => void {
    this.disconnectCallbacks.add(callback);
    return () => {
      this.disconnectCallbacks.delete(callback);
    };
  }

  /**
   * Check if the WebSocket is connected
   * @returns Boolean indicating if the WebSocket is connected
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection state
   * @returns Current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get WebSocket statistics
   * @returns WebSocket statistics
   */
  public getStats(): WebSocketStats {
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
   * @param message Message to queue
   */
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length < this.config.maxQueueSize) {
      this.messageQueue.push(message);
      if (this.config.debug) {
        logger.info("WebSocket message queued", { extra: message });
      }
    } else {
      logger.warn("WebSocket message queue full, dropping message", {
        extra: message,
      });
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
        this.send(message).catch((error) => {
          logger.error("Error sending queued message", error);
        });
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

  /**
   * Start the heartbeat interval
   */
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
   * Generate a unique client ID
   * @returns Unique client ID
   */
  private generateClientId(): string {
    return `client_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.disconnect();
    this.messageHandlers.clear();
    this.connectCallbacks.clear();
    this.disconnectCallbacks.clear();
    if (this.messageCountResetInterval) {
      clearInterval(this.messageCountResetInterval);
      this.messageCountResetInterval = null;
    }
  }
}

// Create a singleton instance
let websocketInstance: WebSocketService | null = null;

/**
 * Get the WebSocket service instance
 * @param config Optional WebSocket configuration
 * @returns WebSocket service instance
 */
export const getWebSocketService = (
  config?: Partial<WebSocketConfig>,
): WebSocketService => {
  if (!websocketInstance) {
    websocketInstance = new WebSocketService(config);
  }
  return websocketInstance;
};

/**
 * Reset the WebSocket service instance
 */
export const resetWebSocketService = (): void => {
  if (websocketInstance) {
    websocketInstance.destroy();
    websocketInstance = null;
  }
};

// Export a default instance
const websocketService = getWebSocketService();
export { websocketService };
export default websocketService;
