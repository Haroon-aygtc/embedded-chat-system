/**
 * Cache Service Module
 *
 * This module provides caching functionality for AI responses and other data.
 */

import { getMySQLClientForAPI, executeQuery } from "../core/mysql";
import logger from "@/utils/logger";
import { AIResponseCache } from "@/models";

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
    const cacheEntry = await AIResponseCache.findOne({
      where: {
        cache_key: cacheKey,
        expires_at: {
          [Symbol.for("gt")]: new Date(),
        },
      },
    });

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
    const existingEntry = await AIResponseCache.findOne({
      where: { cache_key: cacheKey },
    });

    if (existingEntry) {
      await existingEntry.update({
        response,
        model_used: model,
        metadata,
        updated_at: now,
        expires_at: expiresAt,
      });
    } else {
      await AIResponseCache.create({
        cache_key: cacheKey,
        query,
        response,
        model_used: model,
        metadata,
        created_at: now,
        updated_at: now,
        expires_at: expiresAt,
      });
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
    await AIResponseCache.destroy({
      where: { cache_key: cacheKey },
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
    if (model) {
      await AIResponseCache.destroy({
        where: { model_used: model },
      });
    } else {
      await AIResponseCache.destroy({
        where: {},
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
    const sequelize = getMySQLClientForAPI();

    // Get total count
    const totalCount = await AIResponseCache.count();

    // Get count by model
    const modelData = await sequelize.query(
      "SELECT model_used, COUNT(*) as count FROM ai_response_cache GROUP BY model_used",
      { type: sequelize.QueryTypes.SELECT },
    );

    // Get expired count
    const expiredCount = await AIResponseCache.count({
      where: {
        expires_at: {
          [Symbol.for("lt")]: new Date(),
        },
      },
    });

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
