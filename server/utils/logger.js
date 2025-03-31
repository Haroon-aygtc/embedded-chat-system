/**
 * Logger Utility
 *
 * Centralized logging service using Winston
 */

import winston from "winston";
import "winston-daily-rotate-file";

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "info";
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to winston
winston.addColors(colors);

// Define format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) =>
      `${info.timestamp} ${info.level}: ${info.message} ${info.data ? JSON.stringify(info.data) : ""}`,
  ),
);

// Define format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.json(),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Add file transports in production
if (process.env.NODE_ENV === "production") {
  // Daily rotate file for all logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      format: fileFormat,
    }),
  );

  // Daily rotate file for error logs
  transports.push(
    new winston.transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      level: "error",
      format: fileFormat,
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
});

// Extend logger methods to accept data object
const extendedLogger = {
  error: (message, data) => logger.error({ message, data }),
  warn: (message, data) => logger.warn({ message, data }),
  info: (message, data) => logger.info({ message, data }),
  http: (message, data) => logger.http({ message, data }),
  debug: (message, data) => logger.debug({ message, data }),
};

export default extendedLogger;
