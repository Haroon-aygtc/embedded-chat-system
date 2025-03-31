/**
 * Database Initialization Script
 *
 * This script initializes the database with the schema and creates an admin user
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "../services/mysqlClient.js";
import logger from "../utils/logger.js";

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize the database
 */
async function initializeDatabase() {
  try {
    logger.info("Starting database initialization...");

    // Get MySQL client
    const sequelize = await getMySQLClient();

    // Read schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    // Split schema into individual statements
    const statements = schema
      .split(";")
      .filter((statement) => statement.trim() !== "");

    // Execute each statement
    for (const statement of statements) {
      await sequelize.query(`${statement};`);
    }

    logger.info("Database schema created successfully");

    // Check if admin user exists
    const [adminUsers] = await sequelize.query(
      `SELECT * FROM users WHERE role = 'admin' LIMIT 1`,
    );

    // Create admin user if none exists
    if (!adminUsers || adminUsers.length === 0) {
      const adminId = uuidv4();
      const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      // Insert admin user
      await sequelize.query(
        `INSERT INTO users (
          id, email, password, full_name, role, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            adminId,
            adminEmail,
            hashedPassword,
            "Admin User",
            "admin",
            true,
            new Date(),
            new Date(),
          ],
        },
      );

      logger.info(`Admin user created with email: ${adminEmail}`);

      if (process.env.ADMIN_PASSWORD === "Admin123!") {
        logger.warn(
          "Default admin password is being used. Please change it immediately!",
        );
      }
    } else {
      logger.info("Admin user already exists");
    }

    // Create default AI configuration if none exists
    const [aiConfigs] = await sequelize.query(
      `SELECT * FROM ai_configurations LIMIT 1`,
    );

    if (!aiConfigs || aiConfigs.length === 0) {
      const configId = uuidv4();
      const adminId =
        adminUsers[0]?.id ||
        (
          await sequelize.query(
            `SELECT id FROM users WHERE role = 'admin' LIMIT 1`,
          )
        )[0][0].id;

      await sequelize.query(
        `INSERT INTO ai_configurations (
          id, name, description, default_model, is_active, settings, created_at, updated_at, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        {
          replacements: [
            configId,
            "Default Configuration",
            "Default AI configuration",
            "openai",
            true,
            JSON.stringify({
              temperature: 0.7,
              max_tokens: 1000,
              top_p: 1,
              frequency_penalty: 0,
              presence_penalty: 0,
            }),
            new Date(),
            new Date(),
            adminId,
          ],
        },
      );

      logger.info("Default AI configuration created");
    } else {
      logger.info("AI configuration already exists");
    }

    logger.info("Database initialization completed successfully");
    return true;
  } catch (error) {
    logger.error("Error initializing database:", error);
    throw error;
  }
}

// Run initialization if this script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => {
      logger.info("Database initialization script completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Database initialization failed:", error);
      process.exit(1);
    });
}

export default initializeDatabase;
