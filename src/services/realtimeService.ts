/**
 * Unified Realtime Service
 *
 * This service provides real-time updates using WebSockets
 * It replaces the previous Supabase-based implementation
 */

import logger from "@/utils/logger";
import { getMySQLClient } from "./mysqlClient";
import websocketService from "./websocketService";

type NotificationCallback = (notification: any) => void;
type TableChangeCallback = (payload: any) => void;

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

type TableName =
  | "chat_messages"
  | "chat_sessions"
  | "context_rules"
  | "knowledge_base_configs"
  | "widget_configs"
  | "notifications";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

/**
 * Service for handling real-time updates using WebSockets
 */
export const realtimeService = {
  /**
   * Map of active subscriptions
   * Key: userId_subscriptionType
   * Value: Array of callback functions
   */
  subscriptions: new Map<string, any[]>(),

  /**
   * Subscribe to changes on a specific table
   */
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
  },

  /**
   * Subscribe to chat messages for a specific session
   */
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
  },

  /**
   * Subscribe to changes in a chat session
   */
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
  },

  /**
   * Subscribe to changes in context rules
   */
  subscribeToContextRules(callback: TableChangeCallback): RealtimeSubscription {
    return this.subscribeToTable("context_rules", callback, [
      "INSERT",
      "UPDATE",
      "DELETE",
    ]);
  },

  /**
   * Subscribe to changes in widget configurations
   */
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
  },

  /**
   * Subscribe to notifications for a specific user
   */
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
  },

  /**
   * Fetch recent notifications for a user
   */
  async fetchNotifications(userId: string, limit: number = 5): Promise<any[]> {
    try {
      if (!userId) return [];

      const sequelize = await getMySQLClient();

      const notifications = await sequelize.query(
        `SELECT * FROM notifications 
         WHERE user_id = ? AND read = false 
         ORDER BY created_at DESC LIMIT ?`,
        {
          replacements: [userId, limit],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return notifications || [];
    } catch (error) {
      logger.error("Error fetching notifications", error);
      return [];
    }
  },

  /**
   * Mark notifications as read
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
    try {
      if (notificationIds.length === 0) return true;

      const sequelize = await getMySQLClient();

      // Build placeholders for the IN clause
      const placeholders = notificationIds.map(() => "?").join(",");

      await sequelize.query(
        `UPDATE notifications SET read = true WHERE id IN (${placeholders})`,
        {
          replacements: [...notificationIds],
          type: sequelize.QueryTypes.UPDATE,
        },
      );

      return true;
    } catch (error) {
      logger.error("Error marking notifications as read", error);
      return false;
    }
  },

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    this.subscriptions.clear();
    logger.info("Unsubscribed from all real-time channels");
  },
};

export default realtimeService;
