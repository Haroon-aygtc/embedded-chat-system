import { SystemSetting } from "@/models";
import { env } from "../config/env";
import logger from "../utils/logger";

/**
 * Service for managing API keys
 * Handles retrieval, validation, and rotation of API keys
 */
const apiKeyService = {
  /**
   * Get the Gemini API key
   * First checks environment variables, then falls back to database
   */
  getGeminiApiKey: async (): Promise<string | null> => {
    try {
      // First check if the API key is available in environment variables
      const envApiKey = env.GEMINI_API_KEY;
      if (envApiKey) {
        return envApiKey;
      }

      // If not in env, try to fetch from database
      const systemSetting = await SystemSetting.findOne({
        where: {
          category: "api_keys",
          environment: env.MODE || "development",
        },
      });

      if (!systemSetting) {
        logger.warn("No API key settings found in database");
        return null;
      }

      return systemSetting.settings?.gemini_api_key || null;
    } catch (error) {
      logger.error("Error fetching Gemini API key", error);
      return null;
    }
  },

  /**
   * Get the Hugging Face API key
   * First checks environment variables, then falls back to database
   */
  getHuggingFaceApiKey: async (): Promise<string | null> => {
    try {
      // First check if the API key is available in environment variables
      const envApiKey = env.HUGGINGFACE_API_KEY;
      if (envApiKey) {
        return envApiKey;
      }

      // If not in env, try to fetch from database
      const systemSetting = await SystemSetting.findOne({
        where: {
          category: "api_keys",
          environment: env.MODE || "development",
        },
      });

      if (!systemSetting) {
        logger.warn("No API key settings found in database");
        return null;
      }

      return systemSetting.settings?.huggingface_api_key || null;
    } catch (error) {
      logger.error("Error fetching Hugging Face API key", error);
      return null;
    }
  },

  /**
   * Store an API key in the database
   */
  storeApiKey: async (
    keyType: string,
    apiKey: string,
    environment: string = env.MODE || "development",
  ): Promise<boolean> => {
    try {
      // First check if a record exists
      const existingSettings = await SystemSetting.findOne({
        where: {
          category: "api_keys",
          environment,
        },
      });

      const settings = existingSettings?.settings || {};
      settings[`${keyType}_api_key`] = apiKey;

      if (existingSettings) {
        // Update existing record
        await existingSettings.update({
          settings,
          updated_at: new Date(),
        });
      } else {
        // Insert new record
        await SystemSetting.create({
          category: "api_keys",
          environment,
          settings,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      return true;
    } catch (error) {
      logger.error("Error storing API key", error);
      return false;
    }
  },

  /**
   * Validate if an API key is valid and working
   */
  validateApiKey: async (keyType: string, apiKey: string): Promise<boolean> => {
    try {
      // Implementation depends on the API provider
      switch (keyType) {
        case "gemini":
          // Make a simple request to Gemini API to validate the key
          // This is a placeholder - implement actual validation logic
          return true;
        case "huggingface":
          // Make a simple request to Hugging Face API to validate the key
          // This is a placeholder - implement actual validation logic
          return true;
        default:
          logger.error(`Unknown API key type: ${keyType}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error validating ${keyType} API key`, error);
      return false;
    }
  },
};

export default apiKeyService;
