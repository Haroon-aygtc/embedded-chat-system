/**
 * MySQL Core Service
 *
 * This module provides a centralized MySQL client for the API layer
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
    mysqlClient = await getMySQLClient();
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
export const getMySQLClientForAPI = async () => {
  if (!mysqlClient) {
    await initMySQLClient().catch((error) => {
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
  queryType: string = "SELECT",
): Promise<any> => {
  try {
    const client = await getMySQLClientForAPI();
    const results = await client.query(sql, {
      replacements,
      type:
        client.QueryTypes[queryType as keyof typeof client.QueryTypes] ||
        client.QueryTypes.SELECT,
    });
    return results;
  } catch (error) {
    logger.error(`Error executing query: ${sql}`, error);
    throw error;
  }
};

/**
 * Execute a transaction with multiple queries
 */
export const executeTransaction = async (
  queries: { sql: string; replacements: any[]; queryType: string }[],
): Promise<any[]> => {
  const client = await getMySQLClientForAPI();
  const transaction = await client.transaction();

  try {
    const results = [];

    for (const query of queries) {
      const result = await client.query(query.sql, {
        replacements: query.replacements,
        type:
          client.QueryTypes[
            query.queryType as keyof typeof client.QueryTypes
          ] || client.QueryTypes.SELECT,
        transaction,
      });
      results.push(result);
    }

    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    logger.error("MySQL transaction error", error);
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
  executeTransaction,
  closeMySQLConnection,
};
