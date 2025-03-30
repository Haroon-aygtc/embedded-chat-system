/**
 * Prompt Template Service
 * Manages prompt templates for AI responses
 */

import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  category: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PromptTemplateCreateParams {
  name: string;
  description: string;
  template: string;
  category: string;
  variables: string[];
  isActive?: boolean;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PromptTemplateUpdateParams {
  name?: string;
  description?: string;
  template?: string;
  category?: string;
  variables?: string[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface PromptTemplateApplyParams {
  templateId: string;
  variables: Record<string, string>;
  defaultSystemPrompt?: string;
}

const promptTemplateService = {
  /**
   * Get all prompt templates
   */
  getAllTemplates: async (): Promise<PromptTemplate[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM prompt_templates ORDER BY name`,
      );

      return (results as any[]).map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        template: template.template,
        category: template.category,
        variables: template.variables || [],
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        isActive: template.is_active,
        userId: template.user_id,
        metadata: template.metadata,
      }));
    } catch (error) {
      logger.error("Error fetching prompt templates:", error);
      return [];
    }
  },

  /**
   * Get prompt templates by category
   */
  getTemplatesByCategory: async (
    category: string,
  ): Promise<PromptTemplate[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM prompt_templates WHERE category = ? ORDER BY name`,
        {
          replacements: [category],
        },
      );

      return (results as any[]).map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        template: template.template,
        category: template.category,
        variables: template.variables || [],
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        isActive: template.is_active,
        userId: template.user_id,
        metadata: template.metadata,
      }));
    } catch (error) {
      logger.error(
        `Error fetching prompt templates for category ${category}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Get a prompt template by ID
   */
  getTemplate: async (id: string): Promise<PromptTemplate | null> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM prompt_templates WHERE id = ?`,
        {
          replacements: [id],
        },
      );

      if (!results || (results as any[]).length === 0) return null;
      const data = (results as any[])[0];

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        template: data.template,
        category: data.category,
        variables: data.variables || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isActive: data.is_active,
        userId: data.user_id,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error(`Error fetching prompt template ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new prompt template
   */
  createTemplate: async (
    params: PromptTemplateCreateParams,
  ): Promise<PromptTemplate | null> => {
    try {
      const sequelize = await getMySQLClient();
      const newTemplate = {
        id: uuidv4(),
        name: params.name,
        description: params.description,
        template: params.template,
        category: params.category,
        variables: params.variables,
        is_active: params.isActive !== false, // Default to true
        user_id: params.userId,
        metadata: params.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sequelize.query(
        `INSERT INTO prompt_templates (
          id, name, description, template, category, variables, 
          is_active, user_id, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            newTemplate.id,
            newTemplate.name,
            newTemplate.description,
            newTemplate.template,
            newTemplate.category,
            JSON.stringify(newTemplate.variables),
            newTemplate.is_active,
            newTemplate.user_id,
            JSON.stringify(newTemplate.metadata),
            newTemplate.created_at,
            newTemplate.updated_at,
          ],
        },
      );

      return {
        id: newTemplate.id,
        name: newTemplate.name,
        description: newTemplate.description,
        template: newTemplate.template,
        category: newTemplate.category,
        variables: newTemplate.variables,
        createdAt: newTemplate.created_at,
        updatedAt: newTemplate.updated_at,
        isActive: newTemplate.is_active,
        userId: newTemplate.user_id,
        metadata: newTemplate.metadata,
      };
    } catch (error) {
      logger.error("Error creating prompt template:", error);
      return null;
    }
  },

  /**
   * Update a prompt template
   */
  updateTemplate: async (
    id: string,
    params: PromptTemplateUpdateParams,
  ): Promise<PromptTemplate | null> => {
    try {
      const sequelize = await getMySQLClient();
      const updateFields = [];
      const replacements = [];

      // Build dynamic update query
      if (params.name !== undefined) {
        updateFields.push("name = ?");
        replacements.push(params.name);
      }
      if (params.description !== undefined) {
        updateFields.push("description = ?");
        replacements.push(params.description);
      }
      if (params.template !== undefined) {
        updateFields.push("template = ?");
        replacements.push(params.template);
      }
      if (params.category !== undefined) {
        updateFields.push("category = ?");
        replacements.push(params.category);
      }
      if (params.variables !== undefined) {
        updateFields.push("variables = ?");
        replacements.push(JSON.stringify(params.variables));
      }
      if (params.isActive !== undefined) {
        updateFields.push("is_active = ?");
        replacements.push(params.isActive);
      }
      if (params.metadata !== undefined) {
        updateFields.push("metadata = ?");
        replacements.push(JSON.stringify(params.metadata));
      }

      // Always update the updated_at timestamp
      updateFields.push("updated_at = ?");
      replacements.push(new Date().toISOString());

      // Add the ID to the replacements array for the WHERE clause
      replacements.push(id);

      // Execute the update query
      await sequelize.query(
        `UPDATE prompt_templates SET ${updateFields.join(", ")} WHERE id = ?`,
        { replacements },
      );

      // Fetch the updated template
      return await promptTemplateService.getTemplate(id);
    } catch (error) {
      logger.error(`Error updating prompt template ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a prompt template
   */
  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      const sequelize = await getMySQLClient();
      await sequelize.query(`DELETE FROM prompt_templates WHERE id = ?`, {
        replacements: [id],
      });
      return true;
    } catch (error) {
      logger.error(`Error deleting prompt template ${id}:`, error);
      return false;
    }
  },

  /**
   * Apply a prompt template with variables
   */
  applyTemplate: async (
    params: PromptTemplateApplyParams,
  ): Promise<string | null> => {
    try {
      // Get the template
      const template = await promptTemplateService.getTemplate(
        params.templateId,
      );
      if (!template) {
        logger.error(`Prompt template ${params.templateId} not found`);
        return params.defaultSystemPrompt || null;
      }

      // Replace variables in the template
      let processedTemplate = template.template;

      // Log template usage
      await promptTemplateService.logTemplateUsage(template.id);

      // Replace all variables in the format {{variable}}
      for (const [key, value] of Object.entries(params.variables)) {
        const regex = new RegExp(`\{\{${key}\}\}`, "g");
        processedTemplate = processedTemplate.replace(regex, value);
      }

      // Check if there are any unreplaced variables
      const unreplacedVariables = processedTemplate.match(/\{\{[^}]+\}\}/g);
      if (unreplacedVariables && unreplacedVariables.length > 0) {
        logger.warn(
          `Unreplaced variables in template ${template.id}: ${unreplacedVariables.join(
            ", ",
          )}`,
        );
      }

      return processedTemplate;
    } catch (error) {
      logger.error(
        `Error applying prompt template ${params.templateId}:`,
        error,
      );
      return params.defaultSystemPrompt || null;
    }
  },

  /**
   * Log template usage for analytics
   */
  logTemplateUsage: async (templateId: string): Promise<void> => {
    try {
      const sequelize = await getMySQLClient();
      await sequelize.query(
        `INSERT INTO prompt_template_usage (id, template_id, used_at) VALUES (?, ?, ?)`,
        {
          replacements: [uuidv4(), templateId, new Date().toISOString()],
        },
      );
    } catch (error) {
      logger.error(`Error logging template usage for ${templateId}:`, error);
    }
  },

  /**
   * Get template usage analytics
   */
  getTemplateUsageAnalytics: async (params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    try {
      const sequelize = await getMySQLClient();
      let query = `SELECT template_id, used_at FROM prompt_template_usage`;
      const replacements = [];

      if (params.startDate || params.endDate) {
        query += " WHERE ";

        if (params.startDate) {
          query += "used_at >= ?";
          replacements.push(params.startDate);

          if (params.endDate) {
            query += " AND ";
          }
        }

        if (params.endDate) {
          query += "used_at <= ?";
          replacements.push(params.endDate);
        }
      }

      const [data] = await sequelize.query(query, { replacements });

      // Count usage by template ID
      const usageByTemplate: Record<string, number> = {};
      (data as any[]).forEach((usage) => {
        usageByTemplate[usage.template_id] =
          (usageByTemplate[usage.template_id] || 0) + 1;
      });

      // Get template details for the used templates
      const templateIds = Object.keys(usageByTemplate);
      const templates = await Promise.all(
        templateIds.map((id) => promptTemplateService.getTemplate(id)),
      );

      // Combine usage data with template details
      const usageWithDetails = templates
        .filter((template): template is PromptTemplate => template !== null)
        .map((template) => ({
          id: template.id,
          name: template.name,
          category: template.category,
          usageCount: usageByTemplate[template.id] || 0,
        }));

      return {
        totalUsage: (data as any[]).length || 0,
        usageByTemplate: usageWithDetails,
        timeRange: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      };
    } catch (error) {
      logger.error("Error getting template usage analytics:", error);
      return {
        totalUsage: 0,
        usageByTemplate: [],
        timeRange: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      };
    }
  },

  /**
   * Get all template categories
   */
  getAllCategories: async (): Promise<string[]> => {
    try {
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT DISTINCT category FROM prompt_templates ORDER BY category`,
      );

      // Extract unique categories
      const categories = new Set<string>();
      (results as any[]).forEach((template) => {
        if (template.category) {
          categories.add(template.category);
        }
      });

      return Array.from(categories);
    } catch (error) {
      logger.error("Error fetching prompt template categories:", error);
      return [];
    }
  },

  /**
   * Extract variables from a template string
   */
  extractVariables: (templateString: string): string[] => {
    const variables = new Set<string>();
    const regex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = regex.exec(templateString)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  },
};

export default promptTemplateService;
