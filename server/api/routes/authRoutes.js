/**
 * Authentication Routes
 *
 * Handles user authentication, registration, and password management
 */

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";
import { authenticateJWT } from "../../middleware/authMiddleware.js";
import { sendPasswordResetEmail } from "../../services/emailService.js";

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    // Validate input
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Email, password, and full name are required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Invalid email format",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Password must be at least 8 characters long",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Check if email already exists
    const [existingUsers] = await sequelize.query(
      `SELECT * FROM users WHERE email = ?`,
      {
        replacements: [email.toLowerCase()],
      },
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_DUPLICATE_EMAIL",
          message: "Email is already in use",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate user ID
    const userId = uuidv4();

    // Create user
    await sequelize.query(
      `INSERT INTO users (
        id, email, password, full_name, role, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          userId,
          email.toLowerCase(),
          hashedPassword,
          full_name,
          "user", // Default role
          true, // Active by default
          new Date(),
          new Date(),
        ],
      },
    );

    // Generate JWT token
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data and token
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email,
          full_name,
          role: "user",
        },
        token,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error registering user:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to register user",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login a user
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Email and password are required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Find user by email
    const [users] = await sequelize.query(
      `SELECT * FROM users WHERE email = ?`,
      {
        replacements: [email.toLowerCase()],
      },
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_INVALID_CREDENTIALS",
          message: "Invalid email or password",
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "ERR_INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Update last login timestamp
    await sequelize.query(`UPDATE users SET last_login_at = ? WHERE id = ?`, {
      replacements: [new Date(), user.id],
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Return user data and token
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          avatar_url: user.avatar_url,
        },
        token,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error logging in user:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to log in",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Email is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Find user by email
    const [users] = await sequelize.query(
      `SELECT * FROM users WHERE email = ?`,
      {
        replacements: [email.toLowerCase()],
      },
    );

    // Always return success even if user not found (security best practice)
    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          message:
            "If your email is registered, you will receive a password reset link",
        },
      });
    }

    const user = users[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(200).json({
        success: true,
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          message:
            "If your email is registered, you will receive a password reset link",
        },
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Save reset token to database
    await sequelize.query(
      `UPDATE users SET 
        reset_token = ?, 
        reset_token_expiry = ? 
       WHERE id = ?`,
      {
        replacements: [resetToken, resetTokenExpiry, user.id],
      },
    );

    // Send password reset email
    await sendPasswordResetEmail(user.email, user.full_name, resetToken);

    return res.status(200).json({
      success: true,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        message:
          "If your email is registered, you will receive a password reset link",
      },
    });
  } catch (error) {
    logger.error("Error requesting password reset:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to process password reset request",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password using token
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Token and password are required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Password must be at least 8 characters long",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Find user by reset token
    const [users] = await sequelize.query(
      `SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?`,
      {
        replacements: [token, new Date()],
      },
    );

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_INVALID_TOKEN",
          message: "Invalid or expired reset token",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const user = users[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    await sequelize.query(
      `UPDATE users SET 
        password = ?, 
        reset_token = NULL, 
        reset_token_expiry = NULL, 
        updated_at = ? 
       WHERE id = ?`,
      {
        replacements: [hashedPassword, new Date(), user.id],
      },
    );

    return res.status(200).json({
      success: true,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        message: "Password has been reset successfully",
      },
    });
  } catch (error) {
    logger.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to reset password",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout a user (client-side only, just for API completeness)
 */
router.post("/logout", (req, res) => {
  return res.status(200).json({
    success: true,
    data: null,
    meta: {
      timestamp: new Date().toISOString(),
      message: "Logged out successfully",
    },
  });
});

/**
 * @route GET /api/auth/verify
 * @desc Verify JWT token and return user data
 */
router.get("/verify", authenticateJWT, (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        avatar_url: req.user.avatar_url,
      },
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
