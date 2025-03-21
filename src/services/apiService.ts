import { ContextRule } from "@/types/contextRules";
import { PromptTemplate } from "@/types/promptTemplates";
import api from "./axiosConfig";

// Context Rules API
export const contextRulesApi = {
  getAll: async (): Promise<ContextRule[]> => {
    try {
      const { data, error } = await window.supabase
        .from("context_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the ContextRule type
      return (data || []).map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || "",
        isActive: rule.is_active,
        contextType: rule.context_type,
        keywords: rule.keywords || [],
        excludedTopics: rule.excluded_topics || [],
        promptTemplate: rule.prompt_template || "",
        responseFilters: rule.response_filters || [],
        useKnowledgeBases: rule.use_knowledge_bases || false,
        knowledgeBaseIds: rule.knowledge_base_ids || [],
        preferredModel: rule.preferred_model,
        version: rule.version || 1,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
      }));
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching context rules",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data if API is not available
      return [
        {
          id: "1",
          name: "UAE Government Information",
          description:
            "Limit responses to official UAE government information and services",
          isActive: true,
          contextType: "business",
          keywords: [
            "UAE",
            "government",
            "Dubai",
            "Abu Dhabi",
            "services",
            "visa",
            "Emirates ID",
          ],
          excludedTopics: ["politics", "criticism"],
          promptTemplate:
            "You are an assistant that provides information about UAE government services. {{ userQuery }}",
          responseFilters: [
            { type: "keyword", value: "unofficial", action: "block" },
            { type: "regex", value: "(criticism|negative)", action: "flag" },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "General Information",
          description:
            "Provide general information with no specific business context",
          isActive: false,
          contextType: "general",
          keywords: ["help", "information", "question", "what", "how", "when"],
          excludedTopics: [],
          promptTemplate:
            "You are a helpful assistant. Please answer the following question: {{ userQuery }}",
          responseFilters: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  getById: async (id: string): Promise<ContextRule> => {
    try {
      const { data, error } = await window.supabase
        .from("context_rules")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transform the data to match the ContextRule type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        contextType: data.context_type,
        keywords: data.keywords || [],
        excludedTopics: data.excluded_topics || [],
        promptTemplate: data.prompt_template || "",
        responseFilters: data.response_filters || [],
        useKnowledgeBases: data.use_knowledge_bases || false,
        knowledgeBaseIds: data.knowledge_base_ids || [],
        preferredModel: data.preferred_model,
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching context rule ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      const rules = await contextRulesApi.getAll();
      const rule = rules.find((r) => r.id === id);

      if (!rule) {
        throw new Error("Context rule not found");
      }

      return rule;
    }
  },

  create: async (
    rule: Omit<ContextRule, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContextRule> => {
    try {
      // Transform the data to match the database schema
      const dbRule = {
        name: rule.name,
        description: rule.description,
        is_active: rule.isActive,
        context_type: rule.contextType,
        keywords: rule.keywords,
        excluded_topics: rule.excludedTopics,
        prompt_template: rule.promptTemplate,
        response_filters: rule.responseFilters,
        use_knowledge_bases: rule.useKnowledgeBases,
        knowledge_base_ids: rule.knowledgeBaseIds,
        preferred_model: rule.preferredModel,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await window.supabase
        .from("context_rules")
        .insert([dbRule])
        .select()
        .single();

      if (error) throw error;

      // Also create a version record
      const versionData = {
        rule_id: data.id,
        version: 1,
        data: dbRule,
      };

      const { error: versionError } = await window.supabase
        .from("context_rule_versions")
        .insert([versionData]);

      if (versionError) {
        console.error("Error creating version record:", versionError);
      }

      // Transform back to ContextRule type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        contextType: data.context_type,
        keywords: data.keywords || [],
        excludedTopics: data.excluded_topics || [],
        promptTemplate: data.prompt_template || "",
        responseFilters: data.response_filters || [],
        useKnowledgeBases: data.use_knowledge_bases || false,
        knowledgeBaseIds: data.knowledge_base_ids || [],
        preferredModel: data.preferred_model,
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error creating context rule",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const newRule: ContextRule = {
        ...rule,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newRule;
    }
  },

  update: async (
    id: string,
    rule: Partial<ContextRule>,
  ): Promise<ContextRule> => {
    try {
      // Get the current version
      const { data: currentRule, error: fetchError } = await window.supabase
        .from("context_rules")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Transform the data to match the database schema
      const dbRule: any = {};
      if (rule.name !== undefined) dbRule.name = rule.name;
      if (rule.description !== undefined) dbRule.description = rule.description;
      if (rule.isActive !== undefined) dbRule.is_active = rule.isActive;
      if (rule.contextType !== undefined)
        dbRule.context_type = rule.contextType;
      if (rule.keywords !== undefined) dbRule.keywords = rule.keywords;
      if (rule.excludedTopics !== undefined)
        dbRule.excluded_topics = rule.excludedTopics;
      if (rule.promptTemplate !== undefined)
        dbRule.prompt_template = rule.promptTemplate;
      if (rule.responseFilters !== undefined)
        dbRule.response_filters = rule.responseFilters;
      if (rule.useKnowledgeBases !== undefined)
        dbRule.use_knowledge_bases = rule.useKnowledgeBases;
      if (rule.knowledgeBaseIds !== undefined)
        dbRule.knowledge_base_ids = rule.knowledgeBaseIds;
      if (rule.preferredModel !== undefined)
        dbRule.preferred_model = rule.preferredModel;

      // Increment version
      dbRule.version = (currentRule.version || 1) + 1;
      dbRule.updated_at = new Date().toISOString();

      const { data, error } = await window.supabase
        .from("context_rules")
        .update(dbRule)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Create a version record
      const versionData = {
        rule_id: id,
        version: dbRule.version,
        data: { ...currentRule, ...dbRule },
      };

      const { error: versionError } = await window.supabase
        .from("context_rule_versions")
        .insert([versionData]);

      if (versionError) {
        console.error("Error creating version record:", versionError);
      }

      // Transform back to ContextRule type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        contextType: data.context_type,
        keywords: data.keywords || [],
        excludedTopics: data.excluded_topics || [],
        promptTemplate: data.prompt_template || "",
        responseFilters: data.response_filters || [],
        useKnowledgeBases: data.use_knowledge_bases || false,
        knowledgeBaseIds: data.knowledge_base_ids || [],
        preferredModel: data.preferred_model,
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error updating context rule ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const existingRule = await contextRulesApi.getById(id);
      const updatedRule: ContextRule = {
        ...existingRule,
        ...rule,
        updatedAt: new Date().toISOString(),
      };
      return updatedRule;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await window.supabase
        .from("context_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error deleting context rule ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Silently fail for demo purposes
    }
  },

  testRule: async (
    ruleId: string,
    query: string,
  ): Promise<{ result: string; matches: string[] }> => {
    try {
      // Get the rule
      const rule = await contextRulesApi.getById(ruleId);

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
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error testing context rule ${ruleId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      return {
        result: "This query matches the context rule.",
        matches: ["UAE", "visa", "services"],
      };
    }
  },

  getVersions: async (ruleId: string): Promise<any[]> => {
    try {
      const { data, error } = await window.supabase
        .from("context_rule_versions")
        .select("*")
        .eq("rule_id", ruleId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching context rule versions for ${ruleId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return [];
    }
  },

  restoreVersion: async (
    ruleId: string,
    version: number,
  ): Promise<ContextRule> => {
    try {
      // Get the version data
      const { data: versionData, error: versionError } = await window.supabase
        .from("context_rule_versions")
        .select("*")
        .eq("rule_id", ruleId)
        .eq("version", version)
        .single();

      if (versionError) throw versionError;

      // Get the current version
      const { data: currentRule, error: currentError } = await window.supabase
        .from("context_rules")
        .select("version")
        .eq("id", ruleId)
        .single();

      if (currentError) throw currentError;

      // Update the rule with the version data
      const restoredData = versionData.data;
      restoredData.version = (currentRule.version || 1) + 1;
      restoredData.updated_at = new Date().toISOString();

      const { data, error } = await window.supabase
        .from("context_rules")
        .update(restoredData)
        .eq("id", ruleId)
        .select()
        .single();

      if (error) throw error;

      // Create a new version record for the restoration
      const newVersionData = {
        rule_id: ruleId,
        version: restoredData.version,
        data: restoredData,
      };

      await window.supabase
        .from("context_rule_versions")
        .insert([newVersionData]);

      // Transform back to ContextRule type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        isActive: data.is_active,
        contextType: data.context_type,
        keywords: data.keywords || [],
        excludedTopics: data.excluded_topics || [],
        promptTemplate: data.prompt_template || "",
        responseFilters: data.response_filters || [],
        useKnowledgeBases: data.use_knowledge_bases || false,
        knowledgeBaseIds: data.knowledge_base_ids || [],
        preferredModel: data.preferred_model,
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error restoring context rule version ${version} for ${ruleId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      throw error;
    }
  },
};

// Prompt Templates API
export const promptTemplatesApi = {
  getAll: async (): Promise<PromptTemplate[]> => {
    try {
      const { data, error } = await window.supabase
        .from("prompt_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to match the PromptTemplate type
      return (data || []).map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description || "",
        template: template.template,
        category: template.category || "general",
        variables: template.variables || [],
        version: template.version || 1,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
      }));
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching prompt templates",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        {
          id: "1",
          name: "General Information Query",
          description:
            "A general template for handling basic information queries",
          template:
            "You are a helpful assistant. Answer the following question: {{question}}",
          category: "general",
          variables: ["question"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "UAE Government Information",
          description:
            "Template specifically for UAE government related queries",
          template:
            "You are an assistant specializing in UAE government information. Please provide information about {{topic}} within the context of UAE government services.",
          category: "uae-gov",
          variables: ["topic"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Product Support",
          description: "Template for handling product support queries",
          template:
            "You are a product support specialist. Help the user with their question about {{product}}: {{issue}}",
          category: "support",
          variables: ["product", "issue"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    }
  },

  getById: async (id: string): Promise<PromptTemplate> => {
    try {
      const { data, error } = await window.supabase
        .from("prompt_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Transform the data to match the PromptTemplate type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        template: data.template,
        category: data.category || "general",
        variables: data.variables || [],
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching prompt template ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      const templates = await promptTemplatesApi.getAll();
      const template = templates.find((t) => t.id === id);

      if (!template) {
        throw new Error("Prompt template not found");
      }

      return template;
    }
  },

  create: async (
    template: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">,
  ): Promise<PromptTemplate> => {
    try {
      // Transform the data to match the database schema
      const dbTemplate = {
        name: template.name,
        description: template.description,
        template: template.template,
        category: template.category,
        variables: template.variables,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await window.supabase
        .from("prompt_templates")
        .insert([dbTemplate])
        .select()
        .single();

      if (error) throw error;

      // Also create a version record
      const versionData = {
        template_id: data.id,
        version: 1,
        data: dbTemplate,
      };

      const { error: versionError } = await window.supabase
        .from("prompt_template_versions")
        .insert([versionData]);

      if (versionError) {
        console.error("Error creating version record:", versionError);
      }

      // Transform back to PromptTemplate type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        template: data.template,
        category: data.category || "general",
        variables: data.variables || [],
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error creating prompt template",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const newTemplate: PromptTemplate = {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return newTemplate;
    }
  },

  update: async (
    id: string,
    template: Partial<PromptTemplate>,
  ): Promise<PromptTemplate> => {
    try {
      // Get the current version
      const { data: currentTemplate, error: fetchError } = await window.supabase
        .from("prompt_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Transform the data to match the database schema
      const dbTemplate: any = {};
      if (template.name !== undefined) dbTemplate.name = template.name;
      if (template.description !== undefined)
        dbTemplate.description = template.description;
      if (template.template !== undefined)
        dbTemplate.template = template.template;
      if (template.category !== undefined)
        dbTemplate.category = template.category;
      if (template.variables !== undefined)
        dbTemplate.variables = template.variables;

      // Increment version
      dbTemplate.version = (currentTemplate.version || 1) + 1;
      dbTemplate.updated_at = new Date().toISOString();

      const { data, error } = await window.supabase
        .from("prompt_templates")
        .update(dbTemplate)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Create a version record
      const versionData = {
        template_id: id,
        version: dbTemplate.version,
        data: { ...currentTemplate, ...dbTemplate },
      };

      const { error: versionError } = await window.supabase
        .from("prompt_template_versions")
        .insert([versionData]);

      if (versionError) {
        console.error("Error creating version record:", versionError);
      }

      // Transform back to PromptTemplate type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        template: data.template,
        category: data.category || "general",
        variables: data.variables || [],
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error updating prompt template ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      const existingTemplate = await promptTemplatesApi.getById(id);
      const updatedTemplate: PromptTemplate = {
        ...existingTemplate,
        ...template,
        updatedAt: new Date().toISOString(),
      };
      return updatedTemplate;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const { error } = await window.supabase
        .from("prompt_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error deleting prompt template ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Silently fail for demo purposes
    }
  },

  getVersions: async (templateId: string): Promise<any[]> => {
    try {
      const { data, error } = await window.supabase
        .from("prompt_template_versions")
        .select("*")
        .eq("template_id", templateId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching prompt template versions for ${templateId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return [];
    }
  },

  restoreVersion: async (
    templateId: string,
    version: number,
  ): Promise<PromptTemplate> => {
    try {
      // Get the version data
      const { data: versionData, error: versionError } = await window.supabase
        .from("prompt_template_versions")
        .select("*")
        .eq("template_id", templateId)
        .eq("version", version)
        .single();

      if (versionError) throw versionError;

      // Get the current version
      const { data: currentTemplate, error: currentError } =
        await window.supabase
          .from("prompt_templates")
          .select("version")
          .eq("id", templateId)
          .single();

      if (currentError) throw currentError;

      // Update the template with the version data
      const restoredData = versionData.data;
      restoredData.version = (currentTemplate.version || 1) + 1;
      restoredData.updated_at = new Date().toISOString();

      const { data, error } = await window.supabase
        .from("prompt_templates")
        .update(restoredData)
        .eq("id", templateId)
        .select()
        .single();

      if (error) throw error;

      // Create a new version record for the restoration
      const newVersionData = {
        template_id: templateId,
        version: restoredData.version,
        data: restoredData,
      };

      await window.supabase
        .from("prompt_template_versions")
        .insert([newVersionData]);

      // Transform back to PromptTemplate type
      return {
        id: data.id,
        name: data.name,
        description: data.description || "",
        template: data.template,
        category: data.category || "general",
        variables: data.variables || [],
        version: data.version || 1,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error restoring prompt template version ${version} for ${templateId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      throw error;
    }
  },
};

// Chat API
export const chatApi = {
  sendMessage: async (
    message: string,
    contextRuleId?: string,
  ): Promise<{ id: string; text: string; timestamp: string }> => {
    try {
      const response = await api.post("/chat/message", {
        message,
        contextRuleId,
      });
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error sending chat message",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback for demo purposes
      return {
        id: Date.now().toString(),
        text: `This is a fallback response to: "${message}". The API request failed, but in production this would be generated by an AI model.`,
        timestamp: new Date().toISOString(),
      };
    }
  },

  getHistory: async (): Promise<
    { id: string; text: string; timestamp: string; sender: "user" | "ai" }[]
  > => {
    try {
      const response = await api.get("/chat/history");
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching chat history",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        {
          id: "1",
          text: "Hello, how can I help you with the chat widget today?",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          sender: "ai",
        },
        {
          id: "2",
          text: "I'd like to know how to embed it on my website.",
          timestamp: new Date(Date.now() - 3500000).toISOString(),
          sender: "user",
        },
        {
          id: "3",
          text: "You can embed the chat widget using either an iframe or as a Web Component. Would you like me to explain both options?",
          timestamp: new Date(Date.now() - 3400000).toISOString(),
          sender: "ai",
        },
      ];
    }
  },

  // Delete chat history
  deleteChatHistory: async (): Promise<{ success: boolean }> => {
    try {
      const response = await api.delete("/chat/history");
      return { success: true };
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error deleting chat history",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return { success: false };
    }
  },

  // Get chat history for a specific context
  getContextHistory: async (
    contextRuleId: string,
  ): Promise<
    { id: string; text: string; timestamp: string; sender: "user" | "ai" }[]
  > => {
    try {
      const response = await api.get(`/chat/history/${contextRuleId}`);
      return response.data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching chat history for context ${contextRuleId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Return empty array for demo purposes
      return [];
    }
  },
};

// Analytics API
export const analyticsApi = {
  getOverview: async (
    period: "day" | "week" | "month" = "week",
  ): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    userSatisfactionRate: number;
  }> => {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate = new Date(today);

      if (period === "day") {
        startDate.setDate(today.getDate() - 1);
      } else if (period === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(today.getMonth() - 1);
      }

      const { data, error } = await window.supabase
        .from("analytics_data")
        .select("*")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", today.toISOString().split("T")[0])
        .order("date", { ascending: false });

      if (error) throw error;

      // If we have data, use the most recent entry
      if (data && data.length > 0) {
        const latestData = data[0];
        return {
          totalConversations: latestData.total_conversations,
          totalMessages: latestData.total_messages,
          averageResponseTime: latestData.average_response_time,
          userSatisfactionRate: latestData.satisfaction_rate,
        };
      }

      throw new Error("No analytics data found for the specified period");
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching analytics overview for period ${period}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return {
        totalConversations: 1248,
        totalMessages: 8976,
        averageResponseTime: 1.2, // seconds
        userSatisfactionRate: 92, // percentage
      };
    }
  },

  getMessagesByDay: async (
    days: number = 7,
  ): Promise<{ date: string; count: number }[]> => {
    try {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - days + 1);

      const { data, error } = await window.supabase
        .from("analytics_messages_by_day")
        .select("date, count")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", today.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;

      // If we have data, format it correctly
      if (data && data.length > 0) {
        return data.map((item) => ({
          date: item.date,
          count: item.count,
        }));
      }

      // If we don't have enough data, fill in the gaps
      const result = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        const existingData = data?.find((item) => item.date === dateStr);
        if (existingData) {
          result.push({
            date: dateStr,
            count: existingData.count,
          });
        } else {
          result.push({
            date: dateStr,
            count: 0,
          });
        }
      }

      return result;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching messages by day for ${days} days`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Generate fallback data for the past 'days' days
      const data = [];
      const now = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        data.push({
          date: date.toISOString().split("T")[0],
          count: Math.floor(Math.random() * 500) + 500, // Random between 500-1000
        });
      }

      return data;
    }
  },

  getTopQueries: async (
    limit: number = 10,
  ): Promise<{ query: string; count: number }[]> => {
    try {
      const { data, error } = await window.supabase
        .from("analytics_top_queries")
        .select("query, count")
        .order("count", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching top queries with limit ${limit}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        { query: "How to embed chat widget", count: 145 },
        { query: "Reset password", count: 112 },
        { query: "Pricing plans", count: 98 },
        { query: "API documentation", count: 87 },
        { query: "Context rules examples", count: 76 },
        { query: "Custom styling", count: 65 },
        { query: "Integration with WordPress", count: 58 },
        { query: "Mobile support", count: 52 },
        { query: "Data privacy", count: 47 },
        { query: "Offline mode", count: 41 },
      ];
    }
  },

  // Get model usage statistics
  getModelUsage: async (
    period: "day" | "week" | "month" = "week",
  ): Promise<{ model: string; count: number; percentage: number }[]> => {
    try {
      // Calculate date range based on period
      const today = new Date();
      let startDate = new Date(today);

      if (period === "day") {
        startDate.setDate(today.getDate() - 1);
      } else if (period === "week") {
        startDate.setDate(today.getDate() - 7);
      } else if (period === "month") {
        startDate.setMonth(today.getMonth() - 1);
      }

      const { data, error } = await window.supabase
        .from("analytics_model_usage")
        .select("model, count, percentage")
        .gte("date", startDate.toISOString().split("T")[0])
        .lte("date", today.toISOString().split("T")[0])
        .order("count", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching model usage for period ${period}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Fallback to local data
      return [
        { model: "Gemini", count: 6248, percentage: 70 },
        { model: "Hugging Face", count: 2728, percentage: 30 },
      ];
    }
  },

  // Generate and export reports
  generateReport: async (
    type: "csv" | "json",
    period: "day" | "week" | "month" = "week",
    metrics: string[] = [
      "conversations",
      "messages",
      "responseTime",
      "satisfaction",
    ],
  ): Promise<string> => {
    try {
      // Get the data for the report
      const overview = await analyticsApi.getOverview(period);
      const messagesByDay = await analyticsApi.getMessagesByDay(
        period === "day" ? 1 : period === "week" ? 7 : 30,
      );
      const topQueries = await analyticsApi.getTopQueries(10);
      const modelUsage = await analyticsApi.getModelUsage(period);

      // Combine the data into a report object
      const reportData: any = {
        generatedAt: new Date().toISOString(),
        period,
        metrics: {},
      };

      if (metrics.includes("conversations")) {
        reportData.metrics.totalConversations = overview.totalConversations;
      }

      if (metrics.includes("messages")) {
        reportData.metrics.totalMessages = overview.totalMessages;
        reportData.metrics.messagesByDay = messagesByDay;
      }

      if (metrics.includes("responseTime")) {
        reportData.metrics.averageResponseTime = overview.averageResponseTime;
      }

      if (metrics.includes("satisfaction")) {
        reportData.metrics.userSatisfactionRate = overview.userSatisfactionRate;
      }

      reportData.metrics.topQueries = topQueries;
      reportData.metrics.modelUsage = modelUsage;

      // Format the report based on the requested type
      if (type === "json") {
        return JSON.stringify(reportData, null, 2);
      } else if (type === "csv") {
        // Convert to CSV format
        let csv = "Metric,Value\n";

        if (metrics.includes("conversations")) {
          csv += `Total Conversations,${overview.totalConversations}\n`;
        }

        if (metrics.includes("messages")) {
          csv += `Total Messages,${overview.totalMessages}\n`;
        }

        if (metrics.includes("responseTime")) {
          csv += `Average Response Time (s),${overview.averageResponseTime}\n`;
        }

        if (metrics.includes("satisfaction")) {
          csv += `User Satisfaction Rate (%),${overview.userSatisfactionRate}\n`;
        }

        // Add messages by day
        if (metrics.includes("messages")) {
          csv += "\nMessages by Day\nDate,Count\n";
          messagesByDay.forEach((item) => {
            csv += `${item.date},${item.count}\n`;
          });
        }

        // Add top queries
        csv += "\nTop Queries\nQuery,Count\n";
        topQueries.forEach((item) => {
          csv += `"${item.query}",${item.count}\n`;
        });

        // Add model usage
        csv += "\nModel Usage\nModel,Count,Percentage\n";
        modelUsage.forEach((item) => {
          csv += `${item.model},${item.count},${item.percentage}\n`;
        });

        return csv;
      }

      throw new Error(`Unsupported report type: ${type}`);
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error generating ${type} report for period ${period}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      throw error;
    }
  },
};

// Widget Configuration API
export const widgetConfigApi = {
  getAll: async (): Promise<any[]> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .select("*");

      if (error) throw error;
      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching widget configurations",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      // Return empty array on error
      return [];
    }
  },

  getByUserId: async (userId: string): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 is the error code for no rows returned
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching widget configuration for user ${userId}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  getById: async (id: string): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching widget configuration with id ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  create: async (config: any): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .insert([config])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error creating widget configuration",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  update: async (id: string, config: any): Promise<any | null> => {
    try {
      const { data, error } = await window.supabase
        .from("widget_configs")
        .update(config)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error updating widget configuration with id ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return null;
    }
  },

  delete: async (id: string): Promise<boolean> => {
    try {
      const { error } = await window.supabase
        .from("widget_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error deleting widget configuration with id ${id}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return false;
    }
  },
};

// System Settings API
export const systemSettingsApi = {
  getSettings: async (
    category: string,
    environment: string = "production",
  ): Promise<any> => {
    try {
      const { data, error } = await window.supabase
        .from("system_settings")
        .select("settings")
        .eq("category", category)
        .eq("environment", environment)
        .single();

      if (error) throw error;
      return data.settings;
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching system settings for category ${category} and environment ${environment}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });

      // Return default settings based on category
      switch (category) {
        case "general":
          return {
            siteName: "Context-Aware Chat System",
            siteDescription: "Embeddable AI chat widget with context awareness",
            supportEmail: "support@example.com",
            logoUrl: "https://example.com/logo.png",
            faviconUrl: "https://example.com/favicon.ico",
            maintenanceMode: false,
            defaultLanguage: "en",
            timeZone: "UTC",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h",
          };
        case "security":
          return {
            enableMfa: false,
            sessionTimeout: 60,
            maxLoginAttempts: 5,
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: true,
              passwordExpiry: 90,
            },
            ipRestrictions: "",
          };
        case "email":
          return {
            smtpHost: "smtp.example.com",
            smtpPort: 587,
            smtpUsername: "smtp_user",
            smtpPassword: "",
            smtpSecure: true,
            fromEmail: "no-reply@example.com",
            fromName: "Chat System",
          };
        case "backup":
          return {
            enableAutomaticBackups: true,
            backupFrequency: "daily",
            backupTime: "02:00",
            retentionPeriod: 30,
            backupLocation: "local",
            s3Bucket: "",
            s3Region: "",
            s3AccessKey: "",
            s3SecretKey: "",
          };
        case "logging":
          return {
            logLevel: "info",
            enableAuditLogs: true,
            logRetention: 30,
            enableErrorReporting: true,
            errorReportingEmail: "",
          };
        default:
          return {};
      }
    }
  },

  saveSettings: async (
    category: string,
    settings: any,
    environment: string = "production",
  ): Promise<void> => {
    try {
      // Check if settings for this category and environment already exist
      const { data: existingData, error: fetchError } = await window.supabase
        .from("system_settings")
        .select("id, settings")
        .eq("category", category)
        .eq("environment", environment);

      if (fetchError) throw fetchError;

      if (existingData && existingData.length > 0) {
        // Update existing settings
        const { error } = await window.supabase
          .from("system_settings")
          .update({
            settings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData[0].id);

        if (error) throw error;

        // Add to history
        await window.supabase.from("system_settings_history").insert([
          {
            settings_id: existingData[0].id,
            settings: existingData[0].settings,
          },
        ]);
      } else {
        // Create new settings
        const { data, error } = await window.supabase
          .from("system_settings")
          .insert([
            {
              category,
              settings,
              environment,
            },
          ])
          .select()
          .single();

        if (error) throw error;
      }
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error saving system settings for category ${category} and environment ${environment}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      throw error;
    }
  },

  getSettingsHistory: async (
    category: string,
    environment: string = "production",
  ): Promise<any[]> => {
    try {
      // First get the settings ID
      const { data: settingsData, error: settingsError } = await window.supabase
        .from("system_settings")
        .select("id")
        .eq("category", category)
        .eq("environment", environment)
        .single();

      if (settingsError) throw settingsError;

      // Then get the history for that settings ID
      const { data, error } = await window.supabase
        .from("system_settings_history")
        .select("*")
        .eq("settings_id", settingsData.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error fetching system settings history for category ${category} and environment ${environment}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return [];
    }
  },

  getEnvironments: async (): Promise<string[]> => {
    try {
      const { data, error } = await window.supabase
        .from("system_settings")
        .select("environment")
        .order("environment", { ascending: true });

      if (error) throw error;

      // Extract unique environments
      const environments = new Set<string>();
      data?.forEach((item) => environments.add(item.environment));

      return Array.from(environments);
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          "Error fetching system environments",
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      return ["production", "development", "staging"];
    }
  },

  createEnvironment: async (environment: string): Promise<void> => {
    try {
      // Get all categories from existing settings
      const { data, error } = await window.supabase
        .from("system_settings")
        .select("category, settings")
        .eq("environment", "production"); // Use production as template

      if (error) throw error;

      // Create settings for each category in the new environment
      const newSettings =
        data?.map((item) => ({
          category: item.category,
          settings: item.settings,
          environment,
        })) || [];

      if (newSettings.length > 0) {
        const { error: insertError } = await window.supabase
          .from("system_settings")
          .insert(newSettings);

        if (insertError) throw insertError;
      }
    } catch (error) {
      import("@/utils/logger").then((module) => {
        const logger = module.default;
        logger.error(
          `Error creating environment ${environment}`,
          error instanceof Error ? error : new Error(String(error)),
        );
      });
      throw error;
    }
  },
};

// Export a default object with all APIs
export default {
  contextRules: contextRulesApi,
  promptTemplates: promptTemplatesApi,
  chat: chatApi,
  analytics: analyticsApi,
  widgetConfig: widgetConfigApi,
  users: userManagementApi,
  systemSettings: systemSettingsApi,
};
