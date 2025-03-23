/**
 * MySQL Core Service
 *
 * This module provides a centralized MySQL client for the API layer
 * to replace the Supabase client throughout the application.
 */

import { getMySQLClient } from "@/services/mysqlClient";
import logger from "@/utils/logger";

// MySQL client instance
let mysqlClient: any = null;

/**
 * Initialize the MySQL client
 */
export const initMySQLClient = async (): Promise<void> => {
  try {
    mysqlClient = getMySQLClient();
    await mysqlClient.authenticate();
    logger.info("MySQL client initialized for API layer");
  } catch (error) {
    logger.error("Failed to initialize MySQL client for API layer", error);
    throw error;
  }
};

/**
 * Get the MySQL client instance
 */
export const getMySQLClientForAPI = () => {
  if (!mysqlClient) {
    initMySQLClient().catch((error) => {
      logger.error("Failed to initialize MySQL client on demand", error);
    });
  }
  return mysqlClient;
};

/**
 * Execute a raw SQL query
 */
export const executeQuery = async (
  sql: string,
  replacements?: any[],
): Promise<any> => {
  try {
    const client = getMySQLClientForAPI();
    const [results] = await client.query(sql, {
      replacements,
    });
    return results;
  } catch (error) {
    logger.error(`Error executing query: ${sql}`, error);
    throw error;
  }
};

/**
 * Close the MySQL connection
 */
export const closeMySQLConnection = async (): Promise<void> => {
  if (mysqlClient) {
    await mysqlClient.close();
    mysqlClient = null;
    logger.info("MySQL connection closed for API layer");
  }
};

export default {
  initMySQLClient,
  getMySQLClientForAPI,
  executeQuery,
  closeMySQLConnection,
};
