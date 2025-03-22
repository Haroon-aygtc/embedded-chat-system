import { Sequelize } from "sequelize";
import { env } from "@/config/env";
import logger from "@/utils/logger";

// Initialize MySQL connection
const mysqlUrl = env.MYSQL_URL;
const mysqlUser = env.MYSQL_USER;
const mysqlPassword = env.MYSQL_PASSWORD;
const mysqlDatabase = env.MYSQL_DATABASE;

let sequelize: Sequelize | null = null;

/**
 * Initialize the MySQL client with error handling and retry logic
 * @returns Initialized Sequelize client
 */
export const initMySQL = (): Sequelize => {
  if (!sequelize) {
    if (!mysqlUrl && (!mysqlUser || !mysqlPassword || !mysqlDatabase)) {
      throw new Error("MySQL connection details are required");
    }

    try {
      if (mysqlUrl) {
        // Use connection URL if provided
        sequelize = new Sequelize(mysqlUrl, {
          logging: env.NODE_ENV === "development" ? console.log : false,
          dialect: "mysql",
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        });
      } else {
        // Use individual connection parameters
        sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
          host: env.MYSQL_HOST || "localhost",
          port: parseInt(env.MYSQL_PORT || "3306"),
          dialect: "mysql",
          logging: env.NODE_ENV === "development" ? console.log : false,
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
        });
      }

      logger.info("MySQL client initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize MySQL client", error);
      throw error;
    }
  }

  return sequelize;
};

/**
 * Get the MySQL client instance
 * @returns Sequelize client instance
 */
export const getMySQLClient = (): Sequelize => {
  if (!sequelize) {
    return initMySQL();
  }
  return sequelize;
};

/**
 * Reset the MySQL client instance
 * Useful for testing or when changing connection details
 */
export const resetMySQLClient = (): void => {
  if (sequelize) {
    sequelize.close();
  }
  sequelize = null;
};

/**
 * Check if the MySQL client is initialized
 * @returns Boolean indicating if the client is initialized
 */
export const isMySQLInitialized = (): boolean => {
  return !!sequelize;
};

/**
 * Test the MySQL connection
 * @returns Promise that resolves if connection is successful
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = getMySQLClient();
    await client.authenticate();
    logger.info("MySQL connection test successful");
    return true;
  } catch (error) {
    logger.error("MySQL connection test failed", error);
    return false;
  }
};

// Initialize the client
const mysql = getMySQLClient();

export { mysql };
export default mysql;
