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
};

// Add default export
export default aiService;

// Also keep named exports if needed
export { aiService };
