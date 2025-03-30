/**
 * AI Routes
 * 
 * This file defines the API routes for AI-related functionality.
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/ai/generate
 * @desc    Generate a response using AI models
 * @access  Private
 */
router.post("/generate", async (req, res) => {
  try {
    const { query, contextRuleId, knowledgeBaseIds, promptTemplate, preferredModel } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_MISSING_QUERY",
          message: "Query is required"
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Get database connection
    const sequelize = req.app.get("sequelize");
    
    // Get context rule if provided
    let contextRule = null;
    if (contextRuleId) {
      [contextRule] = await sequelize.query(
        "SELECT * FROM context_rules WHERE id = ?",
        {
          replacements: [contextRuleId],
          type: sequelize.QueryTypes.SELECT
        }
      );
    }
    
    // Mock AI response generation
    // In production, this would call an actual AI model API
    const modelUsed = preferredModel || contextRule?.preferred_model || "gpt-3.5-turbo";
    const processingTime = Math.random() * 1.5 + 0.5; // Random time between 0.5 and 2 seconds
    
    // Generate mock response
    const response = {
      content: `This is a response to your query: "${query}". ${contextRule ? `Using context: ${contextRule.name}` : ""}",
      modelUsed,
      metadata: {
        processingTime,
        tokenCount: {
          input: query.split(' ').length,
          output: Math.floor(Math.random() * 100) + 50
        }
      }
    };
    
    // Log the interaction
    const interactionId = uuidv4();
    await sequelize.query(
      `INSERT INTO ai_interaction_logs (
        id, user_id, query, response, model_used, context_rule_id,
        knowledge_base_results, knowledge_base_ids, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      {
        replacements: [
          interactionId,
          req.user.id,
          query,
          response.content,
          response.modelUsed,
          contextRuleId || null,
          0, // knowledge_base_results
          knowledgeBaseIds ? knowledgeBaseIds.join(',') : null,
          JSON.stringify(response.metadata),
          new Date()
        ],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    return res.status(200).json({
      success: true,
      data: response,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_AI_GENERATION",
        message: "Failed to generate AI response",
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  }
});

/**
 * @route   GET /api/ai/logs
 * @desc    Get AI interaction logs
 * @access  Private (Admin only)
 */
router.get("/logs", requireRole("admin"), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, query, modelUsed, contextRuleId, startDate, endDate } = req.query;
    
    // Get database connection
    const sequelize = req.app.get("sequelize");
    
    // Build query conditions
    const conditions = [];
    const replacements = [];
    
    if (query) {
      conditions.push("(l.query LIKE ? OR l.response LIKE ?)");
      replacements.push(`%${query}%`, `%${query}%`);
    }
    
    if (modelUsed) {
      conditions.push("l.model_used = ?");
      replacements.push(modelUsed);
    }
    
    if (contextRuleId) {
      if (contextRuleId === "null") {
        conditions.push("l.context_rule_id IS NULL");
      } else {
        conditions.push("l.context_rule_id = ?");
        replacements.push(contextRuleId);
      }
    }
    
    if (startDate) {
      conditions.push("l.created_at >= ?");
      replacements.push(startDate);
    }
    
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      conditions.push("l.created_at < ?");
      replacements.push(endDateObj.toISOString());
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM ai_interaction_logs l
      ${whereClause}
    `;
    
    const countResult = await sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    // Get logs with pagination
    const logsQuery = `
      SELECT l.*, c.name as context_rule_name 
      FROM ai_interaction_logs l
      LEFT JOIN context_rules c ON l.context_rule_id = c.id
      ${whereClause} 
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const logs = await sequelize.query(logsQuery, {
      replacements: [...replacements, parseInt(pageSize), offset],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Format logs to include context_rule object
    const formattedLogs = logs.map(log => ({
      ...log,
      context_rule: log.context_rule_name ? { name: log.context_rule_name } : null,
      knowledge_base_results: log.knowledge_base_results || 0,
      knowledge_base_ids: log.knowledge_base_ids ? log.knowledge_base_ids.split(",") : []
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        logs: formattedLogs,
        totalPages,
        currentPage: parseInt(page),
        totalItems: total
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  } catch (error) {
    console.error("Error fetching AI logs:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_FETCH_AI_LOGS",
        message: "Failed to fetch AI interaction logs",
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  }
});

/**
 * @route   POST /api/ai/logs
 * @desc    Create an AI interaction log
 * @access  Private
 */
router.post("/logs", async (req, res) => {
  try {
    const { userId, query, response, modelUsed, contextRuleId, knowledgeBaseResults, knowledgeBaseIds, metadata } = req.body;
    
    if (!query || !response || !modelUsed || !userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_MISSING_FIELDS",
          message: "Missing required fields"
        },
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Get database connection
    const sequelize = req.app.get("sequelize");
    
    // Create log entry
    const logId = uuidv4();
    await sequelize.query(
      `INSERT INTO ai_interaction_logs (
        id, user_id, query, response, model_used, context_rule_id,
        knowledge_base_results, knowledge_base_ids, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      {
        replacements: [
          logId,
          userId,
          query,
          response,
          modelUsed,
          contextRuleId || null,
          knowledgeBaseResults || 0,
          knowledgeBaseIds ? knowledgeBaseIds.join(',') : null,
          metadata ? JSON.stringify(metadata) : null,
          new Date()
        ],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    return res.status(201).json({
      success: true,
      data: { id: logId },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  } catch (error) {
    console.error("Error creating AI log:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_CREATE_AI_LOG",
        message: "Failed to create AI interaction log",
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  }
});

/**
 * @route   GET /api/ai/performance
 * @desc    Get AI model performance metrics
 * @access  Private (Admin only)
 */
router.get("/performance", requireRole("admin"), async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query;
    
    // Get database connection
    const sequelize = req.app.get("sequelize");
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    if (timeRange === "24h") {
      startDate.setDate(startDate.getDate() - 1);
    } else if (timeRange === "7d") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === "30d") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeRange === "90d") {
      startDate.setDate(startDate.getDate() - 90);
    }
    
    // Get model usage counts
    const modelUsageQuery = `
      SELECT model_used, COUNT(*) as count
      FROM ai_interaction_logs
      WHERE created_at BETWEEN ? AND ?
      GROUP BY model_used
      ORDER BY count DESC
    `;
    
    const modelUsage = await sequelize.query(modelUsageQuery, {
      replacements: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get average response time (using metadata.processingTime if available)
    const avgResponseTimeQuery = `
      SELECT model_used, AVG(JSON_EXTRACT(metadata, '$.processingTime')) as avg_time
      FROM ai_interaction_logs
      WHERE created_at BETWEEN ? AND ? AND metadata IS NOT NULL
      GROUP BY model_used
    `;
    
    const avgResponseTimes = await sequelize.query(avgResponseTimeQuery, {
      replacements: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get daily usage counts
    const dailyUsageQuery = `
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ai_interaction_logs
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `;
    
    const dailyUsage = await sequelize.query(dailyUsageQuery, {
      replacements: [startDate, endDate],
      type: sequelize.QueryTypes.SELECT
    });
    
    return res.status(200).json({
      success: true,
      data: {
        modelUsage,
        avgResponseTimes,
        dailyUsage,
        timeRange
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  } catch (error) {
    console.error("Error fetching AI performance metrics:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_FETCH_AI_PERFORMANCE",
        message: "Failed to fetch AI performance metrics",
        details: error.message
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || uuidv4()
      }
    });
  }
});

export default router;
