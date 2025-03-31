/**
 * AI Routes
 *
 * This file defines the API routes for AI-related functionality.
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { requireAdmin } from "../../middleware/authMiddleware.js";
import dbHelpers from "../../utils/dbHelpers.js";
import {
  formatSuccess,
  formatError,
  sendResponse,
  errors,
} from "../../utils/responseFormatter.js";
import logger from "../../utils/logger.js";

const router = express.Router();

/**
 * @route   POST /api/ai/generate
 * @desc    Generate a response using AI models
 * @access  Private
 */
router.post("/generate", async (req, res) => {
  try {
    const {
      query,
      contextRuleId,
      knowledgeBaseIds,
      promptTemplate,
      preferredModel,
    } = req.body;

    if (!query) {
      return sendResponse(res, errors.validation("Query is required"));
    }

    // Get context rule if provided
    let contextRule = null;
    if (contextRuleId) {
      const contextRules = await dbHelpers.findByCondition("context_rules", {
        id: contextRuleId,
      });
      if (contextRules && contextRules.length > 0) {
        contextRule = contextRules[0];
      }
    }

    // Mock AI response generation
    // In production, this would call an actual AI model API
    const modelUsed =
      preferredModel || contextRule?.preferred_model || "gpt-3.5-turbo";
    const processingTime = Math.random() * 1.5 + 0.5; // Random time between 0.5 and 2 seconds

    // Generate mock response
    const response = {
      content: `This is a response to your query: "${query}". ${contextRule ? `Using context: ${contextRule.name}` : ""}`,
      modelUsed,
      metadata: {
        processingTime,
        tokenCount: {
          input: query.split(" ").length,
          output: Math.floor(Math.random() * 100) + 50,
        },
      },
    };

    // Log the interaction
    const interactionId = uuidv4();
    await dbHelpers.insert("ai_interaction_logs", {
      id: interactionId,
      user_id: req.user.id,
      query,
      response: response.content,
      model_used: response.modelUsed,
      context_rule_id: contextRuleId || null,
      knowledge_base_results: 0,
      knowledge_base_ids: knowledgeBaseIds ? knowledgeBaseIds.join(",") : null,
      metadata: JSON.stringify(response.metadata),
      created_at: new Date(),
    });

    return sendResponse(res, formatSuccess(response));
  } catch (error) {
    logger.error("Error generating AI response:", error);
    return sendResponse(res, errors.internal("Failed to generate AI response"));
  }
});

/**
 * @route   GET /api/ai/logs
 * @desc    Get AI interaction logs
 * @access  Private (Admin only)
 */
router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      query,
      modelUsed,
      contextRuleId,
      startDate,
      endDate,
    } = req.query;

    // Build query conditions
    let whereClause = "";
    let replacements = [];

    if (query) {
      whereClause += "(l.query LIKE ? OR l.response LIKE ?) ";
      const queryPattern = `%${query}%`;
      replacements.push(queryPattern, queryPattern);
    }

    if (modelUsed) {
      whereClause += whereClause
        ? "AND l.model_used = ? "
        : "l.model_used = ? ";
      replacements.push(modelUsed);
    }

    if (contextRuleId) {
      if (contextRuleId === "null") {
        whereClause += whereClause
          ? "AND l.context_rule_id IS NULL "
          : "l.context_rule_id IS NULL ";
      } else {
        whereClause += whereClause
          ? "AND l.context_rule_id = ? "
          : "l.context_rule_id = ? ";
        replacements.push(contextRuleId);
      }
    }

    if (startDate) {
      whereClause += whereClause
        ? "AND l.created_at >= ? "
        : "l.created_at >= ? ";
      replacements.push(new Date(startDate));
    }

    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      whereClause += whereClause
        ? "AND l.created_at < ? "
        : "l.created_at < ? ";
      replacements.push(endDateObj);
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as count 
      FROM ai_interaction_logs l
      ${whereClause ? `WHERE ${whereClause}` : ""}
    `;

    const countResult = await dbHelpers.executeQuery(countQuery, replacements);
    const totalCount = countResult[0].count;
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    // Get logs with pagination
    const logsQuery = `
      SELECT l.*, c.name as context_rule_name 
      FROM ai_interaction_logs l
      LEFT JOIN context_rules c ON l.context_rule_id = c.id
      ${whereClause ? `WHERE ${whereClause}` : ""} 
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const logs = await dbHelpers.executeQuery(logsQuery, [
      ...replacements,
      parseInt(limit),
      offset,
    ]);

    // Process metadata JSON field
    const processedLogs = logs.map((log) => {
      const processedLog = { ...log };
      if (processedLog.metadata && typeof processedLog.metadata === "string") {
        try {
          processedLog.metadata = JSON.parse(processedLog.metadata);
        } catch (e) {
          processedLog.metadata = {};
        }
      }

      // Format knowledge_base_ids
      if (processedLog.knowledge_base_ids) {
        processedLog.knowledge_base_ids =
          processedLog.knowledge_base_ids.split(",");
      } else {
        processedLog.knowledge_base_ids = [];
      }

      // Add context_rule object
      if (processedLog.context_rule_name) {
        processedLog.context_rule = { name: processedLog.context_rule_name };
        delete processedLog.context_rule_name;
      } else {
        processedLog.context_rule = null;
      }

      return processedLog;
    });

    return sendResponse(
      res,
      formatSuccess({
        logs: processedLogs,
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: totalPages,
        },
      }),
    );
  } catch (error) {
    logger.error("Error fetching AI logs:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch AI interaction logs"),
    );
  }
});

/**
 * @route   POST /api/ai/logs
 * @desc    Create an AI interaction log
 * @access  Private
 */
router.post("/logs", async (req, res) => {
  try {
    const {
      query,
      response,
      modelUsed,
      contextRuleId,
      knowledgeBaseResults,
      knowledgeBaseIds,
      metadata,
    } = req.body;

    if (!query || !response || !modelUsed) {
      return sendResponse(
        res,
        errors.validation("Query, response, and modelUsed are required"),
      );
    }

    // Create log entry
    const logId = uuidv4();
    await dbHelpers.insert("ai_interaction_logs", {
      id: logId,
      user_id: req.user.id,
      query,
      response,
      model_used: modelUsed,
      context_rule_id: contextRuleId || null,
      knowledge_base_results: knowledgeBaseResults || 0,
      knowledge_base_ids: knowledgeBaseIds ? knowledgeBaseIds.join(",") : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date(),
    });

    return sendResponse(res, formatSuccess({ id: logId }, { status: 201 }));
  } catch (error) {
    logger.error("Error creating AI log:", error);
    return sendResponse(
      res,
      errors.internal("Failed to create AI interaction log"),
    );
  }
});

/**
 * @route   GET /api/ai/performance
 * @desc    Get AI model performance metrics
 * @access  Private (Admin only)
 */
router.get("/performance", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "7d" } = req.query;

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
    const modelUsage = await dbHelpers.executeQuery(
      `SELECT model_used, COUNT(*) as count
       FROM ai_interaction_logs
       WHERE created_at BETWEEN ? AND ?
       GROUP BY model_used
       ORDER BY count DESC`,
      [startDate, endDate],
    );

    // Get average response time (using metadata.processingTime if available)
    const avgResponseTimes = await dbHelpers.executeQuery(
      `SELECT model_used, AVG(JSON_EXTRACT(metadata, '$.processingTime')) as avg_time
       FROM ai_interaction_logs
       WHERE created_at BETWEEN ? AND ? AND metadata IS NOT NULL
       GROUP BY model_used`,
      [startDate, endDate],
    );

    // Get daily usage counts
    const dailyUsage = await dbHelpers.executeQuery(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM ai_interaction_logs
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [startDate, endDate],
    );

    return sendResponse(
      res,
      formatSuccess({
        modelUsage,
        avgResponseTimes,
        dailyUsage,
        timeRange,
      }),
    );
  } catch (error) {
    logger.error("Error fetching AI performance metrics:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch AI performance metrics"),
    );
  }
});

export default router;
