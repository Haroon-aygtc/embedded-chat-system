/**
 * Chat Routes
 *
 * Handles API endpoints for chat history and management
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getMySQLClient } from '../../services/mysqlClient.js';
import logger from '../../utils/logger.js';
import { processMessage } from '../../services/aiService.js';

const router = express.Router();

/**
 * @route GET /api/chat/sessions
 * @desc Get all chat sessions for the authenticated user
 */
router.get('/sessions', async (req, res) => {
  try {
    // Must be authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'ERR_UNAUTHORIZED',
          message: 'Authentication required',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT cs.*, 
              (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count,
              (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at ASC LIMIT 1) as first_message,
              wc.name as widget_name
       FROM chat_sessions cs
       LEFT JOIN widget_configs wc ON cs.widget_id = wc.id
       WHERE cs.user_id = ?
       ORDER BY cs.last_activity DESC`,
      {
        replacements: [req.user.id],
      }
    );

    return res.status(200).json({
      success: true,
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching chat sessions:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ERR_INTERNAL_SERVER',
        message: 'Failed to fetch chat sessions',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/chat/sessions/:id
 * @desc Get a specific chat session by ID
 */
router.get('/sessions/:id', async (req, res) => {
  try {
    const sessionId = req.params.id;
    const sequelize = await getMySQLClient();

    // Check if session exists and user has access
    let query = `SELECT * FROM chat_sessions WHERE id = ?`;
    let replacements = [sessionId];

    // If authenticated, check user access
    if (req.user) {
      query += ` AND (user_id = ? OR user_id IS NULL)`;
      replacements.push(req.user.id);
    }

    const [sessions] = await sequelize.query(query, {
      replacements,
    });

    if (!sessions || sessions.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ERR_NOT_FOUND',
          message: 'Chat session not found or you don\'t have access',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get messages for this session
    const [messages] = await sequelize.query(
      `SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC`,
      {
        replacements: [sessionId],
      }
    );

    // Process attachments
    const processedMessages = messages.map(message => {
      if (message.attachments && typeof message.attachments === 'string') {
        try {
          message.attachments = JSON.parse(message.attachments);
        } catch (e) {
          message.attachments = [];
        }
      } else {
        message.attachments = [];
      }
      return message;
    });

    // Get widget info if applicable
    let widget = null;
    if (sessions[0].widget_id) {
      const [widgets] = await sequelize.query(
        `SELECT id, name, primary_color, position, theme FROM widget_configs WHERE id = ?`,
        {
          replacements: [sessions[0].widget_id],
        }
      );
      if (widgets && widgets.length > 0) {
        widget = widgets[0];
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        session: sessions[0],
        messages: processedMessages,
        widget,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error fetching chat session ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'ERR_INTERNAL_SERVER',
        message: 'Failed to fetch chat session',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/chat/sessions
 * @desc Create a new chat session
 */
router.post('/sessions', async (req, res) => {
  try {
    const { widgetId } = req.body;
    const sessionId = uuidv4();
    const userId = req.user ? req.user.id : null;

    const sequelize = await getMySQLClient();

    // Create session
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
      }
    );

    // If widget ID provided, get welcome message
    let welcomeMessage = null;
    if (widgetId) {
      const [widgets] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [widgetId],
        }
      );

      if (widgets && widgets.length > 0 && widgets[0].welcome_message) {
        // Create welcome message
        const welcomeMessageId = uuidv4();
        await sequelize.query(
          `INSERT INTO chat_messages (
            id, session_id, content, role, created_at
          ) VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              welcomeMessageId,
              sessionId,
              widgets[0].welcome_message,
              'assistant',
              new Date(),
            ],
          }
        );

        welcomeMessage = {
          id: welcomeMessageId,
          content: widgets[0].welcome_message,
          role: 'assistant',
          created_at: new Date(),
        };
      }
    }

    return res.status(201).json({
      success: true,
      data: {
        sessionId,
        welcomeMessage,
      },
      meta