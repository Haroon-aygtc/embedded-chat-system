/**
 * Unified Database Configuration
 *
 * This file provides a centralized configuration for database connections
 * used throughout the application. It supports both MySQL and other database types.
 */

import { env } from "./env";

// Database configuration types
export interface DatabaseConfig {
  client: "mysql" | "postgres" | "sqlite";
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    url?: string;
  };
  pool: {
    min: number;
    max: number;
    acquire: number;
    idle: number;
  };
  debug: boolean;
}

// Default database configuration
const defaultConfig: DatabaseConfig = {
  client: "mysql",
  connection: {
    host: env.MYSQL_HOST || "localhost",
    port: parseInt(env.MYSQL_PORT || "3306"),
    user: env.MYSQL_USER || "root",
    password: env.MYSQL_PASSWORD || "",
    database: env.MYSQL_DATABASE || "chat_widget",
    url: env.MYSQL_URL,
  },
  pool: {
    min: 0,
    max: 10,
    acquire: 30000,
    idle: 10000,
  },
  debug: env.NODE_ENV === "development",
};

// Export the database configuration
export const databaseConfig = defaultConfig;

// Helper function to get connection string or connection object
export function getConnectionConfig() {
  if (databaseConfig.connection.url) {
    return databaseConfig.connection.url;
  }

  return {
    host: databaseConfig.connection.host,
    port: databaseConfig.connection.port,
    user: databaseConfig.connection.user,
    password: databaseConfig.connection.password,
    database: databaseConfig.connection.database,
  };
}

export default databaseConfig;
