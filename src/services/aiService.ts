import axios from "axios";
import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { AIInteractionLog } from "@/models";

interface AIInteractionLogsParams {
  page: number;
  pageSize: number;
  query?: string;
  modelUsed?: string;
  contextRuleId?: string;
  startDate?: string;
  endDate?: string;
}

interface GenerateResponseOptions {
  query: string;
  contextRuleId?: string;
  userId: string;
  knowledgeBaseIds?: string[];
  promptTemplate?: string;
  preferredModel?: string;
}

interface AIResponse {
  content: string;
  modelUsed: string;
  metadata?: Record<string, any>;
  knowledgeBaseResults?: number;
  knowledgeBaseIds?: string[];
}

interface ModelPerformanceParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
}

const aiService = {
  /**
   * Get AI interaction logs with filtering and pagination
   */
  getAIInteractionLogs: async (params: AIInteractionLogsParams) => {
    try {
      // Try to fetch from API first
      try {
        const response = await axios.get("/api/ai/logs", { params });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API AI logs fetch failed, falling back to local implementation",
          apiError,
        );

        // Fallback to local database implementation
        const sequelize = await getMySQLClient();

        // Build query conditions
        const conditions = [];
        const replacements: any[] = [];

        if (params.query) {
          conditions.push("(l.query LIKE ? OR l.response LIKE ?)");
          replacements.push(`%${params.query}%`, `%${params.query}%`);
        }

        if (params.modelUsed) {
          conditions.push("l.model_used = ?");
          replacements.push(params.modelUsed);
        }

        if (params.contextRuleId) {
          if (params.contextRuleId === "null") {
            conditions.push("l.context_rule_id IS NULL");
          } else {
            conditions.push("l.context_rule_id = ?");
            replacements.push(params.contextRuleId);
          }
        }

        if (params.startDate) {
          conditions.push("l.created_at >= ?");
          replacements.push(params.startDate);
        }

        if (params.endDate) {
          const endDate = new Date(params.endDate);
          endDate.setDate(endDate.getDate() + 1);
          conditions.push("l.created_at < ?");
          replacements.push(endDate.toISOString());
        }

        const whereClause =
          conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Calculate pagination
        const offset = (params.page - 1) * params.pageSize;

        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) as total 
          FROM ai_interaction_logs l
          ${whereClause}
        `;

        const countResult = await sequelize.query(countQuery, {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        });

        const total = (countResult[0] as any).total;
        const totalPages = Math.ceil(total / params.pageSize);

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
          replacements: [...replacements, params.pageSize, offset],
          type: sequelize.QueryTypes.SELECT,
        });

        // Format logs to include context_rule object
        const formattedLogs = logs.map((log: any) => ({
          ...log,
          context_rule: log.context_rule_name
            ? { name: log.context_rule_name }
            : null,
          knowledge_base_results: log.knowledge_base_results || 0,
          knowledge_base_ids: log.knowledge_base_ids
            ? log.knowledge_base_ids.split(",")
            : [],
        }));

        return {
          logs: formattedLogs,
          totalPages,
          currentPage: params.page,
          totalItems: total,
        };
      }
    } catch (error) {
      logger.error("Error fetching AI interaction logs:", error);

      // Return mock data in case of error
      return {
        logs: [
          {
            id: "mock-log-1",
            user_id: "mock-user-1",
            query: "What services do you offer?",
            response:
              "We offer a range of AI-powered chat solutions for businesses.",
            model_used: "gpt-3.5-turbo",
            context_rule: { name: "General Knowledge" },
            knowledge_base_results: 0,
            knowledge_base_ids: [],
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: "mock-log-2",
            user_id: "mock-user-2",
            query: "How can I integrate this with my website?",
            response:
              "You can integrate our chat widget using either an iframe or our Web Component.",
            model_used: "gemini-pro",
            context_rule: { name: "Technical Support" },
            knowledge_base_results: 2,
            knowledge_base_ids: ["kb-1", "kb-2"],
            created_at: new Date(Date.now() - 7200000).toISOString(),
          },
        ],
        totalPages: 1,
        currentPage: 1,
        totalItems: 2,
      };
    }
  },

  /**
   * Generate a response using AI models
   */
  generateResponse: async (
    options: GenerateResponseOptions,
  ): Promise<AIResponse> => {
    try {
      // Try to generate via API first
      try {
        const response = await axios.post("/api/ai/generate", options);

        // Log the interaction
        await aiService.logInteraction({
          userId: options.userId,
          query: options.query,
          response: response.data.content,
          modelUsed: response.data.modelUsed,
          contextRuleId: options.contextRuleId,
          knowledgeBaseResults: response.data.knowledgeBaseResults || 0,
          knowledgeBaseIds: response.data.knowledgeBaseIds || [],
          metadata: response.data.metadata,
        });

        return response.data;
      } catch (apiError) {
        logger.warn(
          "API AI generation failed, falling back to mock response",
          apiError,
        );

        // Create mock response
        const mockResponse = {
          content: `This is a mock response to your query: "${options.query}". In production, this would be processed by an AI model.`,
          modelUsed: options.preferredModel || "mock-model",
          metadata: {
            processingTime: 0.5,
            tokenCount: {
              input: options.query.split(" ").length,
              output: 20,
            },
          },
        };

        // Log the interaction
        await aiService.logInteraction({
          userId: options.userId,
          query: options.query,
          response: mockResponse.content,
          modelUsed: mockResponse.modelUsed,
          contextRuleId: options.contextRuleId,
          metadata: mockResponse.metadata,
        });

        return mockResponse;
      }
    } catch (error) {
      logger.error("Error generating AI response:", error);

      // Return a fallback response
      const fallbackResponse = {
        content:
          "I'm sorry, I encountered an error processing your request. Please try again later.",
        modelUsed: "fallback-model",
      };

      // Try to log the error
      try {
        await aiService.logInteraction({
          userId: options.userId,
          query: options.query,
          response: fallbackResponse.content,
          modelUsed: fallbackResponse.modelUsed,
          contextRuleId: options.contextRuleId,
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (logError) {
        logger.error("Failed to log AI interaction error:", logError);
      }

      return fallbackResponse;
    }
  },

  /**
   * Log an AI interaction to the database
   */
  logInteraction: async (data: {
    userId: string;
    query: string;
    response: string;
    modelUsed: string;
    contextRuleId?: string;
    knowledgeBaseResults?: number;
    knowledgeBaseIds?: string[];
    metadata?: Record<string, any>;
  }) => {
    try {
      // Try to log via API first
      try {
        await axios.post("/api/ai/logs", data);
        return true;
      } catch (apiError) {
        logger.warn(
          "API AI log creation failed, falling back to local implementation",
          apiError,
        );

        // Fallback to direct database insertion
        const sequelize = await getMySQLClient();

        await sequelize.query(
          `INSERT INTO ai_interaction_logs (
            id, user_id, query, response, model_used, context_rule_id,
            knowledge_base_results, knowledge_base_ids, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          {
            replacements: [
              uuidv4(),
              data.userId,
              data.query,
              data.response,
              data.modelUsed,
              data.contextRuleId || null,
              data.knowledgeBaseResults || 0,
              data.knowledgeBaseIds ? data.knowledgeBaseIds.join(",") : null,
              data.metadata ? JSON.stringify(data.metadata) : null,
              new Date(),
            ],
            type: sequelize.QueryTypes.INSERT,
          },
        );

        return true;
      }
    } catch (error) {
      logger.error("Error logging AI interaction:", error);
      return false;
    }
  },

  /**
   * Get AI model performance metrics
   */
  getModelPerformance: async (
    timeRange: string | ModelPerformanceParams = "week",
  ) => {
    try {
      // Process parameters
      let params: ModelPerformanceParams = {};
      if (typeof timeRange === "string") {
        params.timeRange = timeRange;
      } else {
        params = timeRange;
      }

      // Try to fetch from API first
      try {
        const response = await axios.get("/api/ai/performance", {
          params,
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API AI performance metrics fetch failed, falling back to local implementation",
          apiError,
        );

        // Fallback to local database implementation
        const sequelize = await getMySQLClient();

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        const timeRangeStr =
          typeof timeRange === "string"
            ? timeRange
            : timeRange.timeRange || "week";

        if (timeRangeStr === "day") {
          startDate.setDate(startDate.getDate() - 1);
        } else if (timeRangeStr === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRangeStr === "month") {
          startDate.setDate(startDate.getDate() - 30);
        }

        // Use provided dates if available
        const finalStartDate = params.startDate
          ? new Date(params.startDate)
          : startDate;
        const finalEndDate = params.endDate
          ? new Date(params.endDate)
          : endDate;

        // Get model usage counts
        const modelUsageQuery = `
          SELECT model_used, COUNT(*) as count
          FROM ai_interaction_logs
          WHERE created_at BETWEEN ? AND ?
          GROUP BY model_used
          ORDER BY count DESC
        `;

        const modelUsage = await sequelize.query(modelUsageQuery, {
          replacements: [
            finalStartDate.toISOString(),
            finalEndDate.toISOString(),
          ],
          type: sequelize.QueryTypes.SELECT,
        });

        // Get average response time (using metadata.processingTime if available)
        const avgResponseTimeQuery = `
          SELECT model_used, AVG(JSON_EXTRACT(metadata, '$.processingTime')) as avg_time
          FROM ai_interaction_logs
          WHERE created_at BETWEEN ? AND ? AND metadata IS NOT NULL
          GROUP BY model_used
        `;

        const avgResponseTimes = await sequelize.query(avgResponseTimeQuery, {
          replacements: [
            finalStartDate.toISOString(),
            finalEndDate.toISOString(),
          ],
          type: sequelize.QueryTypes.SELECT,
        });

        // Get context usage
        const contextUsageQuery = `
          SELECT c.name as context_name, COUNT(*) as count
          FROM ai_interaction_logs l
          LEFT JOIN context_rules c ON l.context_rule_id = c.id
          WHERE l.created_at BETWEEN ? AND ?
          GROUP BY c.name
          ORDER BY count DESC
        `;

        const contextUsage = await sequelize.query(contextUsageQuery, {
          replacements: [
            finalStartDate.toISOString(),
            finalEndDate.toISOString(),
          ],
          type: sequelize.QueryTypes.SELECT,
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
          replacements: [
            finalStartDate.toISOString(),
            finalEndDate.toISOString(),
          ],
          type: sequelize.QueryTypes.SELECT,
        });

        return {
          modelUsage,
          avgResponseTimes,
          contextUsage,
          dailyUsage,
          timeRange: timeRangeStr,
          startDate: finalStartDate.toISOString(),
          endDate: finalEndDate.toISOString(),
        };
      }
    } catch (error) {
      logger.error("Error fetching AI performance metrics:", error);

      // Return mock data
      return {
        modelUsage: [
          { model_used: "gpt-3.5-turbo", count: 120 },
          { model_used: "gemini-pro", count: 85 },
          { model_used: "claude-instant", count: 45 },
        ],
        avgResponseTimes: [
          { model_used: "gpt-3.5-turbo", avg_time: 0.8 },
          { model_used: "gemini-pro", avg_time: 0.6 },
          { model_used: "claude-instant", avg_time: 0.9 },
        ],
        contextUsage: [
          { context_name: "General Inquiries", count: 95, effectiveness: 92 },
          { context_name: "Technical Support", count: 85, effectiveness: 88 },
          { context_name: "Product Information", count: 70, effectiveness: 94 },
        ],
        dailyUsage: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toISOString().split("T")[0],
            count: Math.floor(Math.random() * 30) + 10,
          };
        }),
        timeRange:
          typeof timeRange === "string"
            ? timeRange
            : timeRange.timeRange || "week",
      };
    }
  },
};

// Add default export
export default aiService;

// Also keep named exports if needed
export { aiService };
