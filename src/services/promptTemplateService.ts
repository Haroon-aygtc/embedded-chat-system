/**
 * Prompt Template Service
 * Manages prompt templates for AI responses
 */

import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import logger from "@/utils/logger";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .order("name");

      if (error) throw error;

      return (
        data?.map((template) => ({
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
        })) || []
      );
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
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("category", category)
        .order("name");

      if (error) throw error;

      return (
        data?.map((template) => ({
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
        })) || []
      );
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
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

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

      const { data, error } = await supabase
        .from("prompt_templates")
        .insert([newTemplate])
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

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
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined)
        updateData.description = params.description;
      if (params.template !== undefined) updateData.template = params.template;
      if (params.category !== undefined) updateData.category = params.category;
      if (params.variables !== undefined)
        updateData.variables = params.variables;
      if (params.isActive !== undefined) updateData.is_active = params.isActive;
      if (params.metadata !== undefined) updateData.metadata = params.metadata;

      const { data, error } = await supabase
        .from("prompt_templates")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

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
      logger.error(`Error updating prompt template ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a prompt template
   */
  deleteTemplate: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("prompt_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
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
      const { error } = await supabase.from("prompt_template_usage").insert([
        {
          id: uuidv4(),
          template_id: templateId,
          used_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
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
      let query = supabase
        .from("prompt_template_usage")
        .select("template_id, used_at");

      if (params.startDate) {
        query = query.gte("used_at", params.startDate);
      }

      if (params.endDate) {
        query = query.lte("used_at", params.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Count usage by template ID
      const usageByTemplate: Record<string, number> = {};
      data?.forEach((usage) => {
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
        totalUsage: data?.length || 0,
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
      const { data, error } = await supabase
        .from("prompt_templates")
        .select("category")
        .order("category");

      if (error) throw error;

      // Extract unique categories
      const categories = new Set<string>();
      data?.forEach((template) => {
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
