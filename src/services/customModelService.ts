/**
 * Custom Model Service
 * Manages user-defined custom AI models
 */

import aiModelFactory from "./ai/aiModelFactory";
import { v4 as uuidv4 } from "uuid";

interface CustomModelConfig {
  name: string;
  endpoint: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
  headers?: Record<string, string>;
  [key: string]: any;
}

const customModelService = {
  /**
   * Add a new custom model
   */
  addCustomModel: async (config: CustomModelConfig) => {
    try {
      // Generate a unique ID for the model
      const modelId = `custom-${uuidv4().substring(0, 8)}`;

      // Register the model with the AI model factory
      const model = aiModelFactory.registerCustomModel(modelId, config.name, {
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 1024,
        headers: config.headers || {},
        ...config,
      });

      // Save the model configuration to persistent storage
      // This would typically be done via an API call to the backend
      await fetch("/api/admin/custom-models", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: modelId,
          name: config.name,
          endpoint: config.endpoint,
          // Don't include the API key in the request body for security
          // It should be stored securely on the server
        }),
      });

      return model;
    } catch (error) {
      console.error("Error adding custom model:", error);
      throw error;
    }
  },

  /**
   * Remove a custom model
   */
  removeCustomModel: async (modelId: string) => {
    try {
      // Unregister the model from the AI model factory
      const success = aiModelFactory.unregisterModel(modelId);

      if (success) {
        // Remove the model configuration from persistent storage
        await fetch(`/api/admin/custom-models/${modelId}`, {
          method: "DELETE",
        });
      }

      return success;
    } catch (error) {
      console.error("Error removing custom model:", error);
      throw error;
    }
  },

  /**
   * Get all custom models
   */
  getCustomModels: async () => {
    try {
      // Get all models from the AI model factory
      const allModels = aiModelFactory.getAllModels();

      // Filter for custom models only
      return allModels.filter((model) => model.provider === "Custom");
    } catch (error) {
      console.error("Error getting custom models:", error);
      return [];
    }
  },
};

export default customModelService;
