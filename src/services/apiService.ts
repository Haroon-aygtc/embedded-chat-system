import { ContextRule } from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";

// Base URL for API requests
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://api.chatservice.io";

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }
  return response.json();
};

// Helper function to make authenticated API requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return handleResponse(response);
};

// Context Rules API
export const contextRulesApi = {
  getAll: async (): Promise<ContextRule[]> => {
    // For demo purposes, we'll simulate an API call with mock data
    // In a real app, this would be: return fetchWithAuth('/context-rules');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

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
        promptTemplate:
          "You are a helpful assistant. Please answer the following question: {{ userQuery }}",
        responseFilters: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  },

  getById: async (id: string): Promise<ContextRule> => {
    // In a real app: return fetchWithAuth(`/context-rules/${id}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const rules = await contextRulesApi.getAll();
    const rule = rules.find((r) => r.id === id);

    if (!rule) {
      throw new Error("Context rule not found");
    }

    return rule;
  },

  create: async (
    rule: Omit<ContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContextRule> => {
    // In a real app: return fetchWithAuth('/context-rules', { method: 'POST', body: JSON.stringify(rule) });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newRule: ContextRule = {
      ...rule,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newRule;
  },

  update: async (
    id: string,
    rule: Partial<ContextRule>,
  ): Promise<ContextRule> => {
    // In a real app: return fetchWithAuth(`/context-rules/${id}`, { method: 'PUT', body: JSON.stringify(rule) });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existingRule = await contextRulesApi.getById(id);

    const updatedRule: ContextRule = {
      ...existingRule,
      ...rule,
      updatedAt: new Date().toISOString(),
    };

    return updatedRule;
  },

  delete: async (id: string): Promise<void> => {
    // In a real app: return fetchWithAuth(`/context-rules/${id}`, { method: 'DELETE' });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, we would delete the rule from the database
    // For demo purposes, we'll just simulate a successful deletion
    return;
  },

  testRule: async (
    ruleId: string,
    query: string,
  ): Promise<{ result: string; matches: string[] }> => {
    // In a real app: return fetchWithAuth(`/context-rules/${ruleId}/test`, { method: 'POST', body: JSON.stringify({ query }) });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate a test result
    return {
      result: "This query matches the context rule.",
      matches: ["UAE", "visa", "services"],
    };
  },
};

// Prompt Templates API
export const promptTemplatesApi = {
  getAll: async (): Promise<PromptTemplate[]> => {
    // In a real app: return fetchWithAuth('/prompt-templates');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

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
        description: "Template specifically for UAE government related queries",
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
  },

  getById: async (id: string): Promise<PromptTemplate> => {
    // In a real app: return fetchWithAuth(`/prompt-templates/${id}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const templates = await promptTemplatesApi.getAll();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      throw new Error("Prompt template not found");
    }

    return template;
  },

  create: async (
    template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptTemplate> => {
    // In a real app: return fetchWithAuth('/prompt-templates', { method: 'POST', body: JSON.stringify(template) });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newTemplate: PromptTemplate = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newTemplate;
  },

  update: async (
    id: string,
    template: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> => {
    // In a real app: return fetchWithAuth(`/prompt-templates/${id}`, { method: 'PUT', body: JSON.stringify(template) });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const existingTemplate = await promptTemplatesApi.getById(id);

    const updatedTemplate: PromptTemplate = {
      ...existingTemplate,
      ...template,
      updatedAt: new Date().toISOString(),
    };

    return updatedTemplate;
  },

  delete: async (id: string): Promise<void> => {
    // In a real app: return fetchWithAuth(`/prompt-templates/${id}`, { method: 'DELETE' });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // In a real app, we would delete the template from the database
    // For demo purposes, we'll just simulate a successful deletion
    return;
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (
    message: string,
    contextRuleId?: string,
  ): Promise<{ id: string; text: string; timestamp: string }> => {
    // In a real app: return fetchWithAuth('/chat/message', { method: 'POST', body: JSON.stringify({ message, contextRuleId }) });

    // Simulate network delay and AI response time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate an AI response
    return {
      id: Date.now().toString(),
      text: `This is a simulated response to: "${message}". In a real application, this would be generated by an AI model.`,
      timestamp: new Date().toISOString(),
    };
  },

  getHistory: async (): Promise<
    { id: string; text: string; timestamp: string; sender: "user" | "ai" }[]
  > => {
    // In a real app: return fetchWithAuth('/chat/history');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Simulate chat history
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
    // In a real app: return fetchWithAuth(`/analytics/overview?period=${period}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Simulate analytics data
    return {
      totalConversations: 1248,
      totalMessages: 8976,
      averageResponseTime: 1.2, // seconds
      userSatisfactionRate: 92, // percentage
    };
  },

  getMessagesByDay: async (
    days: number = 7,
  ): Promise<{ date: string; count: number }[]> => {
    // In a real app: return fetchWithAuth(`/analytics/messages-by-day?days=${days}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Generate simulated data for the past 'days' days
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
  },

  getTopQueries: async (
    limit: number = 10,
  ): Promise<{ query: string; count: number }[]> => {
    // In a real app: return fetchWithAuth(`/analytics/top-queries?limit=${limit}`);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 700));

    // Simulate top queries data
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
  },
};

// Export a default object with all APIs
export default {
  contextRules: contextRulesApi,
  promptTemplates: promptTemplatesApi,
  chat: chatApi,
  analytics: analyticsApi,
};
