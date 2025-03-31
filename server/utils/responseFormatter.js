/**
 * Response Formatter Utility
 *
 * Provides standardized response formatting for API endpoints
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Format a successful response
 * @param {any} data - The data to include in the response
 * @param {Object} options - Additional options
 * @returns {Object} Formatted success response
 */
export const formatSuccess = (data, options = {}) => {
  const { meta = {}, status = 200 } = options;

  return {
    status,
    body: {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: meta.requestId || uuidv4(),
        ...meta,
      },
    },
  };
};

/**
 * Format an error response
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 * @returns {Object} Formatted error response
 */
export const formatError = (message, options = {}) => {
  const {
    code = "ERR_INTERNAL_SERVER",
    status = 500,
    details = null,
    meta = {},
  } = options;

  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: meta.requestId || uuidv4(),
        ...meta,
      },
    },
  };
};

/**
 * Send a formatted response
 * @param {Object} res - Express response object
 * @param {Object} formatted - Formatted response from formatSuccess or formatError
 */
export const sendResponse = (res, formatted) => {
  return res.status(formatted.status).json(formatted.body);
};

/**
 * Common error responses
 */
export const errors = {
  badRequest: (message = "Bad request", details = null) =>
    formatError(message, { code: "ERR_BAD_REQUEST", status: 400, details }),

  unauthorized: (message = "Authentication required") =>
    formatError(message, { code: "ERR_UNAUTHORIZED", status: 401 }),

  forbidden: (message = "Access denied") =>
    formatError(message, { code: "ERR_FORBIDDEN", status: 403 }),

  notFound: (message = "Resource not found") =>
    formatError(message, { code: "ERR_NOT_FOUND", status: 404 }),

  validation: (message = "Validation error", details = null) =>
    formatError(message, { code: "ERR_VALIDATION", status: 400, details }),

  internal: (message = "Internal server error", details = null) =>
    formatError(message, { code: "ERR_INTERNAL_SERVER", status: 500, details }),
};

export default {
  formatSuccess,
  formatError,
  sendResponse,
  errors,
};
