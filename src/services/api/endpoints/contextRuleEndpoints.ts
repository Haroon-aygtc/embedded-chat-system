/**
 * Context Rules API Endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";
import { ContextRule } from "@/types/contextRules";

export interface TestRuleRequest {
  query: string;
}

export interface TestRuleResponse {
  result: string;
  matches: string[];
}

export const contextRuleEndpoints = {
  /**
   * Get all context rules
   */
  getAll: async (): Promise<ApiResponse<ContextRule[]>> => {
    return api.get<ContextRule[]>("/context-rules");
  },

  /**
   * Get a context rule by ID
   */
  getById: async (id: string): Promise<ApiResponse<ContextRule>> => {
    return api.get<ContextRule>(`/context-rules/${id}`);
  },

  /**
   * Create a new context rule
   */
  create: async (
    rule: Omit<ContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ApiResponse<ContextRule>> => {
    return api.post<ContextRule>("/context-rules", rule);
  },

  /**
   * Update a context rule
   */
  update: async (
    id: string,
    rule: Partial<ContextRule>,
  ): Promise<ApiResponse<ContextRule>> => {
    return api.put<ContextRule>(`/context-rules/${id}`, rule);
  },

  /**
   * Delete a context rule
   */
  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/context-rules/${id}`);
  },

  /**
   * Test a context rule against a query
   */
  testRule: async (
    ruleId: string,
    query: string,
  ): Promise<ApiResponse<TestRuleResponse>> => {
    return api.post<TestRuleResponse>(`/context-rules/${ruleId}/test`, {
      query,
    });
  },
};
