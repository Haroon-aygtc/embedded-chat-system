/**
 * Realtime Service Module
 *
 * This module provides functionality for Supabase real-time subscriptions.
 */

import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabase";
import logger from "@/utils/logger";

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
  | "widget_configs";

// Change events
type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

/**
 * Service for handling Supabase real-time subscriptions
 */
export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isInitialized = false;
  private subscriptionRetryTimeouts: Map<string, number> = new Map();
  private maxRetries = 5;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the real-time service
   */
  private initialize() {
    if (this.isInitialized) return;

    // Check if Supabase URL and key are available
    if (
      !import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY
    ) {
      logger.warn(
        "Supabase URL or anon key not found. Real-time features will not work.",
      );
      return;
    }

    this.isInitialized = true;
    logger.info("Real-time service initialized");
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
    callback: SubscriptionCallback<RealtimePostgresChangesPayload<T>>,
    events: ChangeEvent[] = ["INSERT", "UPDATE", "DELETE"],
    filter?: string,
  ): RealtimeSubscription {
    try {
      const channelId = `${tableName}-${events.join("-")}-${filter || "all"}`;

      // Create a new channel if it doesn't exist
      if (!this.channels.has(channelId)) {
        const supabase = getSupabaseClient();
        const channel = supabase.channel(channelId);

        // Build the subscription
        let subscription = channel.on(
          "postgres_changes",
          {
            event: events,
            schema: "public",
            table: tableName,
            ...(filter ? { filter } : {}),
          },
          (payload) => {
            callback(payload as RealtimePostgresChangesPayload<T>);
          },
        );

        // Subscribe to the channel with retry logic
        this.subscribeWithRetry(channelId, subscription);

        this.channels.set(channelId, channel);
      }

      // Return an unsubscribe function
      return {
        unsubscribe: () => {
          this.unsubscribeFromChannel(channelId);
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
   * Subscribe to a channel with retry logic
   * @param channelId Channel ID
   * @param channel Channel to subscribe to
   * @param attempt Current attempt number
   */
  private subscribeWithRetry(
    channelId: string,
    channel: RealtimeChannel,
    attempt: number = 0,
  ) {
    try {
      // Clear any existing retry timeout
      if (this.subscriptionRetryTimeouts.has(channelId)) {
        window.clearTimeout(this.subscriptionRetryTimeouts.get(channelId));
        this.subscriptionRetryTimeouts.delete(channelId);
      }

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          logger.info(`Subscribed to ${channelId}`);
        } else if (status === "CHANNEL_ERROR") {
          logger.error(`Error subscribing to ${channelId}`);

          // Retry with exponential backoff
          if (attempt < this.maxRetries) {
            const backoffTime = Math.min(1000 * Math.pow(2, attempt), 30000);
            logger.info(
              `Retrying subscription to ${channelId} in ${backoffTime}ms`,
            );

            const timeoutId = window.setTimeout(() => {
              this.subscribeWithRetry(channelId, channel, attempt + 1);
            }, backoffTime);

            this.subscriptionRetryTimeouts.set(channelId, timeoutId);
          } else {
            logger.error(
              `Failed to subscribe to ${channelId} after ${this.maxRetries} attempts`,
            );
          }
        }
      });
    } catch (error) {
      logger.error(`Error in subscribeWithRetry for ${channelId}`, error);
    }
  }

  /**
   * Unsubscribe from a channel
   * @param channelId Channel ID
   */
  private unsubscribeFromChannel(channelId: string) {
    const channel = this.channels.get(channelId);
    if (channel) {
      try {
        channel.unsubscribe();
        this.channels.delete(channelId);
        logger.info(`Unsubscribed from ${channelId}`);
      } catch (error) {
        logger.error(`Error unsubscribing from ${channelId}`, error);
      }
    }

    // Clear any retry timeout
    if (this.subscriptionRetryTimeouts.has(channelId)) {
      window.clearTimeout(this.subscriptionRetryTimeouts.get(channelId));
      this.subscriptionRetryTimeouts.delete(channelId);
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
    callback: SubscriptionCallback<RealtimePostgresChangesPayload<any>>,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "chat_messages",
      callback,
      ["INSERT"],
      `session_id=eq.${sessionId}`,
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
    callback: SubscriptionCallback<RealtimePostgresChangesPayload<any>>,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "chat_sessions",
      callback,
      ["UPDATE"],
      `session_id=eq.${sessionId}`,
    );
  }

  /**
   * Subscribe to changes in context rules
   * @param callback Callback function
   * @returns Subscription object
   */
  subscribeToContextRules(
    callback: SubscriptionCallback<RealtimePostgresChangesPayload<any>>,
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
    callback: SubscriptionCallback<RealtimePostgresChangesPayload<any>>,
  ): RealtimeSubscription {
    return this.subscribeToTable(
      "widget_configs",
      callback,
      ["INSERT", "UPDATE", "DELETE"],
      `user_id=eq.${userId}`,
    );
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    // Clear all retry timeouts
    this.subscriptionRetryTimeouts.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    this.subscriptionRetryTimeouts.clear();

    // Unsubscribe from all channels
    this.channels.forEach((channel) => {
      try {
        channel.unsubscribe();
      } catch (error) {
        logger.error("Error unsubscribing from channel", error);
      }
    });
    this.channels.clear();
    logger.info("Unsubscribed from all real-time channels");
  }

  /**
   * Get the number of active subscriptions
   * @returns Number of active subscriptions
   */
  getActiveSubscriptionCount(): number {
    return this.channels.size;
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
    const channelId = `${tableName}-${events.join("-")}-${filter || "all"}`;
    return this.channels.has(channelId);
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export { realtimeService };
export default realtimeService;
