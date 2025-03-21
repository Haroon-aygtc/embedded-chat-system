import axios from "axios";
import { ContextRule } from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";
import logger from "@/utils/logger";
import knowledgeBaseService, { QueryResult } from "./knowledgeBaseService";
import supabase from "./supabaseClient";

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

// Get environment variables for API keys and endpoints
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const HUGGINGFACE_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY as string;
const GEMINI_ENDPOINT =
  (import.meta.env.VITE_GEMINI_ENDPOINT as string) ||
  "https://generativelanguage.googleapis.com";
const HUGGINGFACE_ENDPOINT =
  (import.meta.env.VITE_HUGGINGFACE_ENDPOINT as string) ||
  "https://api-inference.huggingface.co/models";

// Default model configurations
const modelConfigs: Record<AIModel, AIModelConfig> = {
  gemini: {
    apiKey: GEMINI_API_KEY,
    endpoint: GEMINI_ENDPOINT,
    version: "v1beta",
    maxTokens: 1024,
    temperature: 0.7,
  },
  huggingface: {
    apiKey: HUGGINGFACE_API_KEY,
    endpoint: HUGGINGFACE_ENDPOINT,
    maxTokens: 512,
    temperature: 0.8,
  },
};

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
    const config = modelConfigs.gemini;
    const url = `${config.endpoint}/${config.version}/models/gemini-pro:generateContent?key=${config.apiKey}`;

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

      return {
        content,
        modelUsed: "gemini",
        metadata: {
          promptTokens: response.data.usage?.promptTokenCount || 0,
          completionTokens: response.data.usage?.candidatesTokenCount || 0,
          totalTokens: response.data.usage?.totalTokenCount || 0,
        },
      };
    } catch (error) {
      logger.error("Error generating Gemini response", error);
      throw new Error("Failed to generate response from Gemini");
    }
  },

  /**
   * Generate a response using the Hugging Face API
   */
  generateHuggingFaceResponse: async (
    prompt: string,
  ): Promise<AIModelResponse> => {
    const config = modelConfigs.huggingface;
    // Default to a good general model if not specified
    const model =
      import.meta.env.VITE_HUGGINGFACE_MODEL ||
      "mistralai/Mistral-7B-Instruct-v0.2";
    const url = `${config.endpoint}/${model}`;

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

      return {
        content,
        modelUsed: "huggingface",
        metadata: {
          model: model,
        },
      };
    } catch (error) {
      logger.error("Error generating Hugging Face response", error);
      throw new Error("Failed to generate response from Hugging Face");
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
