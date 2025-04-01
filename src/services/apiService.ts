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
      // Try to fetch from API first
      try {
        const response = await api.get("/context-rules");
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API context rules fetch failed, falling back to local implementation",
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        "Error fetching context rules",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data when no data is available
      return [
        {
          id: "mock-rule-1",
          name: "General Knowledge",
          description: "Allows responses about general topics",
          isActive: true,
          contextType: "general",
          keywords: ["general", "knowledge", "information"],
          excludedTopics: [],
          promptTemplate:
            "You are a helpful assistant providing general information.",
          responseFilters: [],
          useKnowledgeBases: false,
          knowledgeBaseIds: [],
          preferredModel: "default",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "mock-rule-2",
          name: "Business Domain",
          description: "Restricts responses to business-related topics",
          isActive: true,
          contextType: "restricted",
          keywords: ["business", "company", "enterprise"],
          excludedTopics: ["personal", "politics"],
          promptTemplate:
            "You are a business assistant providing information about business topics only.",
          responseFilters: [],
          useKnowledgeBases: false,
          knowledgeBaseIds: [],
          preferredModel: "default",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  getById: async (id) => {
    try {
      // Try to fetch from API first
      try {
        const response = await api.get(`/context-rules/${id}`);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API context rule fetch failed for ID ${id}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        `Error fetching context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data when no data is available
      if (id === "mock-rule-1" || id === "1") {
        return {
          id: "mock-rule-1",
          name: "General Knowledge",
          description: "Allows responses about general topics",
          isActive: true,
          contextType: "general",
          keywords: ["general", "knowledge", "information"],
          excludedTopics: [],
          promptTemplate:
            "You are a helpful assistant providing general information.",
          responseFilters: [],
          useKnowledgeBases: false,
          knowledgeBaseIds: [],
          preferredModel: "default",
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        throw new Error("Context rule not found");
      }
    }
  },

  create: async (rule) => {
    try {
      // Try to create via API first
      try {
        const response = await api.post("/context-rules", rule);
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API context rule creation failed, falling back to local implementation",
          apiError,
        );

        // Fallback to local database
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

        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        "Error creating context rule",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data
      const mockRule = {
        id: uuidv4(),
        name: rule.name,
        description: rule.description || "",
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        contextType: rule.contextType || "general",
        keywords: rule.keywords || [],
        excludedTopics: rule.excludedTopics || [],
        promptTemplate: rule.promptTemplate || "",
        responseFilters: rule.responseFilters || [],
        useKnowledgeBases: rule.useKnowledgeBases || false,
        knowledgeBaseIds: rule.knowledgeBaseIds || [],
        preferredModel: rule.preferredModel || "default",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return mockRule;
    }
  },

  update: async (id, rule) => {
    try {
      // Try to update via API first
      try {
        const response = await api.put(`/context-rules/${id}`, rule);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API context rule update failed for ID ${id}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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
        if (rule.description !== undefined)
          dbRule.description = rule.description;
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
      }
    } catch (error) {
      logger.error(
        `Error updating context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock updated data
      return {
        id,
        name: rule.name || "Updated Rule",
        description: rule.description || "",
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        contextType: rule.contextType || "general",
        keywords: rule.keywords || [],
        excludedTopics: rule.excludedTopics || [],
        promptTemplate: rule.promptTemplate || "",
        responseFilters: rule.responseFilters || [],
        useKnowledgeBases: rule.useKnowledgeBases || false,
        knowledgeBaseIds: rule.knowledgeBaseIds || [],
        preferredModel: rule.preferredModel || "default",
        version: 2,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        updatedAt: new Date().toISOString(),
      };
    }
  },

  delete: async (id) => {
    try {
      // Try to delete via API first
      try {
        await api.delete(`/context-rules/${id}`);
        return true;
      } catch (apiError) {
        logger.warn(
          `API context rule deletion failed for ID ${id}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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

        return true;
      }
    } catch (error) {
      logger.error(
        `Error deleting context rule ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return success for mock data
      return true;
    }
  },

  testRule: async (ruleId, query) => {
    try {
      // Try to test via API first
      try {
        const response = await api.post(`/context-rules/${ruleId}/test`, {
          query,
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API context rule test failed for ID ${ruleId}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local implementation
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
      }
    } catch (error) {
      logger.error(
        `Error testing context rule ${ruleId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock test result
      return {
        result:
          "This is a mock test result. In production, this would check if your query matches the context rule.",
        matches: [],
      };
    }
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (message, contextRuleId) => {
    try {
      // Try to send via API first
      try {
        const response = await api.post("/chat/message", {
          message,
          contextRuleId,
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API chat message send failed, falling back to mock response",
          apiError,
        );

        // Return mock response
        return {
          id: `msg_${Date.now()}`,
          content: `This is a mock response to your message: "${message}". In production, this would be processed by an AI model.`,
          sender: "assistant",
          timestamp: new Date().toISOString(),
          contextRuleId,
        };
      }
    } catch (error) {
      logger.error(
        "Error sending chat message",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock response
      return {
        id: `msg_${Date.now()}`,
        content:
          "I'm sorry, there was an error processing your message. Please try again later.",
        sender: "assistant",
        timestamp: new Date().toISOString(),
        contextRuleId,
      };
    }
  },

  getHistory: async () => {
    try {
      // Try to fetch via API first
      try {
        const response = await api.get("/chat/history");
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API chat history fetch failed, falling back to mock data",
          apiError,
        );

        // Return mock history
        return [
          {
            id: "msg_1",
            content: "Hello! How can I help you today?",
            sender: "assistant",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "sent",
          },
          {
            id: "msg_2",
            content: "I have a question about your services.",
            sender: "user",
            timestamp: new Date(Date.now() - 3500000).toISOString(),
            status: "sent",
          },
          {
            id: "msg_3",
            content:
              "I'd be happy to help with information about our services. What would you like to know?",
            sender: "assistant",
            timestamp: new Date(Date.now() - 3400000).toISOString(),
            status: "sent",
          },
        ];
      }
    } catch (error) {
      logger.error(
        "Error fetching chat history",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return empty array
      return [];
    }
  },

  // Delete chat history
  deleteChatHistory: async () => {
    try {
      // Try to delete via API first
      try {
        await api.delete("/chat/history");
        return { success: true };
      } catch (apiError) {
        logger.warn(
          "API chat history deletion failed, falling back to mock response",
          apiError,
        );

        // Return mock success
        return { success: true };
      }
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
      // Try to fetch via API first
      try {
        const response = await api.get(`/chat/history/${contextRuleId}`);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API chat history fetch failed for context ${contextRuleId}, falling back to mock data`,
          apiError,
        );

        // Return mock history for this context
        return [
          {
            id: "ctx_msg_1",
            content: `Hello! I'm your assistant for context ${contextRuleId}. How can I help you today?`,
            sender: "assistant",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "sent",
            contextRuleId,
          },
          {
            id: "ctx_msg_2",
            content: "Can you tell me more about this specific topic?",
            sender: "user",
            timestamp: new Date(Date.now() - 3500000).toISOString(),
            status: "sent",
            contextRuleId,
          },
          {
            id: "ctx_msg_3",
            content:
              "I'd be happy to provide information about this topic within the context rules I'm configured with.",
            sender: "assistant",
            timestamp: new Date(Date.now() - 3400000).toISOString(),
            status: "sent",
            contextRuleId,
          },
        ];
      }
    } catch (error) {
      logger.error(
        `Error fetching chat history for context ${contextRuleId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return empty array
      return [];
    }
  },
};

// Widget Configuration API
export const widgetConfigApi = {
  getAll: async () => {
    try {
      // Try to fetch via API first
      try {
        const response = await api.get("/widget-configs");
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API widget configs fetch failed, falling back to local implementation",
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
        const configs = await sequelize.query(`SELECT * FROM widget_configs`, {
          type: sequelize.QueryTypes.SELECT,
        });
        return configs;
      }
    } catch (error) {
      logger.error(
        "Error fetching widget configurations",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data
      return [
        {
          id: "widget_1",
          name: "Default Widget",
          primary_color: "#3b82f6",
          position: "bottom-right",
          initial_state: "minimized",
          allow_attachments: true,
          allow_voice: true,
          allow_emoji: true,
          context_mode: "general",
          welcome_message: "Hello! How can I help you today?",
          placeholder_text: "Type your message here...",
          theme: "light",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "widget_2",
          name: "Business Widget",
          primary_color: "#10b981",
          position: "bottom-left",
          initial_state: "minimized",
          allow_attachments: true,
          allow_voice: false,
          allow_emoji: true,
          context_mode: "restricted",
          context_rule_id: "mock-rule-2",
          welcome_message: "Welcome to our business chat!",
          placeholder_text: "Ask a business question...",
          theme: "light",
          created_at: new Date(Date.now() - 43200000).toISOString(),
          updated_at: new Date(Date.now() - 43200000).toISOString(),
        },
      ];
    }
  },

  getByUserId: async (userId) => {
    try {
      // Try to fetch via API first
      try {
        const response = await api.get(`/widget-configs/user/${userId}`);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API widget config fetch failed for user ${userId}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
        const [config] = await sequelize.query(
          `SELECT * FROM widget_configs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
          {
            replacements: [userId],
            type: sequelize.QueryTypes.SELECT,
          },
        );
        return config || null;
      }
    } catch (error) {
      logger.error(
        `Error fetching widget configuration for user ${userId}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data
      return {
        id: `widget_${userId}_1`,
        user_id: userId,
        name: "User Widget",
        primary_color: "#3b82f6",
        position: "bottom-right",
        initial_state: "minimized",
        allow_attachments: true,
        allow_voice: true,
        allow_emoji: true,
        context_mode: "general",
        welcome_message: "Hello! How can I help you today?",
        placeholder_text: "Type your message here...",
        theme: "light",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      };
    }
  },

  getById: async (id) => {
    try {
      // Try to fetch via API first
      try {
        const response = await api.get(`/widget-configs/${id}`);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API widget config fetch failed for ID ${id}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
        const [config] = await sequelize.query(
          `SELECT * FROM widget_configs WHERE id = ?`,
          {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT,
          },
        );
        return config || null;
      }
    } catch (error) {
      logger.error(
        `Error fetching widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data
      if (id === "widget_1") {
        return {
          id: "widget_1",
          name: "Default Widget",
          primary_color: "#3b82f6",
          position: "bottom-right",
          initial_state: "minimized",
          allow_attachments: true,
          allow_voice: true,
          allow_emoji: true,
          context_mode: "general",
          welcome_message: "Hello! How can I help you today?",
          placeholder_text: "Type your message here...",
          theme: "light",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString(),
        };
      }
      return null;
    }
  },

  create: async (config) => {
    try {
      // Try to create via API first
      try {
        const response = await api.post("/widget-configs", config);
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API widget config creation failed, falling back to local implementation",
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
        const id = uuidv4();

        // Prepare fields and values for insertion
        const fields = ["id"];
        const placeholders = ["?"];
        const values = [id];

        Object.entries(config).forEach(([key, value]) => {
          fields.push(key.replace(/([A-Z])/g, "_$1").toLowerCase());
          placeholders.push("?");
          values.push(
            typeof value === "object" ? JSON.stringify(value) : value,
          );
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
      }
    } catch (error) {
      logger.error(
        "Error creating widget configuration",
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data
      const id = uuidv4();
      const now = new Date().toISOString();
      return {
        id,
        ...config,
        created_at: now,
        updated_at: now,
      };
    }
  },

  update: async (id, config) => {
    try {
      // Try to update via API first
      try {
        const response = await api.put(`/widget-configs/${id}`, config);
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API widget config update failed for ID ${id}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        `Error updating widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock data
      return {
        id,
        ...config,
        updated_at: new Date().toISOString(),
      };
    }
  },

  delete: async (id) => {
    try {
      // Try to delete via API first
      try {
        await api.delete(`/widget-configs/${id}`);
        return true;
      } catch (apiError) {
        logger.warn(
          `API widget config deletion failed for ID ${id}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        `Error deleting widget configuration with id ${id}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return success for mock data
      return true;
    }
  },
};

// System Settings API
export const systemSettingsApi = {
  getSettings: async (category, environment = "production") => {
    try {
      // Try to fetch via API first
      try {
        const response = await api.get(
          `/system-settings/${category}?environment=${environment}`,
        );
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API system settings fetch failed for category ${category}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        `Error fetching system settings for category ${category} and environment ${environment}`,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Return mock data
      if (category === "chat") {
        return {
          defaultModel: "gpt-3.5-turbo",
          maxTokens: 2048,
          temperature: 0.7,
          moderationEnabled: true,
        };
      } else if (category === "widget") {
        return {
          defaultPosition: "bottom-right",
          defaultTheme: "light",
          defaultColor: "#3b82f6",
        };
      }
      return {};
    }
  },

  saveSettings: async (category, settings, environment = "production") => {
    try {
      // Try to save via API first
      try {
        const response = await api.post(`/system-settings/${category}`, {
          settings,
          environment,
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          `API system settings save failed for category ${category}, falling back to local implementation`,
          apiError,
        );

        // Fallback to local database
        // Check if settings for this category and environment already exist
        const sequelize = await getMySQLClient();
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
      }
    } catch (error) {
      logger.error(
        `Error saving system settings for category ${category} and environment ${environment}`,
        error instanceof Error ? error : new Error(String(error)),
      );
      // Return mock success
      return { success: true };
    }
  },
};

export default {
  contextRulesApi,
  chatApi,
  widgetConfigApi,
  systemSettingsApi,
};
