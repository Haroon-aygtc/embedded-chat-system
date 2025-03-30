import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";
import aiService from "./aiService";

interface ChatSession {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp: Date;
}

export const chatService = {
  createSession: async (userId: string = "anonymous"): Promise<ChatSession> => {
    try {
      const sessionId = uuidv4();
      const now = new Date();

      const sequelize = await getMySQLClient();
      await sequelize.query(
        `INSERT INTO chat_sessions (id, user_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?)`,
        {
          replacements: [sessionId, userId, now, now],
        },
      );

      return {
        id: sessionId,
        userId,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      logger.error("Error creating chat session:", error);
      throw new Error("Failed to create chat session");
    }
  },

  getSession: async (sessionId: string): Promise<ChatSession | null> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM chat_sessions WHERE id = ?`,
        {
          replacements: [sessionId],
        },
      );

      if (!results || (results as any[]).length === 0) return null;

      const session = (results as any[])[0];
      return {
        id: session.id,
        userId: session.user_id,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      };
    } catch (error) {
      logger.error(`Error fetching chat session ${sessionId}:`, error);
      return null;
    }
  },

  getSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC`,
        {
          replacements: [sessionId],
        },
      );

      return (results as any[]).map((msg) => ({
        id: msg.id,
        sessionId: msg.session_id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
      }));
    } catch (error) {
      logger.error(`Error fetching messages for session ${sessionId}:`, error);
      return [];
    }
  },

  sendMessage: async (
    sessionId: string,
    content: string,
    userId: string = "anonymous",
  ): Promise<ChatMessage> => {
    try {
      // Get the session
      const session = await chatService.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const sequelize = await getMySQLClient();

      // Add user message
      const userMessageId = uuidv4();
      const now = new Date();

      await sequelize.query(
        `INSERT INTO chat_messages (id, session_id, content, role, timestamp) 
         VALUES (?, ?, ?, ?, ?)`,
        {
          replacements: [userMessageId, sessionId, content, "user", now],
        },
      );

      // Update session
      await sequelize.query(
        `UPDATE chat_sessions SET updated_at = ? WHERE id = ?`,
        {
          replacements: [now, sessionId],
        },
      );

      // Generate AI response
      const aiResponse = await aiService.generateResponse({
        query: content,
        userId,
        // You can add more parameters here like contextRuleId, etc.
      });

      // Add AI message
      const aiMessageId = uuidv4();
      const aiTimestamp = new Date();

      await sequelize.query(
        `INSERT INTO chat_messages (id, session_id, content, role, timestamp) 
         VALUES (?, ?, ?, ?, ?)`,
        {
          replacements: [
            aiMessageId,
            sessionId,
            aiResponse.content,
            "assistant",
            aiTimestamp,
          ],
        },
      );

      return {
        id: aiMessageId,
        sessionId,
        content: aiResponse.content,
        role: "assistant",
        timestamp: aiTimestamp,
      };
    } catch (error) {
      logger.error(`Error sending message in session ${sessionId}:`, error);

      // Create a fallback response
      const fallbackId = uuidv4();
      const fallbackTimestamp = new Date();
      const fallbackContent =
        "I'm sorry, I encountered an error processing your message. Please try again later.";

      try {
        const sequelize = await getMySQLClient();
        await sequelize.query(
          `INSERT INTO chat_messages (id, session_id, content, role, timestamp) 
           VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              fallbackId,
              sessionId,
              fallbackContent,
              "assistant",
              fallbackTimestamp,
            ],
          },
        );
      } catch (insertError) {
        logger.error(`Error inserting fallback message:`, insertError);
      }

      return {
        id: fallbackId,
        sessionId,
        content: fallbackContent,
        role: "assistant",
        timestamp: fallbackTimestamp,
      };
    }
  },

  deleteSession: async (sessionId: string): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();

      // Delete all messages in the session first
      await sequelize.query(`DELETE FROM chat_messages WHERE session_id = ?`, {
        replacements: [sessionId],
      });

      // Then delete the session
      await sequelize.query(`DELETE FROM chat_sessions WHERE id = ?`, {
        replacements: [sessionId],
      });

      return true;
    } catch (error) {
      logger.error(`Error deleting chat session ${sessionId}:`, error);
      return false;
    }
  },

  getUserSessions: async (userId: string): Promise<ChatSession[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY updated_at DESC`,
        {
          replacements: [userId],
        },
      );

      return (results as any[]).map((session) => ({
        id: session.id,
        userId: session.user_id,
        createdAt: new Date(session.created_at),
        updatedAt: new Date(session.updated_at),
      }));
    } catch (error) {
      logger.error(`Error fetching sessions for user ${userId}:`, error);
      return [];
    }
  },
};
