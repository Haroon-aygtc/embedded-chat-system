import { v4 as uuidv4 } from "uuid";
import { ChatMessage, ChatSession } from "@/models";
import logger from "@/utils/logger";
import moderationService from "./moderationService";
import { getWebSocketService } from "./api/core/websocket";

export interface ChatMessageInterface {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  messageType: "user" | "system" | "ai";
  metadata?: Record<string, any>;
  createdAt: string;
  attachments?: ChatAttachmentInterface[];
  status?: "pending" | "delivered" | "read" | "moderated";
}

export interface ChatAttachmentInterface {
  id: string;
  messageId: string;
  type: "image" | "file" | "audio" | "video";
  url: string;
  filename: string;
  filesize: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ChatSessionInterface {
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
  ): Promise<ChatSessionInterface | null> {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const session = await ChatSession.create({
        id: uuidv4(),
        session_id: sessionId,
        user_id: userId,
        context_rule_id: contextRuleId,
        is_active: true,
        metadata: metadata || {},
        created_at: now,
        updated_at: now,
        last_message_at: now,
      });

      return this.mapSessionFromDb(session);
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
  async getSession(sessionId: string): Promise<ChatSessionInterface | null> {
    try {
      const session = await ChatSession.findOne({
        where: { session_id: sessionId },
      });

      if (!session) return null;

      return this.mapSessionFromDb(session);
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
  ): Promise<ChatSessionInterface[]> {
    try {
      const query: any = { user_id: userId };
      if (activeOnly) {
        query.is_active = true;
      }

      const sessions = await ChatSession.findAll({
        where: query,
        order: [["last_message_at", "DESC"]],
      });

      return sessions.map((session) => this.mapSessionFromDb(session));
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
        ChatSessionInterface,
        | "id"
        | "sessionId"
        | "userId"
        | "createdAt"
        | "updatedAt"
        | "lastMessageAt"
      >
    >,
  ): Promise<ChatSessionInterface | null> {
    try {
      const updateData: Record<string, any> = {};

      if (updates.contextRuleId !== undefined)
        updateData.context_rule_id = updates.contextRuleId;
      if (updates.isActive !== undefined)
        updateData.is_active = updates.isActive;
      if (updates.metadata !== undefined)
        updateData.metadata = updates.metadata;

      updateData.updated_at = new Date();

      const session = await ChatSession.findOne({
        where: { session_id: sessionId },
      });

      if (!session) {
        throw new Error(`Chat session ${sessionId} not found`);
      }

      await session.update(updateData);

      return this.mapSessionFromDb(session);
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
    attachments?: Omit<
      ChatAttachmentInterface,
      "id" | "messageId" | "createdAt"
    >[],
  ): Promise<ChatMessageInterface | null> {
    try {
      // Check if the session exists
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Chat session ${sessionId} not found`);
      }

      // Check if user is banned (for user messages only)
      if (messageType === "user") {
        const isBanned = await moderationService.isUserBanned(userId);
        if (isBanned) {
          throw new Error("User is banned from sending messages");
        }

        // Check content against moderation rules
        const moderationResult = await moderationService.checkContent(
          message,
          userId,
        );

        // If content is not allowed, return early
        if (!moderationResult.isAllowed) {
          return null;
        }

        // If content was modified, use the modified version
        if (moderationResult.modifiedContent) {
          message = moderationResult.modifiedContent;
          metadata = { ...metadata, moderated: true };
        }

        // If content was flagged, add to metadata
        if (moderationResult.flagged) {
          metadata = { ...metadata, flagged: true };
        }
      }

      // Generate a unique ID for the message
      const messageId = uuidv4();
      const now = new Date();

      // Prepare message data
      const messageData = {
        id: messageId,
        session_id: sessionId,
        user_id: userId,
        content: message,
        type: messageType,
        metadata: metadata || {},
        status: "pending",
        created_at: now,
      };

      // Insert the message
      const chatMessage = await ChatMessage.create(messageData);

      // Process attachments if any
      if (attachments && attachments.length > 0) {
        // In MySQL implementation, we would handle attachments here
        // This would require creating an Attachment model and table
        logger.info(`Attachments handling not implemented yet for MySQL`);
      }

      // Update session's last_message_at
      await ChatSession.update(
        { last_message_at: now, updated_at: now },
        { where: { session_id: sessionId } },
      );

      // Mark as delivered
      await ChatMessage.update(
        { status: "delivered" },
        { where: { id: messageId } },
      );

      // Also send via WebSocket if available
      try {
        const websocketService = getWebSocketService();
        websocketService.sendMessage({
          type: "chat_message",
          data: {
            session_id: sessionId,
            user_id: userId,
            message,
            message_type: messageType,
            metadata: metadata || {},
            attachments: attachments || [],
            created_at: now.toISOString(),
            status: "delivered",
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

      // Get the complete message
      return this.mapMessageFromDb(chatMessage);
    } catch (error) {
      logger.error(
        `Error sending message to session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Get messages for a chat session
   */
  async getSessionMessages(
    sessionId: string,
    limit = 50,
    before?: string,
  ): Promise<ChatMessageInterface[]> {
    try {
      const query: any = { session_id: sessionId };
      if (before) {
        query.created_at = { $lt: before };
      }

      const messages = await ChatMessage.findAll({
        where: query,
        order: [["created_at", "DESC"]],
        limit,
      });

      // Return in chronological order (oldest first)
      return messages
        .map((message) => this.mapMessageFromDb(message))
        .reverse();
    } catch (error) {
      logger.error(
        `Error fetching messages for session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Get a message by ID
   */
  async getMessageById(
    messageId: string,
  ): Promise<ChatMessageInterface | null> {
    try {
      const message = await ChatMessage.findByPk(messageId);
      if (!message) return null;

      return this.mapMessageFromDb(message);
    } catch (error) {
      logger.error(
        `Error fetching message ${messageId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    sessionId: string,
    userId: string,
    messageIds: string[],
  ): Promise<boolean> {
    try {
      // Only mark messages that aren't from this user
      await ChatMessage.update(
        { status: "read" },
        {
          where: {
            id: messageIds,
            session_id: sessionId,
            user_id: { $ne: userId },
          },
        },
      );

      // Notify via WebSocket that messages were read
      try {
        const websocketService = getWebSocketService();
        websocketService.sendMessage({
          type: "messages_read",
          data: {
            session_id: sessionId,
            user_id: userId,
            message_ids: messageIds,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error("Error sending read status via WebSocket", error);
      }

      return true;
    } catch (error) {
      logger.error(
        `Error marking messages as read in session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Map database object to ChatSession
   */
  private mapSessionFromDb(data: any): ChatSessionInterface {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      contextRuleId: data.context_rule_id,
      isActive: data.is_active,
      metadata: data.metadata,
      createdAt:
        data.created_at instanceof Date
          ? data.created_at.toISOString()
          : data.created_at,
      updatedAt:
        data.updated_at instanceof Date
          ? data.updated_at.toISOString()
          : data.updated_at,
      lastMessageAt:
        data.last_message_at instanceof Date
          ? data.last_message_at.toISOString()
          : data.last_message_at,
    };
  }

  /**
   * Map database object to ChatMessage
   */
  private mapMessageFromDb(data: any): ChatMessageInterface {
    return {
      id: data.id,
      sessionId: data.session_id,
      userId: data.user_id,
      message: data.content,
      messageType: data.type,
      metadata: data.metadata,
      status: data.status,
      createdAt:
        data.created_at instanceof Date
          ? data.created_at.toISOString()
          : data.created_at,
    };
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService;
