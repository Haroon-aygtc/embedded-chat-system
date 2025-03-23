import axios from "axios";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import { ContextRule } from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";
import { v4 as uuidv4 } from "uuid";
import { User, WidgetConfig, SystemSetting } from "@/models";
import { getMySQLClient } from "./mysqlClient";

// Create axios instance with base URL
const api = axios.create({
  baseURL: `/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("authToken");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  },
);

// Context Rules API
export const contextRulesApi = {
  getAll: async () => {
    try {
      const sequelize = getMySQLClient();
      const contextRules = await sequelize.query(
        `SELECT * FROM context_rules ORDER BY created_at DESC`,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Transform the data to match the ContextRule type
      return contextRules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || "",
        isActive: rule.is_active,
        contextType: rule.context_type,
        keywords: rule.keywords || [],
        excludedTopics: rule.excluded_topics || [],
        promptTemplate: rule.prompt_template || "",
        responseFilters: rule.response_filters || [],
        useKnowledgeBases: rule.use_knowledge_bases || false,
        knowledgeBaseIds: rule.knowledge_base_ids || [],
        preferredModel: rule.preferred_model,
        version: rule.version || 1,
        createdAt:
          rule.created_at instanceof Date
            ? rule.created_at.toISOString()
            : rule.created_at,
        updatedAt:
          rule.updated_at instanceof Date
            ? rule.updated_at.toISOString()
            : rule.updated_at,
      }));
    } catch (error) {
      logger.error(
        "Error fetching context rules",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return empty array when no data is available
      return [];
    }
  },

  getById: async (id) => {
    try {
      const sequelize = getMySQLClient();
      const [rule] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );
      if (!rule) {
        throw new Error("Context rule not found");
      }

      // Transform the data to match the ContextRule type
      return {
        id: rule.id,
        name: rule.name,
        description: rule.description || "",
        isActive: rule.is_active,
        contextType: rule.context_type,
        keywords: rule.keywords || [],
        excludedTopics: rule.excluded_topics || [],
        promptTemplate: rule.prompt_template || "",
        responseFilters: rule.response_filters || [],
        useKnowledgeBases: rule.use_knowledge_bases || false,
        knowledgeBaseIds: rule.knowledge_base_ids || [],
        preferredModel: rule.preferred_model,
        createdAt:
          rule.created_at instanceof Date
            ? rule.created_at.toISOString()
            : rule.created_at,
        updatedAt:
          rule.updated_at instanceof Date
            ? rule.updated_at.toISOString()
            : rule.updated_at,
      };
    } catch (error) {
      logger.error(
        `Error fetching context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // No data available
      throw new Error("Context rule not found");
    }
  },

  create: async (rule) => {
    try {
      // Transform the data to match the database schema
      const dbRule = {
        id: uuidv4(),
        name: rule.name,
        description: rule.description,
        is_active: rule.isActive,
        context_type: rule.contextType,
        keywords: rule.keywords,
        excluded_topics: rule.excludedTopics,
        prompt_template: rule.promptTemplate,
        response_filters: rule.responseFilters,
        use_knowledge_bases: rule.useKnowledgeBases,
        knowledge_base_ids: rule.knowledgeBaseIds,
        preferred_model: rule.preferredModel,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const sequelize = getMySQLClient();
      await sequelize.query(
        `INSERT INTO context_rules 
         (id, name, description, is_active, context_type, keywords, excluded_topics, 
          prompt_template, response_filters, use_knowledge_bases, knowledge_base_ids, 
          preferred_model, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            dbRule.id,
            dbRule.name,
            dbRule.description,
            dbRule.is_active,
            dbRule.context_type,
            JSON.stringify(dbRule.keywords),
            JSON.stringify(dbRule.excluded_topics),
            dbRule.prompt_template,
            JSON.stringify(dbRule.response_filters),
            dbRule.use_knowledge_bases,
            JSON.stringify(dbRule.knowledge_base_ids),
            dbRule.preferred_model,
            dbRule.created_at,
            dbRule.updated_at,
          ],
          type: sequelize.QueryTypes.INSERT,
        },
      );

      // Fetch the newly created rule
      const [newRule] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [dbRule.id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Transform back to ContextRule type
      return {
        id: newRule.id,
        name: newRule.name,
        description: newRule.description || "",
        isActive: newRule.is_active,
        contextType: newRule.context_type,
        keywords: newRule.keywords || [],
        excludedTopics: newRule.excluded_topics || [],
        promptTemplate: newRule.prompt_template || "",
        responseFilters: newRule.response_filters || [],
        useKnowledgeBases: newRule.use_knowledge_bases || false,
        knowledgeBaseIds: newRule.knowledge_base_ids || [],
        preferredModel: newRule.preferred_model,
        createdAt:
          newRule.created_at instanceof Date
            ? newRule.created_at.toISOString()
            : newRule.created_at,
        updatedAt:
          newRule.updated_at instanceof Date
            ? newRule.updated_at.toISOString()
            : newRule.updated_at,
      };
    } catch (error) {
      logger.error(
        "Error creating context rule",
        error instanceof Error ? error : new Error(String(error)),
      );
      // No data available
      throw new Error("Failed to create context rule");
    }
  },

  update: async (id, rule) => {
    try {
      const sequelize = getMySQLClient();
      const [existingRule] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!existingRule) {
        throw new Error("Context rule not found");
      }

      // Transform the data to match the database schema
      const dbRule = {};
      if (rule.name !== undefined) dbRule.name = rule.name;
      if (rule.description !== undefined) dbRule.description = rule.description;
      if (rule.isActive !== undefined) dbRule.is_active = rule.isActive;
      if (rule.contextType !== undefined)
        dbRule.context_type = rule.contextType;
      if (rule.keywords !== undefined) dbRule.keywords = rule.keywords;
      if (rule.excludedTopics !== undefined)
        dbRule.excluded_topics = rule.excludedTopics;
      if (rule.promptTemplate !== undefined)
        dbRule.prompt_template = rule.promptTemplate;
      if (rule.responseFilters !== undefined)
        dbRule.response_filters = rule.responseFilters;
      if (rule.useKnowledgeBases !== undefined)
        dbRule.use_knowledge_bases = rule.useKnowledgeBases;
      if (rule.knowledgeBaseIds !== undefined)
        dbRule.knowledge_base_ids = rule.knowledgeBaseIds;
      if (rule.preferredModel !== undefined)
        dbRule.preferred_model = rule.preferredModel;

      // Increment version and update timestamp
      dbRule.version = (existingRule.version || 1) + 1;
      dbRule.updated_at = new Date();

      // Build the SQL update statement dynamically
      const updateFields = [];
      const replacements = [];

      Object.entries(dbRule).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(
            `${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`,
          );
          replacements.push(
            typeof value === "object" ? JSON.stringify(value) : value,
          );
        }
      });

      if (updateFields.length > 0) {
        replacements.push(id);
        await sequelize.query(
          `UPDATE context_rules SET ${updateFields.join(", ")} WHERE id = ?`,
          {
            replacements,
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      }

      // Refresh from database
      const [updatedRule] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Transform back to ContextRule type
      return {
        id: updatedRule.id,
        name: updatedRule.name,
        description: updatedRule.description || "",
        isActive: updatedRule.is_active,
        contextType: updatedRule.context_type,
        keywords: updatedRule.keywords || [],
        excludedTopics: updatedRule.excluded_topics || [],
        promptTemplate: updatedRule.prompt_template || "",
        responseFilters: updatedRule.response_filters || [],
        useKnowledgeBases: updatedRule.use_knowledge_bases || false,
        knowledgeBaseIds: updatedRule.knowledge_base_ids || [],
        preferredModel: updatedRule.preferred_model,
        createdAt:
          updatedRule.created_at instanceof Date
            ? updatedRule.created_at.toISOString()
            : updatedRule.created_at,
        updatedAt:
          updatedRule.updated_at instanceof Date
            ? updatedRule.updated_at.toISOString()
            : updatedRule.updated_at,
      };
    } catch (error) {
      logger.error(
        `Error updating context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // No data available
      throw new Error("Failed to update context rule");
    }
  },

  delete: async (id) => {
    try {
      const sequelize = getMySQLClient();
      const [rule] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!rule) {
        throw new Error("Context rule not found");
      }

      await sequelize.query(`DELETE FROM context_rules WHERE id = ?`, {
        replacements: [id],
        type: sequelize.QueryTypes.DELETE,
      });
    } catch (error) {
      logger.error(
        `Error deleting context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Silently fail for demo purposes
    }
  },

  testRule: async (ruleId, query) => {
    try {
      // Get the rule
      const rule = await contextRulesApi.getById(ruleId);

      // Simple implementation: check if any keywords match
      const matches = rule.keywords.filter((keyword) =>
        query.toLowerCase().includes(keyword.toLowerCase()),
      );

      let result = "This query does not match the context rule.";
      if (matches.length > 0) {
        result = `This query matches the context rule with ${matches.length} keyword(s): ${matches.join(", ")}. The AI would respond using the context rule's prompt template.`;
      }

      return { result, matches };
    } catch (error) {
      logger.error(
        `Error testing context rule ${ruleId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // No data available
      throw new Error("Failed to test context rule");
    }
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message, contextRuleId) => {
    try {
      const response = await api.post("/chat/message", {
        message,
        contextRuleId,
      });
      return response.data;
    } catch (error) {
      logger.error(
        "Error sending chat message",
        error instanceof Error ? error : new Error(String(error)),
      );
      // No data available
      throw new Error("Failed to send chat message");
    }
  },

  getHistory: async () => {
    try {
      const response = await api.get("/chat/history");
      return response.data;
    } catch (error) {
      logger.error(
        "Error fetching chat history",
        error instanceof Error ? error : new Error(String(error)),
      );
      // No data available
      return [];
    }
  },

  // Delete chat history
  deleteChatHistory: async () => {
    try {
      const response = await api.delete("/chat/history");
      return { success: true };
    } catch (error) {
      logger.error(
        "Error deleting chat history",
        error instanceof Error ? error : new Error(String(error)),
      );
      return { success: false };
    }
  },

  // Get chat history for a specific context
  getContextHistory: async (contextRuleId) => {
    try {
      const response = await api.get(`/chat/history/${contextRuleId}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Error fetching chat history for context ${contextRuleId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return empty array for demo purposes
      return [];
    }
  },
};

// Widget Configuration API
export const widgetConfigApi = {
  getAll: async () => {
    try {
      const sequelize = getMySQLClient();
      const configs = await sequelize.query(`SELECT * FROM widget_configs`, {
        type: sequelize.QueryTypes.SELECT,
      });
      return configs;
    } catch (error) {
      logger.error(
        "Error fetching widget configurations",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return empty array on error
      return [];
    }
  },

  getByUserId: async (userId) => {
    try {
      const sequelize = getMySQLClient();
      const [config] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
        {
          replacements: [userId],
          type: sequelize.QueryTypes.SELECT,
        },
      );
      return config || null;
    } catch (error) {
      logger.error(
        `Error fetching widget configuration for user ${userId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  },

  getById: async (id) => {
    try {
      const sequelize = getMySQLClient();
      const [config] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );
      return config || null;
    } catch (error) {
      logger.error(
        `Error fetching widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  },

  create: async (config) => {
    try {
      const sequelize = getMySQLClient();
      const id = uuidv4();

      // Prepare fields and values for insertion
      const fields = ["id"];
      const placeholders = ["?"];
      const values = [id];

      Object.entries(config).forEach(([key, value]) => {
        fields.push(key.replace(/([A-Z])/g, "_$1").toLowerCase());
        placeholders.push("?");
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
      });

      // Add timestamps if not provided
      if (!fields.includes("created_at")) {
        fields.push("created_at");
        placeholders.push("?");
        values.push(new Date());
      }

      if (!fields.includes("updated_at")) {
        fields.push("updated_at");
        placeholders.push("?");
        values.push(new Date());
      }

      await sequelize.query(
        `INSERT INTO widget_configs (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
        {
          replacements: values,
          type: sequelize.QueryTypes.INSERT,
        },
      );

      // Fetch the newly created config
      const [newConfig] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return newConfig;
    } catch (error) {
      logger.error(
        "Error creating widget configuration",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  },

  update: async (id, config) => {
    try {
      const sequelize = getMySQLClient();
      const [existingConfig] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!existingConfig) {
        throw new Error("Widget configuration not found");
      }

      // Build the SQL update statement dynamically
      const updateFields = [];
      const replacements = [];

      Object.entries(config).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(
            `${key.replace(/([A-Z])/g, "_$1").toLowerCase()} = ?`,
          );
          replacements.push(
            typeof value === "object" ? JSON.stringify(value) : value,
          );
        }
      });

      // Add updated_at timestamp
      updateFields.push("updated_at = ?");
      replacements.push(new Date());

      if (updateFields.length > 0) {
        replacements.push(id);
        await sequelize.query(
          `UPDATE widget_configs SET ${updateFields.join(", ")} WHERE id = ?`,
          {
            replacements,
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      }

      // Fetch the updated config
      const [updatedConfig] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return updatedConfig;
    } catch (error) {
      logger.error(
        `Error updating widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  },

  delete: async (id) => {
    try {
      const sequelize = getMySQLClient();
      const [config] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!config) {
        throw new Error("Widget configuration not found");
      }

      await sequelize.query(`DELETE FROM widget_configs WHERE id = ?`, {
        replacements: [id],
        type: sequelize.QueryTypes.DELETE,
      });
      return true;
    } catch (error) {
      logger.error(
        `Error deleting widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  },
};

// System Settings API
export const systemSettingsApi = {
  getSettings: async (category, environment = "production") => {
    try {
      const sequelize = getMySQLClient();
      const [setting] = await sequelize.query(
        `SELECT * FROM system_settings WHERE category = ? AND environment = ?`,
        {
          replacements: [category, environment],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!setting) {
        throw new Error(
          `Settings not found for category ${category} and environment ${environment}`,
        );
      }

      return setting.settings;
    } catch (error) {
      logger.error(
        `Error fetching system settings for category ${category} and environment ${environment}`,
        error instanceof Error ? error : new Error(String(error)),
      );

      // No data available
      return {};
    }
  },

  saveSettings: async (category, settings, environment = "production") => {
    try {
      // Check if settings for this category and environment already exist
      const sequelize = getMySQLClient();
      const [existingSetting] = await sequelize.query(
        `SELECT * FROM system_settings WHERE category = ? AND environment = ?`,
        {
          replacements: [category, environment],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (existingSetting) {
        // Update existing settings
        await sequelize.query(
          `UPDATE system_settings SET settings = ?, updated_at = ? WHERE id = ?`,
          {
            replacements: [
              JSON.stringify(settings),
              new Date(),
              existingSetting.id,
            ],
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      } else {
        // Create new settings
        await sequelize.query(
          `INSERT INTO system_settings (id, category, environment, settings, created_at, updated_at) 
           VALUES (UUID(), ?, ?, ?, ?, ?)`,
          {
            replacements: [
              category,
              environment,
              JSON.stringify(settings),
              new Date(),
              new Date(),
            ],
            type: sequelize.QueryTypes.INSERT,
          },
        );
      }

      return { success: true };
    } catch (error) {
      logger.error(
        `Error saving system settings for category ${category} and environment ${environment}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      return { success: false };
    }
  },
};

export default {
  contextRulesApi,
  chatApi,
  widgetConfigApi,
  systemSettingsApi,
};
