/**
 * Environment variable configuration
 * Centralizes access to environment variables across the application
 */

// Helper function to get environment variables with fallbacks
const getEnv = (key: string, fallback: string = ""): string => {
  // For client-side (Vite)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    return import.meta.env[`VITE_${key}`] || import.meta.env[key] || fallback;
  }

  // For server-side (Node.js)
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || process.env[`VITE_${key}`] || fallback;
  }

  return fallback;
};

export const env = {
  // App environment
  NODE_ENV: getEnv("NODE_ENV", "development"),
  MODE: getEnv("MODE", "development"),

  // Supabase configuration
  SUPABASE_URL: getEnv("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnv("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_KEY: getEnv("SUPABASE_SERVICE_KEY"),

  // API keys
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
  HUGGINGFACE_API_KEY: getEnv("HUGGINGFACE_API_KEY"),

  // Server configuration
  PORT: getEnv("PORT", "5173"),
  API_PORT: getEnv("API_PORT", "3001"),
  WS_PORT: getEnv("WS_PORT", "8080"),

  // Feature flags
  ENABLE_ANALYTICS: getEnv("ENABLE_ANALYTICS", "false") === "true",
  ENABLE_MODERATION: getEnv("ENABLE_MODERATION", "false") === "true",

  // Check if a required environment variable is set
  isSet: (key: string): boolean => {
    return !!getEnv(key);
  },

  // Get all environment variables as an object
  getAll: (): Record<string, string | boolean> => {
    return {
      NODE_ENV: env.NODE_ENV,
      MODE: env.MODE,
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      PORT: env.PORT,
      API_PORT: env.API_PORT,
      WS_PORT: env.WS_PORT,
      ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
      ENABLE_MODERATION: env.ENABLE_MODERATION,
    };
  },
};

export default env;
