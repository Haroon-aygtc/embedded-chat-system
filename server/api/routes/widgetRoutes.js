/**
 * Widget Routes
 *
 * Handles all API endpoints related to chat widget configuration
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";

const router = express.Router();

/**
 * @route GET /api/widget-configs
 * @desc Get all widget configurations for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE user_id = ? ORDER BY created_at DESC`,
      {
        replacements: [req.user.id],
      },
    );

    return res.status(200).json({
      success: true,
      data: results,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching widget configurations:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch widget configurations",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/widget-configs/:id
 * @desc Get a specific widget configuration by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Widget configuration not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Parse settings if it exists
    if (results[0].settings && typeof results[0].settings === "string") {
      try {
        results[0].settings = JSON.parse(results[0].settings);
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
    logger.error(
      `Error fetching widget configuration ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch widget configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/widget-configs
 * @desc Create a new widget configuration
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      primary_color,
      position,
      initial_state,
      allow_attachments,
      allow_voice,
      allow_emoji,
      context_mode,
      context_rule_id,
      welcome_message,
      placeholder_text,
      theme,
      settings,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Name is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const widgetId = uuidv4();
    const sequelize = await getMySQLClient();

    await sequelize.query(
      `INSERT INTO widget_configs (
        id, user_id, name, primary_color, position, initial_state, 
        allow_attachments, allow_voice, allow_emoji, context_mode, 
        context_rule_id, welcome_message, placeholder_text, theme, 
        settings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          widgetId,
          req.user.id,
          name,
          primary_color || "#0066CC",
          position || "bottom-right",
          initial_state || "minimized",
          allow_attachments !== undefined ? allow_attachments : true,
          allow_voice !== undefined ? allow_voice : true,
          allow_emoji !== undefined ? allow_emoji : true,
          context_mode || "default",
          context_rule_id || null,
          welcome_message || "Hello! How can I help you today?",
          placeholder_text || "Type your message here...",
          theme || "light",
          settings ? JSON.stringify(settings) : null,
          new Date(),
          new Date(),
        ],
      },
    );

    // Fetch the created widget configuration
    const [results] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE id = ?`,
      {
        replacements: [widgetId],
      },
    );

    // Parse settings if it exists
    if (results[0].settings && typeof results[0].settings === "string") {
      try {
        results[0].settings = JSON.parse(results[0].settings);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    return res.status(201).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error creating widget configuration:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to create widget configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route PUT /api/widget-configs/:id
 * @desc Update a widget configuration
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      primary_color,
      position,
      initial_state,
      allow_attachments,
      allow_voice,
      allow_emoji,
      context_mode,
      context_rule_id,
      welcome_message,
      placeholder_text,
      theme,
      settings,
    } = req.body;

    const sequelize = await getMySQLClient();

    // Check if widget configuration exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message:
            "Widget configuration not found or you don't have permission to update it",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Build update query dynamically based on provided fields
    let updateFields = [];
    let replacements = [];

    if (name !== undefined) {
      updateFields.push("name = ?");
      replacements.push(name);
    }

    if (primary_color !== undefined) {
      updateFields.push("primary_color = ?");
      replacements.push(primary_color);
    }

    if (position !== undefined) {
      updateFields.push("position = ?");
      replacements.push(position);
    }

    if (initial_state !== undefined) {
      updateFields.push("initial_state = ?");
      replacements.push(initial_state);
    }

    if (allow_attachments !== undefined) {
      updateFields.push("allow_attachments = ?");
      replacements.push(allow_attachments);
    }

    if (allow_voice !== undefined) {
      updateFields.push("allow_voice = ?");
      replacements.push(allow_voice);
    }

    if (allow_emoji !== undefined) {
      updateFields.push("allow_emoji = ?");
      replacements.push(allow_emoji);
    }

    if (context_mode !== undefined) {
      updateFields.push("context_mode = ?");
      replacements.push(context_mode);
    }

    if (context_rule_id !== undefined) {
      updateFields.push("context_rule_id = ?");
      replacements.push(context_rule_id);
    }

    if (welcome_message !== undefined) {
      updateFields.push("welcome_message = ?");
      replacements.push(welcome_message);
    }

    if (placeholder_text !== undefined) {
      updateFields.push("placeholder_text = ?");
      replacements.push(placeholder_text);
    }

    if (theme !== undefined) {
      updateFields.push("theme = ?");
      replacements.push(theme);
    }

    if (settings !== undefined) {
      updateFields.push("settings = ?");
      replacements.push(JSON.stringify(settings));
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
      `UPDATE widget_configs SET ${updateFields.join(", ")} WHERE id = ?`,
      {
        replacements,
      },
    );

    // Fetch the updated widget configuration
    const [results] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    // Parse settings if it exists
    if (results[0].settings && typeof results[0].settings === "string") {
      try {
        results[0].settings = JSON.parse(results[0].settings);
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
    logger.error(
      `Error updating widget configuration ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to update widget configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/widget-configs/:id
 * @desc Delete a widget configuration
 */
router.delete("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Check if widget configuration exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message:
            "Widget configuration not found or you don't have permission to delete it",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete the widget configuration
    await sequelize.query(`DELETE FROM widget_configs WHERE id = ?`, {
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
    logger.error(
      `Error deleting widget configuration ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to delete widget configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/widget-configs/:id/embed-code
 * @desc Get embed code for a widget configuration
 */
router.get("/:id/embed-code", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Check if widget configuration exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM widget_configs WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message:
            "Widget configuration not found or you don't have permission to access it",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate embed code
    const iframeCode = `<iframe src="${process.env.PUBLIC_URL || "https://your-domain.com"}/chat-embed?widget=${req.params.id}" width="100%" height="600px" frameborder="0"></iframe>`;

    const scriptCode = `<script src="${process.env.PUBLIC_URL || "https://your-domain.com"}/chat-widget.js" data-widget-id="${req.params.id}"></script>`;

    return res.status(200).json({
      success: true,
      data: {
        iframe: iframeCode,
        script: scriptCode,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(
      `Error generating embed code for widget ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to generate embed code",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/widget-configs/public/:id
 * @desc Get public widget configuration by ID (no auth required)
 */
router.get("/public/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT id, name, primary_color, position, initial_state, 
              allow_attachments, allow_voice, allow_emoji, 
              welcome_message, placeholder_text, theme, settings 
       FROM widget_configs WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Widget configuration not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Parse settings if it exists
    if (results[0].settings && typeof results[0].settings === "string") {
      try {
        results[0].settings = JSON.parse(results[0].settings);
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
    logger.error(
      `Error fetching public widget configuration ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch widget configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
