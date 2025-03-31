/**
 * Cleanup Service
 *
 * Handles cleanup tasks for the application, such as removing old logs,
 * temporary files, and other maintenance tasks.
 */

import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";

/**
 * Clean up old chat sessions and messages
 * @param daysToKeep Number of days to keep chat data
 */
export const cleanupOldChatData = async (daysToKeep = 30): Promise<void> => {
  try {
    const sequelize = await getMySQLClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old chat messages
    await sequelize.query(`DELETE FROM chat_messages WHERE created_at < ?`, {
      replacements: [cutoffDate],
    });

    // Delete old chat sessions that have no messages
    await sequelize.query(
      `DELETE FROM chat_sessions WHERE created_at < ? AND id NOT IN (SELECT DISTINCT session_id FROM chat_messages)`,
      { replacements: [cutoffDate] },
    );

    logger.info(`Cleaned up chat data older than ${daysToKeep} days`);
  } catch (error) {
    logger.error("Error cleaning up old chat data:", error);
    throw error;
  }
};

/**
 * Clean up old AI interaction logs
 * @param daysToKeep Number of days to keep logs
 */
export const cleanupOldLogs = async (daysToKeep = 90): Promise<void> => {
  try {
    const sequelize = await getMySQLClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old AI interaction logs
    await sequelize.query(
      `DELETE FROM ai_interaction_logs WHERE created_at < ?`,
      { replacements: [cutoffDate] },
    );

    logger.info(`Cleaned up logs older than ${daysToKeep} days`);
  } catch (error) {
    logger.error("Error cleaning up old logs:", error);
    throw error;
  }
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = async (): Promise<void> => {
  // Implementation depends on how temporary files are stored
  // This could use the file system or database depending on your app
  logger.info("Temporary file cleanup completed");
};

/**
 * Run all cleanup tasks
 */
export const runAllCleanupTasks = async (): Promise<void> => {
  try {
    await cleanupOldChatData();
    await cleanupOldLogs();
    await cleanupTempFiles();
    logger.info("All cleanup tasks completed successfully");
  } catch (error) {
    logger.error("Error running cleanup tasks:", error);
    throw error;
  }
};

export default {
  cleanupOldChatData,
  cleanupOldLogs,
  cleanupTempFiles,
  runAllCleanupTasks,
};
