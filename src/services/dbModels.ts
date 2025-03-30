import { getMySQLClient } from "./mysqlClient";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";

// Define interfaces for database models
export interface ContextRule {
  id: string;
  name: string;
  description?: string;
  prompt_template_id?: string;
  knowledge_base_ids?: string[];
  system_prompt?: string;
  allowed_domains?: string[];
  blocked_domains?: string[];
  allowed_topics?: string[];
  blocked_topics?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string;
  metadata?: Record<string, any>;
}

export interface WidgetConfig {
  id: string;
  name: string;
  user_id?: string;
  settings: {
    position: string;
    primaryColor: string;
    headerText: string;
    welcomeMessage: string;
    inputPlaceholder: string;
    showAvatar: boolean;
    allowAttachments: boolean;
    theme: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Generic database operations
const dbOperations = {
  findAll: async (table: string, options: any = {}) => {
    try {
      const sequelize = await getMySQLClient();
      let query = `SELECT * FROM ${table}`;
      const replacements = [];

      // Add WHERE clause if conditions are provided
      if (options.where) {
        const whereConditions = [];
        for (const [key, value] of Object.entries(options.where)) {
          whereConditions.push(`${key} = ?`);
          replacements.push(value);
        }
        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(" AND ")}`;
        }
      }

      // Add ORDER BY if specified
      if (options.order) {
        query += ` ORDER BY ${options.order}`;
      }

      // Add LIMIT if specified
      if (options.limit) {
        query += ` LIMIT ?`;
        replacements.push(options.limit);
      }

      // Add OFFSET if specified
      if (options.offset) {
        query += ` OFFSET ?`;
        replacements.push(options.offset);
      }

      const [results] = await sequelize.query(query, { replacements });
      return results;
    } catch (error) {
      logger.error(`Error in findAll for table ${table}:`, error);
      throw error;
    }
  },

  findByPk: async (table: string, id: string) => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM ${table} WHERE id = ?`,
        { replacements: [id] },
      );

      return (results as any[]).length > 0 ? (results as any[])[0] : null;
    } catch (error) {
      logger.error(`Error in findByPk for table ${table}:`, error);
      throw error;
    }
  },

  findOne: async (table: string, options: any = {}) => {
    try {
      const sequelize = await getMySQLClient();
      let query = `SELECT * FROM ${table}`;
      const replacements = [];

      // Add WHERE clause if conditions are provided
      if (options.where) {
        const whereConditions = [];
        for (const [key, value] of Object.entries(options.where)) {
          whereConditions.push(`${key} = ?`);
          replacements.push(value);
        }
        if (whereConditions.length > 0) {
          query += ` WHERE ${whereConditions.join(" AND ")}`;
        }
      }

      query += ` LIMIT 1`;

      const [results] = await sequelize.query(query, { replacements });
      return (results as any[]).length > 0 ? (results as any[])[0] : null;
    } catch (error) {
      logger.error(`Error in findOne for table ${table}:`, error);
      throw error;
    }
  },

  create: async (table: string, data: any) => {
    try {
      const sequelize = await getMySQLClient();
      const id = data.id || uuidv4();
      const now = new Date().toISOString();

      // Prepare fields, placeholders and values
      const fields = ["id", "created_at", "updated_at"];
      const placeholders = ["?", "?", "?"];
      const values = [id, now, now];

      // Add all other fields from data
      for (const [key, value] of Object.entries(data)) {
        if (key !== "id" && key !== "created_at" && key !== "updated_at") {
          fields.push(key);
          placeholders.push("?");

          // Handle objects by converting to JSON strings
          if (typeof value === "object" && value !== null) {
            values.push(JSON.stringify(value));
          } else {
            values.push(value);
          }
        }
      }

      await sequelize.query(
        `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders.join(", ")})`,
        { replacements: values },
      );

      // Return the created record
      const [results] = await sequelize.query(
        `SELECT * FROM ${table} WHERE id = ?`,
        { replacements: [id] },
      );

      return (results as any[])[0];
    } catch (error) {
      logger.error(`Error in create for table ${table}:`, error);
      throw error;
    }
  },

  update: async (table: string, data: any, options: any = {}) => {
    try {
      const sequelize = await getMySQLClient();
      const updateFields = [];
      const replacements = [];

      // Add all fields from data
      for (const [key, value] of Object.entries(data)) {
        if (key !== "id") {
          // Don't update the ID
          updateFields.push(`${key} = ?`);

          // Handle objects by converting to JSON strings
          if (typeof value === "object" && value !== null) {
            replacements.push(JSON.stringify(value));
          } else {
            replacements.push(value);
          }
        }
      }

      // Always update updated_at
      updateFields.push("updated_at = ?");
      replacements.push(new Date().toISOString());

      // Build WHERE clause
      let whereClause = "";
      if (options.where) {
        const whereConditions = [];
        for (const [key, value] of Object.entries(options.where)) {
          whereConditions.push(`${key} = ?`);
          replacements.push(value);
        }
        if (whereConditions.length > 0) {
          whereClause = ` WHERE ${whereConditions.join(" AND ")}`;
        }
      } else if (data.id) {
        whereClause = ` WHERE id = ?`;
        replacements.push(data.id);
      } else {
        throw new Error("No conditions provided for update operation");
      }

      await sequelize.query(
        `UPDATE ${table} SET ${updateFields.join(", ")}${whereClause}`,
        { replacements },
      );

      // Return the updated record(s)
      if (data.id) {
        const [results] = await sequelize.query(
          `SELECT * FROM ${table} WHERE id = ?`,
          { replacements: [data.id] },
        );
        return (results as any[])[0];
      } else {
        return { success: true, affectedRows: 1 }; // Simplified response
      }
    } catch (error) {
      logger.error(`Error in update for table ${table}:`, error);
      throw error;
    }
  },

  destroy: async (table: string, options: any = {}) => {
    try {
      const sequelize = await getMySQLClient();
      let whereClause = "";
      const replacements = [];

      // Build WHERE clause
      if (options.where) {
        const whereConditions = [];
        for (const [key, value] of Object.entries(options.where)) {
          whereConditions.push(`${key} = ?`);
          replacements.push(value);
        }
        if (whereConditions.length > 0) {
          whereClause = ` WHERE ${whereConditions.join(" AND ")}`;
        }
      } else {
        throw new Error("No conditions provided for destroy operation");
      }

      const [result] = await sequelize.query(
        `DELETE FROM ${table}${whereClause}`,
        { replacements },
      );

      return { success: true, affectedRows: (result as any).affectedRows || 0 };
    } catch (error) {
      logger.error(`Error in destroy for table ${table}:`, error);
      throw error;
    }
  },
};

// Model-specific operations
const models = {
  ContextRule: {
    findAll: (options?: any) => dbOperations.findAll("context_rules", options),
    findByPk: (id: string) => dbOperations.findByPk("context_rules", id),
    findOne: (options?: any) => dbOperations.findOne("context_rules", options),
    create: (data: any) => dbOperations.create("context_rules", data),
    update: (data: any, options?: any) =>
      dbOperations.update("context_rules", data, options),
    destroy: (options: any) => dbOperations.destroy("context_rules", options),
  },
  WidgetConfig: {
    findAll: (options?: any) => dbOperations.findAll("widget_configs", options),
    findByPk: (id: string) => dbOperations.findByPk("widget_configs", id),
    findOne: (options?: any) => dbOperations.findOne("widget_configs", options),
    create: (data: any) => dbOperations.create("widget_configs", data),
    update: (data: any, options?: any) =>
      dbOperations.update("widget_configs", data, options),
    destroy: (options: any) => dbOperations.destroy("widget_configs", options),
  },
  SystemSetting: {
    findAll: (options?: any) =>
      dbOperations.findAll("system_settings", options),
    findByPk: (id: string) => dbOperations.findByPk("system_settings", id),
    findOne: (options?: any) =>
      dbOperations.findOne("system_settings", options),
    create: (data: any) => dbOperations.create("system_settings", data),
    update: (data: any, options?: any) =>
      dbOperations.update("system_settings", data, options),
    destroy: (options: any) => dbOperations.destroy("system_settings", options),
  },
  User: {
    findAll: (options?: any) => dbOperations.findAll("users", options),
    findByPk: (id: string) => dbOperations.findByPk("users", id),
    findOne: (options?: any) => dbOperations.findOne("users", options),
    create: (data: any) => dbOperations.create("users", data),
    update: (data: any, options?: any) =>
      dbOperations.update("users", data, options),
    destroy: (options: any) => dbOperations.destroy("users", options),
  },
  AIInteractionLog: {
    findAll: (options?: any) =>
      dbOperations.findAll("ai_interaction_logs", options),
    findByPk: (id: string) => dbOperations.findByPk("ai_interaction_logs", id),
    findOne: (options?: any) =>
      dbOperations.findOne("ai_interaction_logs", options),
    create: (data: any) => dbOperations.create("ai_interaction_logs", data),
    update: (data: any, options?: any) =>
      dbOperations.update("ai_interaction_logs", data, options),
    destroy: (options: any) =>
      dbOperations.destroy("ai_interaction_logs", options),
  },
};

export default models;
