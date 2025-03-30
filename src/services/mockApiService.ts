import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";

const apiService = {
  // Context rules endpoints
  getContextRules: async () => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM context_rules ORDER BY name`,
      );

      return {
        rules: results || [],
        totalCount: (results as any[]).length,
      };
    } catch (error) {
      logger.error("Error fetching context rules:", error);
      return { rules: [], totalCount: 0 };
    }
  },

  // Widget configs endpoints
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      return results[0];
    } catch (error) {
      logger.error("Error fetching current user widget config:", error);
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

        // Handle settings object separately
        if (key === "settings" && typeof value === "object") {
          updateFields.push(`settings = ?`);
          replacements.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = ?`);
          replacements.push(value);
        }
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

  // AI logs endpoints
  getAILogs: async (params: { page: number; pageSize: number }) => {
    try {
      const { page, pageSize } = params;
      const offset = (page - 1) * pageSize;

      const sequelize = await getMySQLClient();

      // Get paginated logs
      const [logs] = await sequelize.query(
        `SELECT * FROM ai_interaction_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        { replacements: [pageSize, offset] },
      );

      // Get total count
      const [countResult] = await sequelize.query(
        `SELECT COUNT(*) as total FROM ai_interaction_logs`,
      );

      const totalItems = (countResult as any[])[0].total || 0;
      const totalPages = Math.ceil(totalItems / pageSize);

      return {
        logs: logs || [],
        totalPages,
        currentPage: page,
        totalItems,
      };
    } catch (error) {
      logger.error("Error fetching AI logs:", error);
      return {
        logs: [],
        totalPages: 0,
        currentPage: params.page,
        totalItems: 0,
      };
    }
  },

  // AI performance endpoints
  getAIPerformance: async () => {
    try {
      const sequelize = await getMySQLClient();

      // Get model usage counts
      const [modelUsage] = await sequelize.query(
        `SELECT model_used, COUNT(*) as count FROM ai_interaction_logs GROUP BY model_used`,
      );

      // Get average response times (assuming we have a response_time field)
      const [avgResponseTimes] = await sequelize.query(
        `SELECT model_used, AVG(TIMESTAMPDIFF(MICROSECOND, created_at, updated_at)/1000000) as avg_time 
         FROM ai_interaction_logs 
         WHERE updated_at IS NOT NULL 
         GROUP BY model_used`,
      );

      // Get context rule usage
      const [contextUsage] = await sequelize.query(
        `SELECT cr.name as context_name, COUNT(ail.id) as count, 
         (COUNT(CASE WHEN ail.response IS NOT NULL THEN 1 END) * 100 / COUNT(*)) as effectiveness
         FROM ai_interaction_logs ail
         JOIN context_rules cr ON ail.context_rule_id = cr.id
         GROUP BY cr.name`,
      );

      // Get daily usage for the last 7 days
      const [dailyUsage] = await sequelize.query(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM ai_interaction_logs 
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY date ASC`,
      );

      return {
        modelUsage: modelUsage || [],
        avgResponseTimes: avgResponseTimes || [],
        contextUsage: contextUsage || [],
        dailyUsage: dailyUsage || [],
      };
    } catch (error) {
      logger.error("Error fetching AI performance metrics:", error);
      return {
        modelUsage: [],
        avgResponseTimes: [],
        contextUsage: [],
        dailyUsage: [],
      };
    }
  },
};

export default apiService;
