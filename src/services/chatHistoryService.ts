import { ChatMessage, ChatSession } from "@/models";
import { Message } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";

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
    try {
      const messageId = uuidv4();
      const timestamp = new Date();

      const newMessage = await ChatMessage.create({
        id: messageId,
        user_id: userId,
        content: message.content,
        sender: message.sender,
        context_rule_id: message.contextRuleId || null,
        model_used: message.modelUsed || null,
        metadata: message.metadata || {},
        created_at: timestamp,
      });

      return {
        id: newMessage.id,
        content: newMessage.content,
        sender: newMessage.sender as "user" | "assistant",
        timestamp: new Date(newMessage.created_at),
        status: "sent",
        metadata: newMessage.metadata,
      };
    } catch (error) {
      logger.error("Error storing message:", error);
      throw new Error(
        `Failed to store message: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
    try {
      const offset = (page - 1) * pageSize;

      // Build the query conditions
      const whereClause: any = { user_id: userId };
      if (sessionId) whereClause.session_id = sessionId;
      if (contextRuleId) whereClause.context_rule_id = contextRuleId;

      // Get total count
      const totalCount = await ChatMessage.count({ where: whereClause });

      // Get messages with pagination
      const chatMessages = await ChatMessage.findAll({
        where: whereClause,
        order: [["created_at", "ASC"]],
        limit: pageSize,
        offset: offset,
      });

      // Transform the data to match the Message interface
      const messages = chatMessages.map((item) => ({
        id: item.id,
        content: item.content,
        sender: item.type as "user" | "assistant",
        timestamp: new Date(item.created_at),
        status: "sent",
        metadata: item.metadata,
      }));

      return {
        messages,
        totalCount,
      };
    } catch (error) {
      logger.error("Error retrieving chat history:", error);
      throw new Error(
        `Failed to retrieve chat history: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  /**
   * Delete chat history for a user
   */
  deleteChatHistory: async (
    userId: string,
    contextRuleId?: string,
  ): Promise<void> => {
    try {
      const whereClause: any = { user_id: userId };
      if (contextRuleId) whereClause.context_rule_id = contextRuleId;

      await ChatMessage.destroy({ where: whereClause });
    } catch (error) {
      logger.error("Error deleting chat history:", error);
      throw new Error(
        `Failed to delete chat history: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  /**
   * Create a new chat session
   */
  createSession: async (
    userId: string,
    contextRuleId?: string,
  ): Promise<string> => {
    try {
      const sessionId = uuidv4();
      const timestamp = new Date();

      await ChatSession.create({
        id: sessionId,
        user_id: userId,
        context_rule_id: contextRuleId || null,
        created_at: timestamp,
        updated_at: timestamp,
        status: "active",
      });

      return sessionId;
    } catch (error) {
      logger.error("Error creating chat session:", error);
      throw new Error(
        `Failed to create chat session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },

  /**
   * Update the last activity timestamp for a session
   */
  updateSessionActivity: async (sessionId: string): Promise<void> => {
    try {
      const session = await ChatSession.findByPk(sessionId);
      if (!session) {
        throw new Error(`Session with ID ${sessionId} not found`);
      }

      await session.update({
        updated_at: new Date(),
      });
    } catch (error) {
      logger.error("Error updating session activity:", error);
      throw new Error(
        `Failed to update session activity: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
};

export default chatHistoryService;
