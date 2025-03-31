/**
 * Migration Runner
 *
 * Utility to run database migrations in a consistent way
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getMySQLClient } from "../services/mysqlClient.js";
import logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "../..");

/**
 * Run all migrations in the migrations directory
 */
export async function runMigrations() {
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
  } catch (error) {
    logger.error("Error running migrations:", error);
    throw error;
  }
}

/**
 * Run a specific migration file
 */
export async function runSingleMigration(migrationFile) {
  try {
    logger.info(`Running single migration: ${migrationFile}`);
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

    // Check if migration has already been executed
    const [executedMigrations] = await sequelize.query(
      "SELECT name FROM migrations WHERE name = ?",
      { replacements: [path.basename(migrationFile)] },
    );

    if (executedMigrations.length > 0) {
      logger.info(`Migration ${migrationFile} already executed, skipping`);
      return;
    }

    // Run the migration
    if (migrationFile.endsWith(".sql")) {
      // SQL migration
      const sqlContent = fs.readFileSync(migrationFile, "utf8");

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
      const migration = await import(migrationFile);
      if (typeof migration.up === "function") {
        await migration.up(sequelize);
      } else if (typeof migration.default === "function") {
        await migration.default(sequelize);
      } else {
        throw new Error(
          `Migration ${migrationFile} has no up or default function`,
        );
      }
    }

    // Record migration as executed
    await sequelize.query("INSERT INTO migrations (name) VALUES (?)", {
      replacements: [path.basename(migrationFile)],
    });

    logger.success(`Migration completed: ${migrationFile}`);
  } catch (error) {
    logger.error(`Error running migration ${migrationFile}:`, error);
    throw error;
  }
}

export default {
  runMigrations,
  runSingleMigration,
};
