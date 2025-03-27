import { useState, useEffect } from "react";
import realtimeService, {
  SubscriptionCallback,
  RealtimeSubscription,
} from "@/services/realtimeService";

// Define our own type instead of using Supabase's
type RealtimeChangesPayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T | null;
  schema: string;
  table: string;
  commit_timestamp: string;
};

type TableName =
  | "chat_messages"
  | "chat_sessions"
  | "context_rules"
  | "knowledge_base_configs"
  | "widget_configs";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

/**
 * Hook for subscribing to Supabase real-time changes
 */
export function useRealtime<T = any>(
  tableName: TableName,
  events: ChangeEvent[] = ["INSERT", "UPDATE", "DELETE"],
  filter?: string,
  enabled = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [payload, setPayload] = useState<RealtimeChangesPayload<T> | null>(
    null,
  );
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let subscription: RealtimeSubscription | null = null;

    if (enabled) {
      setIsLoading(true);

      try {
        const callback: SubscriptionCallback<RealtimeChangesPayload<T>> = (
          payload,
        ) => {
          setPayload(payload);

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            setData(payload.new as T);
          } else if (payload.eventType === "DELETE") {
            setData(null);
          }

          setIsLoading(false);
        };

        subscription = realtimeService.subscribeToTable<T>(
          tableName,
          callback,
          events,
          filter,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [tableName, JSON.stringify(events), filter, enabled]);

  return { data, payload, error, isLoading };
}

/**
 * Hook for subscribing to chat messages for a specific session
 */
export function useChatMessages(sessionId: string, enabled = true) {
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let subscription: RealtimeSubscription | null = null;

    if (enabled && sessionId) {
      setIsLoading(true);

      try {
        const callback: SubscriptionCallback<RealtimeChangesPayload<any>> = (
          payload,
        ) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new]);
          }
          setIsLoading(false);
        };

        subscription = realtimeService.subscribeToChatMessages(
          sessionId,
          callback,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [sessionId, enabled]);

  return { messages, error, isLoading };
}

/**
 * Hook for subscribing to changes in a chat session
 */
export function useChatSession(sessionId: string, enabled = true) {
  const [session, setSession] = useState<any | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let subscription: RealtimeSubscription | null = null;

    if (enabled && sessionId) {
      setIsLoading(true);

      try {
        const callback: SubscriptionCallback<RealtimeChangesPayload<any>> = (
          payload,
        ) => {
          if (payload.eventType === "UPDATE") {
            setSession(payload.new);
          }
          setIsLoading(false);
        };

        subscription = realtimeService.subscribeToChatSession(
          sessionId,
          callback,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [sessionId, enabled]);

  return { session, error, isLoading };
}

/**
 * Hook for subscribing to changes in widget configurations
 */
export function useWidgetConfigs(userId: string, enabled = true) {
  const [configs, setConfigs] = useState<any[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let subscription: RealtimeSubscription | null = null;

    if (enabled && userId) {
      setIsLoading(true);

      try {
        const callback: SubscriptionCallback<RealtimeChangesPayload<any>> = (
          payload,
        ) => {
          if (payload.eventType === "INSERT") {
            setConfigs((prev) => [...prev, payload.new]);
          } else if (payload.eventType === "UPDATE") {
            setConfigs((prev) =>
              prev.map((config) =>
                config.id === payload.new.id ? payload.new : config,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setConfigs((prev) =>
              prev.filter((config) => config.id !== payload.old.id),
            );
          }
          setIsLoading(false);
        };

        subscription = realtimeService.subscribeToWidgetConfigs(
          userId,
          callback,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [userId, enabled]);

  return { configs, error, isLoading };
}
