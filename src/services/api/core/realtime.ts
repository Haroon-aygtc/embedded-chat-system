/**
 * Realtime Service Module
 *
 * This module provides functionality for real-time communication using WebSockets
 * instead of Supabase real-time subscriptions.
 */

import logger from "@/utils/logger";
import websocketService, { MessageType } from "../core/websocket";

// Subscription callback type
export type SubscriptionCallback<T = any> = (payload: T) => void;

// Subscription interface
export interface RealtimeSubscription {
  unsubscribe: () => void;
}

// Table names that can be subscribed to
type TableName =
  | "chat_messages"
  | "chat_sessions"
  | "context_rules"
  | "knowledge_base_configs"
  | "widget_configs"
  | "notifications";

// Change events
type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

/**
 * Service for handling real-time subscriptions via WebSockets
 */
export class RealtimeService {
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private isInitialized = false;
  private maxRetries = 5;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the real-time service
   */
  private initialize() {
    if (this.isInitialized) return;

    // Set up WebSocket connection and message handlers
    websocketService.addMessageHandler(this.handleWebSocketMessage);
    websocketService.onConnect(() => {
      logger.info("WebSocket connected for real-time service");
      this.resubscribeAll();
    });

    // Connect to WebSocket server
    websocketService.connect().catch((error) => {
      logger.error(
        "Error connecting to WebSocket for real-time service",
        error,
      );
    });

    this.isInitialized = true;
    logger.info("Real-time service initialized with WebSockets");
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage = (message: any) => {
    if (message.type === "database_change" && message.table && message.event) {
      const { table, event, data } = message;
      const channelId = `${table}-${event}`;

      // Notify all subscribers for this channel
      const callbacks = this.subscriptions.get(channelId);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback({
              new: data,
              eventType: event,
              table,
              schema: "public",
            });
          } catch (error) {
            logger.error(`Error in real-time callback for ${channelId}`, error);
          }
        });
      }

      // Also check for filtered subscriptions
      this.subscriptions.forEach((callbacks, key) => {
        if (key.startsWith(`${table}-${event}-`) && data) {
          // Extract filter from key
          const filter = key.substring(`${table}-${event}-`.length);
          const [filterField, filterValue] = filter.split("=");

          // Check if data matches filter
          if (data[filterField] === filterValue) {
            callbacks.forEach((callback) => {
              try {
                callback({
                  new: data,
                  eventType: event,
                  table,
                  schema: "public",
                });
              } catch (error) {
                logger.error(
                  `Error in filtered real-time callback for ${key}`,
                  error,
                );
              }
            });
          }
        }
      });
    }
  };

  /**
   * Resubscribe to all channels after reconnection
   */
  private resubscribeAll() {
    // Send subscription messages to the server for each channel
    this.subscriptions.forEach((_, channelId) => {
      const [table, event, filter] = channelId.split("-");

      websocketService
        .send({
          type: MessageType.SUBSCRIBE,
          payload: {
            table,
            event,
            filter: filter || undefined,
          },
        })
        .catch((error) => {
          logger.error(`Error resubscribing to ${channelId}`, error);
        });
    });
  }

  /**
   * Subscribe to changes on a specific table
   * @param tableName Table name
   * @param callback Callback function
   * @param events Events to subscribe to
   * @param filter Optional filter
   * @returns Subscription object
   */
  subscribeToTable<T = any>(
    tableName: TableName,
    callback: SubscriptionCallback<T>,
    events: ChangeEvent[] = ["INSERT", "UPDATE", "DELETE"],
    filter?: string,
  ): RealtimeSubscription {
    try {
      const subscriptions: RealtimeSubscription[] = [];

      // Create a subscription for each event
      for (const event of events) {
        const channelId = `${tableName}-${event}${filter ? `-${filter}` : ""}`;

        // Add callback to subscriptions map
        if (!this.subscriptions.has(channelId)) {
          this.subscriptions.set(channelId, new Set());

          // Send subscription message to server
          if (websocketService.isConnected()) {
            websocketService
              .send({
                type: MessageType.SUBSCRIBE,
                payload: {
                  table: tableName,
                  event,
                  filter: filter || undefined,
                },
              })
              .catch((error) => {
                logger.error(`Error subscribing to ${channelId}`, error);
              });
          }
        }

        const callbacks = this.subscriptions.get(channelId);
        callbacks?.add(callback);

        // Create unsubscribe function for this event
        const unsubscribe = () => {
          const callbacks = this.subscriptions.get(channelId);
          if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
              this.subscriptions.delete(channelId);

              // Send unsubscribe message to server
              if (websocketService.isConnected()) {
                websocketService
                  .send({
                    type: MessageType.UNSUBSCRIBE,
                    payload: {
                      table: tableName,
                      event,
                      filter: filter || undefined,
                    },
                  })
                  .catch((error) => {
                    logger.error(
                      `Error unsubscribing from ${channelId}`,
                      error,
                    );
                  });
              }
            }
          }
        };

        subscriptions.push({ unsubscribe });
      }

      // Return a combined unsubscribe function
      return {
        unsubscribe: () => {
          subscriptions.forEach((sub) => sub.unsubscribe());
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

  /**
   * Subscribe to chat messages for a specific session
   * @param sessionId Session ID
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToChatMessages(
    sessionId: string,
    callback: SubscriptionCallback,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "chat_messages",
      callback,
      ["INSERT"],
      `session_id=${sessionId}`,
    );
  }

  /**
   * Subscribe to changes in a chat session
   * @param sessionId Session ID
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToChatSession(
    sessionId: string,
    callback: SubscriptionCallback,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "chat_sessions",
      callback,
      ["UPDATE"],
      `session_id=${sessionId}`,
    );
  }

  /**
   * Subscribe to changes in context rules
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToContextRules(
    callback: SubscriptionCallback,
  ): RealtimeSubscription {
    return this.subscribeToTable("context_rules", callback, [
      "INSERT",
      "UPDATE",
      "DELETE",
    ]);
  }

  /**
   * Subscribe to changes in widget configurations
   * @param userId User ID
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToWidgetConfigs(
    userId: string,
    callback: SubscriptionCallback,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "widget_configs",
      callback,
      ["INSERT", "UPDATE", "DELETE"],
      `user_id=${userId}`,
    );
  }

  /**
   * Subscribe to notifications for a user
   * @param userId User ID
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToNotifications(
    userId: string,
    callback: SubscriptionCallback,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "notifications",
      callback,
      ["INSERT"],
      `user_id=${userId}`,
    );
  }

  /**
   * Fetch notifications for a user
   * @param userId User ID
   * @param limit Maximum number of notifications to fetch
   * @returns Array of notifications
   */
  async fetchNotifications(userId: string, limit: number = 10): Promise<any[]> {
    try {
      // This would be implemented with a direct API call
      // For now, return an empty array
      return [];
    } catch (error) {
      logger.error("Error fetching notifications", error);
      return [];
    }
  }

  /**
   * Mark notifications as read
   * @param notificationIds Array of notification IDs
   * @returns Boolean indicating success
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      // This would be implemented with a direct API call
      // For now, return success
      return true;
    } catch (error) {
      logger.error("Error marking notifications as read", error);
      return false;
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    // Send unsubscribe messages for all channels
    this.subscriptions.forEach((_, channelId) => {
      const [table, event, filter] = channelId.split("-");

      if (websocketService.isConnected()) {
        websocketService
          .send({
            type: MessageType.UNSUBSCRIBE,
            payload: {
              table,
              event,
              filter: filter || undefined,
            },
          })
          .catch((error) => {
            logger.error(`Error unsubscribing from ${channelId}`, error);
          });
      }
    });

    this.subscriptions.clear();
    logger.info("Unsubscribed from all real-time channels");
  }

  /**
   * Get the number of active subscriptions
   * @returns Number of active subscriptions
   */
  getActiveSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if a specific subscription is active
   * @param tableName Table name
   * @param events Events
   * @param filter Optional filter
   * @returns Boolean indicating if the subscription is active
   */
  isSubscriptionActive(
    tableName: TableName,
    events: ChangeEvent[] = ["INSERT", "UPDATE", "DELETE"],
    filter?: string,
  ): boolean {
    for (const event of events) {
      const channelId = `${tableName}-${event}${filter ? `-${filter}` : ""}`;
      if (this.subscriptions.has(channelId)) {
        return true;
      }
    }
    return false;
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export { realtimeService };
export default realtimeService;
