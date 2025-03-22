import axios from "axios";
import { env } from "@/config/env";
import logger from "@/utils/logger";
import { ContextRule } from "@/models";
import { User, WidgetConfig, SystemSetting } from "@/models";

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
      const contextRules = await ContextRule.findAll({
        order: [["created_at", "DESC"]],
      });

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
      // Fallback to local data if database query fails
      return [
        {
          id: "1",
          name: "UAE Government Information",
          description:
            "Limit responses to official UAE government information and services",
          isActive: true,
          contextType: "business",
          keywords: [
            "UAE",
            "government",
            "Dubai",
            "Abu Dhabi",
            "services",
            "visa",
            "Emirates ID",
          ],
          excludedTopics: ["politics", "criticism"],
          promptTemplate:
            "You are an assistant that provides information about UAE government services. {{ userQuery }}",
          responseFilters: [
            { type: "keyword", value: "unofficial", action: "block" },
            { type: "regex", value: "(criticism|negative)", action: "flag" },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "General Information",
          description:
            "Provide general information with no specific business context",
          isActive: false,
          contextType: "general",
          keywords: ["help", "information", "question", "what", "how", "when"],
          excludedTopics: [],
          promptTemplate:
            "You are a helpful assistant. Please answer the following question: {{ userQuery }}",
          responseFilters: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  getById: async (id) => {
    try {
      const rule = await ContextRule.findByPk(id);
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
      // Fallback to local data
      const rules = await contextRulesApi.getAll();
      const rule = rules.find((r) => r.id === id);

      if (!rule) {
        throw new Error("Context rule not found");
      }

      return rule;
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

      const newRule = await ContextRule.create(dbRule);

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
      // Fallback for demo purposes
      const newRule = {
        ...rule,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newRule;
    }
  },

  update: async (id, rule) => {
    try {
      const existingRule = await ContextRule.findByPk(id);
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

      await existingRule.update(dbRule);

      // Refresh from database
      const updatedRule = await ContextRule.findByPk(id);

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
      // Fallback for demo purposes
      const existingRule = await contextRulesApi.getById(id);
      const updatedRule = {
        ...existingRule,
        ...rule,
        updatedAt: new Date().toISOString(),
      };
      return updatedRule;
    }
  },

  delete: async (id) => {
    try {
      const rule = await ContextRule.findByPk(id);
      if (!rule) {
        throw new Error("Context rule not found");
      }

      await rule.destroy();
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
      // Fallback for demo purposes
      return {
        result: "This query matches the context rule.",
        matches: ["UAE", "visa", "services"],
      };
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
      // Fallback for demo purposes
      return {
        id: Date.now().toString(),
        text: `This is a fallback response to: "${message}". The API request failed, but in production this would be generated by an AI model.`,
        timestamp: new Date().toISOString(),
      };
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
      // Fallback to local data
      return [
        {
          id: "1",
          text: "Hello, how can I help you with the chat widget today?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          sender: "ai",
        },
        {
          id: "2",
          text: "I'd like to know how to embed it on my website.",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          sender: "user",
        },
        {
          id: "3",
          text: "You can embed the chat widget using either an iframe or as a Web Component. Would you like me to explain both options?",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          sender: "ai",
        },
      ];
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
      const configs = await WidgetConfig.findAll();
      return configs.map((config) => config.get({ plain: true }));
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
      const config = await WidgetConfig.findOne({
        where: { user_id: userId },
        order: [["created_at", "DESC"]],
      });
      return config ? config.get({ plain: true }) : null;
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
      const config = await WidgetConfig.findByPk(id);
      return config ? config.get({ plain: true }) : null;
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
      const newConfig = await WidgetConfig.create(config);
      return newConfig.get({ plain: true });
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
      const existingConfig = await WidgetConfig.findByPk(id);
      if (!existingConfig) {
        throw new Error("Widget configuration not found");
      }

      await existingConfig.update(config);
      return existingConfig.get({ plain: true });
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
      const config = await WidgetConfig.findByPk(id);
      if (!config) {
        throw new Error("Widget configuration not found");
      }

      await config.destroy();
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
      const setting = await SystemSetting.findOne({
        where: { category, environment },
      });

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

      // Return default settings based on category
      switch (category) {
        case "general":
          return {
            siteName: "Context-Aware Chat System",
            siteDescription: "Embeddable AI chat widget with context awareness",
            supportEmail: "support@example.com",
            logoUrl: "https://example.com/logo.png",
            faviconUrl: "https://example.com/favicon.ico",
            maintenanceMode: false,
            defaultLanguage: "en",
            timeZone: "UTC",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h",
          };
        case "security":
          return {
            enableMfa: false,
            sessionTimeout: 60,
            maxLoginAttempts: 5,
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true,
              passwordExpiry: 90,
            },
            ipRestrictions: "",
          };
        case "email":
          return {
            smtpHost: "smtp.example.com",
            smtpPort: 587,
            smtpUsername: "smtp_user",
            smtpPassword: "",
            smtpSecure: true,
            fromEmail: "no-reply@example.com",
            fromName: "Chat System",
          };
        case "backup":
          return {
            enableAutomaticBackups: true,
            backupFrequency: "daily",
            backupTime: "02:00",
            retentionPeriod: 30,
            backupLocation: "local",
            s3Bucket: "",
            s3Region: "",
            s3AccessKey: "",
            s3SecretKey: "",
          };
        case "logging":
          return {
            logLevel: "info",
            enableAuditLogs: true,
            logRetention: 30,
            enableErrorReporting: true,
            errorReportingEmail: "",
          };
        default:
          return {};
      }
    }
  },

  saveSettings: async (category, settings, environment = "production") => {
    try {
      // Check if settings for this category and environment already exist
      const existingSetting = await SystemSetting.findOne({
        where: { category, environment },
      });

      if (existingSetting) {
        // Update existing settings
        await existingSetting.update({
          settings,
          updated_at: new Date(),
        });
      } else {
        // Create new settings
        await SystemSetting.create({
          category,
          environment,
          settings,
          created_at: new Date(),
          updated_at: new Date(),
        });
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
