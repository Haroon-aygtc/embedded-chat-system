/**
 * Context Rule Routes
 *
 * Handles all API endpoints related to context rules management
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import dbHelpers from "../../utils/dbHelpers.js";
import { formatSuccess, formatError, sendResponse, errors } from "../../utils/responseFormatter.js";
import logger from "../../utils/logger.js";

const router = express.Router();

// JSON fields that need to be parsed in context rules
const jsonFields = ['keywords', 'excluded_topics', 'response_filters', 'knowledge_base_ids'];

/**
 * @route GET /api/context-rules
 * @desc Get all context rules for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition('context_rules', { user_id: req.user.id }, { orderBy: 'created_at DESC' });
    const processedResults = dbHelpers.processJsonFields(results, jsonFields);
    
    return sendResponse(res, formatSuccess(processedResults));
  } catch (error) {
    logger.error("Error fetching context rules:", error);
    return sendResponse(res, errors.internal("Failed to fetch context rules"));
  }
});

/**
 * @route GET /api/context-rules/:id
 * @desc Get a specific context rule by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition('context_rules', { id: req.params.id, user_id: req.user.id });

    if (!results || results.length === 0) {
      return sendResponse(res, errors.notFound("Context rule not found"));
    }

    const rule = dbHelpers.processJsonFields(results[0], jsonFields);
    return sendResponse(res, formatSuccess(rule));
  } catch (error) {
    logger.error(`Error fetching context rule ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to fetch context rule"));
  }
});

/**
 * @route POST /api/context-rules
 * @desc Create a new context rule
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      is_active,
      context_type,
      keywords,
      excluded_topics,
      prompt_template,
      response_filters,
      use_knowledge_bases,
      knowledge_base_ids,
      preferred_model,
    } = req.body;

    if (!name || !context_type) {
      return sendResponse(res, errors.validation("Name and context_type are required"));
    }

    const ruleId = uuidv4();
    const data = {
      id: ruleId,
      name,
      description: description || "",
      is_active: is_active !== undefined ? is_active : true,
      context_type,
      keywords: keywords ? JSON.stringify(keywords) : null,
      excluded_topics: excluded_topics ? JSON.stringify(excluded_topics) : null,
      prompt_template: prompt_template || "",
      response_filters: response_filters ? JSON.stringify(response_filters) : null,
      use_knowledge_bases: use_knowledge_bases !== undefined ? use_knowledge_bases : false,
      knowledge_base_ids: knowledge_base_ids ? JSON.stringify(knowledge_base_ids) : null,
      preferred_model: preferred_model || null,
      version: 1, // Initial version
      user_id: req.user.id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await dbHelpers.insert('context_rules', data);

    // Fetch the created context rule
    const result = await dbHelpers.findById('context_rules', ruleId);
    const processedRule = dbHelpers.processJsonFields(result, jsonFields);

    return sendResponse(res, formatSuccess(processedRule, { status: 201 }));
  } catch (error) {
    logger.error("Error creating context rule:", error);
    return sendResponse(res, errors.internal("Failed to create context rule"));
  }
});

/**
 * @route PUT /api/context-rules/:id
 * @desc Update a context rule
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      is_active,
      context_type,
      keywords,
      excluded_topics,
      prompt_template,
      response_filters,
      use_knowledge_bases,
      knowledge_base_ids,
      preferred_model,
    } = req.body;

    // Check if context rule exists and belongs to user
    const rule = await dbHelpers.findByCondition('context_rules', { id: req.params.id, user_id: req.user.id });

    if (!rule || rule.length === 0) {
      return sendResponse(res, errors.notFound("Context rule not found or you don't have permission to update it"));
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (context_type !== undefined) updateData.context_type = context_type;
    if (keywords !== undefined) updateData.keywords = JSON.stringify(keywords);
    if (excluded_topics !== undefined) updateData.excluded_topics = JSON.stringify(excluded_topics);
    if (prompt_template !== undefined) updateData.prompt_template = prompt_template;
    if (response_filters !== undefined) updateData.response_filters = JSON.stringify(response_filters);
    if (use_knowledge_bases !== undefined) updateData.use_knowledge_bases = use_knowledge_bases;
    if (knowledge_base_ids !== undefined) updateData.knowledge_base_ids = JSON.stringify(knowledge_base_ids);
    if (preferred_model !== undefined) updateData.preferred_model = preferred_model;

    // Increment version and update timestamp
    updateData.version = rule[0].version + 1;
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 2) { // Only version and updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update('context_rules', updateData, { id: req.params.id });

    // Fetch the updated context rule
    const updatedRule = await dbHelpers.findById('context_rules', req.params.id);
    const processedRule = dbHelpers.processJsonFields(updatedRule, jsonFields);

    return sendResponse(res, formatSuccess(processedRule));
  } catch (error) {
    logger.error(`Error updating context rule ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to update context rule"));
  }
});

/**
 * @route DELETE /api/context-rules/:id
 * @desc Delete a context rule
 */
router.delete("/:id", async (req, res) => {
  try {
    // Check if context rule exists and belongs to user
    const rule = await dbHelpers.findByCondition('context_rules', { id: req.params.id, user_id: req.user.id });

    if (!rule || rule.length === 0) {
      return sendResponse(res, errors.notFound("Context rule not found or you don't have permission to delete it"));
    }

    // Check if the context rule is used by any widget configurations
    const widgetCheck = await dbHelpers.executeQuery(
      `SELECT COUNT(*) as count FROM widget_configs WHERE context_rule_id = ?`,
      [req.params.id]
    );

    if (widgetCheck[0].count > 0) {
      return sendResponse(res, errors.badRequest("This context rule is currently in use by one or more widget configurations", { code: "ERR_RULE_IN_USE" }));
    }

    // Delete the context rule
    await dbHelpers.remove('context_rules', { id: req.params.id });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(`Error deleting context rule ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to delete context rule"));
  }
});

/**
 * @route POST /api/context-rules/test
 * @desc Test a context rule against a sample query
 */
router.post("/test", async (req, res) => {
  try {
    const { rule_id, query } = req.body;

    if (!rule_id || !