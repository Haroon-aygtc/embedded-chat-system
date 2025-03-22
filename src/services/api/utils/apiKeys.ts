/**
 * API Key Management Service
 *
 * This module provides functionality for managing and securing API keys.
 */

import { getSupabaseClient } from "../core/supabase";
import logger from "@/utils/logger";
import { env } from "@/config/env";

// Rate limit configuration
const DEFAULT_RATE_LIMIT = 100; // requests per minute
const DEFAULT_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Cache for rate limiting
interface RateLimitCache {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

// In-memory cache for rate limiting
const rateLimitCache: RateLimitCache = {};

/**
 * Get an API key from environment variables or database
 * @param service Service name (e.g., 'gemini', 'huggingface')
 * @returns API key or null if not found
 */
export const getApiKey = async (service: string): Promise<string | null> => {
  try {
    // First check environment variables (highest priority)
    const envKey = env[`${service.toUpperCase()}_API_KEY`];
    if (envKey) {
      return envKey;
    }

    // Then check database
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("key_value")
      .eq("service", service)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record not found
        return null;
      }
      throw error;
    }

    return data?.key_value || null;
  } catch (error) {
    logger.error(`Error getting API key for ${service}`, error);
    return null;
  }
};

/**
 * Check if a service is within its rate limit
 * @param service Service name
 * @param customLimit Optional custom rate limit
 * @returns Boolean indicating if the service is within its rate limit
 */
export const checkRateLimit = async (
  service: string,
  customLimit?: number,
): Promise<boolean> => {
  try {
    // Get rate limit configuration from database or use default
    let rateLimit = customLimit || DEFAULT_RATE_LIMIT;

    // Try to get service-specific rate limit from database
    if (!customLimit) {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("api_rate_limits")
        .select("requests_per_minute")
        .eq("service", service)
        .single();

      if (!error && data) {
        rateLimit = data.requests_per_minute;
      }
    }

    const now = Date.now();
    const cacheKey = service.toLowerCase();

    // Initialize rate limit entry if it doesn't exist
    if (!rateLimitCache[cacheKey] || rateLimitCache[cacheKey].resetAt <= now) {
      rateLimitCache[cacheKey] = {
        count: 0,
        resetAt: now + DEFAULT_RATE_LIMIT_WINDOW,
      };
    }

    // Check if rate limit is exceeded
    if (rateLimitCache[cacheKey].count >= rateLimit) {
      return false;
    }

    // Increment count
    rateLimitCache[cacheKey].count++;
    return true;
  } catch (error) {
    logger.error(`Error checking rate limit for ${service}`, error);
    // Default to allowing the request in case of error
    return true;
  }
};

/**
 * Log API key usage for monitoring and billing
 * @param service Service name
 * @param endpoint Endpoint or operation used
 * @param responseTime Response time in milliseconds
 * @param statusCode HTTP status code
 */
export const logApiKeyUsage = async (
  service: string,
  endpoint: string,
  responseTime: number,
  statusCode: number,
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("api_key_usage").insert({
      service,
      endpoint,
      response_time_ms: responseTime,
      status_code: statusCode,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Just log the error but don't throw - this is non-critical functionality
    logger.error(`Error logging API key usage for ${service}`, error);
  }
};

/**
 * Create a new API key
 * @param service Service name
 * @param keyValue API key value
 * @param expiresAt Optional expiration date
 * @returns Created API key record
 */
export const createApiKey = async (
  service: string,
  keyValue: string,
  expiresAt?: string,
): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        service,
        key_value: keyValue,
        is_active: true,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error creating API key for ${service}`, error);
    throw error;
  }
};

/**
 * Deactivate an API key
 * @param id API key ID
 * @returns Success status
 */
export const deactivateApiKey = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error(`Error deactivating API key ${id}`, error);
    throw error;
  }
};

/**
 * Get API key usage statistics
 * @param service Service name
 * @param days Number of days to look back
 * @returns Usage statistics
 */
export const getApiKeyUsageStats = async (
  service: string,
  days: number = 7,
): Promise<any> => {
  try {
    const supabase = getSupabaseClient();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("api_key_usage")
      .select("*")
      .eq("service", service)
      .gte("created_at", startDate.toISOString());

    if (error) throw error;

    // Calculate statistics
    const totalRequests = data.length;
    const successfulRequests = data.filter(
      (r) => r.status_code >= 200 && r.status_code < 300,
    ).length;
    const avgResponseTime =
      data.reduce((sum, r) => sum + r.response_time_ms, 0) /
      (totalRequests || 1);

    // Group by day for chart data
    const requestsByDay: Record<string, number> = {};
    data.forEach((r) => {
      const day = r.created_at.split("T")[0];
      requestsByDay[day] = (requestsByDay[day] || 0) + 1;
    });

    return {
      totalRequests,
      successfulRequests,
      successRate: totalRequests
        ? (successfulRequests / totalRequests) * 100
        : 0,
      avgResponseTime,
      requestsByDay: Object.entries(requestsByDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  } catch (error) {
    logger.error(`Error getting API key usage stats for ${service}`, error);
    throw error;
  }
};
