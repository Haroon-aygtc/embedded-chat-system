/**
 * AI Service
 *
 * Handles interactions with AI models for chat responses
 */

import { getMySQLClient } from "./mysqlClient.js";
import logger from "../utils/logger.js";

/**
 * Process a user message and generate an AI response
 * @param {string} message - User message
 * @param {Array} history - Conversation history
 * @param {string} contextRuleId - Optional context rule ID
 * @returns {Promise<Object>} AI response
 */
export const processMessage = async (
  message,
  history,
  contextRuleId = null,
) => {
  try {
    // Get AI configuration
    const aiConfig = await getAIConfiguration();

    // Get context rule if provided
    let contextRule = null;
    if (contextRuleId) {
      contextRule = await getContextRule(contextRuleId);
    }

    // Prepare prompt with context
    const prompt = await preparePrompt(message, history, contextRule);

    // Select AI model
    const modelToUse =
      contextRule && contextRule.preferred_model
        ? contextRule.preferred_model
        : aiConfig.default_model;

    // Call appropriate AI model based on configuration
    let response;
    switch (modelToUse) {
      case "gemini":
        response = await callGeminiAPI(prompt, aiConfig.gemini_api_key);
        break;
      case "huggingface":
        response = await callHuggingFaceAPI(
          prompt,
          aiConfig.huggingface_api_key,
        );
        break;
      case "openai":
      default:
        response = await callOpenAIAPI(
          prompt,
          history,
          aiConfig.openai_api_key,
        );
        break;
    }

    // Apply response filters if context rule has them
    if (
      contextRule &&
      contextRule.response_filters &&
      contextRule.response_filters.length > 0
    ) {
      response = applyResponseFilters(response, contextRule.response_filters);
    }

    // Log the interaction for analytics
    await logAIInteraction(message, response, modelToUse, contextRuleId);

    return {
      content: response,
      model: modelToUse,
    };
  } catch (error) {
    logger.error("Error processing message with AI:", error);
    throw new Error("Failed to generate AI response");
  }
};

/**
 * Get AI configuration from database
 * @returns {Promise<Object>} AI configuration
 */
async function getAIConfiguration() {
  try {
    const sequelize = await getMySQLClient();
    const [configs] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE is_active = true ORDER BY created_at DESC LIMIT 1`,
    );

    if (configs && configs.length > 0) {
      const config = configs[0];

      // Parse settings if it exists
      if (config.settings && typeof config.settings === "string") {
        try {
          config.settings = JSON.parse(config.settings);
        } catch (e) {
          config.settings = {};
        }
      }

      return {
        default_model: config.default_model || "openai",
        openai_api_key: config.openai_api_key || process.env.OPENAI_API_KEY,
        gemini_api_key: config.gemini_api_key || process.env.GEMINI_API_KEY,
        huggingface_api_key:
          config.huggingface_api_key || process.env.HUGGINGFACE_API_KEY,
        settings: config.settings || {},
      };
    }

    // Return default configuration if none found
    return {
      default_model: process.env.DEFAULT_AI_MODEL || "openai",
      openai_api_key: process.env.OPENAI_API_KEY,
      gemini_api_key: process.env.GEMINI_API_KEY,
      huggingface_api_key: process.env.HUGGINGFACE_API_KEY,
      settings: {},
    };
  } catch (error) {
    logger.error("Error getting AI configuration:", error);

    // Return default configuration on error
    return {
      default_model: process.env.DEFAULT_AI_MODEL || "openai",
      openai_api_key: process.env.OPENAI_API_KEY,
      gemini_api_key: process.env.GEMINI_API_KEY,
      huggingface_api_key: process.env.HUGGINGFACE_API_KEY,
      settings: {},
    };
  }
}

/**
 * Get context rule from database
 * @param {string} ruleId - Context rule ID
 * @returns {Promise<Object>} Context rule
 */
async function getContextRule(ruleId) {
  try {
    const sequelize = await getMySQLClient();
    const [rules] = await sequelize.query(
      `SELECT * FROM context_rules WHERE id = ? AND is_active = true`,
      {
        replacements: [ruleId],
      },
    );

    if (rules && rules.length > 0) {
      const rule = rules[0];

      // Parse arrays and JSON fields
      if (rule.keywords && typeof rule.keywords === "string") {
        try {
          rule.keywords = JSON.parse(rule.keywords);
        } catch (e) {
          rule.keywords = [];
        }
      }

      if (rule.excluded_topics && typeof rule.excluded_topics === "string") {
        try {
          rule.excluded_topics = JSON.parse(rule.excluded_topics);
        } catch (e) {
          rule.excluded_topics = [];
        }
      }

      if (rule.response_filters && typeof rule.response_filters === "string") {
        try {
          rule.response_filters = JSON.parse(rule.response_filters);
        } catch (e) {
          rule.response_filters = [];
        }
      }

      if (
        rule.knowledge_base_ids &&
        typeof rule.knowledge_base_ids === "string"
      ) {
        try {
          rule.knowledge_base_ids = JSON.parse(rule.knowledge_base_ids);
        } catch (e) {
          rule.knowledge_base_ids = [];
        }
      }

      return rule;
    }

    return null;
  } catch (error) {
    logger.error(`Error getting context rule ${ruleId}:`, error);
    return null;
  }
}

/**
 * Prepare prompt with context and knowledge base information
 * @param {string} message - User message
 * @param {Array} history - Conversation history
 * @param {Object} contextRule - Context rule
 * @returns {Promise<string>} Prepared prompt
 */
async function preparePrompt(message, history, contextRule) {
  try {
    let prompt = message;

    // If context rule exists, apply it
    if (contextRule) {
      // Use custom prompt template if available
      if (contextRule.prompt_template) {
        prompt = contextRule.prompt_template.replace("{{message}}", message);
      }

      // Add knowledge base information if enabled
      if (
        contextRule.use_knowledge_bases &&
        contextRule.knowledge_base_ids &&
        contextRule.knowledge_base_ids.length > 0
      ) {
        const relevantInfo = await getRelevantKnowledgeBaseInfo(
          message,
          contextRule.knowledge_base_ids,
        );

        if (relevantInfo) {
          prompt = `Context information:\n${relevantInfo}\n\nUser question: ${message}`;
        }
      }

      // Add excluded topics as instructions
      if (
        contextRule.excluded_topics &&
        contextRule.excluded_topics.length > 0
      ) {
        const topicsStr = contextRule.excluded_topics.join(", ");
        prompt = `Please do not discuss these topics: ${topicsStr}.\n\n${prompt}`;
      }
    }

    return prompt;
  } catch (error) {
    logger.error("Error preparing prompt:", error);
    return message; // Return original message on error
  }
}

/**
 * Get relevant information from knowledge bases
 * @param {string} query - User query
 * @param {Array} knowledgeBaseIds - Knowledge base IDs
 * @returns {Promise<string>} Relevant information
 */
async function getRelevantKnowledgeBaseInfo(query, knowledgeBaseIds) {
  try {
    const sequelize = await getMySQLClient();

    // Simple text search (in production, you'd use a vector database or search engine)
    const [results] = await sequelize.query(
      `SELECT d.content 
       FROM knowledge_base_documents d
       WHERE d.knowledge_base_id IN (?)
       AND (d.content LIKE ? OR d.title LIKE ?)
       ORDER BY LENGTH(d.content) ASC
       LIMIT 3`,
      {
        replacements: [knowledgeBaseIds, `%${query}%`, `%${query}%`],
      },
    );

    if (results && results.length > 0) {
      return results.map((r) => r.content).join("\n\n");
    }

    return null;
  } catch (error) {
    logger.error("Error getting knowledge base info:", error);
    return null;
  }
}

/**
 * Call OpenAI API
 * @param {string} prompt - Prepared prompt
 * @param {Array} history - Conversation history
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} AI response
 */
async function callOpenAIAPI(prompt, history, apiKey) {
  try {
    // In a real implementation, this would call the OpenAI API
    // For now, we'll simulate a response

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple response generation
    return `I'm here to help with your question about "${prompt.substring(0, 30)}...". How can I assist you further?`;
  } catch (error) {
    logger.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate AI response from OpenAI");
  }
}

/**
 * Call Gemini API
 * @param {string} prompt - Prepared prompt
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<string>} AI response
 */
async function callGeminiAPI(prompt, apiKey) {
  try {
    // In a real implementation, this would call the Gemini API
    // For now, we'll simulate a response

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple response generation
    return `Gemini AI response to your query about "${prompt.substring(0, 30)}...". Is there anything else you'd like to know?`;
  } catch (error) {
    logger.error("Error calling Gemini API:", error);
    throw new Error("Failed to generate AI response from Gemini");
  }
}

/**
 * Call HuggingFace API
 * @param {string} prompt - Prepared prompt
 * @param {string} apiKey - HuggingFace API key
 * @returns {Promise<string>} AI response
 */
async function callHuggingFaceAPI(prompt, apiKey) {
  try {
    // In a real implementation, this would call the HuggingFace API
    // For now, we'll simulate a response

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simple response generation
    return `HuggingFace model response to "${prompt.substring(0, 30)}...". Can I help with anything else?`;
  } catch (error) {
    logger.error("Error calling HuggingFace API:", error);
    throw new Error("Failed to generate AI response from HuggingFace");
  }
}

/**
 * Apply response filters to AI response
 * @param {string} response - AI response
 * @param {Array} filters - Response filters
 * @returns {string} Filtered response
 */
function applyResponseFilters(response, filters) {
  try {
    let filteredResponse = response;

    for (const filter of filters) {
      if (
        filter.type === "replace" &&
        filter.pattern &&
        filter.replacement !== undefined
      ) {
        const regex = new RegExp(filter.pattern, "gi");
        filteredResponse = filteredResponse.replace(regex, filter.replacement);
      } else if (filter.type === "append" && filter.text) {
        filteredResponse = `${filteredResponse}\n\n${filter.text}`;
      } else if (filter.type === "prepend" && filter.text) {
        filteredResponse = `${filter.text}\n\n${filteredResponse}`;
      }
    }

    return filteredResponse;
  } catch (error) {
    logger.error("Error applying response filters:", error);
    return response; // Return original response on error
  }
}

/**
 * Log AI interaction for analytics
 * @param {string} userMessage - User message
 * @param {string} aiResponse - AI response
 * @param {string} model - AI model used
 * @param {string} contextRuleId - Context rule ID
 * @returns {Promise<void>}
 */
async function logAIInteraction(userMessage, aiResponse, model, contextRuleId) {
  try {
    const sequelize = await getMySQLClient();

    await sequelize.query(
      `INSERT INTO ai_interactions (
        id, user_message, ai_response, model, context_rule_id, created_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?)`,
      {
        replacements: [
          userMessage,
          aiResponse,
          model,
          contextRuleId,
          new Date(),
        ],
      },
    );
  } catch (error) {
    logger.error("Error logging AI interaction:", error);
    // Non-critical error, don't throw
  }
}
