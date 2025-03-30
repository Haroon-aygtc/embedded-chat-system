/**
 * Chat API Endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import {
  ChatMessageInterface,
  ChatSessionInterface,
} from "@/services/chatService";

export interface SendMessageRequest {
  sessionId: string;
  message: string;
  attachments?: any[];
  metadata?: Record<string, any>;
}

export interface CreateSessionRequest {
  contextRuleId?: string;
  metadata?: Record<string, any>;
}

export const chatEndpoints = {
  /**
   * Create a new chat session
   */
  createSession: async (
    data: CreateSessionRequest,
  ): Promise<ApiResponse<ChatSessionInterface>> => {
    return api.post<ChatSessionInterface>("/chat/sessions", data);
  },

  /**
   * Get a chat session by ID
   */
  getSession: async (
    sessionId: string,
  ): Promise<ApiResponse<ChatSessionInterface>> => {
    return api.get<ChatSessionInterface>(`/chat/sessions/${sessionId}`);
  },

  /**
   * Get all chat sessions for the current user
   */
  getUserSessions: async (
    activeOnly: boolean = true,
  ): Promise<ApiResponse<ChatSessionInterface[]>> => {
    return api.get<ChatSessionInterface[]>("/chat/sessions", {
      params: { activeOnly },
    });
  },

  /**
   * Update a chat session
   */
  updateSession: async (
    sessionId: string,
    data: Partial<ChatSessionInterface>,
  ): Promise<ApiResponse<ChatSessionInterface>> => {
    return api.put<ChatSessionInterface>(`/chat/sessions/${sessionId}`, data);
  },

  /**
   * Send a message in a chat session
   */
  sendMessage: async (
    data: SendMessageRequest,
  ): Promise<ApiResponse<ChatMessageInterface>> => {
    return api.post<ChatMessageInterface>("/chat/messages", data);
  },

  /**
   * Get messages for a chat session
   */
  getSessionMessages: async (
    sessionId: string,
    limit: number = 50,
    before?: string,
  ): Promise<ApiResponse<ChatMessageInterface[]>> => {
    return api.get<ChatMessageInterface[]>(
      `/chat/sessions/${sessionId}/messages`,
      {
        params: { limit, before },
      },
    );
  },

  /**
   * Get a message by ID
   */
  getMessageById: async (
    messageId: string,
  ): Promise<ApiResponse<ChatMessageInterface>> => {
    return api.get<ChatMessageInterface>(`/chat/messages/${messageId}`);
  },

  /**
   * Mark messages as read
   */
  markMessagesAsRead: async (
    sessionId: string,
    messageIds: string[],
  ): Promise<ApiResponse<boolean>> => {
    return api.post<boolean>(`/chat/sessions/${sessionId}/read`, {
      messageIds,
    });
  },
};
