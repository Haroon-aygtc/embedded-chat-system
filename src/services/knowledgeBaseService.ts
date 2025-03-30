/**
 * Knowledge Base Service
 * Manages external knowledge sources for AI responses
 */

import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import logger from "@/utils/logger";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface KnowledgeBaseConfig {
  id: string;
  name: string;
  type: "api" | "database" | "cms" | "vector" | "file";
  endpoint?: string;
  connectionString?: string;
  apiKey?: string;
  refreshInterval: number;
  parameters?: Record<string, any>;
  parametersText?: string; // For UI editing
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastSyncedAt?: string;
}

export interface KnowledgeBaseQueryParams {
  query: string;
  limit?: number;
  contextRuleId?: string;
  userId: string;
}

export interface KnowledgeBaseResult {
  id: string;
  content: string;
  source: string;
  relevanceScore?: number;
  metadata?: Record<string, any>;
}

const knowledgeBaseService = {
  /**
   * Get all knowledge base configurations
   */
  getAllConfigs: async (): Promise<KnowledgeBaseConfig[]> => {
    try {
      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching knowledge base configs:", error);
      return [];
    }
  },

  /**
   * Get a knowledge base configuration by ID
   */
  getConfig: async (id: string): Promise<KnowledgeBaseConfig | null> => {
    try {
      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error fetching knowledge base config ${id}:`, error);
      return null;
    }
  },

  /**
   * Create a new knowledge base configuration
   */
  createConfig: async (
    config: Omit<KnowledgeBaseConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<KnowledgeBaseConfig | null> => {
    try {
      const newConfig = {
        ...config,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .insert([newConfig])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error("Error creating knowledge base config:", error);
      return null;
    }
  },

  /**
   * Update a knowledge base configuration
   */
  updateConfig: async (
    id: string,
    config: Partial<KnowledgeBaseConfig>,
  ): Promise<KnowledgeBaseConfig | null> => {
    try {
      const updatedConfig = {
        ...config,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .update(updatedConfig)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error updating knowledge base config ${id}:`, error);
      return null;
    }
  },

  /**
   * Delete a knowledge base configuration
   */
  deleteConfig: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("knowledge_base_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`Error deleting knowledge base config ${id}:`, error);
      return false;
    }
  },

  /**
   * Sync a knowledge base (refresh its content)
   */
  syncKnowledgeBase: async (id: string): Promise<boolean> => {
    try {
      // Get the knowledge base configuration
      const config = await knowledgeBaseService.getConfig(id);
      if (!config) return false;

      // Perform the sync operation based on the knowledge base type
      let success = false;

      switch (config.type) {
        case "api":
          success = await knowledgeBaseService.syncApiKnowledgeBase(config);
          break;
        case "database":
          success =
            await knowledgeBaseService.syncDatabaseKnowledgeBase(config);
          break;
        case "vector":
          success = await knowledgeBaseService.syncVectorKnowledgeBase(config);
          break;
        case "file":
          success = await knowledgeBaseService.syncFileKnowledgeBase(config);
          break;
        case "cms":
          success = await knowledgeBaseService.syncCmsKnowledgeBase(config);
          break;
        default:
          logger.error(`Unknown knowledge base type: ${config.type}`);
          return false;
      }

      if (success) {
        // Update the lastSyncedAt timestamp
        await knowledgeBaseService.updateConfig(id, {
          lastSyncedAt: new Date().toISOString(),
        });
      }

      return success;
    } catch (error) {
      logger.error(`Error syncing knowledge base ${id}:`, error);
      return false;
    }
  },

  /**
   * Sync an API-based knowledge base
   */
  syncApiKnowledgeBase: async (
    config: KnowledgeBaseConfig,
  ): Promise<boolean> => {
    try {
      if (!config.endpoint) {
        logger.error("API endpoint is required for API knowledge base");
        return false;
      }

      // Make a request to the API endpoint to sync the knowledge base
      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        `${config.endpoint}/sync`,
        config.parameters || {},
        { headers },
      );

      return response.status === 200;
    } catch (error) {
      logger.error(`Error syncing API knowledge base ${config.id}:`, error);
      return false;
    }
  },

  /**
   * Sync a database-based knowledge base
   */
  syncDatabaseKnowledgeBase: async (
    config: KnowledgeBaseConfig,
  ): Promise<boolean> => {
    try {
      if (!config.connectionString) {
        logger.error(
          "Connection string is required for database knowledge base",
        );
        return false;
      }

      // In a real implementation, this would connect to the database and sync the data
      // For now, we'll just log a message and return success
      logger.info(`Syncing database knowledge base ${config.id}`);

      // Record the sync operation in the database
      const { error } = await supabase.from("knowledge_base_sync_logs").insert([
        {
          id: uuidv4(),
          knowledge_base_id: config.id,
          status: "success",
          details: "Database sync completed successfully",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(
        `Error syncing database knowledge base ${config.id}:`,
        error,
      );

      // Record the failed sync operation
      try {
        await supabase.from("knowledge_base_sync_logs").insert([
          {
            id: uuidv4(),
            knowledge_base_id: config.id,
            status: "error",
            details: error instanceof Error ? error.message : String(error),
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (logError) {
        logger.error("Error logging sync failure:", logError);
      }

      return false;
    }
  },

  /**
   * Sync a vector database knowledge base
   */
  syncVectorKnowledgeBase: async (
    config: KnowledgeBaseConfig,
  ): Promise<boolean> => {
    try {
      if (!config.endpoint) {
        logger.error("Endpoint is required for vector knowledge base");
        return false;
      }

      // Make a request to the vector database API to sync the knowledge base
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        `${config.endpoint}/sync`,
        config.parameters || {},
        { headers },
      );

      return response.status === 200;
    } catch (error) {
      logger.error(`Error syncing vector knowledge base ${config.id}:`, error);
      return false;
    }
  },

  /**
   * Sync a file-based knowledge base
   */
  syncFileKnowledgeBase: async (
    config: KnowledgeBaseConfig,
  ): Promise<boolean> => {
    try {
      // In a real implementation, this would scan files and update the knowledge base
      // For now, we'll just log a message and return success
      logger.info(`Syncing file knowledge base ${config.id}`);

      // Record the sync operation in the database
      const { error } = await supabase.from("knowledge_base_sync_logs").insert([
        {
          id: uuidv4(),
          knowledge_base_id: config.id,
          status: "success",
          details: "File sync completed successfully",
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`Error syncing file knowledge base ${config.id}:`, error);
      return false;
    }
  },

  /**
   * Sync a CMS-based knowledge base
   */
  syncCmsKnowledgeBase: async (
    config: KnowledgeBaseConfig,
  ): Promise<boolean> => {
    try {
      if (!config.endpoint) {
        logger.error("Endpoint is required for CMS knowledge base");
        return false;
      }

      // Make a request to the CMS API to sync the knowledge base
      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.get(`${config.endpoint}`, {
        headers,
        params: config.parameters || {},
      });

      // Process the CMS data and store it in the knowledge base
      if (response.status === 200 && response.data) {
        // In a real implementation, this would process and store the CMS data
        logger.info(`Received CMS data for knowledge base ${config.id}`);

        // Record the sync operation in the database
        const { error } = await supabase
          .from("knowledge_base_sync_logs")
          .insert([
            {
              id: uuidv4(),
              knowledge_base_id: config.id,
              status: "success",
              details: `Synced ${response.data.length || 0} items from CMS`,
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) throw error;
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error syncing CMS knowledge base ${config.id}:`, error);
      return false;
    }
  },

  /**
   * Query the knowledge base
   */
  query: async (
    params: KnowledgeBaseQueryParams,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      // Get active knowledge bases
      const { data: activeKbs, error: kbError } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .eq("is_active", true);

      if (kbError) throw kbError;

      // Filter by specific knowledge base IDs if provided
      const kbsToQuery = params.contextRuleId
        ? await knowledgeBaseService.getKnowledgeBasesForContextRule(
            params.contextRuleId,
          )
        : activeKbs;

      if (!kbsToQuery || kbsToQuery.length === 0) {
        return [];
      }

      // Query each knowledge base and combine results
      const allResults: KnowledgeBaseResult[] = [];

      for (const kb of kbsToQuery) {
        const results = await knowledgeBaseService.queryKnowledgeBase(
          kb,
          params.query,
          params.limit || 5,
        );
        allResults.push(...results);
      }

      // Sort results by relevance score (descending)
      allResults.sort((a, b) => {
        const scoreA = a.relevanceScore || 0;
        const scoreB = b.relevanceScore || 0;
        return scoreB - scoreA;
      });

      // Limit the total number of results
      const limitedResults = allResults.slice(0, params.limit || 5);

      // Log the query for analytics
      await knowledgeBaseService.logQuery({
        query: params.query,
        userId: params.userId,
        contextRuleId: params.contextRuleId,
        knowledgeBaseIds: kbsToQuery.map((kb) => kb.id),
        resultCount: limitedResults.length,
      });

      return limitedResults;
    } catch (error) {
      logger.error("Error querying knowledge base:", error);
      return [];
    }
  },

  /**
   * Query a specific knowledge base
   */
  queryKnowledgeBase: async (
    config: KnowledgeBaseConfig,
    query: string,
    limit: number,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      switch (config.type) {
        case "api":
          return await knowledgeBaseService.queryApiKnowledgeBase(
            config,
            query,
            limit,
          );
        case "vector":
          return await knowledgeBaseService.queryVectorKnowledgeBase(
            config,
            query,
            limit,
          );
        case "database":
          return await knowledgeBaseService.queryDatabaseKnowledgeBase(
            config,
            query,
            limit,
          );
        case "file":
          return await knowledgeBaseService.queryFileKnowledgeBase(
            config,
            query,
            limit,
          );
        case "cms":
          return await knowledgeBaseService.queryCmsKnowledgeBase(
            config,
            query,
            limit,
          );
        default:
          logger.error(`Unknown knowledge base type: ${config.type}`);
          return [];
      }
    } catch (error) {
      logger.error(
        `Error querying knowledge base ${config.id} of type ${config.type}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Query an API-based knowledge base
   */
  queryApiKnowledgeBase: async (
    config: KnowledgeBaseConfig,
    query: string,
    limit: number,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      if (!config.endpoint) {
        logger.error("API endpoint is required for API knowledge base");
        return [];
      }

      // Make a request to the API endpoint to query the knowledge base
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        config.endpoint,
        {
          query,
          limit,
          ...config.parameters,
        },
        { headers },
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        // Map the API response to KnowledgeBaseResult format
        return response.data.map((item: any) => ({
          id: item.id || uuidv4(),
          content: item.content || item.text || "",
          source: item.source || config.name,
          relevanceScore: item.relevance_score || item.score || 0,
          metadata: item.metadata || {},
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Error querying API knowledge base ${config.id}:`, error);
      return [];
    }
  },

  /**
   * Query a vector database knowledge base
   */
  queryVectorKnowledgeBase: async (
    config: KnowledgeBaseConfig,
    query: string,
    limit: number,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      if (!config.endpoint) {
        logger.error("Endpoint is required for vector knowledge base");
        return [];
      }

      // Make a request to the vector database API to query the knowledge base
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.post(
        config.endpoint,
        {
          query,
          limit,
          ...config.parameters,
        },
        { headers },
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        // Map the vector database response to KnowledgeBaseResult format
        return response.data.map((item: any) => ({
          id: item.id || uuidv4(),
          content: item.content || item.text || "",
          source: item.source || config.name,
          relevanceScore: item.similarity || item.score || 0,
          metadata: item.metadata || {},
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Error querying vector knowledge base ${config.id}:`, error);
      return [];
    }
  },

  /**
   * Query a database-based knowledge base
   */
  queryDatabaseKnowledgeBase: async (
    config: KnowledgeBaseConfig,
    query: string,
    limit: number,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      // In a real implementation, this would query the database directly
      // For now, we'll query the knowledge_base_content table in Supabase
      const { data, error } = await supabase
        .from("knowledge_base_content")
        .select("*")
        .eq("knowledge_base_id", config.id)
        .textSearch("content", query)
        .limit(limit);

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          content: item.content,
          source: item.source || config.name,
          relevanceScore: item.relevance_score || 0.5, // Default score
          metadata: item.metadata || {},
        }));
      }

      return [];
    } catch (error) {
      logger.error(
        `Error querying database knowledge base ${config.id}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Query a file-based knowledge base
   */
  queryFileKnowledgeBase: async (
    config: KnowledgeBaseConfig,
    query: string,
    limit: number,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      // In a real implementation, this would search through indexed files
      // For now, we'll query the knowledge_base_content table in Supabase
      const { data, error } = await supabase
        .from("knowledge_base_content")
        .select("*")
        .eq("knowledge_base_id", config.id)
        .textSearch("content", query)
        .limit(limit);

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((item) => ({
          id: item.id,
          content: item.content,
          source:
            item.source || `${config.name} - ${item.file_path || "unknown"}`,
          relevanceScore: item.relevance_score || 0.5, // Default score
          metadata: item.metadata || {},
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Error querying file knowledge base ${config.id}:`, error);
      return [];
    }
  },

  /**
   * Query a CMS-based knowledge base
   */
  queryCmsKnowledgeBase: async (
    config: KnowledgeBaseConfig,
    query: string,
    limit: number,
  ): Promise<KnowledgeBaseResult[]> => {
    try {
      if (!config.endpoint) {
        logger.error("Endpoint is required for CMS knowledge base");
        return [];
      }

      // Make a request to the CMS API to query the knowledge base
      const headers: Record<string, string> = {};
      if (config.apiKey) {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const response = await axios.get(config.endpoint, {
        headers,
        params: {
          query,
          limit,
          ...config.parameters,
        },
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        // Map the CMS response to KnowledgeBaseResult format
        return response.data.map((item: any) => ({
          id: item.id || uuidv4(),
          content: item.content || item.text || "",
          source: item.source || `${config.name} - ${item.title || "unknown"}`,
          relevanceScore: item.relevance || 0.5, // Default score
          metadata: item.metadata || {},
        }));
      }

      return [];
    } catch (error) {
      logger.error(`Error querying CMS knowledge base ${config.id}:`, error);
      return [];
    }
  },

  /**
   * Get knowledge bases for a specific context rule
   */
  getKnowledgeBasesForContextRule: async (
    contextRuleId: string,
  ): Promise<KnowledgeBaseConfig[]> => {
    try {
      // Get the context rule
      const { data: contextRule, error: contextRuleError } = await supabase
        .from("context_rules")
        .select("*")
        .eq("id", contextRuleId)
        .single();

      if (contextRuleError) throw contextRuleError;

      if (!contextRule || !contextRule.knowledge_base_ids) {
        return [];
      }

      // Get the knowledge bases
      const knowledgeBaseIds = Array.isArray(contextRule.knowledge_base_ids)
        ? contextRule.knowledge_base_ids
        : contextRule.knowledge_base_ids.split(",");

      const { data: knowledgeBases, error: kbError } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .in("id", knowledgeBaseIds)
        .eq("is_active", true);

      if (kbError) throw kbError;

      return knowledgeBases || [];
    } catch (error) {
      logger.error(
        `Error getting knowledge bases for context rule ${contextRuleId}:`,
        error,
      );
      return [];
    }
  },

  /**
   * Log a knowledge base query for analytics
   */
  logQuery: async (params: {
    query: string;
    userId: string;
    contextRuleId?: string;
    knowledgeBaseIds: string[];
    resultCount: number;
  }): Promise<void> => {
    try {
      const { error } = await supabase
        .from("knowledge_base_query_logs")
        .insert([
          {
            id: uuidv4(),
            query: params.query,
            user_id: params.userId,
            context_rule_id: params.contextRuleId,
            knowledge_base_ids: params.knowledgeBaseIds,
            result_count: params.resultCount,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) throw error;
    } catch (error) {
      logger.error("Error logging knowledge base query:", error);
    }
  },

  /**
   * Get knowledge base query logs for analytics
   */
  getQueryLogs: async (params: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> => {
    try {
      let query = supabase
        .from("knowledge_base_query_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (params.startDate) {
        query = query.gte("created_at", params.startDate);
      }

      if (params.endDate) {
        query = query.lte("created_at", params.endDate);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(
          params.offset,
          params.offset + (params.limit || 10) - 1,
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error getting knowledge base query logs:", error);
      return [];
    }
  },

  /**
   * Get knowledge base analytics
   */
  getAnalytics: async (params: {
    startDate?: string;
    endDate?: string;
  }): Promise<any> => {
    try {
      // Get query logs for the specified time period
      const logs = await knowledgeBaseService.getQueryLogs(params);

      // Calculate analytics
      const knowledgeBaseUsage: Record<string, number> = {};
      const queryDistribution: Record<string, number> = {};
      let totalQueries = 0;
      let totalResults = 0;

      logs.forEach((log) => {
        totalQueries++;
        totalResults += log.result_count || 0;

        // Count knowledge base usage
        if (log.knowledge_base_ids && Array.isArray(log.knowledge_base_ids)) {
          log.knowledge_base_ids.forEach((kbId: string) => {
            knowledgeBaseUsage[kbId] = (knowledgeBaseUsage[kbId] || 0) + 1;
          });
        }

        // Count query distribution by context rule
        const contextRuleId = log.context_rule_id || "none";
        queryDistribution[contextRuleId] =
          (queryDistribution[contextRuleId] || 0) + 1;
      });

      return {
        totalQueries,
        totalResults,
        averageResultsPerQuery:
          totalQueries > 0 ? totalResults / totalQueries : 0,
        knowledgeBaseUsage,
        queryDistribution,
        timeRange: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      };
    } catch (error) {
      logger.error("Error getting knowledge base analytics:", error);
      return {
        totalQueries: 0,
        totalResults: 0,
        averageResultsPerQuery: 0,
        knowledgeBaseUsage: {},
        queryDistribution: {},
        timeRange: {
          startDate: params.startDate,
          endDate: params.endDate,
        },
      };
    }
  },
};

export default knowledgeBaseService;
