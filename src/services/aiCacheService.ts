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

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("ai_response_cache")
        .select("*")
        .eq("prompt_hash", promptHash)
        .eq("model_used", model || "default")
        .gt("expires_at", now)
        .maybeSingle();

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
      const { data: existingData } = await supabase
        .from("ai_response_cache")
        .select("id")
        .eq("prompt_hash", promptHash)
        .eq("model_used", model)
        .single();

      if (existingData) {
        // Update existing cache entry
        const { error } = await supabase
          .from("ai_response_cache")
          .update({
            response,
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
            model_used: model,
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
      let query = supabase
        .from("ai_response_cache")
        .delete()
        .ilike("prompt", `%${promptPattern}%`);

      if (model) {
        query = query.eq("model_used", model);
      }

      const { data, error } = await query.select("id");

      if (error) {
        logger.error("Error invalidating cache", error);
        return 0;
      }

      return data?.length || 0;
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
