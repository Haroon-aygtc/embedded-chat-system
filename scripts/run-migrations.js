#!/usr/bin/env node

/**
 * Database Migration Runner Script
 *
 * This script runs all pending migrations in the migrations directory.
 * It can be used as a standalone script or as part of the deployment process.
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import { getMySQLClient } from "../server/services/mysqlClient.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Simple logger
const logger = {
  info: (message) => console.log(`\x1b[36mINFO\x1b[0m: ${message}`),
  success: (message) => console.log(`\x1b[32mSUCCESS\x1b[0m: ${message}`),
  error: (message, error) => {
    console.error(`\x1b[31mERROR\x1b[0m: ${message}`);
    if (error) console.error(error);
  },
  warn: (message) => console.log(`\x1b[33mWARN\x1b[0m: ${message}`),
};

/**
 * Run all migrations in the migrations directory
 */
async function runMigrations() {
  try {
    logger.info("Starting database migrations");
    const sequelize = await getMySQLClient();

    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_migration_name (name)
      )
    `);

    // Get list of executed migrations
    const [executedMigrations] = await sequelize.query(
      "SELECT name FROM migrations ORDER BY id",
    );
    const executedMigrationNames = executedMigrations.map((m) => m.name);

    // Get all migration files
    const migrationsDir = path.join(rootDir, "migrations");
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql") || file.endsWith(".js"))
      .sort(); // Sort to ensure migrations run in order

    // Run migrations that haven't been executed yet
    for (const migrationFile of migrationFiles) {
      if (!executedMigrationNames.includes(migrationFile)) {
        logger.info(`Running migration: ${migrationFile}`);

        if (migrationFile.endsWith(".sql")) {
          // SQL migration
          const sqlContent = fs.readFileSync(
            path.join(migrationsDir, migrationFile),
            "utf8",
          );

          // Split by semicolon to execute multiple statements
          const statements = sqlContent
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          for (const statement of statements) {
            await sequelize.query(statement);
          }
        } else if (migrationFile.endsWith(".js")) {
          // JavaScript migration
          const migration = await import(
            path.join(migrationsDir, migrationFile)
          );
          if (typeof migration.up === "function") {
            await migration.up(sequelize);
          } else if (typeof migration.default === "function") {
            await migration.default(sequelize);
          } else {
            logger.warn(
              `Migration ${migrationFile} has no up or default function`,
            );
            continue;
          }
        }

        // Record migration as executed
        await sequelize.query("INSERT INTO migrations (name) VALUES (?)", {
          replacements: [migrationFile],
        });

        logger.success(`Migration completed: ${migrationFile}`);
      }
    }

    logger.success("All migrations completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error running migrations:", error);
    process.exit(1);
  }
}

// Run the migrations
runMigrations();
