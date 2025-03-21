import axios from "axios";
import logger from "@/utils/logger";
import supabase from "./supabaseClient";

export interface KnowledgeBaseConfig {
  id: string;
  name: string;
  type: "api" | "database" | "cms" | "vector" | "file";
  endpoint?: string;
  apiKey?: string;
  connectionString?: string;
  refreshInterval?: number; // in minutes
  lastSyncedAt?: string;
  parameters?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryResult {
  source: string;
  content: string;
  metadata?: Record<string, any>;
  relevanceScore?: number;
  timestamp?: string;
}

export interface KnowledgeBaseQuery {
  query: string;
  filters?: Record<string, any>;
  limit?: number;
  contextRuleId?: string;
  userId?: string;
}

/**
 * Service for integrating with external knowledge bases
 */
class KnowledgeBaseService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  /**
   * Get all knowledge base configurations
   */
  async getAllConfigs(): Promise<KnowledgeBaseConfig[]> {
    try {
      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .order("name");

      if (error) throw error;

      return data.map(this.mapConfigFromDb);
    } catch (error) {
      logger.error("Error fetching knowledge base configs", error);
      return [];
    }
  }

  /**
   * Get a knowledge base configuration by ID
   */
  async getConfigById(id: string): Promise<KnowledgeBaseConfig | null> {
    try {
      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return this.mapConfigFromDb(data);
    } catch (error) {
      logger.error(`Error fetching knowledge base config with ID ${id}`, error);
      return null;
    }
  }

  /**
   * Create a new knowledge base configuration
   */
  async createConfig(
    config: Omit<KnowledgeBaseConfig, "id" | "createdAt" | "updatedAt">,
  ): Promise<KnowledgeBaseConfig | null> {
    try {
      const now = new Date().toISOString();
      const newConfig = {
        id: crypto.randomUUID(),
        ...config,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .insert(this.mapConfigToDb(newConfig))
        .select()
        .single();

      if (error) throw error;

      return this.mapConfigFromDb(data);
    } catch (error) {
      logger.error("Error creating knowledge base config", error);
      return null;
    }
  }

  /**
   * Update a knowledge base configuration
   */
  async updateConfig(
    id: string,
    config: Partial<KnowledgeBaseConfig>,
  ): Promise<KnowledgeBaseConfig | null> {
    try {
      const updateData = {
        ...this.mapConfigToDb(config as KnowledgeBaseConfig),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("knowledge_base_configs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return this.mapConfigFromDb(data);
    } catch (error) {
      logger.error(`Error updating knowledge base config with ID ${id}`, error);
      return null;
    }
  }

  /**
   * Delete a knowledge base configuration
   */
  async deleteConfig(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("knowledge_base_configs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return true;
    } catch (error) {
      logger.error(`Error deleting knowledge base config with ID ${id}`, error);
      return false;
    }
  }

  /**
   * Query knowledge bases based on the provided query and context rule
   */
  async query(params: KnowledgeBaseQuery): Promise<QueryResult[]> {
    try {
      // Get active knowledge bases for the context rule
      const knowledgeBases = await this.getKnowledgeBasesForContextRule(
        params.contextRuleId,
      );

      if (knowledgeBases.length === 0) {
        return [];
      }

      // Query each knowledge base in parallel
      const results = await Promise.all(
        knowledgeBases.map((kb) => this.queryKnowledgeBase(kb, params)),
      );

      // Flatten results and filter out nulls
      const flattenedResults = results
        .flat()
        .filter((result) => result !== null) as QueryResult[];

      // Sort by relevance score if available
      return flattenedResults.sort(
        (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0),
      );
    } catch (error) {
      logger.error("Error querying knowledge bases", error);
      return [];
    }
  }

  /**
   * Get knowledge bases associated with a context rule
   */
  private async getKnowledgeBasesForContextRule(
    contextRuleId?: string,
  ): Promise<KnowledgeBaseConfig[]> {
    try {
      if (!contextRuleId) {
        // If no context rule specified, get all active knowledge bases
        const { data, error } = await supabase
          .from("knowledge_base_configs")
          .select("*")
          .eq("is_active", true);

        if (error) throw error;
        return data.map(this.mapConfigFromDb);
      }

      // Get knowledge bases linked to the context rule
      const { data, error } = await supabase
        .from("context_rule_knowledge_bases")
        .select("knowledge_base_id")
        .eq("context_rule_id", contextRuleId);

      if (error) throw error;

      if (data.length === 0) {
        return [];
      }

      // Get the actual knowledge base configs
      const kbIds = data.map((item) => item.knowledge_base_id);
      const { data: kbData, error: kbError } = await supabase
        .from("knowledge_base_configs")
        .select("*")
        .in("id", kbIds)
        .eq("is_active", true);

      if (kbError) throw kbError;

      return kbData.map(this.mapConfigFromDb);
    } catch (error) {
      logger.error("Error getting knowledge bases for context rule", error);
      return [];
    }
  }

  /**
   * Query a specific knowledge base
   */
  private async queryKnowledgeBase(
    kb: KnowledgeBaseConfig,
    params: KnowledgeBaseQuery,
  ): Promise<QueryResult[] | null> {
    try {
      switch (kb.type) {
        case "api":
          return await this.queryApiKnowledgeBase(kb, params);
        case "database":
          return await this.queryDatabaseKnowledgeBase(kb, params);
        case "cms":
          return await this.queryCmsKnowledgeBase(kb, params);
        case "vector":
          return await this.queryVectorKnowledgeBase(kb, params);
        case "file":
          return await this.queryFileKnowledgeBase(kb, params);
        default:
          logger.warn(`Unsupported knowledge base type: ${kb.type}`);
          return null;
      }
    } catch (error) {
      logger.error(`Error querying knowledge base ${kb.id}`, error);
      return null;
    }
  }

  /**
   * Query an API-based knowledge base
   */
  private async queryApiKnowledgeBase(
    kb: KnowledgeBaseConfig,
    params: KnowledgeBaseQuery,
  ): Promise<QueryResult[]> {
    try {
      // Check cache first
      const cacheKey = `api-${kb.id}-${params.query}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      if (!kb.endpoint) {
        throw new Error("API endpoint is required for API knowledge base");
      }

      // Prepare request headers
      const headers: Record<string, string> = {};
      if (kb.apiKey) {
        headers["Authorization"] = `Bearer ${kb.apiKey}`;
      }

      // Prepare request parameters
      const requestParams = {
        query: params.query,
        filters: params.filters,
        limit: params.limit || 5,
        ...kb.parameters,
      };

      // Make the API request
      const response = await axios.post(kb.endpoint, requestParams, {
        headers,
      });

      // Transform the response to QueryResult format
      const results: QueryResult[] = Array.isArray(response.data.results)
        ? response.data.results.map((item: any) => ({
            source: kb.name,
            content: item.content || item.text || item.data || "",
            metadata: {
              ...item.metadata,
              id: item.id,
              url: item.url,
              knowledgeBaseId: kb.id,
            },
            relevanceScore: item.score || item.relevance || 0,
            timestamp: item.timestamp || new Date().toISOString(),
          }))
        : [];

      // Cache the results
      this.addToCache(cacheKey, results);

      return results;
    } catch (error) {
      logger.error(`Error querying API knowledge base ${kb.id}`, error);
      return [];
    }
  }

  /**
   * Query a database-based knowledge base
   */
  private async queryDatabaseKnowledgeBase(
    kb: KnowledgeBaseConfig,
    params: KnowledgeBaseQuery,
  ): Promise<QueryResult[]> {
    try {
      // For demo purposes, we'll return mock data
      // In a real implementation, you would connect to the database using the connection string
      // and execute a query

      // Mock data
      const results: QueryResult[] = [
        {
          source: kb.name,
          content: `Database result for query: ${params.query}`,
          metadata: {
            table: "documents",
            knowledgeBaseId: kb.id,
          },
          relevanceScore: 0.85,
          timestamp: new Date().toISOString(),
        },
      ];

      return results;
    } catch (error) {
      logger.error(`Error querying database knowledge base ${kb.id}`, error);
      return [];
    }
  }

  /**
   * Query a CMS-based knowledge base
   */
  private async queryCmsKnowledgeBase(
    kb: KnowledgeBaseConfig,
    params: KnowledgeBaseQuery,
  ): Promise<QueryResult[]> {
    try {
      // Similar to API knowledge base, but with CMS-specific handling
      // For demo purposes, we'll return mock data

      // Mock data
      const results: QueryResult[] = [
        {
          source: kb.name,
          content: `CMS content for query: ${params.query}`,
          metadata: {
            contentType: "article",
            knowledgeBaseId: kb.id,
          },
          relevanceScore: 0.78,
          timestamp: new Date().toISOString(),
        },
      ];

      return results;
    } catch (error) {
      logger.error(`Error querying CMS knowledge base ${kb.id}`, error);
      return [];
    }
  }

  /**
   * Query a vector-based knowledge base (for semantic search)
   */
  private async queryVectorKnowledgeBase(
    kb: KnowledgeBaseConfig,
    params: KnowledgeBaseQuery,
  ): Promise<QueryResult[]> {
    try {
      // Check cache first
      const cacheKey = `vector-${kb.id}-${params.query}`;
      const cachedResult = this.getFromCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      if (!kb.endpoint) {
        throw new Error("API endpoint is required for vector knowledge base");
      }

      // Prepare request headers
      const headers: Record<string, string> = {};
      if (kb.apiKey) {
        headers["Authorization"] = `Bearer ${kb.apiKey}`;
      }

      // Prepare request parameters
      const requestParams = {
        query: params.query,
        filters: params.filters,
        limit: params.limit || 5,
        ...kb.parameters,
      };

      // Make the API request
      const response = await axios.post(kb.endpoint, requestParams, {
        headers,
      });

      // Transform the response to QueryResult format
      const results: QueryResult[] = Array.isArray(response.data.results)
        ? response.data.results.map((item: any) => ({
            source: kb.name,
            content: item.content || item.text || "",
            metadata: {
              ...item.metadata,
              id: item.id,
              knowledgeBaseId: kb.id,
            },
            relevanceScore: item.score || 0,
            timestamp: item.timestamp || new Date().toISOString(),
          }))
        : [];

      // Cache the results
      this.addToCache(cacheKey, results);

      return results;
    } catch (error) {
      logger.error(`Error querying vector knowledge base ${kb.id}`, error);
      return [];
    }
  }

  /**
   * Query a file-based knowledge base
   */
  private async queryFileKnowledgeBase(
    kb: KnowledgeBaseConfig,
    params: KnowledgeBaseQuery,
  ): Promise<QueryResult[]> {
    try {
      // For demo purposes, we'll return mock data
      // In a real implementation, you would search through indexed files

      // Mock data
      const results: QueryResult[] = [
        {
          source: kb.name,
          content: `File content for query: ${params.query}`,
          metadata: {
            fileName: "document.pdf",
            fileType: "pdf",
            knowledgeBaseId: kb.id,
          },
          relevanceScore: 0.72,
          timestamp: new Date().toISOString(),
        },
      ];

      return results;
    } catch (error) {
      logger.error(`Error querying file knowledge base ${kb.id}`, error);
      return [];
    }
  }

  /**
   * Add data to the cache
   */
  private addToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get data from the cache if it's still valid
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if the cache is still valid
    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Map database object to KnowledgeBaseConfig
   */
  private mapConfigFromDb(data: any): KnowledgeBaseConfig {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      endpoint: data.endpoint,
      apiKey: data.api_key,
      connectionString: data.connection_string,
      refreshInterval: data.refresh_interval,
      lastSyncedAt: data.last_synced_at,
      parameters: data.parameters,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map KnowledgeBaseConfig to database object
   */
  private mapConfigToDb(config: Partial<KnowledgeBaseConfig>): any {
    const dbObject: any = {};

    if (config.id !== undefined) dbObject.id = config.id;
    if (config.name !== undefined) dbObject.name = config.name;
    if (config.type !== undefined) dbObject.type = config.type;
    if (config.endpoint !== undefined) dbObject.endpoint = config.endpoint;
    if (config.apiKey !== undefined) dbObject.api_key = config.apiKey;
    if (config.connectionString !== undefined)
      dbObject.connection_string = config.connectionString;
    if (config.refreshInterval !== undefined)
      dbObject.refresh_interval = config.refreshInterval;
    if (config.lastSyncedAt !== undefined)
      dbObject.last_synced_at = config.lastSyncedAt;
    if (config.parameters !== undefined)
      dbObject.parameters = config.parameters;
    if (config.isActive !== undefined) dbObject.is_active = config.isActive;
    if (config.createdAt !== undefined) dbObject.created_at = config.createdAt;
    if (config.updatedAt !== undefined) dbObject.updated_at = config.updatedAt;

    return dbObject;
  }

  /**
   * Sync a knowledge base to update its content
   */
  async syncKnowledgeBase(id: string): Promise<boolean> {
    try {
      const kb = await this.getConfigById(id);
      if (!kb) {
        throw new Error(`Knowledge base with ID ${id} not found`);
      }

      // Update the last synced timestamp
      await this.updateConfig(id, {
        lastSyncedAt: new Date().toISOString(),
      } as Partial<KnowledgeBaseConfig>);

      // Clear cache entries for this knowledge base
      this.clearCacheForKnowledgeBase(id);

      return true;
    } catch (error) {
      logger.error(`Error syncing knowledge base ${id}`, error);
      return false;
    }
  }

  /**
   * Clear cache entries for a specific knowledge base
   */
  private clearCacheForKnowledgeBase(id: string): void {
    for (const [key, _] of this.cache.entries()) {
      if (key.includes(`-${id}-`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Log a knowledge base query for analytics
   */
  async logQuery(params: {
    userId: string;
    query: string;
    contextRuleId?: string;
    knowledgeBaseIds: string[];
    results: number;
  }): Promise<void> {
    try {
      await supabase.from("knowledge_base_query_logs").insert({
        id: crypto.randomUUID(),
        user_id: params.userId,
        query: params.query,
        context_rule_id: params.contextRuleId,
        knowledge_base_ids: params.knowledgeBaseIds,
        results_count: params.results,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Error logging knowledge base query", error);
    }
  }
}

// Create a singleton instance
const knowledgeBaseService = new KnowledgeBaseService();

export default knowledgeBaseService;
