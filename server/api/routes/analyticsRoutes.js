/**
 * Analytics Routes
 *
 * Handles API endpoints for analytics and reporting
 */

import express from "express";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";
import { requireAdmin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Require admin for all routes
router.use(requireAdmin);

/**
 * @route GET /api/analytics/overview
 * @desc Get overview analytics
 */
router.get("/overview", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days) || 30));

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get total sessions
    const [sessionResults] = await sequelize.query(
      `SELECT COUNT(*) as total_sessions FROM chat_sessions 
       WHERE created_at BETWEEN ? AND ?`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get total messages
    const [messageResults] = await sequelize.query(
      `SELECT COUNT(*) as total_messages FROM chat_messages 
       WHERE created_at BETWEEN ? AND ?`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get total users
    const [userResults] = await sequelize.query(
      `SELECT COUNT(*) as total_users FROM users 
       WHERE created_at BETWEEN ? AND ?`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get active users (users with sessions in the period)
    const [activeUserResults] = await sequelize.query(
      `SELECT COUNT(DISTINCT user_id) as active_users FROM chat_sessions 
       WHERE created_at BETWEEN ? AND ? AND user_id IS NOT NULL`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get daily session counts
    const [dailySessions] = await sequelize.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM chat_sessions 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY DATE(created_at) 
       ORDER BY date`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get daily message counts
    const [dailyMessages] = await sequelize.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM chat_messages 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY DATE(created_at) 
       ORDER BY date`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get widget usage
    const [widgetUsage] = await sequelize.query(
      `SELECT w.id, w.name, COUNT(cs.id) as session_count 
       FROM widget_configs w 
       LEFT JOIN chat_sessions cs ON w.id = cs.widget_id AND cs.created_at BETWEEN ? AND ? 
       GROUP BY w.id, w.name 
       ORDER BY session_count DESC`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSessions: sessionResults[0].total_sessions,
          totalMessages: messageResults[0].total_messages,
          totalUsers: userResults[0].total_users,
          activeUsers: activeUserResults[0].active_users,
        },
        dailySessions,
        dailyMessages,
        widgetUsage,
      },
      meta: {
        timestamp: new Date().toISOString(),
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching analytics overview:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch analytics overview",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/analytics/messages
 * @desc Get message analytics
 */
router.get("/messages", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days) || 30));

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get message counts by role
    const [messagesByRole] = await sequelize.query(
      `SELECT role, COUNT(*) as count 
       FROM chat_messages 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY role`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get average message length by role
    const [avgMessageLength] = await sequelize.query(
      `SELECT role, AVG(LENGTH(content)) as avg_length 
       FROM chat_messages 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY role`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get average response time (time between user message and assistant response)
    const [avgResponseTime] = await sequelize.query(
      `SELECT AVG(TIMESTAMPDIFF(SECOND, user_msg.created_at, assistant_msg.created_at)) as avg_seconds
       FROM chat_messages user_msg
       JOIN chat_messages assistant_msg ON user_msg.session_id = assistant_msg.session_id
       WHERE user_msg.role = 'user' AND assistant_msg.role = 'assistant'
       AND user_msg.created_at BETWEEN ? AND ?
       AND assistant_msg.created_at > user_msg.created_at
       AND NOT EXISTS (
         SELECT 1 FROM chat_messages intermediate
         WHERE intermediate.session_id = user_msg.session_id
         AND intermediate.created_at > user_msg.created_at
         AND intermediate.created_at < assistant_msg.created_at
       )`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get most active sessions
    const [activeSessions] = await sequelize.query(
      `SELECT cs.id, COUNT(cm.id) as message_count, 
              cs.created_at, cs.last_activity,
              TIMESTAMPDIFF(MINUTE, cs.created_at, cs.last_activity) as duration_minutes,
              u.full_name as user_name, w.name as widget_name
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cs.id = cm.session_id
       LEFT JOIN users u ON cs.user_id = u.id
       LEFT JOIN widget_configs w ON cs.widget_id = w.id
       WHERE cs.created_at BETWEEN ? AND ?
       GROUP BY cs.id, cs.created_at, cs.last_activity, u.full_name, w.name
       ORDER BY message_count DESC
       LIMIT 10`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    return res.status(200).json({
      success: true,
      data: {
        messagesByRole,
        avgMessageLength,
        avgResponseTime: avgResponseTime[0].avg_seconds || 0,
        activeSessions,
      },
      meta: {
        timestamp: new Date().toISOString(),
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching message analytics:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch message analytics",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/analytics/users
 * @desc Get user analytics
 */
router.get("/users", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days) || 30));

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get new users per day
    const [newUsers] = await sequelize.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count 
       FROM users 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY DATE(created_at) 
       ORDER BY date`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get most active users
    const [activeUsers] = await sequelize.query(
      `SELECT u.id, u.full_name, u.email, COUNT(cs.id) as session_count, 
              COUNT(cm.id) as message_count
       FROM users u
       LEFT JOIN chat_sessions cs ON u.id = cs.user_id AND cs.created_at BETWEEN ? AND ?
       LEFT JOIN chat_messages cm ON cs.id = cm.session_id
       GROUP BY u.id, u.full_name, u.email
       ORDER BY session_count DESC
       LIMIT 10`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get user retention (users who have had sessions on multiple days)
    const [userRetention] = await sequelize.query(
      `SELECT COUNT(DISTINCT user_id) as retained_users,
              (SELECT COUNT(DISTINCT user_id) FROM chat_sessions 
               WHERE created_at BETWEEN ? AND ? AND user_id IS NOT NULL) as total_users
       FROM (
         SELECT user_id, COUNT(DISTINCT DATE(created_at)) as days_active
         FROM chat_sessions
         WHERE created_at BETWEEN ? AND ? AND user_id IS NOT NULL
         GROUP BY user_id
         HAVING days_active > 1
       ) as retention_data`,
      {
        replacements: [startDateStr, endDateStr, startDateStr, endDateStr],
      },
    );

    return res.status(200).json({
      success: true,
      data: {
        newUsers,
        activeUsers,
        userRetention: {
          retainedUsers: userRetention[0].retained_users || 0,
          totalUsers: userRetention[0].total_users || 0,
          retentionRate:
            userRetention[0].total_users > 0
              ? (userRetention[0].retained_users /
                  userRetention[0].total_users) *
                100
              : 0,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching user analytics:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch user analytics",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/analytics/ai
 * @desc Get AI performance analytics
 */
router.get("/ai", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days) || 30));

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Get AI model usage
    const [modelUsage] = await sequelize.query(
      `SELECT model, COUNT(*) as count 
       FROM ai_interactions 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY model 
       ORDER BY count DESC`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get context rule usage
    const [contextRuleUsage] = await sequelize.query(
      `SELECT cr.id, cr.name, COUNT(ai.id) as usage_count 
       FROM context_rules cr 
       LEFT JOIN ai_interactions ai ON cr.id = ai.context_rule_id AND ai.created_at BETWEEN ? AND ? 
       GROUP BY cr.id, cr.name 
       ORDER BY usage_count DESC`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    // Get average response length by model
    const [avgResponseLength] = await sequelize.query(
      `SELECT model, AVG(LENGTH(ai_response)) as avg_length 
       FROM ai_interactions 
       WHERE created_at BETWEEN ? AND ? 
       GROUP BY model`,
      {
        replacements: [startDateStr, endDateStr],
      },
    );

    return res.status(200).json({
      success: true,
      data: {
        modelUsage,
        contextRuleUsage,
        avgResponseLength,
      },
      meta: {
        timestamp: new Date().toISOString(),
        dateRange: {
          start: startDateStr,
          end: endDateStr,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching AI analytics:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch AI analytics",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/analytics/export
 * @desc Export analytics data
 */
router.get("/export", async (req, res) => {
  try {
    const { type, format } = req.query;
    const sequelize = await getMySQLClient();

    // Get date range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (parseInt(req.query.days) || 30));

    // Format dates for SQL
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    let data = [];

    // Get data based on type
    switch (type) {
      case "sessions":
        const [sessions] = await sequelize.query(
          `SELECT cs.id, cs.created_at, cs.last_activity, 
                  TIMESTAMPDIFF(MINUTE, cs.created_at, cs.last_activity) as duration_minutes,
                  u.full_name as user_name, u.email as user_email,
                  w.name as widget_name,
                  (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count
           FROM chat_sessions cs
           LEFT JOIN users u ON cs.user_id = u.id
           LEFT JOIN widget_configs w ON cs.widget_id = w.id
           WHERE cs.created_at BETWEEN ? AND ?
           ORDER BY cs.created_at DESC`,
          {
            replacements: [startDateStr, endDateStr],
          },
        );
        data = sessions;
        break;

      case "messages":
        const [messages] = await sequelize.query(
          `SELECT cm.id, cm.session_id, cm.content, cm.role, cm.created_at,
                  u.full_name as user_name, u.email as user_email,
                  w.name as widget_name
           FROM chat_messages cm
           JOIN chat_sessions cs ON cm.session_id = cs.id
           LEFT JOIN users u ON cs.user_id = u.id
           LEFT JOIN widget_configs w ON cs.widget_id = w.id
           WHERE cm.created_at BETWEEN ? AND ?
           ORDER BY cm.created_at DESC`,
          {
            replacements: [startDateStr, endDateStr],
          },
        );
        data = messages;
        break;

      case "users":
        const [users] = await sequelize.query(
          `SELECT u.id, u.email, u.full_name, u.role, u.created_at, u.last_login_at,
                  COUNT(DISTINCT cs.id) as session_count,
                  COUNT(cm.id) as message_count
           FROM users u
           LEFT JOIN chat_sessions cs ON u.id = cs.user_id AND cs.created_at BETWEEN ? AND ?
           LEFT JOIN chat_messages cm ON cs.id = cm.session_id
           WHERE u.created_at <= ?
           GROUP BY u.id, u.email, u.full_name, u.role, u.created_at, u.last_login_at
           ORDER BY u.created_at DESC`,
          {
            replacements: [startDateStr, endDateStr, endDateStr],
          },
        );
        data = users;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: "ERR_VALIDATION",
            message: "Invalid export type",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
    }

    // Return data in requested format
    if (format === "csv") {
      // Convert to CSV
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "ERR_NO_DATA",
            message: "No data available for export",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      const headers = Object.keys(data[0]).join(",");
      const rows = data
        .map((row) => {
          return Object.values(row)
            .map((value) => {
              // Handle values with commas or quotes
              if (value === null || value === undefined) {
                return "";
              }
              const stringValue = String(value);
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(",");
        })
        .join("\n");

      const csv = `${headers}\n${rows}`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${type}_${startDateStr}_to_${endDateStr}.csv`,
      );
      return res.send(csv);
    } else {
      // Return as JSON
      return res.status(200).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          dateRange: {
            start: startDateStr,
            end: endDateStr,
          },
          type,
          count: data.length,
        },
      });
    }
  } catch (error) {
    logger.error("Error exporting analytics data:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to export analytics data",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
