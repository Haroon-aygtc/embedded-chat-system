/**
 * Response Format Routes
 *
 * Handles all API endpoints related to response format management
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
import { requireAdmin } from "../../middleware/authMiddleware.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// JSON fields that need to be parsed in response formats
const jsonFields = ["variables", "data_schema"];

/**
 * @route GET /api/response-formats
 * @desc Get all response formats for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition(
      "response_formats",
      { user_id: req.user.id },
      { orderBy: "created_at DESC" },
    );
    const processedResults = dbHelpers.processJsonFields(results, jsonFields);

    return sendResponse(res, formatSuccess(processedResults));
  } catch (error) {
    logger.error("Error fetching response formats:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch response formats"),
    );
  }
});

/**
 * @route GET /api/response-formats/:id
 * @desc Get a specific response format by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition("response_formats", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(res, errors.notFound("Response format not found"));
    }

    const format = dbHelpers.processJsonFields(results[0], jsonFields);
    return sendResponse(res, formatSuccess(format));
  } catch (error) {
    logger.error(`Error fetching response format ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch response format"),
    );
  }
});

/**
 * @route POST /api/response-formats
 * @desc Create a new response format
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      format_type,
      template,
      variables,
      is_active,
      branding_enabled,
      brand_name,
      brand_color,
      brand_logo,
      structured_data,
      data_schema,
      context_rule_id,
    } = req.body;

    if (!name || !template) {
      return sendResponse(
        res,
        errors.validation("Name and template are required"),
      );
    }

    // Extract variables from template if not provided
    let extractedVariables = variables || [];
    if (!extractedVariables || extractedVariables.length === 0) {
      const regex = /\{\{\s*([\w.]+)\s*\}\}/g;
      const foundVariables = new Set();
      let match;

      while ((match = regex.exec(template)) !== null) {
        foundVariables.add(match[1]);
      }

      extractedVariables = Array.from(foundVariables);
    }

    const formatId = uuidv4();
    const data = {
      id: formatId,
      name,
      description: description || "",
      format_type: format_type || "markdown",
      template,
      variables: JSON.stringify(extractedVariables),
      is_active: is_active !== undefined ? is_active : true,
      branding_enabled:
        branding_enabled !== undefined ? branding_enabled : false,
      brand_name: brand_name || null,
      brand_color: brand_color || null,
      brand_logo: brand_logo || null,
      structured_data: structured_data !== undefined ? structured_data : false,
      data_schema: data_schema ? JSON.stringify(data_schema) : null,
      context_rule_id: context_rule_id || null,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await dbHelpers.insert("response_formats", data);

    // Fetch the created response format
    const result = await dbHelpers.findById("response_formats", formatId);
    const processedFormat = dbHelpers.processJsonFields(result, jsonFields);

    return sendResponse(res, formatSuccess(processedFormat, { status: 201 }));
  } catch (error) {
    logger.error("Error creating response format:", error);
    return sendResponse(
      res,
      errors.internal("Failed to create response format"),
    );
  }
});

/**
 * @route PUT /api/response-formats/:id
 * @desc Update a response format
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      format_type,
      template,
      variables,
      is_active,
      branding_enabled,
      brand_name,
      brand_color,
      brand_logo,
      structured_data,
      data_schema,
      context_rule_id,
    } = req.body;

    // Check if response format exists and belongs to user
    const results = await dbHelpers.findByCondition("response_formats", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Response format not found or you don't have permission to update it",
        ),
      );
    }

    // Extract variables from template if template is provided but variables are not
    let extractedVariables = variables;
    if (template && !extractedVariables) {
      const regex = /\{\{\s*([\w.]+)\s*\}\}/g;
      const foundVariables = new Set();
      let match;

      while ((match = regex.exec(template)) !== null) {
        foundVariables.add(match[1]);
      }

      extractedVariables = Array.from(foundVariables);
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (format_type !== undefined) updateData.format_type = format_type;
    if (template !== undefined) updateData.template = template;
    if (extractedVariables !== undefined)
      updateData.variables = JSON.stringify(extractedVariables);
    if (is_active !== undefined) updateData.is_active = is_active;
    if (branding_enabled !== undefined)
      updateData.branding_enabled = branding_enabled;
    if (brand_name !== undefined) updateData.brand_name = brand_name;
    if (brand_color !== undefined) updateData.brand_color = brand_color;
    if (brand_logo !== undefined) updateData.brand_logo = brand_logo;
    if (structured_data !== undefined)
      updateData.structured_data = structured_data;
    if (data_schema !== undefined)
      updateData.data_schema = JSON.stringify(data_schema);
    if (context_rule_id !== undefined)
      updateData.context_rule_id = context_rule_id;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update("response_formats", updateData, {
      id: req.params.id,
    });

    // Fetch the updated response format
    const updatedFormat = await dbHelpers.findById(
      "response_formats",
      req.params.id,
    );
    const processedFormat = dbHelpers.processJsonFields(
      updatedFormat,
      jsonFields,
    );

    return sendResponse(res, formatSuccess(processedFormat));
  } catch (error) {
    logger.error(`Error updating response format ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to update response format"),
    );
  }
});

/**
 * @route DELETE /api/response-formats/:id
 * @desc Delete a response format
 */
router.delete("/:id", async (req, res) => {
  try {
    // Check if response format exists and belongs to user
    const results = await dbHelpers.findByCondition("response_formats", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Response format not found or you don't have permission to delete it",
        ),
      );
    }

    // Check if the response format is in use by any widget configurations
    const widgetCheck = await dbHelpers.executeQuery(
      `SELECT COUNT(*) as count FROM widget_configs WHERE response_format_id = ?`,
      [req.params.id],
    );

    if (widgetCheck[0].count > 0) {
      return sendResponse(
        res,
        errors.badRequest(
          "This response format is currently in use by one or more widget configurations",
          { code: "ERR_FORMAT_IN_USE" },
        ),
      );
    }

    // Delete the response format
    await dbHelpers.remove("response_formats", { id: req.params.id });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(`Error deleting response format ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to delete response format"),
    );
  }
});

/**
 * @route POST /api/response-formats/:id/apply
 * @desc Apply a response format with variables
 */
router.post("/:id/apply", async (req, res) => {
  try {
    const { variables } = req.body;

    if (!variables) {
      return sendResponse(res, errors.validation("Variables are required"));
    }

    // Get the response format
    const results = await dbHelpers.findByCondition("response_formats", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(res, errors.notFound("Response format not found"));
    }

    const format = dbHelpers.processJsonFields(results[0], jsonFields);

    // Apply variables to template
    let result = format.template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(regex, value);
    }

    return sendResponse(
      res,
      formatSuccess({
        original: format.template,
        applied: result,
        format_type: format.format_type,
      }),
    );
  } catch (error) {
    logger.error(`Error applying response format ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to apply response format"),
    );
  }
});

export default router;
