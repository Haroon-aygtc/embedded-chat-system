import apiService from "./apiService";
import supabase from "./supabaseClient";

// Centralized admin service for data fetching and operations
const adminService = {
  // Dashboard data
  getDashboardStats: async () => {
    try {
      const analytics = await apiService.analytics.getOverview("week");
      const messagesByDay = await apiService.analytics.getMessagesByDay(7);
      const topQueries = await apiService.analytics.getTopQueries(5);
      const modelUsage = await apiService.analytics.getModelUsage("week");

      return {
        analytics,
        messagesByDay,
        topQueries,
        modelUsage,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  },

  // User management
  getUsers: async () => {
    try {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      return data;
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
      return data;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData: any) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  updateUser: async (id: string, userData: any) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id: string) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Context rules management
  getContextRules: async () => {
    try {
      return await apiService.contextRules.getAll();
    } catch (error) {
      console.error("Error fetching context rules:", error);
      throw error;
    }
  },

  getContextRuleById: async (id: string) => {
    try {
      return await apiService.contextRules.getById(id);
    } catch (error) {
      console.error(`Error fetching context rule ${id}:`, error);
      throw error;
    }
  },

  // Prompt templates management
  getPromptTemplates: async () => {
    try {
      return await apiService.promptTemplates.getAll();
    } catch (error) {
      console.error("Error fetching prompt templates:", error);
      throw error;
    }
  },

  getPromptTemplateById: async (id: string) => {
    try {
      return await apiService.promptTemplates.getById(id);
    } catch (error) {
      console.error(`Error fetching prompt template ${id}:`, error);
      throw error;
    }
  },

  // Widget configuration
  getWidgetConfigs: async () => {
    try {
      return await apiService.widgetConfig.getAll();
    } catch (error) {
      console.error("Error fetching widget configurations:", error);
      throw error;
    }
  },

  getWidgetConfigById: async (id: string) => {
    try {
      return await apiService.widgetConfig.getById(id);
    } catch (error) {
      console.error(`Error fetching widget configuration ${id}:`, error);
      throw error;
    }
  },

  // Moderation management
  getModerationQueue: async (status: "pending" | "approved" | "rejected") => {
    try {
      // Using the existing moderationService through a wrapper
      const { getModerationQueue } = await import("./moderationService");
      return getModerationQueue(status);
    } catch (error) {
      console.error(`Error fetching moderation queue (${status}):`, error);
      throw error;
    }
  },

  getModerationRules: async () => {
    try {
      const { getRules } = await import("./moderationService");
      return getRules();
    } catch (error) {
      console.error("Error fetching moderation rules:", error);
      throw error;
    }
  },

  // System settings
  getSystemSettings: async (
    category: string,
    environment: string = "production",
  ) => {
    try {
      return await apiService.systemSettings.getSettings(category, environment);
    } catch (error) {
      console.error(`Error fetching system settings for ${category}:`, error);
      throw error;
    }
  },

  saveSystemSettings: async (
    category: string,
    settings: any,
    environment: string = "production",
  ) => {
    try {
      await apiService.systemSettings.saveSettings(
        category,
        settings,
        environment,
      );
      return true;
    } catch (error) {
      console.error(`Error saving system settings for ${category}:`, error);
      throw error;
    }
  },

  // API key management
  getApiKeys: async () => {
    try {
      // This would be implemented in a real application
      // For now, return mock data
      return [
        { id: "1", name: "Gemini API Key", lastUsed: new Date().toISOString() },
        {
          id: "2",
          name: "Hugging Face API Key",
          lastUsed: new Date().toISOString(),
        },
      ];
    } catch (error) {
      console.error("Error fetching API keys:", error);
      throw error;
    }
  },
};

export default adminService;
