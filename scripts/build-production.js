#!/usr/bin/env node

/**
 * Production Build Script
 *
 * This script builds the application for production deployment.
 * It runs database migrations, builds the frontend, and prepares the server.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Set environment to production
process.env.NODE_ENV = "production";

const logStep = (message) => {
  console.log(`\n\x1b[36m===> ${message}\x1b[0m`);
};

const logSuccess = (message) => {
  console.log(`\x1b[32m✓ ${message}\x1b[0m`);
};

const logError = (message, error) => {
  console.error(`\x1b[31m✗ ${message}\x1b[0m`);
  if (error) console.error(error);
};

try {
  // Step 1: Clean previous builds
  logStep("Cleaning previous builds");
  if (fs.existsSync("dist")) {
    fs.rmSync("dist", { recursive: true, force: true });
  }
  logSuccess("Previous builds cleaned");

  // Step 2: Install dependencies
  logStep("Installing production dependencies");
  execSync("npm ci --production", { stdio: "inherit" });
  logSuccess("Dependencies installed");

  // Step 3: Run database migrations
  logStep("Running database migrations");
  execSync("node scripts/run-migrations.js", { stdio: "inherit" });
  logSuccess("Database migrations completed");

  // Step 4: Build frontend
  logStep("Building frontend");
  execSync("npm run build", { stdio: "inherit" });
  logSuccess("Frontend built successfully");

  // Step 5: Copy server files to dist
  logStep("Preparing server files");
  if (!fs.existsSync("dist/server")) {
    fs.mkdirSync("dist/server", { recursive: true });
  }
  execSync("cp -r server/* dist/server/", { stdio: "inherit" });
  execSync("cp package.json dist/", { stdio: "inherit" });
  execSync("cp package-lock.json dist/", { stdio: "inherit" });
  logSuccess("Server files prepared");

  // Step 6: Create production .env file if it doesn't exist
  logStep("Checking environment configuration");
  if (!fs.existsSync("dist/.env")) {
    if (fs.existsSync(".env.production")) {
      fs.copyFileSync(".env.production", "dist/.env");
    } else if (fs.existsSync(".env")) {
      fs.copyFileSync(".env", "dist/.env");
    } else {
      logError("No .env file found. Please create a .env file for production.");
      process.exit(1);
    }
  }
  logSuccess("Environment configuration ready");

  logStep("Production build completed successfully!");
  console.log("\nTo start the production server:");
  console.log("  cd dist");
  console.log("  NODE_ENV=production node server/server.js");
  console.log("\nOr using PM2:");
  console.log("  cd dist");
  console.log(
    '  pm2 start server/server.js --name "chat-widget" --env production',
  );
} catch (error) {
  logError("Build failed", error);
  process.exit(1);
}
