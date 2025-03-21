import supabase from "./supabaseClient";
import logger from "@/utils/logger";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export type SubscriptionCallback<T = any> = (payload: T) => void;

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

type TableName =
  | "chat_messages"
  | "chat_sessions"
  | "context_rules"
  | "knowledge_base_configs"
  | "widget_configs";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

/**
 * Service for handling Supabase real-time subscriptions
 */
class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isInitialized = false;

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

        // Subscribe to the channel
        subscription.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            logger.info(`Subscribed to ${channelId}`);
          } else if (status === "CHANNEL_ERROR") {
            logger.error(`Error subscribing to ${channelId}`);
          }
        });

        this.channels.set(channelId, channel);
      }

      // Return an unsubscribe function
      return {
        unsubscribe: () => {
          const channel = this.channels.get(channelId);
          if (channel) {
            channel.unsubscribe();
            this.channels.delete(channelId);
            logger.info(`Unsubscribed from ${channelId}`);
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

  /**
   * Subscribe to chat messages for a specific session
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
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    logger.info("Unsubscribed from all real-time channels");
  }
}

// Create a singleton instance
const realtimeService = new RealtimeService();

export default realtimeService;
