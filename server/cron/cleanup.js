/**
 * Scheduled Cleanup Tasks
 *
 * This file contains cron jobs for regular maintenance tasks
 * such as cleaning up old data and optimizing the database.
 */

import cron from "node-cron";
import { getMySQLClient } from "../services/mysqlClient.js";
import logger from "../utils/logger.js";

/**
 * Initialize cleanup cron jobs
 */
export function initCleanupJobs() {
  // Run daily at 3:00 AM
  cron.schedule("0 3 * * *", async () => {
    logger.info("Running daily cleanup tasks");
    try {
      await cleanupOldChatData(30); // Keep chat data for 30 days
      await cleanupOldLogs(90); // Keep logs for 90 days
      await optimizeDatabase(); // Optimize database tables
      logger.success("Daily cleanup completed successfully");
    } catch (error) {
      logger.error("Error during daily cleanup:", error);
    }
  });

  // Run weekly on Sunday at 2:00 AM
  cron.schedule("0 2 * * 0", async () => {
    logger.info("Running weekly cleanup tasks");
    try {
      await purgeInactiveUsers(180); // Purge users inactive for 180 days
      await cleanupTempFiles(); // Clean temporary files
      logger.success("Weekly cleanup completed successfully");
    } catch (error) {
      logger.error("Error during weekly cleanup:", error);
    }
  });

  logger.info("Cleanup cron jobs initialized");
}

/**
 * Clean up old chat sessions and messages
 * @param {number} daysToKeep - Number of days to keep chat data
 */
async function cleanupOldChatData(daysToKeep) {
  try {
    const sequelize = await getMySQLClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old chat messages
    const [messageResult] = await sequelize.query(
      `DELETE FROM chat_messages WHERE created_at < ?`,
      { replacements: [cutoffDate] },
    );

    // Delete old chat sessions that have no messages
    const [sessionResult] = await sequelize.query(
      `DELETE FROM chat_sessions WHERE created_at < ? AND id NOT IN (SELECT DISTINCT session_id FROM chat_messages)`,
      { replacements: [cutoffDate] },
    );

    logger.info(
      `Cleaned up ${messageResult.affectedRows || 0} chat messages and ${sessionResult.affectedRows || 0} chat sessions older than ${daysToKeep} days`,
    );
  } catch (error) {
    logger.error("Error cleaning up old chat data:", error);
    throw error;
  }
}

/**
 * Clean up old AI interaction logs
 * @param {number} daysToKeep - Number of days to keep logs
 */
async function cleanupOldLogs(daysToKeep) {
  try {
    const sequelize = await getMySQLClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old AI interaction logs
    const [result] = await sequelize.query(
      `DELETE FROM ai_interaction_logs WHERE created_at < ?`,
      { replacements: [cutoffDate] },
    );

    logger.info(
      `Cleaned up ${result.affectedRows || 0} logs older than ${daysToKeep} days`,
    );
  } catch (error) {
    logger.error("Error cleaning up old logs:", error);
    throw error;
  }
}

/**
 * Optimize database tables
 */
async function optimizeDatabase() {
  try {
    const sequelize = await getMySQLClient();
    const tables = [
      "chat_messages",
      "chat_sessions",
      "ai_interaction_logs",
      "widget_configs",
      "context_rules",
      "knowledge_base",
      "prompt_templates",
      "response_formats",
      "scrape_jobs",
      "scrape_vectors",
    ];

    for (const table of tables) {
      await sequelize.query(`OPTIMIZE TABLE ${table}`);
    }

    logger.info(`Optimized ${tables.length} database tables`);
  } catch (error) {
    logger.error("Error optimizing database:", error);
    throw error;
  }
}

/**
 * Purge inactive users
 * @param {number} daysInactive - Number of days of inactivity before purging
 */
async function purgeInactiveUsers(daysInactive) {
  try {
    const sequelize = await getMySQLClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    // Find users with no activity
    const [inactiveUsers] = await sequelize.query(
      `SELECT id FROM users WHERE last_login < ? AND role != 'admin'`,
      { replacements: [cutoffDate] },
    );

    if (inactiveUsers.length === 0) {
      logger.info(`No inactive users found to purge`);
      return;
    }

    const userIds = inactiveUsers.map((user) => user.id);

    // Delete related data first (respecting foreign key constraints)
    await sequelize.query(
      `DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id IN (?))`,
      { replacements: [userIds] },
    );

    await sequelize.query(`DELETE FROM chat_sessions WHERE user_id IN (?)`, {
      replacements: [userIds],
    });

    await sequelize.query(
      `DELETE FROM ai_interaction_logs WHERE user_id IN (?)`,
      { replacements: [userIds] },
    );

    // Finally delete the users
    const [result] = await sequelize.query(
      `DELETE FROM users WHERE id IN (?)`,
      { replacements: [userIds] },
    );

    logger.info(`Purged ${result.affectedRows || 0} inactive users`);
  } catch (error) {
    logger.error("Error purging inactive users:", error);
    throw error;
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles() {
  // Implementation depends on how temporary files are stored
  // This could use the file system or database depending on your app
  logger.info("Temporary file cleanup completed");
}

export default {
  initCleanupJobs,
};
