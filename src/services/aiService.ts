import axios from "axios";
import { ContextRule } from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";
import logger from "@/utils/logger";
import knowledgeBaseService, { QueryResult } from "./knowledgeBaseService";
import supabase from "./supabaseClient";
import apiKeyService from "./apiKeyService";
import aiCacheService from "./aiCacheService";

// Define the AI model types
type AIModel = "gemini" | "huggingface";

// Define the response structure from AI models
interface AIModelResponse {
  content: string;
  modelUsed: string;
  metadata?: Record<string, any>;
}

// Configuration for AI models
interface AIModelConfig {
  apiKey: string;
  endpoint: string;
  version?: string;
  maxTokens?: number;
  temperature?: number;
}

// Default endpoints for API services
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com";
const HUGGINGFACE_ENDPOINT = "https://api-inference.huggingface.co/models";

// Default model configurations (API keys will be loaded dynamically)
const modelConfigs: Record<AIModel, AIModelConfig> = {
  gemini: {
    apiKey: "", // Will be loaded dynamically
    endpoint: GEMINI_ENDPOINT,
    version: "v1beta",
    maxTokens: 1024,
    temperature: 0.7,
  },
  huggingface: {
    apiKey: "", // Will be loaded dynamically
    endpoint: HUGGINGFACE_ENDPOINT,
    maxTokens: 512,
    temperature: 0.8,
  },
};

// Initialize API keys
async function initializeApiKeys() {
  try {
    // Load Gemini API key from secure storage
    const geminiApiKey = await apiKeyService.getGeminiApiKey();
    if (geminiApiKey) {
      modelConfigs.gemini.apiKey = geminiApiKey;
    } else {
      logger.warn("Gemini API key not found in secure storage");
    }

    // Load Hugging Face API key (implementation similar to Gemini)
    // For now, fallback to environment variable if available
    const huggingFaceApiKey = import.meta.env
      .VITE_HUGGINGFACE_API_KEY as string;
    if (huggingFaceApiKey) {
      modelConfigs.huggingface.apiKey = huggingFaceApiKey;
    } else {
      logger.warn("Hugging Face API key not found");
    }
  } catch (error) {
    logger.error("Error initializing API keys", error);
  }
}

// Call initialization
initializeApiKeys();

/**
 * Service for interacting with AI models
 */
export const aiService = {
  /**
   * Determine which AI model to use based on the query and context
   */
  determineModel: (query: string, contextRule?: ContextRule): AIModel => {
    // If a specific model is defined in the context rule, use that
    if (contextRule?.preferredModel) {
      return contextRule.preferredModel as AIModel;
    }

    // Default logic: Use Gemini for complex queries, Hugging Face for simpler ones
    const isComplexQuery =
      query.length > 100 ||
      query.includes("explain") ||
      query.includes("analyze") ||
      query.includes("compare") ||
      query.split(" ").length > 15;

    return isComplexQuery ? "gemini" : "huggingface";
  },

  /**
   * Apply context rule filtering to the prompt
   */
  applyContextRuleToPrompt: async (
    query: string,
    contextRule?: ContextRule,
    promptTemplate?: PromptTemplate,
    userId?: string,
  ): Promise<string> => {
    if (!contextRule) {
      return query;
    }

    // Check if we should use knowledge bases for this context rule
    let knowledgeBaseContext = "";
    if (contextRule.useKnowledgeBases) {
      const kbResults = await knowledgeBaseService.query({
        query,
        contextRuleId: contextRule.id,
        userId,
        limit: 5,
      });

      if (kbResults.length > 0) {
        knowledgeBaseContext =
          "\n\nRelevant information from knowledge base:\n" +
          kbResults
            .map(
              (result, index) =>
                `[${index + 1}] ${result.content} (Source: ${result.source})`,
            )
            .join("\n\n");

        // Log the knowledge base query
        await knowledgeBaseService.logQuery({
          userId: userId || "anonymous",
          query,
          contextRuleId: contextRule.id,
          knowledgeBaseIds: kbResults
            .map((r) => r.metadata?.knowledgeBaseId)
            .filter(Boolean) as string[],
          results: kbResults.length,
        });
      }
    }

    // If there's a prompt template, use it
    if (promptTemplate) {
      let prompt = promptTemplate.template;
      // Replace variables in the template
      promptTemplate.variables.forEach((variable) => {
        if (variable === "question" || variable === "query") {
          prompt = prompt.replace(`{{${variable}}}`, query);
        } else if (variable === "context" && contextRule) {
          prompt = prompt.replace(
            `{{${variable}}}`,
            contextRule.description || "",
          );
        } else if (variable === "knowledge_base" && knowledgeBaseContext) {
          prompt = prompt.replace(`{{${variable}}}`, knowledgeBaseContext);
        }
      });
      return prompt;
    }

    // Default context-aware prompt with knowledge base information if available
    let prompt = `You are an AI assistant focused on ${contextRule.name}. ${contextRule.description || ""}\n\nUser query: ${query}`;

    if (knowledgeBaseContext) {
      prompt += knowledgeBaseContext;
    }

    prompt += `\n\nPlease provide a helpful response within the context of ${contextRule.name}.`;

    return prompt;
  },

  /**
   * Apply context rule filtering to the response
   */
  applyContextRuleToResponse: (
    response: string,
    contextRule?: ContextRule,
  ): string => {
    if (
      !contextRule ||
      !contextRule.excludedTopics ||
      contextRule.excludedTopics.length === 0
    ) {
      return response;
    }

    // Check if the response contains any excluded topics
    const containsExcludedTopic = contextRule.excludedTopics.some((topic) =>
      response.toLowerCase().includes(topic.toLowerCase()),
    );

    if (containsExcludedTopic) {
      return "I'm sorry, but I cannot provide information on that topic based on the current context restrictions.";
    }

    // Apply any response filters defined in the context rule
    if (contextRule.responseFilters && contextRule.responseFilters.length > 0) {
      let filteredResponse = response;

      contextRule.responseFilters.forEach((filter) => {
        if (filter.type === "keyword" && filter.action === "block") {
          const regex = new RegExp(`\\b${filter.value}\\b`, "gi");
          if (regex.test(filteredResponse)) {
            filteredResponse =
              "I'm sorry, but I cannot provide that information based on the current context restrictions.";
          }
        } else if (filter.type === "regex" && filter.action === "block") {
          try {
            const regex = new RegExp(filter.value, "gi");
            if (regex.test(filteredResponse)) {
              filteredResponse =
                "I'm sorry, but I cannot provide that information based on the current context restrictions.";
            }
          } catch (error) {
            logger.error("Invalid regex in response filter", error);
          }
        }
      });

      return filteredResponse;
    }

    return response;
  },

  /**
   * Generate a response using the Gemini API
   */
  generateGeminiResponse: async (prompt: string): Promise<AIModelResponse> => {
    // Check if we have a cached response
    const cachedResponse = await aiCacheService.getCachedResponse(prompt);
    if (cachedResponse && cachedResponse.modelUsed === "gemini") {
      logger.info("Using cached Gemini response");
      return {
        content: cachedResponse.response,
        modelUsed: "gemini",
        metadata: {
          cached: true,
          cachedAt: cachedResponse.createdAt,
          ...cachedResponse.metadata,
        },
      };
    }

    // Check rate limits before making API call
    const withinRateLimit = await apiKeyService.checkRateLimit("gemini");
    if (!withinRateLimit) {
      logger.warn("Rate limit exceeded for Gemini API");
      throw new Error(
        "Rate limit exceeded for Gemini API. Please try again later.",
      );
    }

    // Ensure API key is loaded
    if (!modelConfigs.gemini.apiKey) {
      await initializeApiKeys();
      if (!modelConfigs.gemini.apiKey) {
        throw new Error("Gemini API key not configured");
      }
    }

    const config = modelConfigs.gemini;
    const url = `${config.endpoint}/${config.version}/models/gemini-pro:generateContent?key=${config.apiKey}`;

    const startTime = Date.now();
    let statusCode = 200;

    try {
      // Implement retry logic with exponential backoff
      let retries = 0;
      const maxRetries = 3;
      let lastError: any = null;

      while (retries <= maxRetries) {
        try {
          const response = await axios.post(url, {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: config.maxTokens,
              temperature: config.temperature,
            },
          });

          // Extract the response text from the Gemini API response
          const content = response.data.candidates[0].content.parts[0].text;

          // Calculate response time for monitoring
          const responseTime = Date.now() - startTime;

          // Log API usage for monitoring
          await apiKeyService.logApiKeyUsage(
            "gemini",
            "generateContent",
            responseTime,
            response.status,
          );

          // Cache the successful response
          const metadata = {
            promptTokens: response.data.usage?.promptTokenCount || 0,
            completionTokens: response.data.usage?.candidatesTokenCount || 0,
            totalTokens: response.data.usage?.totalTokenCount || 0,
            responseTime,
          };

          await aiCacheService.cacheResponse(
            prompt,
            content,
            "gemini",
            metadata,
            60, // Cache for 1 hour
          );

          return {
            content,
            modelUsed: "gemini",
            metadata,
          };
        } catch (error: any) {
          lastError = error;
          statusCode = error.response?.status || 500;

          // Only retry on specific error codes that are retryable
          if (
            error.response?.status === 429 ||
            error.response?.status === 503
          ) {
            retries++;
            if (retries <= maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              const backoffTime = Math.pow(2, retries - 1) * 1000;
              logger.warn(
                `Retrying Gemini API call in ${backoffTime}ms (${retries}/${maxRetries})`,
              );
              await new Promise((resolve) => setTimeout(resolve, backoffTime));
              continue;
            }
          }
          throw error;
        }
      }

      throw lastError;
    } catch (error: any) {
      // Log the failed API call
      const responseTime = Date.now() - startTime;
      await apiKeyService.logApiKeyUsage(
        "gemini",
        "generateContent",
        responseTime,
        statusCode,
      );

      logger.error("Error generating Gemini response", error);
      throw new Error(
        "Failed to generate response from Gemini: " +
          (error.message || "Unknown error"),
      );
    }
  },

  /**
   * Generate a response using the Hugging Face API
   */
  generateHuggingFaceResponse: async (
    prompt: string,
  ): Promise<AIModelResponse> => {
    // Check if we have a cached response
    const cachedResponse = await aiCacheService.getCachedResponse(prompt);
    if (cachedResponse && cachedResponse.modelUsed === "huggingface") {
      logger.info("Using cached Hugging Face response");
      return {
        content: cachedResponse.response,
        modelUsed: "huggingface",
        metadata: {
          cached: true,
          cachedAt: cachedResponse.createdAt,
          ...cachedResponse.metadata,
        },
      };
    }

    // Check rate limits before making API call
    const withinRateLimit = await apiKeyService.checkRateLimit("huggingface");
    if (!withinRateLimit) {
      logger.warn("Rate limit exceeded for Hugging Face API");
      throw new Error(
        "Rate limit exceeded for Hugging Face API. Please try again later.",
      );
    }

    // Ensure API key is loaded
    if (!modelConfigs.huggingface.apiKey) {
      await initializeApiKeys();
      if (!modelConfigs.huggingface.apiKey) {
        throw new Error("Hugging Face API key not configured");
      }
    }

    const config = modelConfigs.huggingface;
    // Default to a good general model if not specified
    const model =
      import.meta.env.VITE_HUGGINGFACE_MODEL ||
      "mistralai/Mistral-7B-Instruct-v0.2";
    const url = `${config.endpoint}/${model}`;

    const startTime = Date.now();
    let statusCode = 200;

    try {
      // Implement retry logic with exponential backoff
      let retries = 0;
      const maxRetries = 3;
      let lastError: any = null;

      while (retries <= maxRetries) {
        try {
          const response = await axios.post(
            url,
            {
              inputs: prompt,
              parameters: {
                max_new_tokens: config.maxTokens,
                temperature: config.temperature,
                return_full_text: false,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                "Content-Type": "application/json",
              },
            },
          );

          // Extract the response text from the Hugging Face API response
          const content = response.data[0].generated_text;

          // Calculate response time for monitoring
          const responseTime = Date.now() - startTime;

          // Log API usage for monitoring
          await apiKeyService.logApiKeyUsage(
            "huggingface",
            model,
            responseTime,
            response.status,
          );

          // Cache the successful response
          const metadata = {
            model,
            responseTime,
          };

          await aiCacheService.cacheResponse(
            prompt,
            content,
            "huggingface",
            metadata,
            60, // Cache for 1 hour
          );

          return {
            content,
            modelUsed: "huggingface",
            metadata,
          };
        } catch (error: any) {
          lastError = error;
          statusCode = error.response?.status || 500;

          // Only retry on specific error codes that are retryable
          if (
            error.response?.status === 429 ||
            error.response?.status === 503
          ) {
            retries++;
            if (retries <= maxRetries) {
              // Exponential backoff: 1s, 2s, 4s
              const backoffTime = Math.pow(2, retries - 1) * 1000;
              logger.warn(
                `Retrying Hugging Face API call in ${backoffTime}ms (${retries}/${maxRetries})`,
              );
              await new Promise((resolve) => setTimeout(resolve, backoffTime));
              continue;
            }
          }
          throw error;
        }
      }

      throw lastError;
    } catch (error: any) {
      // Log the failed API call
      const responseTime = Date.now() - startTime;
      await apiKeyService.logApiKeyUsage(
        "huggingface",
        model,
        responseTime,
        statusCode,
      );

      logger.error("Error generating Hugging Face response", error);
      throw new Error(
        "Failed to generate response from Hugging Face: " +
          (error.message || "Unknown error"),
      );
    }
  },

  /**
   * Generate a response using the appropriate AI model with fallback
   */
  generateResponse: async (
    query: string,
    contextRule?: ContextRule,
    promptTemplate?: PromptTemplate,
    userId?: string,
  ): Promise<AIModelResponse> => {
    // Determine which model to use
    const primaryModel = aiService.determineModel(query, contextRule);

    // Apply context rule to the prompt, including knowledge base integration
    const prompt = await aiService.applyContextRuleToPrompt(
      query,
      contextRule,
      promptTemplate,
      userId,
    );

    try {
      // Try the primary model first
      let response: AIModelResponse;

      if (primaryModel === "gemini") {
        response = await aiService.generateGeminiResponse(prompt);
      } else {
        response = await aiService.generateHuggingFaceResponse(prompt);
      }

      // Apply context rule filtering to the response
      response.content = aiService.applyContextRuleToResponse(
        response.content,
        contextRule,
      );

      return response;
    } catch (error) {
      logger.error(`Error with primary model ${primaryModel}`, error);

      // Fallback to the other model
      const fallbackModel =
        primaryModel === "gemini" ? "huggingface" : "gemini";
      logger.info(`Falling back to ${fallbackModel}`);

      try {
        let fallbackResponse: AIModelResponse;

        if (fallbackModel === "gemini") {
          fallbackResponse = await aiService.generateGeminiResponse(prompt);
        } else {
          fallbackResponse =
            await aiService.generateHuggingFaceResponse(prompt);
        }

        // Apply context rule filtering to the response
        fallbackResponse.content = aiService.applyContextRuleToResponse(
          fallbackResponse.content,
          contextRule,
        );

        return fallbackResponse;
      } catch (fallbackError) {
        logger.error(
          `Error with fallback model ${fallbackModel}`,
          fallbackError,
        );
        throw new Error(
          "Failed to generate response from both primary and fallback AI models",
        );
      }
    }
  },

  /**
   * Log AI interaction for auditing and review
   */
  logAIInteraction: async (
    userId: string,
    query: string,
    response: AIModelResponse,
    contextRuleId?: string,
  ): Promise<void> => {
    try {
      const { error } = await supabase.from("ai_interaction_logs").insert({
        user_id: userId,
        query: query,
        response: response.content,
        model_used: response.modelUsed,
        context_rule_id: contextRuleId || null,
        metadata: response.metadata || {},
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error("Error logging AI interaction", error);
      }
    } catch (error) {
      logger.error("Error logging AI interaction", error);
    }
  },
};

export default aiService;
