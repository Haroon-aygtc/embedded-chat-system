import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";

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
      const sequelize = getMySQLClient();

      // Find cache entry in database
      const [cacheEntry] = await sequelize.query(
        `SELECT * FROM ai_response_cache 
         WHERE prompt_hash = ? AND model_used = ? AND expires_at > ?`,
        {
          replacements: [promptHash, model || "default", now],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!cacheEntry) {
        return null;
      }

      return {
        prompt: cacheEntry.prompt,
        response: cacheEntry.response,
        modelUsed: cacheEntry.model_used,
        metadata:
          typeof cacheEntry.metadata === "string"
            ? JSON.parse(cacheEntry.metadata)
            : cacheEntry.metadata,
        createdAt: new Date(cacheEntry.created_at).toISOString(),
        expiresAt: new Date(cacheEntry.expires_at).toISOString(),
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
      const sequelize = getMySQLClient();

      // Check if entry already exists
      const [existingEntry] = await sequelize.query(
        `SELECT id FROM ai_response_cache 
         WHERE prompt_hash = ? AND model_used = ?`,
        {
          replacements: [promptHash, model],
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (existingEntry) {
        // Update existing cache entry
        await sequelize.query(
          `UPDATE ai_response_cache 
           SET response = ?, metadata = ?, updated_at = ?, expires_at = ? 
           WHERE id = ?`,
          {
            replacements: [
              response,
              JSON.stringify(metadata || {}),
              now,
              expiresAt,
              existingEntry.id,
            ],
            type: sequelize.QueryTypes.UPDATE,
          },
        );
      } else {
        // Create new cache entry
        await sequelize.query(
          `INSERT INTO ai_response_cache 
           (id, prompt, prompt_hash, response, model_used, metadata, created_at, updated_at, expires_at) 
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              prompt,
              promptHash,
              response,
              model,
              JSON.stringify(metadata || {}),
              now,
              now,
              expiresAt,
            ],
            type: sequelize.QueryTypes.INSERT,
          },
        );
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
      const sequelize = getMySQLClient();

      // Delete expired cache entries
      const [result] = await sequelize.query(
        `DELETE FROM ai_response_cache WHERE expires_at < ?`,
        {
          replacements: [now],
          type: sequelize.QueryTypes.DELETE,
        },
      );

      return result?.affectedRows || 0;
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
      let query = `DELETE FROM ai_response_cache WHERE prompt LIKE ?`;
      const replacements = [`%${promptPattern}%`];

      if (model) {
        query += ` AND model_used = ?`;
        replacements.push(model);
      }

      // Delete matching cache entries
      const [result] = await sequelize.query(query, {
        replacements,
        type: sequelize.QueryTypes.DELETE,
      });

      return result?.affectedRows || 0;
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
