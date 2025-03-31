/**
 * User Routes
 *
 * Handles all API endpoints related to user management
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";

const router = express.Router();

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 */
router.get("/", async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_FORBIDDEN",
          message: "You don't have permission to access this resource",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const sequelize = await getMySQLClient();

    // Build query based on search parameter
    let query = `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at FROM users`;
    let countQuery = `SELECT COUNT(*) as count FROM users`;
    let replacements = [];

    if (search) {
      query += ` WHERE email LIKE ? OR full_name LIKE ?`;
      countQuery += ` WHERE email LIKE ? OR full_name LIKE ?`;
      replacements = [`%${search}%`, `%${search}%`];
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    replacements.push(limit, offset);

    // Execute queries
    const [users] = await sequelize.query(query, { replacements });
    const [countResult] = await sequelize.query(countQuery, {
      replacements: search ? [`%${search}%`, `%${search}%`] : [],
    });

    const totalCount = countResult[0].count;

    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch users",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 */
router.get("/me", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at, metadata 
       FROM users WHERE id = ?`,
      {
        replacements: [req.user.id],
      },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "User not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Parse metadata if it exists
    if (results[0].metadata && typeof results[0].metadata === "string") {
      try {
        results[0].metadata = JSON.parse(results[0].metadata);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    return res.status(200).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching current user profile:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch user profile",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID (admin only)
 */
router.get("/:id", async (req, res) => {
  try {
    // Check if user is admin or requesting their own profile
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_FORBIDDEN",
          message: "You don't have permission to access this resource",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at, metadata 
       FROM users WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "User not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Parse metadata if it exists
    if (results[0].metadata && typeof results[0].metadata === "string") {
      try {
        results[0].metadata = JSON.parse(results[0].metadata);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    return res.status(200).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error fetching user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch user",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 */
router.put("/me", async (req, res) => {
  try {
    const { full_name, avatar_url, current_password, new_password } = req.body;
    const sequelize = await getMySQLClient();

    // Build update query dynamically based on provided fields
    let updateFields = [];
    let replacements = [];

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      replacements.push(full_name);
    }

    if (avatar_url !== undefined) {
      updateFields.push("avatar_url = ?");
      replacements.push(avatar_url);
    }

    // Handle password change
    if (new_password && current_password) {
      // Verify current password
      const [userResults] = await sequelize.query(
        `SELECT password FROM users WHERE id = ?`,
        {
          replacements: [req.user.id],
        },
      );

      if (!userResults || userResults.length === 0) {
        return res.status(404).json({
          success: false,
          error: {
            code: "ERR_NOT_FOUND",
            message: "User not found",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      const isPasswordValid = await bcrypt.compare(
        current_password,
        userResults[0].password,
      );

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: {
            code: "ERR_INVALID_CREDENTIALS",
            message: "Current password is incorrect",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateFields.push("password = ?");
      replacements.push(hashedPassword);
    }

    // Always update the updated_at timestamp
    updateFields.push("updated_at = ?");
    replacements.push(new Date());

    // Add the ID as the last replacement
    replacements.push(req.user.id);

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "No fields to update",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Execute the update query
    await sequelize.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      {
        replacements,
      },
    );

    // Fetch the updated user
    const [results] = await sequelize.query(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at 
       FROM users WHERE id = ?`,
      {
        replacements: [req.user.id],
      },
    );

    return res.status(200).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error updating user profile:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to update user profile",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user (admin only)
 */
router.put("/:id", async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_FORBIDDEN",
          message: "You don't have permission to access this resource",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const { full_name, email, role, is_active, avatar_url, metadata } =
      req.body;
    const sequelize = await getMySQLClient();

    // Check if user exists
    const [checkResults] = await sequelize.query(
      `SELECT * FROM users WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "User not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Build update query dynamically based on provided fields
    let updateFields = [];
    let replacements = [];

    if (full_name !== undefined) {
      updateFields.push("full_name = ?");
      replacements.push(full_name);
    }

    if (email !== undefined) {
      // Check if email is already in use
      if (email !== checkResults[0].email) {
        const [emailCheck] = await sequelize.query(
          `SELECT * FROM users WHERE email = ? AND id != ?`,
          {
            replacements: [email, req.params.id],
          },
        );

        if (emailCheck && emailCheck.length > 0) {
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
      }

      updateFields.push("email = ?");
      replacements.push(email);
    }

    if (role !== undefined) {
      // Validate role
      const validRoles = ["admin", "user"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: {
            code: "ERR_VALIDATION",
            message: "Invalid role",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      updateFields.push("role = ?");
      replacements.push(role);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      replacements.push(is_active);
    }

    if (avatar_url !== undefined) {
      updateFields.push("avatar_url = ?");
      replacements.push(avatar_url);
    }

    if (metadata !== undefined) {
      updateFields.push("metadata = ?");
      replacements.push(JSON.stringify(metadata));
    }

    // Always update the updated_at timestamp
    updateFields.push("updated_at = ?");
    replacements.push(new Date());

    // Add the ID as the last replacement
    replacements.push(req.params.id);

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "No fields to update",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Execute the update query
    await sequelize.query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      {
        replacements,
      },
    );

    // Fetch the updated user
    const [results] = await sequelize.query(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at 
       FROM users WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    return res.status(200).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error updating user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to update user",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (admin only)
 */
router.delete("/:id", async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_FORBIDDEN",
          message: "You don't have permission to access this resource",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "You cannot delete your own account",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Check if user exists
    const [checkResults] = await sequelize.query(
      `SELECT * FROM users WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "User not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete user
    await sequelize.query(`DELETE FROM users WHERE id = ?`, {
      replacements: [req.params.id],
    });

    return res.status(200).json({
      success: true,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error deleting user ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to delete user",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/users/activity
 * @desc Get user activity logs
 */
router.get("/activity", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.query.userId || req.user.id;

    // Only admins can view other users' activity
    if (userId !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: {
          code: "ERR_FORBIDDEN",
          message: "You don't have permission to access this resource",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Fetch activity logs with pagination
    const [activities] = await sequelize.query(
      `SELECT * FROM user_activities 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      {
        replacements: [userId, limit, offset],
      },
    );

    // Get total count for pagination
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM user_activities WHERE user_id = ?`,
      {
        replacements: [userId],
      },
    );

    const totalCount = countResult[0].count;

    // Process metadata
    const processedActivities = activities.map((activity) => {
      if (activity.metadata && typeof activity.metadata === "string") {
        try {
          activity.metadata = JSON.parse(activity.metadata);
        } catch (e) {
          // If parsing fails, keep as is
        }
      }
      return activity;
    });

    return res.status(200).json({
      success: true,
      data: processedActivities,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching user activity logs:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch user activity logs",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/users/activity
 * @desc Log user activity
 */
router.post("/activity", async (req, res) => {
  try {
    const { action, metadata } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Action is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();
    const activityId = uuidv4();

    // Get IP and user agent from request
    const ip_address =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const user_agent = req.headers["user-agent"];

    await sequelize.query(
      `INSERT INTO user_activities (
        id, user_id, action, ip_address, user_agent, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          activityId,
          req.user.id,
          action,
          ip_address,
          user_agent,
          metadata ? JSON.stringify(metadata) : null,
          new Date(),
        ],
      },
    );

    return res.status(201).json({
      success: true,
      data: {
        id: activityId,
        user_id: req.user.id,
        action,
        created_at: new Date(),
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error logging user activity:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to log user activity",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
