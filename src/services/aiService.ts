import axios from "axios";
import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { AIInteractionLog } from "@/models";
import aiModelFactory from "./ai/aiModelFactory";
import { AIModelRequest, AIModelResponse } from "./ai/types";
import knowledgeBaseService, {
  KnowledgeBaseResult,
} from "./knowledgeBaseService";
import promptTemplateService from "./promptTemplateService";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

interface ContextRule {
  id: string;
  name: string;
  description?: string;
  prompt_template_id?: string;
  knowledge_base_ids?: string[];
  system_prompt?: string;
  allowed_domains?: string[];
  blocked_domains?: string[];
  allowed_topics?: string[];
  blocked_topics?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
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

        // Process the query with knowledge base and prompt templates
        const enhancedRequest =
          await aiService.enhanceRequestWithContext(options);

        // Convert options to AIModelRequest format
        const modelRequest: AIModelRequest = {
          query: enhancedRequest.query,
          contextRuleId: options.contextRuleId,
          userId: options.userId,
          knowledgeBaseIds: enhancedRequest.knowledgeBaseIds,
          promptTemplate: options.promptTemplate,
          systemPrompt: enhancedRequest.systemPrompt,
          preferredModel: options.preferredModel,
          maxTokens: options.maxTokens,
          temperature: options.temperature,
          additionalParams: {
            ...options.additionalParams,
            knowledgeBaseResults: enhancedRequest.knowledgeBaseResults,
          },
        };

        // Generate response using the AI model factory
        const response = await aiModelFactory.generateResponse(modelRequest);

        // Enhance the response with metadata about knowledge base usage
        const enhancedResponse: AIModelResponse = {
          ...response,
          knowledgeBaseResults:
            enhancedRequest.knowledgeBaseResults?.length || 0,
          knowledgeBaseIds: enhancedRequest.knowledgeBaseIds || [],
        };

        // Log the interaction
        await aiService.logInteraction({
          userId: options.userId,
          query: options.query,
          response: enhancedResponse.content,
          modelUsed: enhancedResponse.modelUsed,
          contextRuleId: options.contextRuleId,
          knowledgeBaseResults: enhancedResponse.knowledgeBaseResults || 0,
          knowledgeBaseIds: enhancedResponse.knowledgeBaseIds || [],
          metadata: enhancedResponse.metadata,
        });

        return enhancedResponse;
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
   * Enhance a request with context from knowledge bases and prompt templates
   */
  enhanceRequestWithContext: async (
    options: GenerateResponseOptions,
  ): Promise<{
    query: string;
    systemPrompt: string;
    knowledgeBaseIds?: string[];
    knowledgeBaseResults?: KnowledgeBaseResult[];
  }> => {
    try {
      let systemPrompt = options.systemPrompt || "";
      let knowledgeBaseIds = options.knowledgeBaseIds || [];
      let knowledgeBaseResults: KnowledgeBaseResult[] = [];

      // If a context rule is specified, get its configuration
      if (options.contextRuleId) {
        const contextRule = await aiService.getContextRule(
          options.contextRuleId,
        );
        if (contextRule) {
          // Use the context rule's system prompt if available
          if (contextRule.system_prompt) {
            systemPrompt = contextRule.system_prompt;
          }

          // Use the context rule's knowledge base IDs if available
          if (
            contextRule.knowledge_base_ids &&
            contextRule.knowledge_base_ids.length > 0
          ) {
            knowledgeBaseIds = Array.isArray(contextRule.knowledge_base_ids)
              ? contextRule.knowledge_base_ids
              : contextRule.knowledge_base_ids.split(",");
          }

          // Apply prompt template if specified in the context rule
          if (contextRule.prompt_template_id) {
            const templateResult = await promptTemplateService.applyTemplate({
              templateId: contextRule.prompt_template_id,
              variables: {
                query: options.query,
                userId: options.userId,
                ...options.additionalParams,
              },
              defaultSystemPrompt: systemPrompt,
            });

            if (templateResult) {
              systemPrompt = templateResult;
            }
          }
        }
      }

      // Query knowledge bases if any are specified
      if (knowledgeBaseIds.length > 0) {
        knowledgeBaseResults = await knowledgeBaseService.query({
          query: options.query,
          contextRuleId: options.contextRuleId,
          userId: options.userId,
          limit: 5, // Limit to top 5 results
        });

        // If we got results, enhance the system prompt with them
        if (knowledgeBaseResults.length > 0) {
          const contextContent = knowledgeBaseResults
            .map(
              (result, index) =>
                `[${index + 1}] ${result.content} (Source: ${result.source})`,
            )
            .join("\n\n");

          systemPrompt = `${systemPrompt}\n\nRelevant context information:\n${contextContent}\n\nPlease use the above information to answer the following question. If the information doesn't contain the answer, say so and provide your best response based on your general knowledge.`;
        }
      }

      return {
        query: options.query,
        systemPrompt,
        knowledgeBaseIds,
        knowledgeBaseResults,
      };
    } catch (error) {
      logger.error("Error enhancing request with context:", error);
      return {
        query: options.query,
        systemPrompt: options.systemPrompt || "",
        knowledgeBaseIds: options.knowledgeBaseIds,
      };
    }
  },

  /**
   * Get a context rule by ID
   */
  getContextRule: async (id: string): Promise<ContextRule | null> => {
    try {
      const { data, error } = await supabase
        .from("context_rules")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error fetching context rule ${id}:`, error);
      return null;
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

  /**
   * Get AI interaction logs
   */
  getInteractionLogs: async (params: AIInteractionLogsParams) => {
    try {
      const { data, error } = await supabase
        .from("ai_interaction_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .range(
          (params.page - 1) * params.pageSize,
          params.page * params.pageSize - 1,
        );

      if (error) throw error;

      // Get total count for pagination
      const { count, error: countError } = await supabase
        .from("ai_interaction_logs")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;

      return {
        logs: data || [],
        total: count || 0,
        page: params.page,
        pageSize: params.pageSize,
      };
    } catch (error) {
      logger.error("Error getting AI interaction logs:", error);
      return {
        logs: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
      };
    }
  },
};

// Add default export
export default aiService;

// Also keep named exports if needed
export { aiService };
