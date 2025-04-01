import axios from "axios";
import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { AIInteractionLog } from "@/models";
import aiModelFactory from "./ai/aiModelFactory";
import { AIModelRequest, AIModelResponse } from "./ai/types";

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
  systemPrompt?: string;
  preferredModel?: string;
  maxTokens?: number;
  temperature?: number;
  additionalParams?: Record<string, any>;
}

interface ModelPerformanceParams {
  timeRange?: string;
  startDate?: string;
  endDate?: string;
}

const aiService = {
  /**
   * Generate a response using AI models
   */
  generateResponse: async (
    options: GenerateResponseOptions,
  ): Promise<AIModelResponse> => {
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
          "API AI generation failed, falling back to local implementation",
          apiError,
        );

        // Convert options to AIModelRequest format
        const modelRequest: AIModelRequest = {
          query: options.query,
          contextRuleId: options.contextRuleId,
          userId: options.userId,
          knowledgeBaseIds: options.knowledgeBaseIds,
          promptTemplate: options.promptTemplate,
          systemPrompt: options.systemPrompt,
          preferredModel: options.preferredModel,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          additionalParams: options.additionalParams,
        };

        // Generate response using the AI model factory
        const response = await aiModelFactory.generateResponse(modelRequest);

        // Log the interaction
        await aiService.logInteraction({
          userId: options.userId,
          query: options.query,
          response: response.content,
          modelUsed: response.modelUsed,
          contextRuleId: options.contextRuleId,
          knowledgeBaseResults: response.knowledgeBaseResults || 0,
          knowledgeBaseIds: response.knowledgeBaseIds || [],
          metadata: response.metadata,
        });

        return response;
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
   * Get available AI models
   */
  getAvailableModels: async () => {
    try {
      const models = aiModelFactory.getAllModels();
      const availableModels = [];

      for (const model of models) {
        const isAvailable = await model.isAvailable();
        if (isAvailable) {
          availableModels.push({
            id: model.id,
            name: model.name,
            provider: model.provider,
          });
        }
      }

      return availableModels;
    } catch (error) {
      logger.error("Error getting available AI models:", error);
      return [];
    }
  },

  /**
   * Set the default AI model
   */
  setDefaultModel: (modelId: string) => {
    try {
      aiModelFactory.setDefaultModelId(modelId);
      return true;
    } catch (error) {
      logger.error("Error setting default AI model:", error);
      return false;
    }
  },

  /**
   * Get the default AI model
   */
  getDefaultModel: () => {
    try {
      const model = aiModelFactory.getDefaultModel();
      return {
        id: model.id,
        name: model.name,
        provider: model.provider,
      };
    } catch (error) {
      logger.error("Error getting default AI model:", error);
      return null;
    }
  },

  /**
   * Get AI model performance metrics
   */
  getModelPerformance: async (timeRange: string = "7d") => {
    try {
      const response = await axios.get("/api/ai/performance", {
        params: { timeRange },
      });
      return response.data;
    } catch (error) {
      logger.error("Error getting AI model performance metrics:", error);
      return {
        modelUsage: [],
        avgResponseTimes: [],
        dailyUsage: [],
        timeRange,
      };
    }
  },
};

// Add default export
export default aiService;

// Also keep named exports if needed
export { aiService };
