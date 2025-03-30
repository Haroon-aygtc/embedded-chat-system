/**
 * AI Service API Endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface GenerateResponseRequest {
  query: string;
  contextRuleId?: string;
  promptTemplateId?: string;
  userId: string;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
}

export interface AIModelResponse {
  content: string;
  modelUsed: string;
  metadata?: Record<string, any>;
  knowledgeBaseResults?: number;
  knowledgeBaseIds?: string[];
}

export interface AIInteractionLogParams {
  page?: number;
  pageSize?: number;
  userId?: string;
  modelUsed?: string;
  contextRuleId?: string | null;
  startDate?: string;
  endDate?: string;
  query?: string;
}

export interface AIInteractionLog {
  id: string;
  user_id: string;
  query: string;
  response: string;
  model_used: string;
  context_rule_id?: string;
  context_rule?: {
    name: string;
  };
  knowledge_base_results?: number;
  knowledge_base_ids?: string[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIInteractionLogsResponse {
  logs: AIInteractionLog[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
}

export interface LogInteractionRequest {
  userId: string;
  query: string;
  response: string;
  modelUsed: string;
  contextRuleId?: string;
  knowledgeBaseResults?: number;
  knowledgeBaseIds?: string[];
  metadata?: Record<string, any>;
}

export interface AIPerformanceMetrics {
  modelUsage: Array<{ model_used: string; count: number }>;
  avgResponseTimes: Array<{ model_used: string; avg_time: number }>;
  dailyUsage: Array<{ date: string; count: number }>;
  timeRange: string;
}

export const aiEndpoints = {
  /**
   * Generate a response using the appropriate AI model
   */
  generateResponse: async (
    data: GenerateResponseRequest,
  ): Promise<ApiResponse<AIModelResponse>> => {
    return api.post<AIModelResponse>("/ai/generate", data);
  },

  /**
   * Get AI interaction logs for admin dashboard
   */
  getInteractionLogs: async (
    params: AIInteractionLogParams = {},
  ): Promise<ApiResponse<AIInteractionLogsResponse>> => {
    return api.get<AIInteractionLogsResponse>("/ai/logs", { params });
  },

  /**
   * Log an AI interaction
   */
  logInteraction: async (
    data: LogInteractionRequest,
  ): Promise<ApiResponse<{ id: string }>> => {
    return api.post<{ id: string }>("/ai/logs", data);
  },

  /**
   * Get AI model performance metrics
   */
  getModelPerformance: async (
    timeRange: string = "7d",
  ): Promise<ApiResponse<AIPerformanceMetrics>> => {
    return api.get<AIPerformanceMetrics>("/ai/performance", {
      params: { timeRange },
    });
  },
};
