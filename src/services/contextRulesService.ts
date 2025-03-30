import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { ContextRule } from "@/models";

interface ContextRuleData {
  name: string;
  description?: string;
  isActive?: boolean;
  contextType?: string;
  keywords?: string[];
  excludedTopics?: string[];
  promptTemplate?: string;
  responseFilters?: any[];
  useKnowledgeBases?: boolean;
  knowledgeBaseIds?: string[];
  preferredModel?: string;
  version?: number;
}

const contextRulesService = {
  /**
   * Get all context rules
   */
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

  /**
   * Get a context rule by ID
   */
  getContextRule: async (id: string): Promise<ContextRule | null> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!results || (results as any[]).length === 0) return null;

      const rule = (results as any[])[0];
      return {
        id: rule.id,
        name: rule.name,
        description: rule.description || "",
        is_active: rule.is_active,
        context_type: rule.context_type,
        keywords: rule.keywords || [],
        excluded_topics: rule.excluded_topics || [],
        prompt_template: rule.prompt_template || "",
        response_filters: rule.response_filters || [],
        use_knowledge_bases: rule.use_knowledge_bases || false,
        knowledge_base_ids: rule.knowledge_base_ids || [],
        preferred_model: rule.preferred_model,
        version: rule.version || 1,
        created_at: rule.created_at,
        updated_at: rule.updated_at,
      };
    } catch (error) {
      logger.error(`Error fetching context rule ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new context rule
   */
  createContextRule: async (data: ContextRuleData) => {
    try {
      const sequelize = await getMySQLClient();
      const id = uuidv4();
      const now = new Date().toISOString();

      // Convert camelCase to snake_case for database and prepare values
      const fields = [];
      const placeholders = [];
      const values = [];

      fields.push("id");
      placeholders.push("?");
      values.push(id);

      fields.push("created_at");
      placeholders.push("?");
      values.push(now);

      fields.push("updated_at");
      placeholders.push("?");
      values.push(now);

      // Process all other fields from data
      Object.entries(data).forEach(([key, value]) => {
        // Convert camelCase to snake_case
        const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        fields.push(dbField);
        placeholders.push("?");

        // Handle arrays and objects by converting to JSON strings
        if (typeof value === "object" && value !== null) {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      });

      await sequelize.query(
        `INSERT INTO context_rules (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
        {
          replacements: values,
          type: sequelize.QueryTypes.INSERT,
        },
      );

      // Fetch the created rule
      const [results] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      return (results as any[])[0];
    } catch (error) {
      logger.error("Error creating context rule:", error);
      throw error;
    }
  },

  /**
   * Update an existing context rule
   */
  updateContextRule: async (id: string, data: Partial<ContextRuleData>) => {
    try {
      const sequelize = await getMySQLClient();
      const updateFields = [];
      const replacements = [];

      // Build dynamic update query
      Object.entries(data).forEach(([key, value]) => {
        // Convert camelCase to snake_case for database
        const dbField = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        updateFields.push(`${dbField} = ?`);

        // Handle arrays and objects by converting to JSON strings
        if (typeof value === "object" && value !== null) {
          replacements.push(JSON.stringify(value));
        } else {
          replacements.push(value);
        }
      });

      // Add updated_at timestamp
      updateFields.push("updated_at = ?");
      replacements.push(new Date().toISOString());

      // Add ID to replacements
      replacements.push(id);

      await sequelize.query(
        `UPDATE context_rules SET ${updateFields.join(", ")} WHERE id = ?`,
        {
          replacements,
          type: sequelize.QueryTypes.UPDATE,
        },
      );

      // Fetch the updated rule
      const [results] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [id],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!results || (results as any[]).length === 0) {
        throw new Error(`Context rule with ID ${id} not found`);
      }

      return (results as any[])[0];
    } catch (error) {
      logger.error(`Error updating context rule ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a context rule
   */
  deleteContextRule: async (id: string) => {
    try {
      const sequelize = await getMySQLClient();
      await sequelize.query(`DELETE FROM context_rules WHERE id = ?`, {
        replacements: [id],
        type: sequelize.QueryTypes.DELETE,
      });
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting context rule ${id}:`, error);
      throw error;
    }
  },

  /**
   * Test a context rule against a query
   */
  testContextRule: async (id: string, query: string) => {
    try {
      // Get the rule
      const rule = await contextRulesService.getContextRule(id);
      if (!rule) {
        throw new Error(`Context rule with ID ${id} not found`);
      }

      // Simple implementation: check if any keywords match
      const matches = rule.keywords.filter((keyword) =>
        query.toLowerCase().includes(keyword.toLowerCase()),
      );

      let result = "This query does not match the context rule.";
      if (matches.length > 0) {
        result = `This query matches the context rule with ${matches.length} keyword(s): ${matches.join(", ")}. The AI would respond using the context rule's prompt template.`;
      }

      return { result, matches };
    } catch (error) {
      logger.error(`Error testing context rule ${id}:`, error);
      throw error;
    }
  },
};

export default contextRulesService;
