import supabase from "./supabaseClient";
import { Message } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";

export interface ChatHistoryParams {
  userId: string;
  sessionId?: string;
  contextRuleId?: string;
  page?: number;
  pageSize?: number;
}

export interface MessageToStore {
  content: string;
  sender: "user" | "assistant";
  contextRuleId?: string;
  modelUsed?: string;
  metadata?: Record<string, any>;
}

/**
 * Service for managing chat history in the database
 */
export const chatHistoryService = {
  /**
   * Store a new message in the database
   */
  storeMessage: async (
    userId: string,
    message: MessageToStore,
  ): Promise<Message> => {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        id: messageId,
        user_id: userId,
        content: message.content,
        sender: message.sender,
        context_rule_id: message.contextRuleId || null,
        model_used: message.modelUsed || null,
        metadata: message.metadata || {},
        created_at: timestamp,
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing message:", error);
      throw new Error(`Failed to store message: ${error.message}`);
    }

    return {
      id: data.id,
      content: data.content,
      sender: data.sender as "user" | "assistant",
      timestamp: new Date(data.created_at),
      status: "sent",
      metadata: data.metadata,
    };
  },

  /**
   * Get chat history for a user with pagination
   */
  getChatHistory: async ({
    userId,
    sessionId,
    contextRuleId,
    page = 1,
    pageSize = 20,
  }: ChatHistoryParams): Promise<{
    messages: Message[];
    totalCount: number;
  }> => {
    const startIndex = (page - 1) * pageSize;

    // Build the query
    let query = supabase
      .from("chat_messages")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    // Add filters if provided
    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    if (contextRuleId) {
      query = query.eq("context_rule_id", contextRuleId);
    }

    // Add pagination
    query = query.range(startIndex, startIndex + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error retrieving chat history:", error);
      throw new Error(`Failed to retrieve chat history: ${error.message}`);
    }

    // Transform the data to match the Message interface
    const messages = data.map((item) => ({
      id: item.id,
      content: item.content,
      sender: item.sender as "user" | "assistant",
      timestamp: new Date(item.created_at),
      status: "sent",
      metadata: item.metadata,
    }));

    return {
      messages,
      totalCount: count || 0,
    };
  },

  /**
   * Delete chat history for a user
   */
  deleteChatHistory: async (
    userId: string,
    contextRuleId?: string,
  ): Promise<void> => {
    let query = supabase.from("chat_messages").delete().eq("user_id", userId);

    if (contextRuleId) {
      query = query.eq("context_rule_id", contextRuleId);
    }

    const { error } = await query;

    if (error) {
      console.error("Error deleting chat history:", error);
      throw new Error(`Failed to delete chat history: ${error.message}`);
    }
  },

  /**
   * Create a new chat session
   */
  createSession: async (
    userId: string,
    contextRuleId?: string,
  ): Promise<string> => {
    const sessionId = uuidv4();
    const timestamp = new Date().toISOString();

    const { error } = await supabase.from("chat_sessions").insert({
      id: sessionId,
      user_id: userId,
      context_rule_id: contextRuleId || null,
      created_at: timestamp,
      last_activity: timestamp,
    });

    if (error) {
      console.error("Error creating chat session:", error);
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return sessionId;
  },

  /**
   * Update the last activity timestamp for a session
   */
  updateSessionActivity: async (sessionId: string): Promise<void> => {
    const { error } = await supabase
      .from("chat_sessions")
      .update({ last_activity: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      console.error("Error updating session activity:", error);
      throw new Error(`Failed to update session activity: ${error.message}`);
    }
  },
};

export default chatHistoryService;
