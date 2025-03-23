import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";
import { AIResponseCache } from "@/models";

interface CacheEntry {
  prompt: string;
  response: string;
  modelUsed: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt: string;
}

/**
 * Service for caching AI responses to reduce API calls
 */
const aiCacheService = {
  /**
   * Get a cached response if available
   */
  getCachedResponse: async (
    prompt: string,
    model?: string,
  ): Promise<CacheEntry | null> => {
    try {
      // Create a hash of the prompt for efficient lookup
      const promptHash = await createHash(prompt);

      const now = new Date();

      // Find cache entry in database
      const cacheEntry = await AIResponseCache.findOne({
        where: {
          prompt_hash: promptHash,
          model_used: model || "default",
          expires_at: {
            [Symbol.for("gt")]: now,
          },
        },
      });

      if (!cacheEntry) {
        return null;
      }

      return {
        prompt: cacheEntry.prompt,
        response: cacheEntry.response,
        modelUsed: cacheEntry.model_used,
        metadata: cacheEntry.metadata,
        createdAt: cacheEntry.created_at.toISOString(),
        expiresAt: cacheEntry.expires_at.toISOString(),
      };
    } catch (error) {
      logger.error(
        "Error getting cached response",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  },

  /**
   * Cache an AI response for future use
   */
  cacheResponse: async (
    prompt: string,
    response: string,
    model: string,
    metadata?: Record<string, any>,
    ttlSeconds: number = 3600, // Default TTL: 1 hour
  ): Promise<boolean> => {
    try {
      // Create a hash of the prompt for efficient lookup
      const promptHash = await createHash(prompt);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

      // Check if entry already exists
      const existingEntry = await AIResponseCache.findOne({
        where: {
          prompt_hash: promptHash,
          model_used: model,
        },
      });

      if (existingEntry) {
        // Update existing cache entry
        await existingEntry.update({
          response,
          metadata,
          updated_at: now,
          expires_at: expiresAt,
        });
      } else {
        // Create new cache entry
        await AIResponseCache.create({
          prompt,
          prompt_hash: promptHash,
          response,
          model_used: model,
          metadata,
          created_at: now,
          updated_at: now,
          expires_at: expiresAt,
        });
      }

      return true;
    } catch (error) {
      logger.error(
        "Error caching response",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpiredCache: async (): Promise<number> => {
    try {
      const now = new Date();

      // Delete expired cache entries
      const result = await AIResponseCache.destroy({
        where: {
          expires_at: {
            [Symbol.for("lt")]: now,
          },
        },
      });

      return result;
    } catch (error) {
      logger.error(
        "Error clearing expired cache",
        error instanceof Error ? error : new Error(String(error)),
      );
      return 0;
    }
  },

  /**
   * Invalidate cache entries for a specific prompt or pattern
   */
  invalidateCache: async (
    promptPattern: string,
    model?: string,
  ): Promise<number> => {
    try {
      const sequelize = getMySQLClient();
      const Op = sequelize.Op;

      const whereClause: any = {
        prompt: {
          [Op.like]: `%${promptPattern}%`,
        },
      };

      if (model) {
        whereClause.model_used = model;
      }

      // Delete matching cache entries
      const result = await AIResponseCache.destroy({
        where: whereClause,
      });

      return result;
    } catch (error) {
      logger.error(
        "Error invalidating cache",
        error instanceof Error ? error : new Error(String(error)),
      );
      return 0;
    }
  },
};

/**
 * Create a simple hash of the prompt for efficient lookup
 * In a production environment, consider using a more robust hashing algorithm
 */
async function createHash(text: string): Promise<string> {
  // Simple hash function for demo purposes
  // In production, use a proper crypto hash function
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export default aiCacheService;
