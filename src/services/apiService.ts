import { ContextRule } from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";
import api from "./axiosConfig";

// Context Rules API
export const contextRulesApi = {
  getAll: async (): Promise<ContextRule[]> => {
    try {
      const response = await api.get("/context-rules");
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching context rules",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data if API is not available
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

  getById: async (id: string): Promise<ContextRule> => {
    try {
      const response = await api.get(`/context-rules/${id}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching context rule ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      const rules = await contextRulesApi.getAll();
      const rule = rules.find((r) => r.id === id);

      if (!rule) {
        throw new Error("Context rule not found");
      }

      return rule;
    }
  },

  create: async (
    rule: Omit<ContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContextRule> => {
    try {
      const response = await api.post("/context-rules", rule);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error creating context rule",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const newRule: ContextRule = {
        ...rule,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newRule;
    }
  },

  update: async (
    id: string,
    rule: Partial<ContextRule>,
  ): Promise<ContextRule> => {
    try {
      const response = await api.put(`/context-rules/${id}`, rule);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error updating context rule ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const existingRule = await contextRulesApi.getById(id);
      const updatedRule: ContextRule = {
        ...existingRule,
        ...rule,
        updatedAt: new Date().toISOString(),
      };
      return updatedRule;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/context-rules/${id}`);
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error deleting context rule ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Silently fail for demo purposes
    }
  },

  testRule: async (
    ruleId: string,
    query: string,
  ): Promise<{ result: string; matches: string[] }> => {
    try {
      const response = await api.post(`/context-rules/${ruleId}/test`, {
        query,
      });
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error testing context rule ${ruleId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      return {
        result: "This query matches the context rule.",
        matches: ["UAE", "visa", "services"],
      };
    }
  },
};

// Prompt Templates API
export const promptTemplatesApi = {
  getAll: async (): Promise<PromptTemplate[]> => {
    try {
      const response = await api.get("/prompt-templates");
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching prompt templates",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        {
          id: "1",
          name: "General Information Query",
          description:
            "A general template for handling basic information queries",
          template:
            "You are a helpful assistant. Answer the following question: {{question}}",
          category: "general",
          variables: ["question"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "UAE Government Information",
          description:
            "Template specifically for UAE government related queries",
          template:
            "You are an assistant specializing in UAE government information. Please provide information about {{topic}} within the context of UAE government services.",
          category: "uae-gov",
          variables: ["topic"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Product Support",
          description: "Template for handling product support queries",
          template:
            "You are a product support specialist. Help the user with their question about {{product}}: {{issue}}",
          category: "support",
          variables: ["product", "issue"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  getById: async (id: string): Promise<PromptTemplate> => {
    try {
      const response = await api.get(`/prompt-templates/${id}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching prompt template ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      const templates = await promptTemplatesApi.getAll();
      const template = templates.find((t) => t.id === id);

      if (!template) {
        throw new Error("Prompt template not found");
      }

      return template;
    }
  },

  create: async (
    template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptTemplate> => {
    try {
      const response = await api.post("/prompt-templates", template);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error creating prompt template",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const newTemplate: PromptTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTemplate;
    }
  },

  update: async (
    id: string,
    template: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> => {
    try {
      const response = await api.put(`/prompt-templates/${id}`, template);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error updating prompt template ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const existingTemplate = await promptTemplatesApi.getById(id);
      const updatedTemplate: PromptTemplate = {
        ...existingTemplate,
        ...template,
        updatedAt: new Date().toISOString(),
      };
      return updatedTemplate;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/prompt-templates/${id}`);
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error deleting prompt template ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Silently fail for demo purposes
    }
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (
    message: string,
    contextRuleId?: string,
  ): Promise<{ id: string; text: string; timestamp: string }> => {
    try {
      const response = await api.post("/chat/message", {
        message,
        contextRuleId,
      });
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error sending chat message",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      return {
        id: Date.now().toString(),
        text: `This is a fallback response to: "${message}". The API request failed, but in production this would be generated by an AI model.`,
        timestamp: new Date().toISOString(),
      };
    }
  },

  getHistory: async (): Promise<
    { id: string; text: string; timestamp: string; sender: "user" | "ai" }[]
  > => {
    try {
      const response = await api.get("/chat/history");
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching chat history",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
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
  deleteChatHistory: async (): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete("/chat/history");
      return { success: true };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error deleting chat history",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return { success: false };
    }
  },

  // Get chat history for a specific context
  getContextHistory: async (
    contextRuleId: string,
  ): Promise<
    { id: string; text: string; timestamp: string; sender: "user" | "ai" }[]
  > => {
    try {
      const response = await api.get(`/chat/history/${contextRuleId}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching chat history for context ${contextRuleId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Return empty array for demo purposes
      return [];
    }
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: async (
    period: "day" | "week" | "month" = "week",
  ): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    userSatisfactionRate: number;
  }> => {
    try {
      const response = await api.get(`/analytics/overview?period=${period}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching analytics overview for period ${period}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return {
        totalConversations: 1248,
        totalMessages: 8976,
        averageResponseTime: 1.2, // seconds
        userSatisfactionRate: 92, // percentage
      };
    }
  },

  getMessagesByDay: async (
    days: number = 7,
  ): Promise<{ date: string; count: number }[]> => {
    try {
      const response = await api.get(`/analytics/messages-by-day?days=${days}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching messages by day for ${days} days`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Generate fallback data for the past 'days' days
      const data = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        data.push({
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 500) + 500, // Random between 500-1000
        });
      }

      return data;
    }
  },

  getTopQueries: async (
    limit: number = 10,
  ): Promise<{ query: string; count: number }[]> => {
    try {
      const response = await api.get(`/analytics/top-queries?limit=${limit}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching top queries with limit ${limit}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        { query: "How to embed chat widget", count: 145 },
        { query: "Reset password", count: 112 },
        { query: "Pricing plans", count: 98 },
        { query: "API documentation", count: 87 },
        { query: "Context rules examples", count: 76 },
        { query: "Custom styling", count: 65 },
        { query: "Integration with WordPress", count: 58 },
        { query: "Mobile support", count: 52 },
        { query: "Data privacy", count: 47 },
        { query: "Offline mode", count: 41 },
      ];
    }
  },

  // Get model usage statistics
  getModelUsage: async (
    period: "day" | "week" | "month" = "week",
  ): Promise<{ model: string; count: number; percentage: number }[]> => {
    try {
      const response = await api.get(`/analytics/model-usage?period=${period}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching model usage for period ${period}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        { model: "Gemini", count: 6248, percentage: 70 },
        { model: "Hugging Face", count: 2728, percentage: 30 },
      ];
    }
  },
};

// Widget Configuration API
export const widgetConfigApi = {
  getAll: async (): Promise<any[]> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching widget configurations",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Return empty array on error
      return [];
    }
  },

  getByUserId: async (userId: string): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 is the error code for no rows returned
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching widget configuration for user ${userId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  getById: async (id: string): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching widget configuration with id ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  create: async (config: any): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .insert([config])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error creating widget configuration",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  update: async (id: string, config: any): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .update(config)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error updating widget configuration with id ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const { error } = await window.supabase
        .from("widget_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error deleting widget configuration with id ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return false;
    }
  },
};

// User Management API
export const userManagementApi = {
  getUsers: async ({
    page = 1,
    pageSize = 10,
    searchTerm = "",
    roleFilter = null,
    statusFilter = null,
  }: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    roleFilter?: string | null;
    statusFilter?: string | null;
  }) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*", { count: "exact" });

      if (userError) throw userError;

      // Apply filters
      let filteredUsers = [...(userData || [])];

      if (searchTerm) {
        filteredUsers = filteredUsers.filter(
          (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.full_name &&
              user.full_name.toLowerCase().includes(searchTerm.toLowerCase())),
        );
      }

      if (roleFilter) {
        filteredUsers = filteredUsers.filter(
          (user) => user.role === roleFilter,
        );
      }

      if (statusFilter) {
        filteredUsers = filteredUsers.filter((user) =>
          statusFilter === "active" ? user.is_active : !user.is_active,
        );
      }

      // Get total count and pages
      const totalCount = filteredUsers.length;
      const totalPages = Math.ceil(totalCount / pageSize);

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedUsers = filteredUsers.slice(start, end);

      // Get user activity for each user
      const usersWithActivity = await Promise.all(
        paginatedUsers.map(async (user) => {
          // Get last login
          const { data: activityData } = await supabase
            .from("user_activity")
            .select("*")
            .eq("user_id", user.id)
            .eq("action", "login")
            .order("created_at", { ascending: false })
            .limit(1);

          const lastLogin =
            activityData && activityData.length > 0
              ? activityData[0].created_at
              : null;

          return {
            id: user.id,
            name: user.full_name || user.email.split("@")[0],
            email: user.email,
            role: user.role,
            isActive: user.is_active,
            avatar: user.avatar_url,
            lastLogin,
            createdAt: user.created_at,
          };
        }),
      );

      return {
        users: usersWithActivity,
        totalCount,
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  getUserById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.full_name || data.email.split("@")[0],
        email: data.email,
        role: data.role,
        isActive: data.is_active,
        avatar: data.avatar_url,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData: {
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    password?: string;
  }) => {
    try {
      // First create auth user if password is provided
      let authId = null;
      if (userData.password) {
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
          });

        if (authError) throw authError;
        authId = authData.user.id;
      }

      // Then create user in our users table
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            email: userData.email,
            full_name: userData.name,
            role: userData.role,
            is_active: userData.isActive,
            auth_id: authId,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.full_name || data.email.split("@")[0],
        email: data.email,
        role: data.role,
        isActive: data.is_active,
        avatar: data.avatar_url,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (
    id: string,
    userData: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
    },
  ) => {
    try {
      const updateData: any = {};
      if (userData.name !== undefined) updateData.full_name = userData.name;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.isActive !== undefined)
        updateData.is_active = userData.isActive;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.full_name || data.email.split("@")[0],
        email: data.email,
        role: data.role,
        isActive: data.is_active,
        avatar: data.avatar_url,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      // First get the user to check if they have an auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", id)
        .single();

      if (userError) throw userError;

      // If the user has an auth_id, delete the auth user
      if (userData?.auth_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          userData.auth_id,
        );
        if (authError) throw authError;
      }

      // Delete the user from our users table
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  getUserActivity: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching activity for user ${userId}:`, error);
      return [];
    }
  },

  getUserSessions: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("last_active_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching sessions for user ${userId}:`, error);
      return [];
    }
  },

  logUserActivity: async ({
    userId,
    action,
    ipAddress,
    userAgent,
    metadata = {},
  }: {
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { error } = await supabase.from("user_activity").insert([
        {
          user_id: userId,
          action,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata,
        },
      ]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error logging user activity:", error);
      return false;
    }
  },
};

// Export a default object with all APIs
export default {
  contextRules: contextRulesApi,
  promptTemplates: promptTemplatesApi,
  chat: chatApi,
  analytics: analyticsApi,
  widgetConfig: widgetConfigApi,
  users: userManagementApi,
};
