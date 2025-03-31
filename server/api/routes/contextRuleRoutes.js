/**
 * Context Rule Routes
 *
 * Handles all API endpoints related to context rules management
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";

const router = express.Router();

/**
 * @route GET /api/context-rules
 * @desc Get all context rules for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM context_rules WHERE user_id = ? ORDER BY created_at DESC`,
      {
        replacements: [req.user.id],
      }
    );

    // Process arrays and JSON fields
    const processedResults = results.map(rule => {
      // Process keywords array
      if (rule.keywords && typeof rule.keywords === 'string') {
        try {
          rule.keywords = JSON.parse(rule.keywords);
        } catch (e) {
          rule.keywords = [];
        }
      }

      // Process excluded_topics array
      if (rule.excluded_topics && typeof rule.excluded_topics === 'string') {
        try {
          rule.excluded_topics = JSON.parse(rule.excluded_topics);
        } catch (e) {
          rule.excluded_topics = [];
        }
      }

      // Process response_filters array
      if (rule.response_filters && typeof rule.response_filters === 'string') {
        try {
          rule.response_filters = JSON.parse(rule.response_filters);
        } catch (e) {
          rule.response_filters = [];
        }
      }

      // Process knowledge_base_ids array
      if (rule.knowledge_base_ids && typeof rule.knowledge_base_ids === 'string') {
        try {
          rule.knowledge_base_ids = JSON.parse(rule.knowledge_base_ids);
        } catch (e) {
          rule.knowledge_base_ids = [];
        }
      }

      return rule;
    });

    return res.status(200).json({
      success: true,
      data: processedResults,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching context rules:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch context rules",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/context-rules/:id
 * @desc Get a specific context rule by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM context_rules WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Context rule not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Process arrays and JSON fields
    const rule = results[0];
    
    // Process keywords array
    if (rule.keywords && typeof rule.keywords === 'string') {
      try {
        rule.keywords = JSON.parse(rule.keywords);
      } catch (e) {
        rule.keywords = [];
      }
    }

    // Process excluded_topics array
    if (rule.excluded_topics && typeof rule.excluded_topics === 'string') {
      try {
        rule.excluded_topics = JSON.parse(rule.excluded_topics);
      } catch (e) {
        rule.excluded_topics = [];
      }
    }

    // Process response_filters array
    if (rule.response_filters && typeof rule.response_filters === 'string') {
      try {
        rule.response_filters = JSON.parse(rule.response_filters);
      } catch (e) {
        rule.response_filters = [];
      }
    }

    // Process knowledge_base_ids array
    if (rule.knowledge_base_ids && typeof rule.knowledge_base_ids === 'string') {
      try {
        rule.knowledge_base_ids = JSON.parse(rule.knowledge_base_ids);
      } catch (e) {
        rule.knowledge_base_ids = [];
      }
    }

    return res.status(200).json({
      success: true,
      data: rule,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error fetching context rule ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch context rule",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
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
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Name and context_type are required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const ruleId = uuidv4();
    const sequelize = await getMySQLClient();

    await sequelize.query(
      `INSERT INTO context_rules (
        id, name, description, is_active, context_type, keywords, 
        excluded_topics, prompt_template, response_filters, 
        use_knowledge_bases, knowledge_base_ids, preferred_model, 
        version, user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          ruleId,
          name,
          description || "",
          is_active !== undefined ? is_active : true,
          context_type,
          keywords ? JSON.stringify(keywords) : null,
          excluded_topics ? JSON.stringify(excluded_topics) : null,
          prompt_template || "",
          response_filters ? JSON.stringify(response_filters) : null,
          use_knowledge_bases !== undefined ? use_knowledge_bases : false,
          knowledge_base_ids ? JSON.stringify(knowledge_base_ids) : null,
          preferred_model || null,
          1, // Initial version
          req.user.id,
          new Date(),
          new Date(),
        ],
      }
    );

    // Fetch the created context rule
    const [results] = await sequelize.query(
      `SELECT * FROM context_rules WHERE id = ?`,
      {
        replacements: [ruleId],
      }
    );

    // Process arrays and JSON fields
    const rule = results[0];
    
    // Process keywords array
    if (rule.keywords && typeof rule.keywords === 'string') {
      try {
        rule.keywords = JSON.parse(rule.keywords);
      } catch (e) {
        rule.keywords = [];
      }
    }

    // Process excluded_topics array
    if (rule.excluded_topics && typeof rule.excluded_topics === 'string') {
      try {
        rule.excluded_topics = JSON.parse(rule.excluded_topics);
      } catch (e) {
        rule.excluded_topics = [];
      }
    }

    // Process response_filters array
    if (rule.response_filters && typeof rule.response_filters === 'string') {
      try {
        rule.response_filters = JSON.parse(rule.response_filters);
      } catch (e) {
        rule.response_filters = [];
      }
    }

    // Process knowledge_base_ids array
    if (rule.knowledge_base_ids && typeof rule.knowledge_base_ids === 'string') {
      try {
        rule.knowledge_base_ids = JSON.parse(rule.knowledge_base_ids);
      } catch (e) {
        rule.knowledge_base_ids = [];
      }
    }

    return res.status(201).json({
      success: true,
      data: rule,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error creating context rule:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to create context rule",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
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

    const sequelize = await getMySQLClient();

    // Check if context rule exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM context_rules WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      }
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Context rule not found or you don't have permission to update it",
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

    if (description !== undefined) {
      updateFields.push("description = ?");
      replacements.push(description);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      replacements.push(is_active);
    }

    if (context_type !== undefined) {
      updateFields.push("context_type = ?");
      replacements.push(context_type);
    }

    if (keywords !== undefined) {
      updateFields.push("keywords = ?");
      replacements.push(JSON.stringify(keywords));
    }

    if (excluded_topics !== undefined) {
      updateFields.push("excluded_topics = ?");
      replacements.push(JSON.stringify(excluded_topics));
    }

    if (prompt_template !== undefined) {
      updateFields.push("prompt_template = ?");
      replacements.push(prompt_template);
    }

    if (response_filters !== undefined) {
      updateFields.push("response_filters = ?");
      replacements.push(JSON.stringify(response_filters));
    }

    if (use_knowledge_bases !== undefined) {
      updateFields.push("use_knowledge_bases = ?");
      replacements.push(use_knowledge_bases);
    }

    if (knowledge_base_ids !== undefined) {
      updateFields.push("knowledge_base_ids = ?");
      replacements.push(JSON.stringify(knowledge_base_ids));
    }

    if (preferred_model !== undefined) {
      updateFields.push("preferred_model = ?");
      replacements.push(preferred_model);
    }

    // Increment version
    updateFields.push("version = version + 1");

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
      `UPDATE context_rules SET ${updateFields.join(", ")} WHERE id = ?`,
      {
        replacements,
      }
    );

    // Fetch the updated context rule
    const [results] = await sequelize.query(
      `SELECT * FROM context_rules WHERE id = ?`,
      {
        replacements: [req.params.id],
      }
    );

    // Process arrays and JSON fields
    const rule = results[0];
    
    // Process keywords array
    if (rule.keywords && typeof rule.keywords === 'string') {
      try {
        rule.keywords = JSON.parse(rule.keywords);
      } catch (e) {
        rule.keywords = [];
      }
    }

    // Process excluded_topics array
    if (rule.excluded_topics && typeof rule.excluded_topics === 'string') {
      try {
        rule.excluded_topics = JSON.parse(rule.excluded_topics);
      } catch (e) {
        rule.excluded_topics = [];
      }
    }

    // Process response_filters array
    if (rule.response_filters && typeof rule.response_filters === 'string') {
      try {
        rule.response_filters = JSON.parse(rule.response_filters);
      } catch (e) {
        rule.response_filters = [];
      }
    }

    // Process knowledge_base_ids array
    if (rule.knowledge_base_ids && typeof rule.knowledge_base_ids === 'string') {
      try {
        rule.knowledge_base_ids = JSON.parse(rule.knowledge_base_ids);
      } catch (e) {
        rule.knowledge_base_ids = [];
      }
    }

    return res.status(200).json({
      success: true,
      data: rule,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error updating context rule ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to update context rule",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/context-rules/:id
 * @desc Delete a context rule
 */
router.delete("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Check if context rule exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM context_rules WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      }
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Context rule not found or you don't have permission to delete it",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if the context rule is used by any widget configurations
    const [widgetCheck] = await sequelize.query(
      `SELECT COUNT(*) as count FROM widget_configs WHERE context_rule_id = ?`,
      {
        replacements: [req.params.id],
      }
    );

    if (widgetCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_RULE_IN_USE",
          message: "This context rule is currently in use by one or more widget configurations",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete the context rule
    await sequelize.query(`DELETE FROM context_rules WHERE id = ?`, {
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
    logger.error(`Error deleting context rule ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to delete context rule",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
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