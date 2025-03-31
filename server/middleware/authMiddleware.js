/**
 * Authentication Middleware
 *
 * Handles JWT verification and user authentication
 */

import jwt from "jsonwebtoken";
import { getMySQLClient } from "../services/mysqlClient.js";
import logger from "../utils/logger.js";

/**
 * Middleware to authenticate JWT tokens
 * Adds user object to request if authentication is successful
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.split(" ")[1]) || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_UNAUTHORIZED",
          message: "Authentication required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const sequelize = await getMySQLClient();
    const [users] = await sequelize.query(
      `SELECT id, email, full_name, role, is_active FROM users WHERE id = ?`,
      {
        replacements: [decoded.userId],
      },
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_UNAUTHORIZED",
          message: "User not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_ACCOUNT_DISABLED",
          message: "Your account has been disabled",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_INVALID_TOKEN",
          message: "Invalid or expired token",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    logger.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Internal server error during authentication",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Middleware to authenticate JWT tokens but allow requests without tokens
 * Adds user object to request if authentication is successful
 */
export const authenticateOptional = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = (authHeader && authHeader.split(" ")[1]) || req.cookies.token;

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const sequelize = await getMySQLClient();
    const [users] = await sequelize.query(
      `SELECT id, email, full_name, role, is_active FROM users WHERE id = ?`,
      {
        replacements: [decoded.userId],
      },
    );

    if (users && users.length > 0) {
      const user = users[0];
      // Only add active users
      if (user.is_active) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // For optional auth, just continue without user if token is invalid
    next();
  }
};

/**
 * Middleware to check if user is an admin
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "ERR_FORBIDDEN",
        message: "Admin privileges required",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
  next();
};
