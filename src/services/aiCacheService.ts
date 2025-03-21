import supabase from "./supabaseClient";
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
export const aiCacheService = {
  /**
   * Get a cached response if available
   */
  getCachedResponse: async (prompt: string): Promise<CacheEntry | null> => {
    try {
      // Create a hash of the prompt for efficient lookup
      const promptHash = await createHash(prompt);

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("ai_response_cache")
        .select("*")
        .eq("prompt_hash", promptHash)
        .gt("expires_at", now)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        prompt: data.prompt,
        response: data.response,
        modelUsed: data.model_used,
        metadata: data.metadata,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      };
    } catch (error) {
      logger.error("Error getting cached response", error);
      return null;
    }
  },

  /**
   * Cache an AI response for future use
   */
  cacheResponse: async (
    prompt: string,
    response: string,
    modelUsed: string,
    metadata?: Record<string, any>,
    ttlMinutes: number = 60, // Default TTL: 1 hour
  ): Promise<boolean> => {
    try {
      // Create a hash of the prompt for efficient lookup
      const promptHash = await createHash(prompt);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

      // Check if entry already exists
      const { data: existingData } = await supabase
        .from("ai_response_cache")
        .select("id")
        .eq("prompt_hash", promptHash)
        .single();

      if (existingData) {
        // Update existing cache entry
        const { error } = await supabase
          .from("ai_response_cache")
          .update({
            response,
            model_used: modelUsed,
            metadata,
            updated_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          })
          .eq("id", existingData.id);

        if (error) {
          logger.error("Error updating cached response", error);
          return false;
        }
      } else {
        // Create new cache entry
        const { error } = await supabase.from("ai_response_cache").insert([
          {
            prompt,
            prompt_hash: promptHash,
            response,
            model_used: modelUsed,
            metadata,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
          },
        ]);

        if (error) {
          logger.error("Error creating cached response", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error("Error caching response", error);
      return false;
    }
  },

  /**
   * Clear expired cache entries
   */
  clearExpiredCache: async (): Promise<number> => {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("ai_response_cache")
        .delete()
        .lt("expires_at", now)
        .select("id");

      if (error) {
        logger.error("Error clearing expired cache", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error("Error clearing expired cache", error);
      return 0;
    }
  },

  /**
   * Invalidate cache entries for a specific prompt or pattern
   */
  invalidateCache: async (promptPattern: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from("ai_response_cache")
        .delete()
        .ilike("prompt", `%${promptPattern}%`)
        .select("id");

      if (error) {
        logger.error("Error invalidating cache", error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      logger.error("Error invalidating cache", error);
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
