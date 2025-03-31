/**
 * Widget Routes
 *
 * Handles all API endpoints related to widget configuration management
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import dbHelpers from "../../utils/dbHelpers.js";
import {
  formatSuccess,
  formatError,
  sendResponse,
  errors,
} from "../../utils/responseFormatter.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// JSON fields that need to be parsed in widget configs
const jsonFields = [
  "settings",
  "appearance",
  "behavior",
  "allowed_domains",
  "metadata",
];

/**
 * @route GET /api/widget-configs
 * @desc Get all widget configurations for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition(
      "widget_configs",
      { user_id: req.user.id },
      { orderBy: "created_at DESC" },
    );
    const processedResults = dbHelpers.processJsonFields(results, jsonFields);

    return sendResponse(res, formatSuccess(processedResults));
  } catch (error) {
    logger.error("Error fetching widget configurations:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch widget configurations"),
    );
  }
});

/**
 * @route GET /api/widget-configs/:id
 * @desc Get a specific widget configuration by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition("widget_configs", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound("Widget configuration not found"),
      );
    }

    const widget = dbHelpers.processJsonFields(results[0], jsonFields);
    return sendResponse(res, formatSuccess(widget));
  } catch (error) {
    logger.error(
      `Error fetching widget configuration ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to fetch widget configuration"),
    );
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
      return sendResponse(res, errors.validation("Name is required"));
    }

    const widgetId = uuidv4();
    const data = {
      id: widgetId,
      user_id: req.user.id,
      name,
      primary_color: primary_color || "#0066CC",
      position: position || "bottom-right",
      initial_state: initial_state || "minimized",
      allow_attachments:
        allow_attachments !== undefined ? allow_attachments : true,
      allow_voice: allow_voice !== undefined ? allow_voice : true,
      allow_emoji: allow_emoji !== undefined ? allow_emoji : true,
      context_mode: context_mode || "default",
      context_rule_id: context_rule_id || null,
      welcome_message: welcome_message || "Hello! How can I help you today?",
      placeholder_text: placeholder_text || "Type your message here...",
      theme: theme || "light",
      settings: settings ? JSON.stringify(settings) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await dbHelpers.insert("widget_configs", data);

    // Fetch the created widget configuration
    const result = await dbHelpers.findById("widget_configs", widgetId);
    const processedWidget = dbHelpers.processJsonFields(result, jsonFields);

    return sendResponse(res, formatSuccess(processedWidget, { status: 201 }));
  } catch (error) {
    logger.error("Error creating widget configuration:", error);
    return sendResponse(
      res,
      errors.internal("Failed to create widget configuration"),
    );
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

    // Check if widget configuration exists and belongs to user
    const results = await dbHelpers.findByCondition("widget_configs", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Widget configuration not found or you don't have permission to update it",
        ),
      );
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (primary_color !== undefined) updateData.primary_color = primary_color;
    if (position !== undefined) updateData.position = position;
    if (initial_state !== undefined) updateData.initial_state = initial_state;
    if (allow_attachments !== undefined)
      updateData.allow_attachments = allow_attachments;
    if (allow_voice !== undefined) updateData.allow_voice = allow_voice;
    if (allow_emoji !== undefined) updateData.allow_emoji = allow_emoji;
    if (context_mode !== undefined) updateData.context_mode = context_mode;
    if (context_rule_id !== undefined)
      updateData.context_rule_id = context_rule_id;
    if (welcome_message !== undefined)
      updateData.welcome_message = welcome_message;
    if (placeholder_text !== undefined)
      updateData.placeholder_text = placeholder_text;
    if (theme !== undefined) updateData.theme = theme;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update("widget_configs", updateData, { id: req.params.id });

    // Fetch the updated widget configuration
    const updatedWidget = await dbHelpers.findById(
      "widget_configs",
      req.params.id,
    );
    const processedWidget = dbHelpers.processJsonFields(
      updatedWidget,
      jsonFields,
    );

    return sendResponse(res, formatSuccess(processedWidget));
  } catch (error) {
    logger.error(
      `Error updating widget configuration ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to update widget configuration"),
    );
  }
});

/**
 * @route DELETE /api/widget-configs/:id
 * @desc Delete a widget configuration
 */
router.delete("/:id", async (req, res) => {
  try {
    // Check if widget configuration exists and belongs to user
    const results = await dbHelpers.findByCondition("widget_configs", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Widget configuration not found or you don't have permission to delete it",
        ),
      );
    }

    // Delete the widget configuration
    await dbHelpers.remove("widget_configs", { id: req.params.id });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(
      `Error deleting widget configuration ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to delete widget configuration"),
    );
  }
});

/**
 * @route GET /api/widget-configs/:id/embed-code
 * @desc Get embed code for a widget configuration
 */
router.get("/:id/embed-code", async (req, res) => {
  try {
    // Check if widget configuration exists and belongs to user
    const results = await dbHelpers.findByCondition("widget_configs", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Widget configuration not found or you don't have permission to access it",
        ),
      );
    }

    // Generate embed code
    const iframeCode = `<iframe src="${process.env.PUBLIC_URL || "https://your-domain.com"}/chat-embed?widget=${req.params.id}" width="100%" height="600px" frameborder="0"></iframe>`;

    const scriptCode = `<script src="${process.env.PUBLIC_URL || "https://your-domain.com"}/chat-widget.js" data-widget-id="${req.params.id}"></script>`;

    return sendResponse(
      res,
      formatSuccess({
        iframe: iframeCode,
        script: scriptCode,
      }),
    );
  } catch (error) {
    logger.error(
      `Error generating embed code for widget ${req.params.id}:`,
      error,
    );
    return sendResponse(res, errors.internal("Failed to generate embed code"));
  }
});

/**
 * @route GET /api/widget-configs/public/:id
 * @desc Get public widget configuration by ID (no auth required)
 */
router.get("/public/:id", async (req, res) => {
  try {
    const results = await dbHelpers.executeQuery(
      `SELECT id, name, primary_color, position, initial_state, 
              allow_attachments, allow_voice, allow_emoji, 
              welcome_message, placeholder_text, theme, settings 
       FROM widget_configs WHERE id = ?`,
      [req.params.id],
    );

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound("Widget configuration not found"),
      );
    }

    const widget = dbHelpers.processJsonFields(results[0], jsonFields);
    return sendResponse(res, formatSuccess(widget));
  } catch (error) {
    logger.error(
      `Error fetching public widget configuration ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to fetch widget configuration"),
    );
  }
});

export default router;
