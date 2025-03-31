/**
 * Request Logger Middleware
 *
 * Logs incoming API requests for monitoring and debugging
 */

import logger from "../utils/logger.js";

/**
 * Middleware to log all incoming requests
 */
const requestLogger = (req, res, next) => {
  // Get request start time
  const start = Date.now();

  // Log request details
  const logRequest = () => {
    const duration = Date.now() - start;
    const userId = req.user ? req.user.id : "unauthenticated";

    logger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  };

  // Log when response is finished
  res.on("finish", logRequest);

  next();
};

export default requestLogger;
