import logger from "@/utils/logger";
import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  isAvailable: boolean;
  isDefault: boolean;
  apiKeyConfigured: boolean;
  maxTokens?: number;
  temperature?: number;
  customEndpoint?: string;
  additionalParams?: Record<string, any>;
}

export interface ModelPerformance {
  modelId: string;
  avgResponseTime: number;
  totalRequests: number;
  successRate: number;
  lastUsed: string;
}

const aiModelService = {
  /**
   * Get all available AI models
   */
  getAvailableModels: async (): Promise<AIModel[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM ai_models WHERE is_active = 1`,
        { type: sequelize.QueryTypes.SELECT },
      );

      return (results as any[]).map((model) => ({
        id: model.id,
        name: model.name,
        provider: model.provider,
        isAvailable: model.is_available === 1,
        isDefault: model.is_default === 1,
        apiKeyConfigured: model.api_key_configured === 1,
        maxTokens: model.max_tokens,
        temperature: model.temperature,
        customEndpoint: model.custom_endpoint,
        additionalParams: model.additional_params
          ? JSON.parse(model.additional_params)
          : {},
      }));
    } catch (error) {
      logger.error("Error fetching AI models:", error);
      return [];
    }
  },

  /**
   * Get the default AI model
   */
  getDefaultModel: async (): Promise<AIModel | null> => {
    try {
      const sequelize = await getMySQLClient();
      const [result] = await sequelize.query(
        `SELECT * FROM ai_models WHERE is_default = 1 AND is_active = 1 LIMIT 1`,
        { type: sequelize.QueryTypes.SELECT },
      );

      if (!result) return null;

      return {
        id: result.id,
        name: result.name,
        provider: result.provider,
        isAvailable: result.is_available === 1,
        isDefault: result.is_default === 1,
        apiKeyConfigured: result.api_key_configured === 1,
        maxTokens: result.max_tokens,
        temperature: result.temperature,
        customEndpoint: result.custom_endpoint,
        additionalParams: result.additional_params
          ? JSON.parse(result.additional_params)
          : {},
      };
    } catch (error) {
      logger.error("Error fetching default AI model:", error);
      return null;
    }
  },

  /**
   * Set a model as the default
   */
  setDefaultModel: async (modelId: string): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();

      // First, set all models to non-default
      await sequelize.query(`UPDATE ai_models SET is_default = 0`, {
        type: sequelize.QueryTypes.UPDATE,
      });

      // Then set the selected model as default
      await sequelize.query(
        `UPDATE ai_models SET is_default = 1 WHERE id = ?`,
        {
          replacements: [modelId],
          type: sequelize.QueryTypes.UPDATE,
        },
      );

      return true;
    } catch (error) {
      logger.error(`Error setting default model ${modelId}:`, error);
      return false;
    }
  },

  /**
   * Get model performance metrics
   */
  getModelPerformance: async (): Promise<ModelPerformance[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT 
          model_used as modelId, 
          COUNT(*) as totalRequests,
          AVG(TIMESTAMPDIFF(MICROSECOND, created_at, updated_at)/1000000) as avgResponseTime,
          (COUNT(CASE WHEN response IS NOT NULL THEN 1 END) * 100 / COUNT(*)) as successRate,
          MAX(created_at) as lastUsed
        FROM ai_interaction_logs 
        GROUP BY model_used`,
        { type: sequelize.QueryTypes.SELECT },
      );

      return results as ModelPerformance[];
    } catch (error) {
      logger.error("Error fetching model performance metrics:", error);
      return [];
    }
  },

  /**
   * Update model configuration
   */
  updateModelConfig: async (
    modelId: string,
    config: Partial<AIModel>,
  ): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();
      const updateFields = [];
      const replacements = [];

      if (config.maxTokens !== undefined) {
        updateFields.push("max_tokens = ?");
        replacements.push(config.maxTokens);
      }

      if (config.temperature !== undefined) {
        updateFields.push("temperature = ?");
        replacements.push(config.temperature);
      }

      if (config.customEndpoint !== undefined) {
        updateFields.push("custom_endpoint = ?");
        replacements.push(config.customEndpoint || null);
      }

      if (config.additionalParams !== undefined) {
        updateFields.push("additional_params = ?");
        replacements.push(JSON.stringify(config.additionalParams || {}));
      }

      if (config.isAvailable !== undefined) {
        updateFields.push("is_available = ?");
        replacements.push(config.isAvailable ? 1 : 0);
      }

      if (updateFields.length === 0) return true; // Nothing to update

      // Add updated_at timestamp
      updateFields.push("updated_at = ?");
      replacements.push(new Date().toISOString());

      // Add ID to replacements
      replacements.push(modelId);

      await sequelize.query(
        `UPDATE ai_models SET ${updateFields.join(", ")} WHERE id = ?`,
        {
          replacements,
          type: sequelize.QueryTypes.UPDATE,
        },
      );

      return true;
    } catch (error) {
      logger.error(`Error updating model ${modelId} configuration:`, error);
      return false;
    }
  },

  /**
   * Add a custom model
   */
  addCustomModel: async (
    name: string,
    endpoint: string,
  ): Promise<string | null> => {
    try {
      const sequelize = await getMySQLClient();
      const id = uuidv4();

      await sequelize.query(
        `INSERT INTO ai_models (
          id, name, provider, custom_endpoint, is_active, is_available, 
          api_key_configured, created_at, updated_at
        ) VALUES (?, ?, 'Custom', ?, 1, 1, 1, ?, ?)`,
        {
          replacements: [
            id,
            name,
            endpoint,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
          type: sequelize.QueryTypes.INSERT,
        },
      );

      return id;
    } catch (error) {
      logger.error("Error adding custom model:", error);
      return null;
    }
  },

  /**
   * Remove a model
   */
  removeModel: async (modelId: string, isCustom: boolean): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();

      if (isCustom) {
        // For custom models, we can delete them entirely
        await sequelize.query(`DELETE FROM ai_models WHERE id = ?`, {
          replacements: [modelId],
          type: sequelize.QueryTypes.DELETE,
        });
      } else {
        // For built-in models, just mark them as inactive
        await sequelize.query(
          `UPDATE ai_models SET is_active = 0, updated_at = ? WHERE id = ?`,
          {
            replacements: [new Date().toISOString(), modelId],
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      }

      return true;
    } catch (error) {
      logger.error(`Error removing model ${modelId}:`, error);
      return false;
    }
  },

  /**
   * Save API key for a provider
   */
  saveApiKey: async (provider: string, apiKey: string): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();

      await sequelize.query(
        `INSERT INTO api_keys (provider, api_key, created_at, updated_at) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE api_key = ?, updated_at = ?`,
        {
          replacements: [
            provider,
            apiKey,
            new Date().toISOString(),
            new Date().toISOString(),
            apiKey,
            new Date().toISOString(),
          ],
          type: sequelize.QueryTypes.INSERT,
        },
      );

      // Update model availability based on API key
      await sequelize.query(
        `UPDATE ai_models SET api_key_configured = 1, is_available = 1 
         WHERE provider = ?`,
        {
          replacements: [provider],
          type: sequelize.QueryTypes.UPDATE,
        },
      );

      return true;
    } catch (error) {
      logger.error(`Error saving API key for provider ${provider}:`, error);
      return false;
    }
  },

  /**
   * Test a model with a query
   */
  testModel: async (
    modelId: string,
    query: string,
  ): Promise<{ success: boolean; response?: string; error?: string }> => {
    try {
      const sequelize = await getMySQLClient();

      // Get the model details
      const [model] = await sequelize.query(
        `SELECT * FROM ai_models WHERE id = ?`,
        {
          replacements: [modelId],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!model) {
        return { success: false, error: "Model not found" };
      }

      // Get the API key for the model's provider
      const [apiKeyResult] = await sequelize.query(
        `SELECT api_key FROM api_keys WHERE provider = ?`,
        {
          replacements: [model.provider],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (
        !apiKeyResult &&
        model.provider !== "Custom" &&
        model.provider !== "Fallback"
      ) {
        return {
          success: false,
          error: "API key not configured for this provider",
        };
      }

      // Log the test request
      const testId = uuidv4();
      await sequelize.query(
        `INSERT INTO ai_interaction_logs (
          id, user_id, query, model_used, created_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            testId,
            "admin",
            query,
            model.name,
            new Date().toISOString(),
            JSON.stringify({ isTest: true }),
          ],
          type: sequelize.QueryTypes.INSERT,
        },
      );

      // For a real implementation, this would call the actual AI model API
      // Here we're simulating a response for demonstration purposes
      const response = `This is a test response from ${model.name} for query: "${query}". In a production environment, this would be processed by the actual AI model.`;

      // Update the test log with the response
      await sequelize.query(
        `UPDATE ai_interaction_logs SET 
          response = ?, updated_at = ? 
         WHERE id = ?`,
        {
          replacements: [response, new Date().toISOString(), testId],
          type: sequelize.QueryTypes.UPDATE,
        },
      );

      return { success: true, response };
    } catch (error) {
      logger.error(`Error testing model ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};

export default aiModelService;
