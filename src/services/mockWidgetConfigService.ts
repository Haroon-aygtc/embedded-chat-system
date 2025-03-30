import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";

const widgetConfigService = {
  getCurrentUserWidgetConfig: async () => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE user_id = ? LIMIT 1`,
        {
          replacements: ["current_user_id"], // Replace with actual user ID from auth context
        },
      );

      if (!results || (results as any[]).length === 0) {
        // Return default config if none exists
        return {
          id: "default",
          name: "Default Widget",
          primaryColor: "#4f46e5",
          secondaryColor: "#f3f4f6",
          position: "bottom-right",
          initialMessage: "Hello! How can I help you today?",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      return results[0];
    } catch (error) {
      logger.error("Error fetching widget config:", error);
      throw error;
    }
  },

  updateWidgetConfig: async (id: string, data: any) => {
    try {
      const sequelize = await getMySQLClient();
      const updateFields = [];
      const replacements = [];

      // Build dynamic update query
      Object.entries(data).forEach(([key, value]) => {
        // Convert camelCase to snake_case for database
        const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updateFields.push(`${dbField} = ?`);
        replacements.push(value);
      });

      // Add updated_at timestamp
      updateFields.push("updated_at = ?");
      replacements.push(new Date().toISOString());

      // Add ID to replacements
      replacements.push(id);

      await sequelize.query(
        `UPDATE widget_configs SET ${updateFields.join(", ")} WHERE id = ?`,
        { replacements },
      );

      // Fetch the updated config
      const [results] = await sequelize.query(
        `SELECT * FROM widget_configs WHERE id = ?`,
        {
          replacements: [id],
        },
      );

      return results[0];
    } catch (error) {
      logger.error("Error updating widget config:", error);
      throw error;
    }
  },

  getWidgetConfigs: async () => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM widget_configs ORDER BY created_at DESC`,
      );

      return {
        configs: results || [],
        totalCount: (results as any[]).length,
      };
    } catch (error) {
      logger.error("Error fetching widget configs:", error);
      return { configs: [], totalCount: 0 };
    }
  },
};

export default widgetConfigService;
