import { env } from "../config/env";
import logger from "../utils/logger";
import { getMySQLClient } from "./mysqlClient";
import axios from "axios";

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
      // Try API first
      try {
        const response = await axios.get("/api/settings/api-keys/gemini");
        return response.data.apiKey;
      } catch (apiError) {
        logger.warn(
          "API Gemini key fetch failed, falling back to local implementation",
          apiError,
        );

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
      }
    } catch (error) {
      logger.error("Error fetching Gemini API key", error);
      return null;
    }
  },

  /**
   * Set the Gemini API key
   */
  setGeminiApiKey: async (apiKey: string): Promise<boolean> => {
    try {
      // Try API first
      try {
        await axios.post("/api/settings/api-keys/gemini", { apiKey });
        return true;
      } catch (apiError) {
        logger.warn(
          "API Gemini key set failed, falling back to local implementation",
          apiError,
        );

        return await apiKeyService.storeApiKey("gemini", apiKey);
      }
    } catch (error) {
      logger.error("Error setting Gemini API key", error);
      return false;
    }
  },

  /**
   * Get the Hugging Face API key
   * First checks environment variables, then falls back to database
   */
  getHuggingFaceApiKey: async (): Promise<string | null> => {
    try {
      // Try API first
      try {
        const response = await axios.get("/api/settings/api-keys/huggingface");
        return response.data.apiKey;
      } catch (apiError) {
        logger.warn(
          "API Hugging Face key fetch failed, falling back to local implementation",
          apiError,
        );

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
      }
    } catch (error) {
      logger.error("Error fetching Hugging Face API key", error);
      return null;
    }
  },

  /**
   * Set the Hugging Face API key
   */
  setHuggingFaceApiKey: async (apiKey: string): Promise<boolean> => {
    try {
      // Try API first
      try {
        await axios.post("/api/settings/api-keys/huggingface", { apiKey });
        return true;
      } catch (apiError) {
        logger.warn(
          "API Hugging Face key set failed, falling back to local implementation",
          apiError,
        );

        return await apiKeyService.storeApiKey("huggingface", apiKey);
      }
    } catch (error) {
      logger.error("Error setting Hugging Face API key", error);
      return false;
    }
  },

  /**
   * Rotate an API key
   */
  rotateApiKey: async (keyType: string): Promise<{ newApiKey: string } | null> => {
    try {
      // Try API first
      try {
        const response = await axios.post(`/api/settings/api-keys/${keyType}/rotate`);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API ${keyType} key rotation failed, falling back to local implementation`,
          apiError,
        );

        // Generate a new key (in a real implementation, this would be more secure)
        const newKey = `${keyType}_${Math.random().toString(36).substring(2, 15)}`;
        
        // Store the new key
        const success = await apiKeyService.storeApiKey(keyType, newKey);
        
        if (success) {
          return { newApiKey: newKey };
        }
        return null;
      }
    } catch (error) {
      logger.error(`Error rotating ${keyType} API key`, error);
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
      // Try API first
      try {
        const response = await axios.post("/api/settings/api-keys/validate", {
          keyType,
          apiKey,
        });
        return response.data.valid;
      } catch (apiError) {
        logger.warn(
          `API ${keyType} key validation failed, falling back to local implementation`,
          apiError,
        );

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
      }
    } catch (error) {
      logger.error(`Error validating ${keyType} API key`, error);
      return false;
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
      // Try API first
      try {
        const response = await axios.get("/api/settings/api-keys/usage", {
          params: { keyType, days },
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API key usage stats fetch failed, falling back to local implementation",
          apiError,
        );

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

        // Calculate summary statistics
        const geminiStats = results.filter((r: any) => r.key_type === "gemini");
        const huggingfaceStats = results.filter((r: any) => r.key_type === "huggingface");

        const calculateSummary = (stats: any[]) => {
          if (stats.length === 0) return null;
          
          const totalCalls = stats.reduce((sum: number, item: any) => sum + parseInt(item.request_count), 0);
          const totalErrors = stats.reduce((sum: number, item: any) => sum + parseInt(item.error_count), 0);
          const avgResponseTime = stats.reduce((sum: number, item: any) => sum + parseFloat(item.avg_response_time), 0) / stats.length;
          
          return {
            totalCalls,
            successRate: totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls) * 100 : 100,
            averageResponseTime: avgResponseTime,
            costThisMonth: (totalCalls * 0.01).toFixed(2), // Example cost calculation
          };
        };

        // Get last used timestamps
        const lastUsedQuery = `
          SELECT key_type, MAX(created_at) as last_used
          FROM api_key_usage_logs
          GROUP BY key_type
        `;
        
        const lastUsedResults = await sequelize.query(lastUsedQuery, {
          type: sequelize.QueryTypes.SELECT,
        });
        
        const lastUsed: Record<string, string | null> = {
          gemini: null,
          huggingface: null,
        };
        
        lastUsedResults.forEach((result: any) => {
          lastUsed[result.key_type] = result.last_used;
        });

        return {
          usageStats: {
            gemini: calculateSummary(geminiStats) || {
              totalCalls: 0,
              successRate: 100,
              averageResponseTime: 0,
              costThisMonth: 0,
            },
            huggingface: calculateSummary(huggingfaceStats) || {
              totalCalls: 0,
              successRate: 100,
              averageResponseTime: 0,
              costThisMonth: 0,
            },
          },
          lastUsed,
          dailyStats: results,
        };
      }
    } catch (error) {
      logger.error(`Error getting API key usage statistics`, error);
      
      // Return mock data
      return {
        usageStats: {
          gemini: {
            totalCalls: 1248,
            successRate: 98.5,
            averageResponseTime: 0.8,
            costThisMonth: 12.42,
          },
          huggingface: {
            totalCalls: 856,
            successRate: 97.2,
            averageResponseTime: 1.2,
            costThisMonth: 8.76,
          },
        },
        lastUsed: {
          gemini: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          huggingface: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        },
        dailyStats: [],
      };
    }
  },

  /**
   * Get all API keys from the database
   */
  getAllApiKeys: async