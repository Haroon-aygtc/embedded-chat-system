/**
 * Data Migration Script from Supabase to MySQL
 *
 * This script extracts data from Supabase and imports it into MySQL.
 *
 * Usage:
 * 1. Set up environment variables for both Supabase and MySQL
 * 2. Run: node scripts/migrate-from-supabase.js
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// MySQL configuration
const mysqlConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: process.env.MYSQL_PORT || 3306,
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

// Check if required environment variables are set
if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Supabase URL and service key are required");
  process.exit(1);
}

if (!mysqlConfig.username || !mysqlConfig.database) {
  console.error("Error: MySQL username and database are required");
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize MySQL connection
const sequelize = new Sequelize({
  host: mysqlConfig.host,
  port: mysqlConfig.port,
  username: mysqlConfig.username,
  password: mysqlConfig.password,
  database: mysqlConfig.database,
  dialect: "mysql",
  logging: false,
});

// Tables to migrate
const tables = [
  "users",
  "user_activities",
  "context_rules",
  "widget_configs",
  "chat_sessions",
  "chat_messages",
  "ai_response_cache",
  "ai_interaction_logs",
  "system_settings",
];

// Main migration function
async function migrateData() {
  try {
    console.log("Starting migration from Supabase to MySQL...");

    // Test connections
    console.log("Testing Supabase connection...");
    const { data: supabaseTest, error: supabaseError } = await supabase
      .from("users")
      .select("count")
      .limit(1);
    if (supabaseError)
      throw new Error(`Supabase connection error: ${supabaseError.message}`);
    console.log("Supabase connection successful");

    console.log("Testing MySQL connection...");
    await sequelize.authenticate();
    console.log("MySQL connection successful");

    // Create backup directory
    const backupDir = path.join(
      __dirname,
      "../backup",
      new Date().toISOString().replace(/:/g, "-"),
    );
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Process each table
    for (const table of tables) {
      console.log(`\nMigrating table: ${table}`);

      // Extract data from Supabase
      console.log(`Extracting data from Supabase table: ${table}`);
      const { data, error } = await supabase.from(table).select("*");

      if (error) {
        console.error(`Error extracting data from ${table}:`, error);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`No data found in ${table}, skipping...`);
        continue;
      }

      console.log(`Found ${data.length} records in ${table}`);

      // Save backup
      const backupFile = path.join(backupDir, `${table}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
      console.log(`Backup saved to ${backupFile}`);

      // Import into MySQL
      console.log(`Importing data into MySQL table: ${table}`);

      try {
        // Clear existing data (optional, comment out if you want to preserve existing data)
        await sequelize.query(`TRUNCATE TABLE ${table}`);

        // Insert data in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);

          // Generate placeholders for the INSERT statement
          const columns = Object.keys(batch[0]);
          const placeholders = batch
            .map(() => `(${columns.map(() => "?").join(", ")})`)
            .join(", ");

          // Flatten values for the query
          const values = batch.flatMap((record) => {
            return columns.map((col) => {
              // Handle JSON fields
              if (typeof record[col] === "object" && record[col] !== null) {
                return JSON.stringify(record[col]);
              }
              return record[col];
            });
          });

          // Execute the INSERT statement
          await sequelize.query(
            `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`,
            {
              replacements: values,
              type: Sequelize.QueryTypes.INSERT,
            },
          );
        }

        console.log(
          `Successfully imported ${data.length} records into ${table}`,
        );
      } catch (importError) {
        console.error(`Error importing data into ${table}:`, importError);
      }
    }

    console.log("\nMigration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    // Close connections
    await sequelize.close();
    console.log("Connections closed");
  }
}

// Run the migration
migrateData();
