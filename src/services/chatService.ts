import supabase from "./supabaseClient";
import logger from "@/utils/logger";
import realtimeService from "./realtimeService";
import websocketService from "./websocketService";
import moderationService from "./moderationService";
import { v4 as uuidv4 } from "uuid";

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  messageType: "user" | "system" | "ai";
  metadata?: Record<string, any>;
  createdAt: string;
  attachments?: ChatAttachment[];
  status?: "pending" | "delivered" | "read" | "moderated";
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  type: "image" | "file" | "audio" | "video";
  url: string;
  filename: string;
  filesize: number;
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
    attachments?: Omit<ChatAttachment, "id" | "messageId" | "createdAt">[],
  ): Promise<ChatMessage | null> {
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
      const now = new Date().toISOString();

      // Prepare message data
      const messageData = {
        id: messageId,
        session_id: sessionId,
        user_id: userId,
        message,
        message_type: messageType,
        metadata: metadata || {},
        status: "pending",
        created_at: now,
      };

      // Insert the message
      const { data, error } = await supabase
        .from("chat_messages")
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Process attachments if any
      if (attachments && attachments.length > 0) {
        const attachmentInserts = attachments.map((attachment) => ({
          id: uuidv4(),
          message_id: messageId,
          type: attachment.type,
          url: attachment.url,
          filename: attachment.filename,
          filesize: attachment.filesize,
          metadata: attachment.metadata || {},
          created_at: now,
        }));

        const { error: attachmentError } = await supabase
          .from("chat_attachments")
          .insert(attachmentInserts);

        if (attachmentError) {
          logger.error(
            `Error saving attachments for message ${messageId}`,
            attachmentError instanceof Error
              ? attachmentError
              : new Error(String(attachmentError)),
          );
        }
      }

      // Update session's last_message_at
      await supabase
        .from("chat_sessions")
        .update({ last_message_at: now, updated_at: now })
        .eq("session_id", sessionId);

      // Mark as delivered
      await supabase
        .from("chat_messages")
        .update({ status: "delivered" })
        .eq("id", messageId);

      // Also send via WebSocket if available
      this.sendMessageViaWebSocket(
        sessionId,
        userId,
        message,
        messageType,
        metadata,
        attachments,
      );

      // Get the complete message with attachments
      return this.getMessageById(messageId);
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
    attachments?: Omit<ChatAttachment, "id" | "messageId" | "createdAt">[],
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
          attachments: attachments || [],
          created_at: new Date().toISOString(),
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
        .select("*, chat_attachments(*)")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt("created_at", before);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Return in chronological order (oldest first)
      return data.map(this.mapMessageWithAttachmentsFromDb).reverse();
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
  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*, chat_attachments(*)")
        .eq("id", messageId)
        .single();

      if (error) throw error;

      return this.mapMessageWithAttachmentsFromDb(data);
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
      const { error } = await supabase
        .from("chat_messages")
        .update({ status: "read" })
        .in("id", messageIds)
        .eq("session_id", sessionId)
        .neq("user_id", userId);

      if (error) throw error;

      // Notify via WebSocket that messages were read
      websocketService.sendMessage({
        type: "messages_read",
        data: {
          session_id: sessionId,
          user_id: userId,
          message_ids: messageIds,
          timestamp: new Date().toISOString(),
        },
      });

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
   * Upload a file attachment
   */
  async uploadAttachment(
    file: File,
    sessionId: string,
    userId: string,
  ): Promise<{ url: string; filename: string; filesize: number } | null> {
    try {
      // Generate a unique filename
      const fileExt = file.name.split(".").pop();
      const filename = `${uuidv4()}.${fileExt}`;
      const filePath = `attachments/${sessionId}/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        filename: file.name,
        filesize: file.size,
      };
    } catch (error) {
      logger.error(
        `Error uploading attachment for session ${sessionId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
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
      status: data.status,
      createdAt: data.created_at,
    };
  }

  /**
   * Map database object to ChatMessage with attachments
   */
  private mapMessageWithAttachmentsFromDb(data: any): ChatMessage {
    const message = this.mapMessageFromDb(data);

    // Add attachments if they exist
    if (data.chat_attachments && Array.isArray(data.chat_attachments)) {
      message.attachments = data.chat_attachments.map((attachment: any) => ({
        id: attachment.id,
        messageId: attachment.message_id,
        type: attachment.type,
        url: attachment.url,
        filename: attachment.filename,
        filesize: attachment.filesize,
        metadata: attachment.metadata,
        createdAt: attachment.created_at,
      }));
    }

    return message;
  }
}

// Create a singleton instance
const chatService = new ChatService();

export default chatService;
