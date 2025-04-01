import mockApiService from "./mockApiService";

const mockWidgetConfigService = {
  getCurrentUserWidgetConfig: async () => {
    try {
      return await mockApiService.getCurrentUserWidgetConfig();
    } catch (error) {
      console.error("Error fetching widget config:", error);
      throw error;
    }
  },

  updateWidgetConfig: async (id: string, data: any) => {
    try {
      return await mockApiService.updateWidgetConfig(id, data);
    } catch (error) {
      console.error("Error updating widget config:", error);
      throw error;
    }
  },

  getWidgetConfigs: async () => {
    try {
      return await mockApiService.getWidgetConfigs();
    } catch (error) {
      console.error("Error fetching widget configs:", error);
      return { configs: [], totalCount: 0 };
    }
  },
};

export default mockWidgetConfigService;
