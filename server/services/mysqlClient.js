/**
 * MySQL Client Service
 *
 * Manages database connections using Sequelize ORM
 * This is the production-ready implementation that will be used throughout the application
 */

import { Sequelize } from "sequelize";
import logger from "../utils/logger.js";

let sequelizeInstance = null;

/**
 * Get or create a MySQL client instance
 * @returns {Promise<Sequelize>} Sequelize instance
 */
export const getMySQLClient = async () => {
  if (sequelizeInstance) {
    return sequelizeInstance;
  }

  try {
    // Create new Sequelize instance
    sequelizeInstance = new Sequelize(
      process.env.MYSQL_DATABASE,
      process.env.MYSQL_USER,
      process.env.MYSQL_PASSWORD,
      {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT || 3306,
        dialect: "mysql",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
        dialectOptions: {
          dateStrings: true,
          typeCast: true,
        },
        timezone: "+00:00", // UTC
      },
    );

    // Test connection
    await sequelizeInstance.authenticate();
    logger.info("MySQL connection established successfully");

    return sequelizeInstance;
  } catch (error) {
    logger.error("Unable to connect to MySQL database:", error);
    throw new Error("Database connection failed");
  }
};

/**
 * Close the MySQL connection
 */
export const closeMySQLConnection = async () => {
  if (sequelizeInstance) {
    try {
      await sequelizeInstance.close();
      sequelizeInstance = null;
      logger.info("MySQL connection closed successfully");
    } catch (error) {
      logger.error("Error closing MySQL connection:", error);
    }
  }
};

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} Result of the transaction
 */
export const executeTransaction = async (callback) => {
  const sequelize = await getMySQLClient();
  const transaction = await sequelize.transaction();

  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Get the QueryTypes object from Sequelize
 * @returns {Object} Sequelize QueryTypes
 */
export const getQueryTypes = async () => {
  const sequelize = await getMySQLClient();
  return sequelize.QueryTypes;
};

// Export default object with all functions
export default {
  getMySQLClient,
  closeMySQLConnection,
  executeTransaction,
  getQueryTypes,
};
