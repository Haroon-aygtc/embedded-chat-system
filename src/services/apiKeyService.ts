import { env } from "../config/env";
import logger from "../utils/logger";
import { getMySQLClient } from "./mysqlClient";

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
      const sequelize = await getMySQLClient();
      const [result] = await sequelize.query(
        `SELECT settings FROM system_settings 
         WHERE category = 'api_keys' AND environment = ?`,
        {
          replacements: [env.MODE || "development"],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!result) {
        logger.warn("No API key settings found in database");
        return null;
      }

      const settings =
        typeof result.settings === "string"
          ? JSON.parse(result.settings)
          : result.settings;

      return settings?.gemini_api_key || null;
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
      const sequelize = await getMySQLClient();
      const [result] = await sequelize.query(
        `SELECT settings FROM system_settings 
         WHERE category = 'api_keys' AND environment = ?`,
        {
          replacements: [env.MODE || "development"],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!result) {
        logger.warn("No API key settings found in database");
        return null;
      }

      const settings =
        typeof result.settings === "string"
          ? JSON.parse(result.settings)
          : result.settings;

      return settings?.huggingface_api_key || null;
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
      const sequelize = await getMySQLClient();

      // Check if a record exists
      const [existingSettings] = await sequelize.query(
        `SELECT id, settings FROM system_settings 
         WHERE category = 'api_keys' AND environment = ?`,
        {
          replacements: [environment],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const settings = existingSettings?.settings
        ? typeof existingSettings.settings === "string"
          ? JSON.parse(existingSettings.settings)
          : existingSettings.settings
        : {};

      settings[`${keyType}_api_key`] = apiKey;

      if (existingSettings) {
        // Update existing record
        await sequelize.query(
          `UPDATE system_settings 
           SET settings = ?, updated_at = NOW() 
           WHERE id = ?`,
          {
            replacements: [JSON.stringify(settings), existingSettings.id],
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      } else {
        // Insert new record
        await sequelize.query(
          `INSERT INTO system_settings 
           (id, category, environment, settings, created_at, updated_at) 
           VALUES (UUID(), 'api_keys', ?, ?, NOW(), NOW())`,
          {
            replacements: [environment, JSON.stringify(settings)],
            type: sequelize.QueryTypes.INSERT,
          },
        );
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
          const geminiEndpoint =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
          const response = await fetch(`${geminiEndpoint}?key=${apiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Hello",
                    },
                  ],
                },
              ],
            }),
          });
          return response.status !== 401 && response.status !== 403;

        case "huggingface":
          // Make a simple request to Hugging Face API to validate the key
          const huggingfaceEndpoint =
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
          const hfResponse = await fetch(huggingfaceEndpoint, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: "Hello",
            }),
          });
          return hfResponse.status !== 401 && hfResponse.status !== 403;

        default:
          logger.error(`Unknown API key type: ${keyType}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error validating ${keyType} API key`, error);
      return false;
    }
  },

  /**
   * Check if the API usage is within rate limits
   */
  checkRateLimit: async (keyType: string): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Count API calls in the last hour
      const [result] = await sequelize.query(
        `SELECT COUNT(*) as count FROM api_key_usage_logs 
         WHERE key_type = ? AND created_at > ?`,
        {
          replacements: [keyType, hourAgo],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const count = result.count || 0;

      // Define rate limits based on key type
      const rateLimit = keyType === "gemini" ? 100 : 50; // Example limits

      return count < rateLimit;
    } catch (error) {
      logger.error(`Error checking rate limit for ${keyType}`, error);
      // Default to allowing the request in case of error
      return true;
    }
  },

  /**
   * Log API key usage for monitoring and rate limiting
   */
  logApiKeyUsage: async (
    keyType: string,
    operation: string,
    responseTime: number,
    statusCode: number,
  ): Promise<void> => {
    try {
      const sequelize = await getMySQLClient();

      await sequelize.query(
        `INSERT INTO api_key_usage_logs 
         (id, key_type, operation, response_time_ms, status_code, created_at) 
         VALUES (UUID(), ?, ?, ?, ?, NOW())`,
        {
          replacements: [keyType, operation, responseTime, statusCode],
          type: sequelize.QueryTypes.INSERT,
        },
      );
    } catch (error) {
      logger.error(`Error logging API key usage for ${keyType}`, error);
      // Silently fail as this is just for monitoring
    }
  },

  /**
   * Get API key usage statistics
   */
  getApiKeyUsageStats: async (
    keyType?: string,
    days: number = 7,
  ): Promise<any> => {
    try {
      const sequelize = await getMySQLClient();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = `
        SELECT 
          key_type, 
          DATE(created_at) as date, 
          COUNT(*) as request_count,
          AVG(response_time_ms) as avg_response_time,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
        FROM api_key_usage_logs
        WHERE created_at >= ?
      `;

      const replacements = [startDate];

      if (keyType) {
        query += ` AND key_type = ?`;
        replacements.push(keyType);
      }

      query += ` GROUP BY key_type, DATE(created_at) ORDER BY date DESC, key_type`;

      const results = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      });

      return results;
    } catch (error) {
      logger.error(`Error getting API key usage statistics`, error);
      return [];
    }
  },

  /**
   * Get all API keys from the database
   */
  getAllApiKeys: async (): Promise<any[]> => {
    try {
      const sequelize = await getMySQLClient();

      const [settings] = await sequelize.query(
        `SELECT * FROM system_settings WHERE category = 'api_keys'`,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!settings) {
        return [];
      }

      const apiKeySettings =
        typeof settings.settings === "string"
          ? JSON.parse(settings.settings)
          : settings.settings;

      const keys = [];

      if (apiKeySettings.gemini_api_key) {
        keys.push({
          type: "gemini",
          key: `${apiKeySettings.gemini_api_key.substring(0, 4)}...${apiKeySettings.gemini_api_key.substring(apiKeySettings.gemini_api_key.length - 4)}`,
          environment: settings.environment,
          lastUpdated: settings.updated_at,
        });
      }

      if (apiKeySettings.huggingface_api_key) {
        keys.push({
          type: "huggingface",
          key: `${apiKeySettings.huggingface_api_key.substring(0, 4)}...${apiKeySettings.huggingface_api_key.substring(apiKeySettings.huggingface_api_key.length - 4)}`,
          environment: settings.environment,
          lastUpdated: settings.updated_at,
        });
      }

      return keys;
    } catch (error) {
      logger.error(`Error getting all API keys`, error);
      return [];
    }
  },
};

export default apiKeyService;
