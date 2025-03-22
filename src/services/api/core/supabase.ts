/**
 * Supabase Client Module
 *
 * This module initializes and exports the Supabase client for use throughout the application.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import logger from "@/utils/logger";

// Initialize Supabase client
const supabaseUrl = env.SUPABASE_URL;
const supabaseAnonKey = env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Features requiring database access will not work.",
  );
}

// Create a singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Initialize the Supabase client with error handling and retry logic
 * @returns Initialized Supabase client
 */
export const initSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase URL and anon key are required");
    }

    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        global: {
          headers: {
            "x-application-name": "chat-widget",
          },
        },
        // Add retryable fetch for better reliability
        fetch: createRetryableFetch(),
      });

      logger.info("Supabase client initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Supabase client", error);
      throw error;
    }
  }

  return supabaseInstance;
};

/**
 * Create a fetch implementation with retry logic
 * @returns Enhanced fetch function with retries
 */
const createRetryableFetch = () => {
  return async (url: RequestInfo | URL, options?: RequestInit) => {
    const maxRetries = 3;
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
      try {
        const response = await fetch(url, options);

        // Only retry on server errors (5xx) or specific network errors
        if (response.status >= 500 && response.status < 600) {
          retries++;
          if (retries < maxRetries) {
            const backoffTime = Math.pow(2, retries) * 100; // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, backoffTime));
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        retries++;

        if (retries < maxRetries) {
          const backoffTime = Math.pow(2, retries) * 100; // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw lastError || new Error("Failed to fetch after multiple retries");
  };
};

/**
 * Get the Supabase client instance
 * @returns Supabase client instance
 */
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
};

/**
 * Reset the Supabase client instance
 * Useful for testing or when changing authentication
 */
export const resetSupabaseClient = (): void => {
  supabaseInstance = null;
};

/**
 * Check if the Supabase client is initialized
 * @returns Boolean indicating if the client is initialized
 */
export const isSupabaseInitialized = (): boolean => {
  return !!supabaseInstance;
};

/**
 * Get the current Supabase session
 * @returns Current session or null if not authenticated
 */
export const getCurrentSession = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  } catch (error) {
    logger.error("Error getting current session", error);
    return null;
  }
};

/**
 * Get the current user
 * @returns Current user or null if not authenticated
 */
export const getCurrentUser = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user;
  } catch (error) {
    logger.error("Error getting current user", error);
    return null;
  }
};

// Initialize the client
const supabase = getSupabaseClient();

export { supabase };
export default supabase;
