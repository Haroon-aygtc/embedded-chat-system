/**
 * Database Helper Utilities
 *
 * Provides common database operations and query building helpers
 */

import { getMySQLClient } from "../services/mysqlClient.js";
import logger from "./logger.js";

/**
 * Execute a database query with error handling
 * @param {string} sql - SQL query string
 * @param {Array} replacements - Query parameter replacements
 * @param {string} queryType - Query type (SELECT, INSERT, UPDATE, DELETE)
 * @returns {Promise<any>} Query results
 */
export const executeQuery = async (
  sql,
  replacements = [],
  queryType = "SELECT",
) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes[queryType],
    });

    return results;
  } catch (error) {
    logger.error(`Database query error: ${error.message}`, {
      sql,
      error,
    });
    throw error;
  }
};

/**
 * Find a record by ID
 * @param {string} table - Table name
 * @param {string} id - Record ID
 * @param {string} idField - ID field name (default: 'id')
 * @returns {Promise<Object|null>} Found record or null
 */
export const findById = async (table, id, idField = "id") => {
  const results = await executeQuery(
    `SELECT * FROM ${table} WHERE ${idField} = ?`,
    [id],
  );

  return results && results.length > 0 ? results[0] : null;
};

/**
 * Find records by a condition
 * @param {string} table - Table name
 * @param {Object} conditions - Conditions object {field: value}
 * @param {Object} options - Additional options (limit, offset, orderBy)
 * @returns {Promise<Array>} Found records
 */
export const findByCondition = async (table, conditions = {}, options = {}) => {
  const { limit, offset, orderBy } = options;

  // Build WHERE clause
  const whereConditions = [];
  const replacements = [];

  Object.entries(conditions).forEach(([field, value]) => {
    if (value === null) {
      whereConditions.push(`${field} IS NULL`);
    } else {
      whereConditions.push(`${field} = ?`);
      replacements.push(value);
    }
  });

  // Build query
  let query = `SELECT * FROM ${table}`;

  if (whereConditions.length > 0) {
    query += ` WHERE ${whereConditions.join(" AND ")}`;
  }

  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    query += ` LIMIT ?`;
    replacements.push(parseInt(limit));

    if (offset) {
      query += ` OFFSET ?`;
      replacements.push(parseInt(offset));
    }
  }

  return executeQuery(query, replacements);
};

/**
 * Insert a record
 * @param {string} table - Table name
 * @param {Object} data - Data to insert
 * @returns {Promise<any>} Insert result
 */
export const insert = async (table, data) => {
  const fields = Object.keys(data);
  const placeholders = fields.map(() => "?").join(", ");
  const values = Object.values(data);

  const query = `INSERT INTO ${table} (${fields.join(", ")}) VALUES (${placeholders})`;

  return executeQuery(query, values, "INSERT");
};

/**
 * Update a record
 * @param {string} table - Table name
 * @param {Object} data - Data to update
 * @param {Object} conditions - Update conditions
 * @returns {Promise<any>} Update result
 */
export const update = async (table, data, conditions) => {
  const updateFields = Object.keys(data)
    .map((field) => `${field} = ?`)
    .join(", ");
  const whereConditions = Object.keys(conditions)
    .map((field) => `${field} = ?`)
    .join(" AND ");

  const values = [...Object.values(data), ...Object.values(conditions)];

  const query = `UPDATE ${table} SET ${updateFields} WHERE ${whereConditions}`;

  return executeQuery(query, values, "UPDATE");
};

/**
 * Delete a record
 * @param {string} table - Table name
 * @param {Object} conditions - Delete conditions
 * @returns {Promise<any>} Delete result
 */
export const remove = async (table, conditions) => {
  const whereConditions = Object.keys(conditions)
    .map((field) => `${field} = ?`)
    .join(" AND ");
  const values = Object.values(conditions);

  const query = `DELETE FROM ${table} WHERE ${whereConditions}`;

  return executeQuery(query, values, "DELETE");
};

/**
 * Process JSON fields in database results
 * @param {Object|Array} data - Data to process
 * @param {Array<string>} jsonFields - Fields to parse as JSON
 * @returns {Object|Array} Processed data
 */
export const processJsonFields = (data, jsonFields = []) => {
  if (!data) return data;

  const processItem = (item) => {
    const result = { ...item };

    jsonFields.forEach((field) => {
      if (result[field] && typeof result[field] === "string") {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (e) {
          result[field] = null;
        }
      }
    });

    return result;
  };

  return Array.isArray(data) ? data.map(processItem) : processItem(data);
};

/**
 * Execute a transaction
 * @param {Function} callback - Function to execute within transaction
 * @returns {Promise<any>} Transaction result
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

export default {
  executeQuery,
  findById,
  findByCondition,
  insert,
  update,
  remove,
  processJsonFields,
  executeTransaction,
};
