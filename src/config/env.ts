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

// Helper function to get boolean environment variables
const getBoolEnv = (key: string, fallback: boolean = false): boolean => {
  const value = getEnv(key, String(fallback));
  return value === "true" || value === "1";
};

export const env = {
  // App environment
  NODE_ENV: getEnv("NODE_ENV", "development"),
  MODE: getEnv("MODE", "development"),
  PROD: getEnv("NODE_ENV", "development") === "production",
  DEV: getEnv("NODE_ENV", "development") === "development",

  // MySQL configuration
  MYSQL_URL: getEnv("MYSQL_URL"),
  MYSQL_HOST: getEnv("MYSQL_HOST", "localhost"),
  MYSQL_PORT: getEnv("MYSQL_PORT", "3306"),
  MYSQL_USER: getEnv("MYSQL_USER", "root"),
  MYSQL_PASSWORD: getEnv("MYSQL_PASSWORD", ""),
  MYSQL_DATABASE: getEnv("MYSQL_DATABASE", "chat_app_dev"),

  // API configuration
  API_BASE_URL: getEnv("API_BASE_URL", "/api"),
  WEBSOCKET_URL: getEnv("WEBSOCKET_URL", "ws://localhost:8080"),
  WS_AUTO_CONNECT: getBoolEnv("WS_AUTO_CONNECT", true),

  // API keys
  GEMINI_API_KEY: getEnv("GEMINI_API_KEY"),
  HUGGINGFACE_API_KEY: getEnv("HUGGINGFACE_API_KEY"),
  GROK_API_KEY: getEnv("GROK_API_KEY"),

  // Server configuration
  PORT: getEnv("PORT", "5173"),
  API_PORT: getEnv("API_PORT", "3001"),
  WS_PORT: getEnv("WS_PORT", "8080"),

  // Feature flags
  ENABLE_ANALYTICS: getBoolEnv("ENABLE_ANALYTICS", false),
  ENABLE_MODERATION: getBoolEnv("ENABLE_MODERATION", false),
  ENABLE_MOCK_MODE: getBoolEnv("ENABLE_MOCK_MODE", true),

  // App version
  APP_VERSION: getEnv("APP_VERSION", "1.0.0"),

  // Tempo
  TEMPO: getBoolEnv("TEMPO", false),

  // Check if a required environment variable is set
  isSet: (key: string): boolean => {
    return !!getEnv(key);
  },

  // Get all environment variables as an object
  getAll: (): Record<string, string | boolean> => {
    return {
      NODE_ENV: env.NODE_ENV,
      MODE: env.MODE,
      PROD: env.PROD,
      DEV: env.DEV,
      MYSQL_URL: env.MYSQL_URL,
      MYSQL_HOST: env.MYSQL_HOST,
      MYSQL_PORT: env.MYSQL_PORT,
      MYSQL_USER: env.MYSQL_USER,
      MYSQL_DATABASE: env.MYSQL_DATABASE,
      API_BASE_URL: env.API_BASE_URL,
      WEBSOCKET_URL: env.WEBSOCKET_URL,
      WS_AUTO_CONNECT: env.WS_AUTO_CONNECT,
      PORT: env.PORT,
      API_PORT: env.API_PORT,
      WS_PORT: env.WS_PORT,
      ENABLE_ANALYTICS: env.ENABLE_ANALYTICS,
      ENABLE_MODERATION: env.ENABLE_MODERATION,
      ENABLE_MOCK_MODE: env.ENABLE_MOCK_MODE,
      APP_VERSION: env.APP_VERSION,
      TEMPO: env.TEMPO,
    };
  },
};

export default env;
