/**
 * User Routes
 *
 * Handles all API endpoints related to user management
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import dbHelpers from "../../utils/dbHelpers.js";
import {
  formatSuccess,
  formatError,
  sendResponse,
  errors,
} from "../../utils/responseFormatter.js";
import { requireAdmin } from "../../middleware/authMiddleware.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// JSON fields that need to be parsed in user records
const jsonFields = ["metadata"];

/**
 * @route GET /api/users
 * @desc Get all users (admin only)
 */
router.get("/", requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

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
    const users = await dbHelpers.executeQuery(query, replacements);
    const countResult = await dbHelpers.executeQuery(
      countQuery,
      search ? [`%${search}%`, `%${search}%`] : [],
    );

    const totalCount = countResult[0].count;

    return sendResponse(
      res,
      formatSuccess(users, {
        meta: {
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
          },
        },
      }),
    );
  } catch (error) {
    logger.error("Error fetching users:", error);
    return sendResponse(res, errors.internal("Failed to fetch users"));
  }
});

/**
 * @route GET /api/users/me
 * @desc Get current user profile
 */
router.get("/me", async (req, res) => {
  try {
    const user = await dbHelpers.executeQuery(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at, metadata 
       FROM users WHERE id = ?`,
      [req.user.id],
    );

    if (!user || user.length === 0) {
      return sendResponse(res, errors.notFound("User not found"));
    }

    const processedUser = dbHelpers.processJsonFields(user[0], jsonFields);
    return sendResponse(res, formatSuccess(processedUser));
  } catch (error) {
    logger.error("Error fetching current user profile:", error);
    return sendResponse(res, errors.internal("Failed to fetch user profile"));
  }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID (admin only or own profile)
 */
router.get("/:id", async (req, res) => {
  try {
    // Check if user is admin or requesting their own profile
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return sendResponse(
        res,
        errors.forbidden("You don't have permission to access this resource"),
      );
    }

    const user = await dbHelpers.executeQuery(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at, metadata 
       FROM users WHERE id = ?`,
      [req.params.id],
    );

    if (!user || user.length === 0) {
      return sendResponse(res, errors.notFound("User not found"));
    }

    const processedUser = dbHelpers.processJsonFields(user[0], jsonFields);
    return sendResponse(res, formatSuccess(processedUser));
  } catch (error) {
    logger.error(`Error fetching user ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to fetch user"));
  }
});

/**
 * @route PUT /api/users/me
 * @desc Update current user profile
 */
router.put("/me", async (req, res) => {
  try {
    const { full_name, avatar_url, current_password, new_password } = req.body;

    // Build update data object
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    // Handle password change
    if (new_password && current_password) {
      // Verify current password
      const userResults = await dbHelpers.executeQuery(
        `SELECT password FROM users WHERE id = ?`,
        [req.user.id],
      );

      if (!userResults || userResults.length === 0) {
        return sendResponse(res, errors.notFound("User not found"));
      }

      const isPasswordValid = await bcrypt.compare(
        current_password,
        userResults[0].password,
      );

      if (!isPasswordValid) {
        return sendResponse(
          res,
          errors.validation("Current password is incorrect", {
            code: "ERR_INVALID_CREDENTIALS",
          }),
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updateData.password = hashedPassword;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update("users", updateData, { id: req.user.id });

    // Fetch the updated user
    const updatedUser = await dbHelpers.executeQuery(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at 
       FROM users WHERE id = ?`,
      [req.user.id],
    );

    return sendResponse(res, formatSuccess(updatedUser[0]));
  } catch (error) {
    logger.error("Error updating user profile:", error);
    return sendResponse(res, errors.internal("Failed to update user profile"));
  }
});

/**
 * @route PUT /api/users/:id
 * @desc Update user (admin only)
 */
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const { full_name, email, role, is_active, avatar_url, metadata } =
      req.body;

    // Check if user exists
    const user = await dbHelpers.findById("users", req.params.id);

    if (!user) {
      return sendResponse(res, errors.notFound("User not found"));
    }

    // Build update data object
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;

    if (email !== undefined) {
      // Check if email is already in use
      if (email !== user.email) {
        const emailCheck = await dbHelpers.findByCondition(
          "users",
          { email },
          { limit: 1 },
        );

        if (
          emailCheck &&
          emailCheck.length > 0 &&
          emailCheck[0].id !== req.params.id
        ) {
          return sendResponse(
            res,
            errors.validation("Email is already in use", {
              code: "ERR_DUPLICATE_EMAIL",
            }),
          );
        }
      }

      updateData.email = email;
    }

    if (role !== undefined) {
      // Validate role
      const validRoles = ["admin", "user"];
      if (!validRoles.includes(role)) {
        return sendResponse(res, errors.validation("Invalid role"));
      }

      updateData.role = role;
    }

    if (is_active !== undefined) updateData.is_active = is_active;
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update("users", updateData, { id: req.params.id });

    // Fetch the updated user
    const updatedUser = await dbHelpers.executeQuery(
      `SELECT id, email, full_name, role, is_active, avatar_url, created_at, updated_at, last_login_at 
       FROM users WHERE id = ?`,
      [req.params.id],
    );

    return sendResponse(res, formatSuccess(updatedUser[0]));
  } catch (error) {
    logger.error(`Error updating user ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to update user"));
  }
});

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (admin only)
 */
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return sendResponse(
        res,
        errors.validation("You cannot delete your own account"),
      );
    }

    // Check if user exists
    const user = await dbHelpers.findById("users", req.params.id);

    if (!user) {
      return sendResponse(res, errors.notFound("User not found"));
    }

    // Delete user
    await dbHelpers.remove("users", { id: req.params.id });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(`Error deleting user ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to delete user"));
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
      return sendResponse(
        res,
        errors.forbidden("You don't have permission to access this resource"),
      );
    }

    // Fetch activity logs with pagination
    const activities = await dbHelpers.findByCondition(
      "user_activities",
      { user_id: userId },
      { orderBy: "created_at DESC", limit, offset },
    );

    // Get total count for pagination
    const countResult = await dbHelpers.executeQuery(
      `SELECT COUNT(*) as count FROM user_activities WHERE user_id = ?`,
      [userId],
    );

    const totalCount = countResult[0].count;

    // Process metadata
    const processedActivities = dbHelpers.processJsonFields(activities, [
      "metadata",
    ]);

    return sendResponse(
      res,
      formatSuccess(processedActivities, {
        meta: {
          pagination: {
            total: totalCount,
            page,
            limit,
            pages: Math.ceil(totalCount / limit),
          },
        },
      }),
    );
  } catch (error) {
    logger.error("Error fetching user activity logs:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch user activity logs"),
    );
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
      return sendResponse(res, errors.validation("Action is required"));
    }

    const activityId = uuidv4();

    // Get IP and user agent from request
    const ip_address =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const user_agent = req.headers["user-agent"];

    await dbHelpers.insert("user_activities", {
      id: activityId,
      user_id: req.user.id,
      action,
      ip_address,
      user_agent,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date(),
    });

    return sendResponse(
      res,
      formatSuccess(
        {
          id: activityId,
          user_id: req.user.id,
          action,
          created_at: new Date(),
        },
        { status: 201 },
      ),
    );
  } catch (error) {
    logger.error("Error logging user activity:", error);
    return sendResponse(res, errors.internal("Failed to log user activity"));
  }
});

export default router;
