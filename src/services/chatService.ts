import supabase from "./supabaseClient";
import logger from "@/utils/logger";
import realtimeService from "./realtimeService";
import websocketService from "./websocketService";
import { v4 as uuidv4 } from "uuid";

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  messageType: "user" | "system" | "ai";
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  userId: string;
  contextRuleId?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

/**
 * Service for managing chat sessions and messages
 */
class ChatService {
  /**
   * Create a new chat session
   */
  async createSession(
    userId: string,
    contextRuleId?: string,
    metadata?: Record<string, any>,
  ): Promise<ChatSession | null> {
    try {
      const sessionId = uuidv4();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          id: uuidv4(),
          session_id: sessionId,
          user_id: userId,
          context_rule_id: contextRuleId,
          is_active: true,
          metadata: metadata || {},
          created_at: now,
          updated_at: now,
          last_message_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapSessionFromDb(data);
    } catch (error) {
      logger.error(
        "Error creating chat session",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Get a chat session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .single();

      if (error) throw error;

      return this.mapSessionFromDb(data);
    } catch (error) {
      logger.error(
        `Error fetching chat session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Get all chat sessions for a user
   */
  async getUserSessions(
    userId: string,
    activeOnly = true,
  ): Promise<ChatSession[]> {
    try {
      let query = supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this.mapSessionFromDb);
    } catch (error) {
      logger.error(
        `Error fetching user chat sessions for ${userId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Update a chat session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<
      Omit<
        ChatSession,
        | "id"
        | "sessionId"
        | "userId"
        | "createdAt"
        | "updatedAt"
        | "lastMessageAt"
      >
    >,
  ): Promise<ChatSession | null> {
    try {
      const updateData: Record<string, any> = {};

      if (updates.contextRuleId !== undefined)
        updateData.context_rule_id = updates.contextRuleId;
      if (updates.isActive !== undefined)
        updateData.is_active = updates.isActive;
      if (updates.metadata !== undefined)
        updateData.metadata = updates.metadata;

      const { data, error } = await supabase
        .from("chat_sessions")
        .update(updateData)
        .eq("session_id", sessionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapSessionFromDb(data);
    } catch (error) {
      logger.error(
        `Error updating chat session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Send a message in a chat session
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    message: string,
    messageType: "user" | "system" | "ai" = "user",
    metadata?: Record<string, any>,
  ): Promise<ChatMessage | null> {
    try {
      // Check if the session exists
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Chat session ${sessionId} not found`);
      }

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          id: uuidv4(),
          session_id: sessionId,
          user_id: userId,
          message,
          message_type: messageType,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Also send via WebSocket if available
      this.sendMessageViaWebSocket(
        sessionId,
        userId,
        message,
        messageType,
        metadata,
      );

      return this.mapMessageFromDb(data);
    } catch (error) {
      logger.error(
        `Error sending message to session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Send a message via WebSocket for immediate delivery
   */
  private sendMessageViaWebSocket(
    sessionId: string,
    userId: string,
    message: string,
    messageType: "user" | "system" | "ai",
    metadata?: Record<string, any>,
  ): void {
    try {
      websocketService.sendMessage({
        type: "chat_message",
        data: {
          session_id: sessionId,
          user_id: userId,
          message,
          message_type: messageType,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(
        "Error sending message via WebSocket",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Continue execution - WebSocket is just for immediate delivery,
      // the message is already saved in the database
    }
  }

  /**
   * Get messages for a chat session
   */
  async getSessionMessages(
    sessionId: string,
    limit = 50,
    before?: string,
  ): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Return in chronological order (oldest first)
      return data.map(this.mapMessageFromDb).reverse();
    } catch (error) {
      logger.error(
        `Error fetching messages for session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Subscribe to new messages in a chat session
   */
  subscribeToMessages(
    sessionId: string,
    callback: (message: ChatMessage) => void,
  ) {
    return realtimeService.subscribeToChatMessages(sessionId, (payload) => {
      if (payload.eventType === "INSERT") {
        callback(this.mapMessageFromDb(payload.new));
      }
    });
  }

  /**
   * Subscribe to changes in a chat session
   */
  subscribeToSession(
    sessionId: string,
    callback: (session: ChatSession) => void,
  ) {
    return realtimeService.subscribeToChatSession(sessionId, (payload) => {
      if (payload.eventType === "UPDATE") {
        callback(this.mapSessionFromDb(payload.new));
      }
    });
  }

  /**
   * Map database object to ChatSession
   */
  private mapSessionFromDb(data: any): ChatSession {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      contextRuleId: data.context_rule_id,
      isActive: data.is_active,
      metadata: data.metadata,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      lastMessageAt: data.last_message_at,
    };
  }

  /**
   * Map database object to ChatMessage
   */
  private mapMessageFromDb(data: any): ChatMessage {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      message: data.message,
      messageType: data.message_type,
      metadata: data.metadata,
      createdAt: data.created_at,
    };
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService;
