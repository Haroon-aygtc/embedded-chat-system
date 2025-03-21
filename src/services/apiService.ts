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
      console.error("Error fetching context rules:", error);
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
      console.error(`Error fetching context rule ${id}:`, error);
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
      console.error("Error creating context rule:", error);
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
      console.error(`Error updating context rule ${id}:`, error);
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
      console.error(`Error deleting context rule ${id}:`, error);
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
      console.error(`Error testing context rule ${ruleId}:`, error);
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
      console.error("Error fetching prompt templates:", error);
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
      console.error(`Error fetching prompt template ${id}:`, error);
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
      console.error("Error creating prompt template:", error);
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
      console.error(`Error updating prompt template ${id}:`, error);
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
      console.error(`Error deleting prompt template ${id}:`, error);
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
      console.error("Error sending chat message:", error);
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
      console.error("Error fetching chat history:", error);
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
      console.error(
        `Error fetching analytics overview for period ${period}:`,
        error,
      );
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
      console.error(`Error fetching messages by day for ${days} days:`, error);
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
      console.error(`Error fetching top queries with limit ${limit}:`, error);
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
};

// Export a default object with all APIs
export default {
  contextRules: contextRulesApi,
  promptTemplates: promptTemplatesApi,
  chat: chatApi,
  analytics: analyticsApi,
};
