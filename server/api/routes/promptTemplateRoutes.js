/**
 * Prompt Template Routes
 *
 * Handles all API endpoints related to prompt template management
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

// JSON fields that need to be parsed in prompt templates
const jsonFields = ["variables", "examples", "metadata"];

/**
 * @route GET /api/prompt-templates
 * @desc Get all prompt templates for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition(
      "prompt_templates",
      { user_id: req.user.id },
      { orderBy: "created_at DESC" },
    );
    const processedResults = dbHelpers.processJsonFields(results, jsonFields);

    return sendResponse(res, formatSuccess(processedResults));
  } catch (error) {
    logger.error("Error fetching prompt templates:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch prompt templates"),
    );
  }
});

/**
 * @route GET /api/prompt-templates/:id
 * @desc Get a specific prompt template by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition("prompt_templates", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(res, errors.notFound("Prompt template not found"));
    }

    const template = dbHelpers.processJsonFields(results[0], jsonFields);
    return sendResponse(res, formatSuccess(template));
  } catch (error) {
    logger.error(`Error fetching prompt template ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch prompt template"),
    );
  }
});

/**
 * @route POST /api/prompt-templates
 * @desc Create a new prompt template
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      template,
      variables,
      examples,
      category,
      metadata,
      is_active,
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

    const templateId = uuidv4();
    const data = {
      id: templateId,
      name,
      description: description || "",
      template,
      variables: JSON.stringify(extractedVariables),
      examples: examples ? JSON.stringify(examples) : null,
      category: category || "general",
      metadata: metadata ? JSON.stringify(metadata) : null,
      is_active: is_active !== undefined ? is_active : true,
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await dbHelpers.insert("prompt_templates", data);

    // Fetch the created prompt template
    const result = await dbHelpers.findById("prompt_templates", templateId);
    const processedTemplate = dbHelpers.processJsonFields(result, jsonFields);

    return sendResponse(res, formatSuccess(processedTemplate, { status: 201 }));
  } catch (error) {
    logger.error("Error creating prompt template:", error);
    return sendResponse(
      res,
      errors.internal("Failed to create prompt template"),
    );
  }
});

/**
 * @route PUT /api/prompt-templates/:id
 * @desc Update a prompt template
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      template,
      variables,
      examples,
      category,
      metadata,
      is_active,
    } = req.body;

    // Check if prompt template exists and belongs to user
    const results = await dbHelpers.findByCondition("prompt_templates", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Prompt template not found or you don't have permission to update it",
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
    if (template !== undefined) updateData.template = template;
    if (extractedVariables !== undefined)
      updateData.variables = JSON.stringify(extractedVariables);
    if (examples !== undefined) updateData.examples = JSON.stringify(examples);
    if (category !== undefined) updateData.category = category;
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);
    if (is_active !== undefined) updateData.is_active = is_active;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update("prompt_templates", updateData, {
      id: req.params.id,
    });

    // Fetch the updated prompt template
    const updatedTemplate = await dbHelpers.findById(
      "prompt_templates",
      req.params.id,
    );
    const processedTemplate = dbHelpers.processJsonFields(
      updatedTemplate,
      jsonFields,
    );

    return sendResponse(res, formatSuccess(processedTemplate));
  } catch (error) {
    logger.error(`Error updating prompt template ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to update prompt template"),
    );
  }
});

/**
 * @route DELETE /api/prompt-templates/:id
 * @desc Delete a prompt template
 */
router.delete("/:id", async (req, res) => {
  try {
    // Check if prompt template exists and belongs to user
    const results = await dbHelpers.findByCondition("prompt_templates", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Prompt template not found or you don't have permission to delete it",
        ),
      );
    }

    // Check if the prompt template is in use by any context rules
    const usageCheck = await dbHelpers.executeQuery(
      `SELECT COUNT(*) as count FROM context_rules WHERE prompt_template_id = ?`,
      [req.params.id],
    );

    if (usageCheck[0].count > 0) {
      return sendResponse(
        res,
        errors.badRequest(
          "This prompt template is currently in use by one or more context rules",
          { code: "ERR_TEMPLATE_IN_USE" },
        ),
      );
    }

    // Delete the prompt template
    await dbHelpers.remove("prompt_templates", { id: req.params.id });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(`Error deleting prompt template ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to delete prompt template"),
    );
  }
});

/**
 * @route POST /api/prompt-templates/:id/apply
 * @desc Apply a prompt template with variables
 */
router.post("/:id/apply", async (req, res) => {
  try {
    const { variables } = req.body;

    if (!variables) {
      return sendResponse(res, errors.validation("Variables are required"));
    }

    // Get the template
    const results = await dbHelpers.findByCondition("prompt_templates", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(res, errors.notFound("Prompt template not found"));
    }

    const template = dbHelpers.processJsonFields(results[0], jsonFields);

    // Apply variables to template
    let result = template.template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      result = result.replace(regex, value);
    }

    return sendResponse(
      res,
      formatSuccess({
        original: template.template,
        applied: result,
      }),
    );
  } catch (error) {
    logger.error(`Error applying prompt template ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to apply prompt template"),
    );
  }
});

export default router;
