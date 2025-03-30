/**
 * Authentication Middleware
 *
 * This middleware handles JWT authentication for API routes.
 */

import jwt from "jsonwebtoken";
import { User } from "../../../src/models/index.js";

// JWT secret from environment variables
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

/**
 * Authenticate JWT token middleware
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user exists and is active
    const user = await User.findOne({
      where: { id: decoded.userId, is_active: true },
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_INVALID_USER",
          message: "User not found or inactive",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_TOKEN_EXPIRED",
          message: "Authentication token expired",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_INVALID_TOKEN",
          message: "Invalid authentication token",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_AUTH_FAILED",
        message: "Authentication failed",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
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

    const userRole = req.user.role;
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    if (!rolesArray.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_FORBIDDEN",
          message: "Insufficient permissions",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    next();
  };
};

/**
 * Generate JWT token for a user
 */
export const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "24h" },
  );
};
