import logger from "@/utils/logger";
import { getMySQLClient } from "./mysqlClient";

interface AnalyticsData {
  totalInteractions: number;
  totalUsers: number;
  averageResponseTime: number;
  successRate: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

interface ModelUsage {
  modelId: string;
  modelName: string;
  count: number;
  percentage: number;
}

interface ContextRuleUsage {
  ruleId: string;
  ruleName: string;
  count: number;
  effectiveness: number;
}

interface UserActivity {
  userId: string;
  interactionCount: number;
  lastActive: string;
}

interface ExportOptions {
  startDate?: string;
  endDate?: string;
  format: "csv" | "json" | "excel";
  includeContent?: boolean;
}

const analyticsService = {
  /**
   * Get overall analytics data
   */
  getOverallAnalytics: async (
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsData> => {
    try {
      const sequelize = await getMySQLClient();

      // Build date filter if provided
      let dateFilter = "";
      const replacements = [];

      if (startDate) {
        dateFilter += " AND created_at >= ?";
        replacements.push(startDate);
      }

      if (endDate) {
        dateFilter += " AND created_at <= ?";
        replacements.push(endDate);
      }

      // Get overall analytics
      const [result] = await sequelize.query(
        `SELECT 
          COUNT(*) as total_interactions,
          COUNT(DISTINCT user_id) as total_users,
          AVG(TIMESTAMPDIFF(MICROSECOND, created_at, updated_at)/1000000) as avg_response_time,
          (COUNT(CASE WHEN response IS NOT NULL THEN 1 END) * 100 / COUNT(*)) as success_rate
        FROM ai_interaction_logs
        WHERE 1=1${dateFilter}`,
        {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return {
        totalInteractions: (result as any).total_interactions || 0,
        totalUsers: (result as any).total_users || 0,
        averageResponseTime: (result as any).avg_response_time || 0,
        successRate: (result as any).success_rate || 0,
      };
    } catch (error) {
      logger.error("Error fetching overall analytics:", error);
      return {
        totalInteractions: 0,
        totalUsers: 0,
        averageResponseTime: 0,
        successRate: 0,
      };
    }
  },

  /**
   * Get daily usage data for a time period
   */
  getDailyUsage: async (days = 30): Promise<TimeSeriesData[]> => {
    try {
      const sequelize = await getMySQLClient();

      const [results] = await sequelize.query(
        `SELECT 
          DATE(created_at) as date, 
          COUNT(*) as count 
        FROM ai_interaction_logs 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC`,
        {
          replacements: [days],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return (results as any[]).map((item) => ({
        date: item.date,
        count: item.count,
      }));
    } catch (error) {
      logger.error("Error fetching daily usage data:", error);
      return [];
    }
  },

  /**
   * Get hourly usage data for a specific day
   */
  getHourlyUsage: async (date?: string): Promise<TimeSeriesData[]> => {
    try {
      const sequelize = await getMySQLClient();

      // Use provided date or default to today
      const targetDate = date || new Date().toISOString().split("T")[0];

      const [results] = await sequelize.query(
        `SELECT 
          HOUR(created_at) as hour, 
          COUNT(*) as count 
        FROM ai_interaction_logs 
        WHERE DATE(created_at) = ?
        GROUP BY HOUR(created_at)
        ORDER BY hour ASC`,
        {
          replacements: [targetDate],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Fill in missing hours with zero counts
      const hourlyData: TimeSeriesData[] = [];
      for (let i = 0; i < 24; i++) {
        const hourData = (results as any[]).find((item) => item.hour === i);
        hourlyData.push({
          date: i.toString().padStart(2, "0") + ":00",
          count: hourData ? hourData.count : 0,
        });
      }

      return hourlyData;
    } catch (error) {
      logger.error("Error fetching hourly usage data:", error);
      return [];
    }
  },

  /**
   * Get model usage statistics
   */
  getModelUsage: async (
    startDate?: string,
    endDate?: string,
  ): Promise<ModelUsage[]> => {
    try {
      const sequelize = await getMySQLClient();

      // Build date filter if provided
      let dateFilter = "";
      const replacements = [];

      if (startDate) {
        dateFilter += " AND created_at >= ?";
        replacements.push(startDate);
      }

      if (endDate) {
        dateFilter += " AND created_at <= ?";
        replacements.push(endDate);
      }

      // Get total count for percentage calculation
      const [totalResult] = await sequelize.query(
        `SELECT COUNT(*) as total FROM ai_interaction_logs WHERE 1=1${dateFilter}`,
        {
          replacements: [...replacements],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      const total = (totalResult as any).total || 0;

      // Get model usage counts
      const [results] = await sequelize.query(
        `SELECT 
          model_used as model_id,
          COUNT(*) as count
        FROM ai_interaction_logs
        WHERE 1=1${dateFilter}
        GROUP BY model_used
        ORDER BY count DESC`,
        {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Get model names from ai_models table
      const modelIds = (results as any[]).map((item) => item.model_id);
      let modelNames: Record<string, string> = {};

      if (modelIds.length > 0) {
        const [modelResults] = await sequelize.query(
          `SELECT id, name FROM ai_models WHERE id IN (?)`,
          {
            replacements: [modelIds],
            type: sequelize.QueryTypes.SELECT,
          },
        );

        modelNames = (modelResults as any[]).reduce(
          (acc, model) => {
            acc[model.id] = model.name;
            return acc;
          },
          {} as Record<string, string>,
        );
      }

      return (results as any[]).map((item) => ({
        modelId: item.model_id,
        modelName: modelNames[item.model_id] || item.model_id,
        count: item.count,
        percentage: total > 0 ? (item.count / total) * 100 : 0,
      }));
    } catch (error) {
      logger.error("Error fetching model usage statistics:", error);
      return [];
    }
  },

  /**
   * Get context rule usage statistics
   */
  getContextRuleUsage: async (
    startDate?: string,
    endDate?: string,
  ): Promise<ContextRuleUsage[]> => {
    try {
      const sequelize = await getMySQLClient();

      // Build date filter if provided
      let dateFilter = "";
      const replacements = [];

      if (startDate) {
        dateFilter += " AND ail.created_at >= ?";
        replacements.push(startDate);
      }

      if (endDate) {
        dateFilter += " AND ail.created_at <= ?";
        replacements.push(endDate);
      }

      const [results] = await sequelize.query(
        `SELECT 
          cr.id as rule_id,
          cr.name as rule_name,
          COUNT(ail.id) as count,
          (COUNT(CASE WHEN ail.response IS NOT NULL THEN 1 END) * 100 / COUNT(ail.id)) as effectiveness
        FROM ai_interaction_logs ail
        JOIN context_rules cr ON ail.context_rule_id = cr.id
        WHERE 1=1${dateFilter}
        GROUP BY cr.id, cr.name
        ORDER BY count DESC`,
        {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return (results as any[]).map((item) => ({
        ruleId: item.rule_id,
        ruleName: item.rule_name,
        count: item.count,
        effectiveness: item.effectiveness || 0,
      }));
    } catch (error) {
      logger.error("Error fetching context rule usage statistics:", error);
      return [];
    }
  },

  /**
   * Get user activity statistics
   */
  getUserActivity: async (
    limit = 100,
    offset = 0,
  ): Promise<{ users: UserActivity[]; total: number }> => {
    try {
      const sequelize = await getMySQLClient();

      // Get user activity with pagination
      const [users] = await sequelize.query(
        `SELECT 
          user_id,
          COUNT(*) as interaction_count,
          MAX(created_at) as last_active
        FROM ai_interaction_logs
        GROUP BY user_id
        ORDER BY interaction_count DESC
        LIMIT ? OFFSET ?`,
        {
          replacements: [limit, offset],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Get total count
      const [countResult] = await sequelize.query(
        `SELECT COUNT(DISTINCT user_id) as total FROM ai_interaction_logs`,
        { type: sequelize.QueryTypes.SELECT },
      );

      return {
        users: (users as any[]).map((user) => ({
          userId: user.user_id,
          interactionCount: user.interaction_count,
          lastActive: user.last_active,
        })),
        total: (countResult as any).total || 0,
      };
    } catch (error) {
      logger.error("Error fetching user activity statistics:", error);
      return { users: [], total: 0 };
    }
  },

  /**
   * Get common queries and topics
   */
  getCommonQueries: async (
    limit = 20,
  ): Promise<{ query: string; count: number }[]> => {
    try {
      const sequelize = await getMySQLClient();

      // This is a simplified approach - in a real implementation, you would use
      // more sophisticated NLP techniques to extract topics and cluster similar queries
      const [results] = await sequelize.query(
        `SELECT 
          query,
          COUNT(*) as count
        FROM ai_interaction_logs
        GROUP BY query
        HAVING count > 1
        ORDER BY count DESC
        LIMIT ?`,
        {
          replacements: [limit],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return (results as any[]).map((item) => ({
        query: item.query,
        count: item.count,
      }));
    } catch (error) {
      logger.error("Error fetching common queries:", error);
      return [];
    }
  },

  /**
   * Export analytics data
   */
  exportData: async (
    options: ExportOptions,
  ): Promise<{ data: string; filename: string }> => {
    try {
      const sequelize = await getMySQLClient();

      // Build date filter if provided
      let dateFilter = "";
      const replacements = [];

      if (options.startDate) {
        dateFilter += " AND created_at >= ?";
        replacements.push(options.startDate);
      }

      if (options.endDate) {
        dateFilter += " AND created_at <= ?";
        replacements.push(options.endDate);
      }

      // Select fields based on includeContent option
      const contentFields = options.includeContent ? ", query, response" : "";

      const [results] = await sequelize.query(
        `SELECT 
          id, user_id, model_used, context_rule_id, 
          created_at, updated_at${contentFields}
        FROM ai_interaction_logs
        WHERE 1=1${dateFilter}
        ORDER BY created_at DESC`,
        {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        },
      );

      // Format data based on requested format
      let data = "";
      let filename = `analytics_export_${new Date().toISOString().split("T")[0]}`;

      if (options.format === "json") {
        data = JSON.stringify(results, null, 2);
        filename += ".json";
      } else if (options.format === "csv") {
        // Create CSV header
        const headers = [
          "id",
          "user_id",
          "model_used",
          "context_rule_id",
          "created_at",
          "updated_at",
        ];
        if (options.includeContent) {
          headers.push("query", "response");
        }

        data = headers.join(",") + "\n";

        // Add rows
        for (const row of results as any[]) {
          const values = [
            row.id,
            row.user_id,
            row.model_used,
            row.context_rule_id,
            row.created_at,
            row.updated_at,
          ];

          if (options.includeContent) {
            values.push(
              `"${row.query?.replace(/"/g, '""') || ""}"`,
              `"${row.response?.replace(/"/g, '""') || ""}"`,
            );
          }

          data += values.join(",") + "\n";
        }

        filename += ".csv";
      } else {
        // For Excel format, we'd typically use a library like exceljs
        // Here we'll just return CSV with a different extension
        const headers = [
          "id",
          "user_id",
          "model_used",
          "context_rule_id",
          "created_at",
          "updated_at",
        ];
        if (options.includeContent) {
          headers.push("query", "response");
        }

        data = headers.join(",") + "\n";

        // Add rows
        for (const row of results as any[]) {
          const values = [
            row.id,
            row.user_id,
            row.model_used,
            row.context_rule_id,
            row.created_at,
            row.updated_at,
          ];

          if (options.includeContent) {
            values.push(
              `"${row.query?.replace(/"/g, '""') || ""}"`,
              `"${row.response?.replace(/"/g, '""') || ""}"`,
            );
          }

          data += values.join(",") + "\n";
        }

        filename += ".xlsx";
      }

      return { data, filename };
    } catch (error) {
      logger.error("Error exporting analytics data:", error);
      throw error;
    }
  },
};

export default analyticsService;
