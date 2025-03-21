/**
 * WebSocket types for the application
 */

import type { WebSocketMessage } from "./chat";

/**
 * WebSocket connection states
 */
export enum ConnectionState {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  RECONNECTING = "reconnecting",
  FAILED = "failed",
}

/**
 * WebSocket service configuration options
 */
export interface WebSocketConfig {
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

/**
 * WebSocket connection statistics
 */
export interface WebSocketStats {
  connectionState: ConnectionState;
  queuedMessages: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  isConnected: boolean;
  messageRatePerMinute: number;
  latency?: number;
}

/**
 * WebSocket authentication data
 */
export interface WebSocketAuthData {
  token: string;
  userId?: string;
  sessionId?: string;
}

/**
 * WebSocket authentication response
 */
export interface WebSocketAuthResponse extends WebSocketMessage {
  type: "auth_response";
  payload: {
    success: boolean;
    reason?: string;
    userId?: string;
    permissions?: string[];
  };
}
