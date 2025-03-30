/**
 * Widget Configuration API Endpoints
 */

import { api, ApiResponse } from "../middleware/apiMiddleware";

export interface WidgetConfig {
  id: string;
  name: string;
  primary_color: string;
  position: string;
  initial_state: string;
  allow_attachments: boolean;
  allow_voice: boolean;
  allow_emoji: boolean;
  context_mode: string;
  context_rule_id?: string;
  welcome_message: string;
  placeholder_text: string;
  theme: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export const widgetEndpoints = {
  /**
   * Get all widget configurations
   */
  getAll: async (): Promise<ApiResponse<WidgetConfig[]>> => {
    return api.get<WidgetConfig[]>("/widget-configs");
  },

  /**
   * Get widget configurations for a specific user
   */
  getByUserId: async (userId: string): Promise<ApiResponse<WidgetConfig>> => {
    return api.get<WidgetConfig>(`/widget-configs/user/${userId}`);
  },

  /**
   * Get a widget configuration by ID
   */
  getById: async (id: string): Promise<ApiResponse<WidgetConfig>> => {
    return api.get<WidgetConfig>(`/widget-configs/${id}`);
  },

  /**
   * Create a new widget configuration
   */
  create: async (
    config: Omit<WidgetConfig, "id" | "created_at" | "updated_at">,
  ): Promise<ApiResponse<WidgetConfig>> => {
    return api.post<WidgetConfig>("/widget-configs", config);
  },

  /**
   * Update a widget configuration
   */
  update: async (
    id: string,
    config: Partial<WidgetConfig>,
  ): Promise<ApiResponse<WidgetConfig>> => {
    return api.put<WidgetConfig>(`/widget-configs/${id}`, config);
  },

  /**
   * Delete a widget configuration
   */
  delete: async (id: string): Promise<ApiResponse<boolean>> => {
    return api.delete<boolean>(`/widget-configs/${id}`);
  },
};
