import supabase from "./supabaseClient";
import logger from "@/utils/logger";

/**
 * Service for managing API keys securely
 */
export const apiKeyService = {
  /**
   * Get the Gemini API key from secure storage
   */
  getGeminiApiKey: async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("settings")
        .eq("category", "api_keys")
        .eq("environment", process.env.NODE_ENV || "development")
        .single();

      if (error) {
        logger.error("Error fetching Gemini API key", error);
        return null;
      }

      return data?.settings?.gemini_api_key || null;
    } catch (error) {
      logger.error("Error fetching Gemini API key", error);
      return null;
    }
  },

  /**
   * Store or update the Gemini API key in secure storage
   */
  setGeminiApiKey: async (apiKey: string): Promise<boolean> => {
    try {
      // Check if settings for this category already exist
      const { data: existingData, error: fetchError } = await supabase
        .from("system_settings")
        .select("id, settings")
        .eq("category", "api_keys")
        .eq("environment", process.env.NODE_ENV || "development");

      if (fetchError) {
        logger.error("Error checking existing API key settings", fetchError);
        return false;
      }

      if (existingData && existingData.length > 0) {
        // Update existing settings
        const updatedSettings = {
          ...existingData[0].settings,
          gemini_api_key: apiKey,
          last_updated: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("system_settings")
          .update({
            settings: updatedSettings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData[0].id);

        if (error) {
          logger.error("Error updating Gemini API key", error);
          return false;
        }

        // Add to history for audit trail
        await supabase.from("system_settings_history").insert([
          {
            settings_id: existingData[0].id,
            settings: existingData[0].settings,
            created_by: "system", // Replace with actual user ID if available
          },
        ]);
      } else {
        // Create new settings
        const { error } = await supabase.from("system_settings").insert([
          {
            category: "api_keys",
            settings: {
              gemini_api_key: apiKey,
              last_updated: new Date().toISOString(),
            },
            environment: process.env.NODE_ENV || "development",
          },
        ]);

        if (error) {
          logger.error("Error creating Gemini API key setting", error);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error("Error setting Gemini API key", error);
      return false;
    }
  },

  /**
   * Rotate the Gemini API key (replace with a new one and archive the old one)
   */
  rotateGeminiApiKey: async (newApiKey: string): Promise<boolean> => {
    try {
      // Get the current API key first for history
      const currentApiKey = await apiKeyService.getGeminiApiKey();

      // Set the new API key
      const success = await apiKeyService.setGeminiApiKey(newApiKey);

      if (success && currentApiKey) {
        // Log the rotation for audit purposes
        await supabase.from("api_key_rotations").insert([
          {
            key_type: "gemini",
            rotated_at: new Date().toISOString(),
            rotated_by: "system", // Replace with actual user ID if available
            metadata: {
              previous_key_prefix: currentApiKey.substring(0, 4) + "...", // Only store prefix for security
            },
          },
        ]);
      }

      return success;
    } catch (error) {
      logger.error("Error rotating Gemini API key", error);
      return false;
    }
  },

  /**
   * Log API key usage for monitoring and alerting
   */
  logApiKeyUsage: async (
    keyType: string,
    endpoint: string,
    responseTimeMs: number,
    statusCode: number,
  ): Promise<void> => {
    try {
      // Get the API key ID (not the actual key)
      const { data: keyData } = await supabase
        .from("system_settings")
        .select("id")
        .eq("category", "api_keys")
        .eq("environment", process.env.NODE_ENV || "development")
        .single();

      if (!keyData) return;

      await supabase.from("api_key_usage").insert([
        {
          api_key_id: keyData.id,
          endpoint,
          method: "POST",
          response_time_ms: responseTimeMs,
          status_code: statusCode,
          ip_address: "internal", // For internal API calls
          user_agent: "application/server",
        },
      ]);
    } catch (error) {
      logger.error("Error logging API key usage", error);
    }
  },

  /**
   * Check if API usage is within rate limits
   */
  checkRateLimit: async (keyType: string): Promise<boolean> => {
    try {
      // Get the current rate limits from settings
      const { data: limitsData } = await supabase
        .from("system_settings")
        .select("settings")
        .eq("category", "rate_limits")
        .eq("environment", process.env.NODE_ENV || "development")
        .single();

      if (!limitsData) return true; // If no limits are set, allow the request

      const limits = limitsData.settings;
      const maxRequestsPerMinute = limits?.gemini_requests_per_minute || 60;

      // Count recent requests in the last minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

      const { data: keyData } = await supabase
        .from("system_settings")
        .select("id")
        .eq("category", "api_keys")
        .eq("environment", process.env.NODE_ENV || "development")
        .single();

      if (!keyData) return true;

      const { count, error } = await supabase
        .from("api_key_usage")
        .select("id", { count: "exact" })
        .eq("api_key_id", keyData.id)
        .gte("created_at", oneMinuteAgo);

      if (error) {
        logger.error("Error checking rate limit", error);
        return true; // On error, allow the request to proceed
      }

      return (count || 0) < maxRequestsPerMinute;
    } catch (error) {
      logger.error("Error checking rate limit", error);
      return true; // On error, allow the request to proceed
    }
  },
};

export default apiKeyService;
