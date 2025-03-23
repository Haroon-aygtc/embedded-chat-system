/**
 * Cache Service Module
 *
 * This module provides caching functionality for AI responses and other data.
 */

import { getMySQLClientForAPI } from "../core/mysql";
import logger from "@/utils/logger";

// In-memory cache for faster access
interface MemoryCache {
  [key: string]: {
    data: any;
    expiresAt: number;
  };
}

// Memory cache with TTL
const memoryCache: MemoryCache = {};

// Default TTL in seconds
const DEFAULT_TTL = 3600; // 1 hour

/**
 * Generate a cache key
 * @param query Query string
 * @param model Optional model name
 * @returns Cache key
 */
const generateCacheKey = (query: string, model?: string): string => {
  // Create a deterministic key from the query and model
  const normalizedQuery = query.trim().toLowerCase();
  return `${model || "default"}:${normalizedQuery}`;
};

/**
 * Get a cached response
 * @param query Query string
 * @param model Optional model name
 * @returns Cached response or null if not found
 */
export const getCachedResponse = async (
  query: string,
  model?: string,
): Promise<any | null> => {
  try {
    const cacheKey = generateCacheKey(query, model);

    // Check memory cache first (fastest)
    const now = Date.now();
    if (memoryCache[cacheKey] && memoryCache[cacheKey].expiresAt > now) {
      return memoryCache[cacheKey].data;
    }

    // If not in memory cache, check database
    const sequelize = await getMySQLClientForAPI();

    const [cacheEntry] = await sequelize.query(
      "SELECT * FROM ai_response_cache WHERE cache_key = ? AND expires_at > ? LIMIT 1",
      {
        replacements: [cacheKey, new Date().toISOString()],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (cacheEntry) {
      // Store in memory cache for faster access next time
      memoryCache[cacheKey] = {
        data: {
          response: cacheEntry.response,
          modelUsed: cacheEntry.model_used,
          createdAt: cacheEntry.created_at,
          metadata: cacheEntry.metadata,
        },
        expiresAt: new Date(cacheEntry.expires_at).getTime(),
      };

      return memoryCache[cacheKey].data;
    }

    return null;
  } catch (error) {
    logger.error("Error getting cached response", error);
    return null;
  }
};

/**
 * Cache a response
 * @param query Query string
 * @param response Response text
 * @param model Model name
 * @param metadata Optional metadata
 * @param ttl TTL in seconds
 */
export const cacheResponse = async (
  query: string,
  response: string,
  model: string,
  metadata?: Record<string, any>,
  ttl: number = DEFAULT_TTL,
): Promise<void> => {
  try {
    const cacheKey = generateCacheKey(query, model);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    // Store in memory cache
    memoryCache[cacheKey] = {
      data: {
        response,
        modelUsed: model,
        createdAt: now.toISOString(),
        metadata,
      },
      expiresAt: expiresAt.getTime(),
    };

    // Store in database for persistence
    const sequelize = await getMySQLClientForAPI();

    // Check if entry already exists
    const [existingEntry] = await sequelize.query(
      "SELECT id FROM ai_response_cache WHERE cache_key = ? LIMIT 1",
      {
        replacements: [cacheKey],
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (existingEntry) {
      // Update existing entry
      await sequelize.query(
        "UPDATE ai_response_cache SET response = ?, model_used = ?, metadata = ?, updated_at = ?, expires_at = ? WHERE id = ?",
        {
          replacements: [
            response,
            model,
            JSON.stringify(metadata || {}),
            now.toISOString(),
            expiresAt.toISOString(),
            existingEntry.id,
          ],
          type: sequelize.QueryTypes.UPDATE,
        },
      );
    } else {
      // Create new entry
      const id = require("uuid").v4();
      await sequelize.query(
        "INSERT INTO ai_response_cache (id, cache_key, query, response, model_used, metadata, created_at, updated_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        {
          replacements: [
            id,
            cacheKey,
            query,
            response,
            model,
            JSON.stringify(metadata || {}),
            now.toISOString(),
            now.toISOString(),
            expiresAt.toISOString(),
          ],
          type: sequelize.QueryTypes.INSERT,
        },
      );
    }
  } catch (error) {
    logger.error("Error caching response", error);
    // Don't throw - caching failures shouldn't break the application
  }
};

/**
 * Invalidate a cached response
 * @param query Query string
 * @param model Optional model name
 */
export const invalidateCache = async (
  query: string,
  model?: string,
): Promise<void> => {
  try {
    const cacheKey = generateCacheKey(query, model);

    // Remove from memory cache
    delete memoryCache[cacheKey];

    // Remove from database
    const sequelize = await getMySQLClientForAPI();
    await sequelize.query("DELETE FROM ai_response_cache WHERE cache_key = ?", {
      replacements: [cacheKey],
      type: sequelize.QueryTypes.DELETE,
    });
  } catch (error) {
    logger.error("Error invalidating cache", error);
    // Don't throw - cache invalidation failures shouldn't break the application
  }
};

/**
 * Clear all cached responses
 * @param model Optional model name to clear only responses for that model
 */
export const clearCache = async (model?: string): Promise<void> => {
  try {
    // Clear memory cache
    if (model) {
      // Clear only for specific model
      Object.keys(memoryCache).forEach((key) => {
        if (key.startsWith(`${model}:`)) {
          delete memoryCache[key];
        }
      });
    } else {
      // Clear all
      Object.keys(memoryCache).forEach((key) => {
        delete memoryCache[key];
      });
    }

    // Clear database cache
    const sequelize = await getMySQLClientForAPI();

    if (model) {
      await sequelize.query(
        "DELETE FROM ai_response_cache WHERE model_used = ?",
        {
          replacements: [model],
          type: sequelize.QueryTypes.DELETE,
        },
      );
    } else {
      await sequelize.query("DELETE FROM ai_response_cache", {
        type: sequelize.QueryTypes.DELETE,
      });
    }
  } catch (error) {
    logger.error("Error clearing cache", error);
    // Don't throw - cache clearing failures shouldn't break the application
  }
};

/**
 * Get cache statistics
 * @returns Cache statistics
 */
export const getCacheStats = async (): Promise<any> => {
  try {
    const sequelize = await getMySQLClientForAPI();

    // Get total count
    const [totalCountResult] = await sequelize.query(
      "SELECT COUNT(*) as count FROM ai_response_cache",
      { type: sequelize.QueryTypes.SELECT },
    );
    const totalCount = totalCountResult.count;

    // Get count by model
    const modelData = await sequelize.query(
      "SELECT model_used, COUNT(*) as count FROM ai_response_cache GROUP BY model_used",
      { type: sequelize.QueryTypes.SELECT },
    );

    // Get expired count
    const [expiredCountResult] = await sequelize.query(
      "SELECT COUNT(*) as count FROM ai_response_cache WHERE expires_at < ?",
      {
        replacements: [new Date().toISOString()],
        type: sequelize.QueryTypes.SELECT,
      },
    );
    const expiredCount = expiredCountResult.count;

    // Memory cache stats
    const memoryCacheSize = Object.keys(memoryCache).length;
    const memoryCacheExpired = Object.values(memoryCache).filter(
      (item) => item.expiresAt < Date.now(),
    ).length;

    return {
      totalCached: totalCount || 0,
      expiredCount: expiredCount || 0,
      activeCount: (totalCount || 0) - (expiredCount || 0),
      byModel: modelData || [],
      memoryCache: {
        size: memoryCacheSize,
        expired: memoryCacheExpired,
        active: memoryCacheSize - memoryCacheExpired,
      },
    };
  } catch (error) {
    logger.error("Error getting cache stats", error);
    throw error;
  }
};
