import { v4 as uuidv4 } from "uuid";

// Mock data for context rules
const mockContextRules = [
  {
    id: uuidv4(),
    name: "General Inquiries",
    description: "Handles basic questions about the platform",
    priority: 10,
    isActive: true,
    conditions: [
      { type: "keyword", value: "help, support, question, how to" },
      { type: "intent", value: "get_information" },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: uuidv4(),
    name: "Technical Support",
    description: "Resolves technical issues and implementation questions",
    priority: 20,
    isActive: true,
    conditions: [
      { type: "keyword", value: "error, bug, issue, problem, not working" },
      { type: "intent", value: "get_help" },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: uuidv4(),
    name: "Product Information",
    description: "Provides details about features and capabilities",
    priority: 15,
    isActive: true,
    conditions: [
      { type: "keyword", value: "feature, capability, can it, does it" },
      { type: "intent", value: "get_product_info" },
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
];

// Mock data for widget configs
const mockWidgetConfigs = [
  {
    id: uuidv4(),
    name: "Default Widget",
    user_id: "current-user",
    settings: {
      position: "bottom-right",
      primaryColor: "#4f46e5",
      headerText: "Chat Support",
      welcomeMessage: "Hello! How can I help you today?",
      inputPlaceholder: "Type your message...",
      showAvatar: true,
      allowAttachments: false,
      theme: "light",
    },
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for AI logs
const generateMockAILogs = (count = 20) => {
  const logs = [];
  const models = ["gpt-3.5-turbo", "gemini-pro", "claude-instant"];
  const contextRules = [
    "General Inquiries",
    "Technical Support",
    "Product Information",
    null,
  ];
  const queries = [
    "How do I integrate the chat widget?",
    "Is there an API available?",
    "The widget is not loading on my site",
    "Can I customize the appearance?",
    "What AI models do you support?",
    "How secure is the data transmission?",
    "Do you offer a free tier?",
    "How can I export chat history?",
  ];

  for (let i = 0; i < count; i++) {
    const randomModel = models[Math.floor(Math.random() * models.length)];
    const randomContextIndex = Math.floor(Math.random() * contextRules.length);
    const randomContext = contextRules[randomContextIndex];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    logs.push({
      id: uuidv4(),
      user_id: "user-" + Math.floor(Math.random() * 1000),
      query: randomQuery,
      response: `This is a mock response to: "${randomQuery}"`,
      model_used: randomModel,
      context_rule: randomContext ? { name: randomContext } : null,
      knowledge_base_results: Math.floor(Math.random() * 3),
      knowledge_base_ids: [],
      created_at: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
    });
  }

  return logs;
};

const mockAILogs = generateMockAILogs();

// Mock API service
const mockApiService = {
  // Context rules endpoints
  getContextRules: () => {
    return Promise.resolve({
      rules: mockContextRules,
      totalCount: mockContextRules.length,
    });
  },

  createContextRule: (data: any) => {
    const newRule = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString(),
    };
    mockContextRules.push(newRule);
    return Promise.resolve(newRule);
  },

  updateContextRule: (id: string, data: any) => {
    const index = mockContextRules.findIndex((rule) => rule.id === id);
    if (index !== -1) {
      mockContextRules[index] = { ...mockContextRules[index], ...data };
      return Promise.resolve(mockContextRules[index]);
    }
    return Promise.reject(new Error("Context rule not found"));
  },

  deleteContextRule: (id: string) => {
    const index = mockContextRules.findIndex((rule) => rule.id === id);
    if (index !== -1) {
      mockContextRules.splice(index, 1);
      return Promise.resolve({ success: true });
    }
    return Promise.reject(new Error("Context rule not found"));
  },

  // Widget configs endpoints
  getWidgetConfigs: () => {
    return Promise.resolve({
      configs: mockWidgetConfigs,
      totalCount: mockWidgetConfigs.length,
    });
  },

  getCurrentUserWidgetConfig: () => {
    return Promise.resolve(mockWidgetConfigs[0]);
  },

  updateWidgetConfig: (id: string, data: any) => {
    const index = mockWidgetConfigs.findIndex((config) => config.id === id);
    if (index !== -1) {
      mockWidgetConfigs[index] = {
        ...mockWidgetConfigs[index],
        ...data,
        updated_at: new Date().toISOString(),
      };
      return Promise.resolve(mockWidgetConfigs[index]);
    }
    return Promise.reject(new Error("Widget config not found"));
  },

  // AI logs endpoints
  getAILogs: (params: { page: number; pageSize: number }) => {
    const { page, pageSize } = params;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedLogs = mockAILogs.slice(start, end);

    return Promise.resolve({
      logs: paginatedLogs,
      totalPages: Math.ceil(mockAILogs.length / pageSize),
      currentPage: page,
      totalItems: mockAILogs.length,
    });
  },

  // AI performance endpoints
  getAIPerformance: () => {
    return Promise.resolve({
      modelUsage: [
        { model_used: "gpt-3.5-turbo", count: 120 },
        { model_used: "gemini-pro", count: 85 },
        { model_used: "claude-instant", count: 45 },
      ],
      avgResponseTimes: [
        { model_used: "gpt-3.5-turbo", avg_time: 0.8 },
        { model_used: "gemini-pro", avg_time: 0.6 },
        { model_used: "claude-instant", avg_time: 0.9 },
      ],
      contextUsage: [
        { context_name: "General Inquiries", count: 95, effectiveness: 92 },
        { context_name: "Technical Support", count: 85, effectiveness: 88 },
        { context_name: "Product Information", count: 70, effectiveness: 94 },
      ],
      dailyUsage: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 30) + 10,
        };
      }),
    });
  },
};

export default mockApiService;
