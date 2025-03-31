/**
 * AI Configuration Routes
 *
 * Handles API endpoints for AI model configuration
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";
import { requireAdmin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Require admin for all routes
router.use(requireAdmin);

/**
 * @route GET /api/ai-config
 * @desc Get all AI configurations
 */
router.get("/", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM ai_configurations ORDER BY created_at DESC`,
    );

    // Process settings if it exists
    const processedResults = results.map((config) => {
      if (config.settings && typeof config.settings === "string") {
        try {
          config.settings = JSON.parse(config.settings);
        } catch (e) {
          config.settings = {};
        }
      }
      return config;
    });

    return res.status(200).json({
      success: true,
      data: processedResults,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching AI configurations:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch AI configurations",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/ai-config/active
 * @desc Get the active AI configuration
 */
router.get("/active", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE is_active = true ORDER BY created_at DESC LIMIT 1`,
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "No active AI configuration found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Process settings if it exists
    const config = results[0];
    if (config.settings && typeof config.settings === "string") {
      try {
        config.settings = JSON.parse(config.settings);
      } catch (e) {
        config.settings = {};
      }
    }

    return res.status(200).json({
      success: true,
      data: config,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching active AI configuration:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch active AI configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/ai-config/:id
 * @desc Get a specific AI configuration by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "AI configuration not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Process settings if it exists
    const config = results[0];
    if (config.settings && typeof config.settings === "string") {
      try {
        config.settings = JSON.parse(config.settings);
      } catch (e) {
        config.settings = {};
      }
    }

    return res.status(200).json({
      success: true,
      data: config,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error fetching AI configuration ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch AI configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/ai-config
 * @desc Create a new AI configuration
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      default_model,
      openai_api_key,
      gemini_api_key,
      huggingface_api_key,
      is_active,
      settings,
    } = req.body;

    if (!name || !default_model) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Name and default model are required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const configId = uuidv4();
    const sequelize = await getMySQLClient();

    // If this config is active, deactivate all others
    if (is_active) {
      await sequelize.query(`UPDATE ai_configurations SET is_active = false`);
    }

    await sequelize.query(
      `INSERT INTO ai_configurations (
        id, name, description, default_model, openai_api_key, 
        gemini_api_key, huggingface_api_key, is_active, settings, 
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          configId,
          name,
          description || "",
          default_model,
          openai_api_key || null,
          gemini_api_key || null,
          huggingface_api_key || null,
          is_active !== undefined ? is_active : true,
          settings ? JSON.stringify(settings) : null,
          new Date(),
          new Date(),
          req.user.id,
        ],
      },
    );

    // Fetch the created configuration
    const [results] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE id = ?`,
      {
        replacements: [configId],
      },
    );

    // Process settings if it exists
    const config = results[0];
    if (config.settings && typeof config.settings === "string") {
      try {
        config.settings = JSON.parse(config.settings);
      } catch (e) {
        config.settings = {};
      }
    }

    return res.status(201).json({
      success: true,
      data: config,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error creating AI configuration:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to create AI configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route PUT /api/ai-config/:id
 * @desc Update an AI configuration
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      default_model,
      openai_api_key,
      gemini_api_key,
      huggingface_api_key,
      is_active,
      settings,
    } = req.body;

    const sequelize = await getMySQLClient();

    // Check if configuration exists
    const [checkResults] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "AI configuration not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // If this config is being activated, deactivate all others
    if (is_active) {
      await sequelize.query(`UPDATE ai_configurations SET is_active = false`);
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

    if (default_model !== undefined) {
      updateFields.push("default_model = ?");
      replacements.push(default_model);
    }

    if (openai_api_key !== undefined) {
      updateFields.push("openai_api_key = ?");
      replacements.push(openai_api_key);
    }

    if (gemini_api_key !== undefined) {
      updateFields.push("gemini_api_key = ?");
      replacements.push(gemini_api_key);
    }

    if (huggingface_api_key !== undefined) {
      updateFields.push("huggingface_api_key = ?");
      replacements.push(huggingface_api_key);
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      replacements.push(is_active);
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
      `UPDATE ai_configurations SET ${updateFields.join(", ")} WHERE id = ?`,
      {
        replacements,
      },
    );

    // Fetch the updated configuration
    const [results] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    // Process settings if it exists
    const config = results[0];
    if (config.settings && typeof config.settings === "string") {
      try {
        config.settings = JSON.parse(config.settings);
      } catch (e) {
        config.settings = {};
      }
    }

    return res.status(200).json({
      success: true,
      data: config,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error updating AI configuration ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to update AI configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/ai-config/:id
 * @desc Delete an AI configuration
 */
router.delete("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Check if configuration exists
    const [checkResults] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "AI configuration not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if this is the active configuration
    if (checkResults[0].is_active) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_ACTIVE_CONFIG",
          message:
            "Cannot delete the active configuration. Please activate another configuration first.",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete the configuration
    await sequelize.query(`DELETE FROM ai_configurations WHERE id = ?`, {
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
    logger.error(`Error deleting AI configuration ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to delete AI configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/ai-config/:id/test
 * @desc Test an AI configuration
 */
router.post("/:id/test", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Prompt is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Get the configuration
    const [configs] = await sequelize.query(
      `SELECT * FROM ai_configurations WHERE id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    if (!configs || configs.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "AI configuration not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const config = configs[0];

    // Test the configuration with the prompt
    // This is a simplified implementation
    let response;
    switch (config.default_model) {
      case "gemini":
        // Call Gemini API
        response = "This is a test response from Gemini AI.";
        break;
      case "huggingface":
        // Call HuggingFace API
        response = "This is a test response from HuggingFace.";
        break;
      case "openai":
      default:
        // Call OpenAI API
        response = "This is a test response from OpenAI.";
        break;
    }

    return res.status(200).json({
      success: true,
      data: {
        model: config.default_model,
        prompt,
        response,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error testing AI configuration ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to test AI configuration",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
