/**
 * Error Handler Middleware
 *
 * Provides centralized error handling for the API
 */

import { formatError, sendResponse } from "../utils/responseFormatter.js";
import logger from "../utils/logger.js";

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error("Unhandled error:", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user.id : "unauthenticated",
  });

  // Determine error type and status code
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || "ERR_INTERNAL_SERVER";
  let errorMessage = err.message || "An unexpected error occurred";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "ERR_VALIDATION";
  } else if (
    err.name === "UnauthorizedError" ||
    err.name === "JsonWebTokenError"
  ) {
    statusCode = 401;
    errorCode = "ERR_UNAUTHORIZED";
    errorMessage = "Authentication required";
  } else if (err.name === "ForbiddenError") {
    statusCode = 403;
    errorCode = "ERR_FORBIDDEN";
    errorMessage = "Access denied";
  } else if (err.name === "NotFoundError") {
    statusCode = 404;
    errorCode = "ERR_NOT_FOUND";
    errorMessage = err.message || "Resource not found";
  }

  // Format and send the error response
  const formattedError = formatError(errorMessage, {
    code: errorCode,
    status: statusCode,
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  return sendResponse(res, formattedError);
};

/**
 * Not found handler middleware
 */
export const notFoundHandler = (req, res) => {
  const formattedError = formatError("Resource not found", {
    code: "ERR_NOT_FOUND",
    status: 404,
    details: `Route ${req.method} ${req.originalUrl} not found`,
  });

  return sendResponse(res, formattedError);
};

export default {
  errorHandler,
  notFoundHandler,
};
