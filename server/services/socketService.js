/**
 * Socket.IO Service
 *
 * Handles real-time WebSocket connections and messaging
 */

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "./mysqlClient.js";
import logger from "../utils/logger.js";
import { processMessage } from "./aiService.js";

// Store active connections
const activeConnections = new Map();

// Store active chat sessions
const activeSessions = new Map();

/**
 * Initialize Socket.IO server
 * @param {SocketIO.Server} io - Socket.IO server instance
 */
const initializeSocketIO = (io) => {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      // Allow anonymous connections with session ID
      if (!token && socket.handshake.query.sessionId) {
        socket.sessionId = socket.handshake.query.sessionId;
        socket.isAuthenticated = false;
        return next();
      }

      // Verify token if provided
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);

          // Get user from database
          const sequelize = await getMySQLClient();
          const [users] = await sequelize.query(
            `SELECT id, email, full_name, role, is_active FROM users WHERE id = ?`,
            {
              replacements: [decoded.userId],
            },
          );

          if (users && users.length > 0 && users[0].is_active) {
            socket.user = users[0];
            socket.isAuthenticated = true;
          }
        } catch (error) {
          // Invalid token, continue as anonymous
          socket.isAuthenticated = false;
        }
      } else {
        socket.isAuthenticated = false;
      }

      // Generate session ID if not provided
      if (!socket.sessionId) {
        socket.sessionId = uuidv4();
      }

      next();
    } catch (error) {
      logger.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    // Add to active connections
    activeConnections.set(socket.id, {
      id: socket.id,
      sessionId: socket.sessionId,
      userId: socket.user ? socket.user.id : null,
      isAuthenticated: socket.isAuthenticated,
      connectedAt: new Date(),
    });

    logger.info("Socket connected", {
      socketId: socket.id,
      sessionId: socket.sessionId,
      userId: socket.user ? socket.user.id : "anonymous",
      isAuthenticated: socket.isAuthenticated,
    });

    // Handle chat session initialization
    socket.on("init_chat", async (data, callback) => {
      try {
        const { widgetId } = data;
        const sessionId = socket.sessionId;
        const userId = socket.user ? socket.user.id : null;

        // Create or retrieve chat session
        let session;

        if (activeSessions.has(sessionId)) {
          session = activeSessions.get(sessionId);
        } else {
          session = {
            id: sessionId,
            userId,
            widgetId,
            messages: [],
            createdAt: new Date(),
            lastActivity: new Date(),
          };
          activeSessions.set(sessionId, session);

          // Save session to database
          const sequelize = await getMySQLClient();
          await sequelize.query(
            `INSERT INTO chat_sessions (
              id, user_id, widget_id, created_at, last_activity
            ) VALUES (?, ?, ?, ?, ?)`,
            {
              replacements: [
                sessionId,
                userId,
                widgetId,
                new Date(),
                new Date(),
              ],
            },
          );

          // Load widget configuration
          if (widgetId) {
            const [widgets] = await sequelize.query(
              `SELECT * FROM widget_configs WHERE id = ?`,
              {
                replacements: [widgetId],
              },
            );

            if (widgets && widgets.length > 0) {
              const widget = widgets[0];

              // Send welcome message if configured
              if (widget.welcome_message) {
                const welcomeMessageId = uuidv4();
                const welcomeMessage = {
                  id: welcomeMessageId,
                  sessionId,
                  content: widget.welcome_message,
                  role: "assistant",
                  timestamp: new Date(),
                };

                session.messages.push(welcomeMessage);

                // Save welcome message to database
                await sequelize.query(
                  `INSERT INTO chat_messages (
                    id, session_id, content, role, created_at
                  ) VALUES (?, ?, ?, ?, ?)`,
                  {
                    replacements: [
                      welcomeMessageId,
                      sessionId,
                      widget.welcome_message,
                      "assistant",
                      new Date(),
                    ],
                  },
                );

                // Send welcome message to client
                socket.emit("message", welcomeMessage);
              }
            }
          }
        }

        // Join session room
        socket.join(sessionId);

        // Return session info to client
        if (callback) {
          callback({
            success: true,
            sessionId,
            isAuthenticated: socket.isAuthenticated,
          });
        }
      } catch (error) {
        logger.error("Error initializing chat:", error);
        if (callback) {
          callback({
            success: false,
            error: "Failed to initialize chat session",
          });
        }
      }
    });

    // Handle incoming messages
    socket.on("message", async (data) => {
      try {
        const { content, attachments } = data;
        const sessionId = socket.sessionId;

        if (!sessionId || !content) {
          return socket.emit("error", {
            message: "Invalid message data",
          });
        }

        // Get session
        const session = activeSessions.get(sessionId);
        if (!session) {
          return socket.emit("error", {
            message: "Session not found",
          });
        }

        // Update session activity
        session.lastActivity = new Date();

        // Create message object
        const messageId = uuidv4();
        const message = {
          id: messageId,
          sessionId,
          content,
          attachments: attachments || [],
          role: "user",
          timestamp: new Date(),
        };

        // Add to session messages
        session.messages.push(message);

        // Save message to database
        const sequelize = await getMySQLClient();
        await sequelize.query(
          `INSERT INTO chat_messages (
            id, session_id, content, attachments, role, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              messageId,
              sessionId,
              content,
              attachments ? JSON.stringify(attachments) : null,
              "user",
              new Date(),
            ],
          },
        );

        // Update session last activity
        await sequelize.query(
          `UPDATE chat_sessions SET last_activity = ? WHERE id = ?`,
          {
            replacements: [new Date(), sessionId],
          },
        );

        // Broadcast message to session room
        io.to(sessionId).emit("message", message);

        // Send typing indicator
        io.to(sessionId).emit("typing", { isTyping: true });

        // Process message with AI
        try {
          // Get widget configuration for context rules
          let contextRuleId = null;
          if (session.widgetId) {
            const [widgets] = await sequelize.query(
              `SELECT context_rule_id FROM widget_configs WHERE id = ?`,
              {
                replacements: [session.widgetId],
              },
            );

            if (widgets && widgets.length > 0 && widgets[0].context_rule_id) {
              contextRuleId = widgets[0].context_rule_id;
            }
          }

          // Get conversation history
          const history = session.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }));

          // Process with AI service
          const aiResponse = await processMessage(
            content,
            history,
            contextRuleId,
          );

          // Create AI response message
          const aiMessageId = uuidv4();
          const aiMessage = {
            id: aiMessageId,
            sessionId,
            content: aiResponse.content,
            role: "assistant",
            timestamp: new Date(),
          };

          // Add to session messages
          session.messages.push(aiMessage);

          // Save AI message to database
          await sequelize.query(
            `INSERT INTO chat_messages (
              id, session_id, content, role, created_at
            ) VALUES (?, ?, ?, ?, ?)`,
            {
              replacements: [
                aiMessageId,
                sessionId,
                aiResponse.content,
                "assistant",
                new Date(),
              ],
            },
          );

          // Stop typing indicator
          io.to(sessionId).emit("typing", { isTyping: false });

          // Send AI response to session room
          io.to(sessionId).emit("message", aiMessage);
        } catch (aiError) {
          logger.error("Error processing message with AI:", aiError);

          // Stop typing indicator
          io.to(sessionId).emit("typing", { isTyping: false });

          // Send error message
          io.to(sessionId).emit("error", {
            message: "Failed to process your message",
          });
        }
      } catch (error) {
        logger.error("Error handling message:", error);
        socket.emit("error", {
          message: "Failed to process your message",
        });
      }
    });

    // Handle typing indicators
    socket.on("typing", (data) => {
      const { isTyping } = data;
      const sessionId = socket.sessionId;

      if (sessionId) {
        // Broadcast to everyone in the room except sender
        socket.to(sessionId).emit("typing", {
          isTyping,
          userId: socket.user ? socket.user.id : null,
        });
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      // Remove from active connections
      activeConnections.delete(socket.id);

      logger.info("Socket disconnected", {
        socketId: socket.id,
        sessionId: socket.sessionId,
        userId: socket.user ? socket.user.id : "anonymous",
      });
    });
  });

  // Periodic cleanup of inactive sessions (every 30 minutes)
  setInterval(
    async () => {
      try {
        const now = new Date();
        const inactiveThreshold = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

        // Clean up memory sessions
        for (const [sessionId, session] of activeSessions.entries()) {
          if (session.lastActivity < inactiveThreshold) {
            activeSessions.delete(sessionId);
          }
        }

        // No need to clean up database sessions as they're valuable for analytics
      } catch (error) {
        logger.error("Error cleaning up inactive sessions:", error);
      }
    },
    30 * 60 * 1000,
  ); // 30 minutes

  return io;
};

export default initializeSocketIO;
