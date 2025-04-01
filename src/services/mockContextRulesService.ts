import { v4 as uuidv4 } from "uuid";
import mockApiService from "./mockApiService";

const mockContextRulesService = {
  getContextRules: async () => {
    try {
      const result = await mockApiService.getContextRules();
      // Ensure we're returning an object with a rules array
      if (result && result.rules) {
        return {
          rules: Array.isArray(result.rules) ? result.rules : [],
          totalCount: result.totalCount || 0,
        };
      }
      // If result is not in expected format, return empty array
      return { rules: [], totalCount: 0 };
    } catch (error) {
      console.error("Error fetching context rules:", error);
      return { rules: [], totalCount: 0 };
    }
  },

  createContextRule: async (data: any) => {
    try {
      return await mockApiService.createContextRule(data);
    } catch (error) {
      console.error("Error creating context rule:", error);
      throw error;
    }
  },

  updateContextRule: async (id: string, data: any) => {
    try {
      return await mockApiService.updateContextRule(id, data);
    } catch (error) {
      console.error("Error updating context rule:", error);
      throw error;
    }
  },

  deleteContextRule: async (id: string) => {
    try {
      return await mockApiService.deleteContextRule(id);
    } catch (error) {
      console.error("Error deleting context rule:", error);
      throw error;
    }
  },
};

export default mockContextRulesService;
