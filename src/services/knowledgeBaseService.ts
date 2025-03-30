/**
 * Knowledge Base Service
 * Manages external knowledge sources for AI responses
 */

import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";

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
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM knowledge_base_configs ORDER BY name`,
      );
      return results as KnowledgeBaseConfig[];
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
      const sequelize = await getMySQLClient();
      const [results] = await sequelize.query(
        `SELECT * FROM knowledge_base_configs WHERE id = ?`,
        {
          replacements: [id],
        },
      );

      if (!results || (results as any[]).length === 0) return null;
      return (results as any[])[0] as KnowledgeBaseConfig;
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
      const sequelize = await getMySQLClient();
      const newConfig = {
        ...config,
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await sequelize.query(
        `INSERT INTO knowledge_base_configs (
          id, name, type, endpoint, connection_string, api_key, refresh_interval,
          parameters, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            newConfig.id,
            newConfig.name,
            newConfig.type,
            newConfig.endpoint || null,
            newConfig.connectionString || null,
            newConfig.apiKey || null,
            newConfig.refreshInterval,
            JSON.stringify(newConfig.parameters || {}),
            newConfig.isActive,
            newConfig.created_at,
            newConfig.updated_at,
          ],
        },
      );

      return {
        ...config,
        id: newConfig.id,
        createdAt: newConfig.created_at,
        updatedAt: newConfig.updated_at,
      };
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
      const sequelize = await getMySQLClient();
      const updateFields = [];
      const replacements = [];

      // Build dynamic update query
      if (config.name !== undefined) {
        updateFields.push("name = ?");
        replacements.push(config.name);
      }
      if (config.type !== undefined) {
        updateFields.push("type = ?");
        replacements.push(config.type);
      }
      if (config.endpoint !== undefined) {
        updateFields.push("endpoint = ?");
        replacements.push(config.endpoint);
      }
      if (config.connectionString !== undefined) {
        updateFields.push("connection_string = ?");
        replacements.push(config.connectionString);
      }
      if (config.apiKey !== undefined) {
        updateFields.push("api_key = ?");
        replacements.push(config.apiKey);
      }
      if (config.refreshInterval !== undefined) {
        updateFields.push("refresh_interval = ?");
        replacements.push(config.refreshInterval);
      }
      if (config.parameters !== undefined) {
        updateFields.push("parameters = ?");
        replacements.push(JSON.stringify(config.parameters));
      }
      if (config.isActive !== undefined) {
        updateFields.push("is_active = ?");
        replacements.push(config.isActive);
      }
      if (config.lastSyncedAt !== undefined) {
        updateFields.push("last_synced_at = ?");
        replacements.push(config.lastSyncedAt);
      }

      // Always update the updated_at timestamp
      updateFields.push("updated_at = ?");
      replacements.push(new Date().toISOString());

      // Add the ID to the replacements array for the WHERE clause
      replacements.push(id);

      // Execute the update query
      await sequelize.query(
        `UPDATE knowledge_base_configs SET ${updateFields.join(", ")} WHERE id = ?`,
        { replacements },
      );

      // Fetch the updated config
      return await knowledgeBaseService.getConfig(id);
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
      const sequelize = await getMySQLClient();
      await sequelize.query(`DELETE FROM knowledge_base_configs WHERE id = ?`, {
        replacements: [id],
      });
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
      logger.info(`Syncing database knowledge base ${config.id}`);

      // Record the sync operation in the database
      const sequelize = await getMySQLClient();
      await sequelize.query(
        `INSERT INTO knowledge_base_sync_logs (id, knowledge_base_id, status, details, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        {
          replacements: [
            uuidv4(),
            config.id,
            "success",
            "Database sync completed successfully",
            new Date().toISOString(),
          ],
        },
      );

      return true;
    } catch (error) {
      logger.error(
        `Error syncing database knowledge base ${config.id}:`,
        error,
      );

      // Record the failed sync operation
      try {
        const sequelize = await getMySQLClient();
        await sequelize.query(
          `INSERT INTO knowledge_base_sync_logs (id, knowledge_base_id, status, details, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              uuidv4(),
              config.id,
              "error",
              error instanceof Error ? error.message : String(error),
              new Date().toISOString(),
            ],
          },
        );
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
      logger.info(`Syncing file knowledge base ${config.id}`);

      // Record the sync operation in the database
      const sequelize = await getMySQLClient();
      await sequelize.query(
        `INSERT INTO knowledge_base_sync_logs (id, knowledge_base_id, status, details, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        {
          replacements: [
            uuidv4(),
            config.id,
            "success",
            "File sync completed successfully",
            new Date().toISOString(),
          ],
        },
      );

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
        const sequelize = await getMySQLClient();
        await sequelize.query(
          `INSERT INTO knowledge_base_sync_logs (id, knowledge_base_id, status, details, created_at)
           VALUES (?, ?, ?, ?, ?)`,
          {
            replacements: [
              uuidv4(),
              config.id,
              "success",
              `Synced ${response.data.length || 0} items from CMS`,
              new Date().toISOString(),
            ],
          },
        );

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
      const sequelize = await getMySQLClient();
      const [activeKbs] = await sequelize.query(
        `SELECT * FROM knowledge_base_configs WHERE is_active = 1`,
      );

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
        knowledgeBaseIds: kbsToQuery.map((kb: any) => kb.id),
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
      // Query the knowledge_base_content table in MySQL
      const sequelize = await getMySQLClient();
      const [data] = await sequelize.query(
        `SELECT * FROM knowledge_base_content 
         WHERE knowledge_base_id = ? 
         AND MATCH(content) AGAINST(? IN NATURAL LANGUAGE MODE)
         LIMIT ?`,
        {
          replacements: [config.id, query, limit],
        },
      );

      if (data && (data as any[]).length > 0) {
        return (data as any[]).map((item) => ({
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
      // Query the knowledge_base_content table in MySQL
      const sequelize = await getMySQLClient();
      const [data] = await sequelize.query(
        `SELECT * FROM knowledge_base_content 
         WHERE knowledge_base_id = ? 
         AND MATCH(content) AGAINST(? IN NATURAL LANGUAGE MODE)
         LIMIT ?`,
        {
          replacements: [config.id, query, limit],
        },
      );

      if (data && (data as any[]).length > 0) {
        return (data as any[]).map((item) => ({
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
      const sequelize = await getMySQLClient();
      const [contextRules] = await sequelize.query(
        `SELECT * FROM context_rules WHERE id = ?`,
        {
          replacements: [contextRuleId],
        },
      );

      if (!contextRules || (contextRules as any[]).length === 0) {
        return [];
      }

      const contextRule = (contextRules as any[])[0];
      if (!contextRule || !contextRule.knowledge_base_ids) {
        return [];
      }

      // Get the knowledge bases
      const knowledgeBaseIds = Array.isArray(contextRule.knowledge_base_ids)
        ? contextRule.knowledge_base_ids
        : contextRule.knowledge_base_ids.split(",");

      const placeholders = knowledgeBaseIds.map(() => "?").join(",");
      const [knowledgeBases] = await sequelize.query(
        `SELECT * FROM knowledge_base_configs 
         WHERE id IN (${placeholders}) 
         AND is_active = 1`,
        {
          replacements: knowledgeBaseIds,
        },
      );

      return knowledgeBases as KnowledgeBaseConfig[];
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
      const sequelize = await getMySQLClient();
      await sequelize.query(
        `INSERT INTO knowledge_base_query_logs (
          id, query, user_id, context_rule_id, knowledge_base_ids, 
          result_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            uuidv4(),
            params.query,
            params.userId,
            params.contextRuleId || null,
            JSON.stringify(params.knowledgeBaseIds),
            params.resultCount,
            new Date().toISOString(),
          ],
        },
      );
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
      const sequelize = await getMySQLClient();
      let query = `SELECT * FROM knowledge_base_query_logs ORDER BY created_at DESC`;
      const replacements = [];
      const conditions = [];

      if (params.startDate) {
        conditions.push("created_at >= ?");
        replacements.push(params.startDate);
      }

      if (params.endDate) {
        conditions.push("created_at <= ?");
        replacements.push(params.endDate);
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      if (params.limit) {
        query += " LIMIT ?";
        replacements.push(params.limit);

        if (params.offset) {
          query += " OFFSET ?";
          replacements.push(params.offset);
        }
      }

      const [data] = await sequelize.query(query, { replacements });
      return data as any[];
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
