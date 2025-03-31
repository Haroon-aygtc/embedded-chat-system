/**
 * Knowledge Base Routes
 *
 * Handles all API endpoints related to knowledge base management
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getMySQLClient } from "../../services/mysqlClient.js";
import logger from "../../utils/logger.js";

const router = express.Router();

/**
 * @route GET /api/knowledge-base
 * @desc Get all knowledge bases for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE user_id = ? ORDER BY created_at DESC`,
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
    logger.error("Error fetching knowledge bases:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch knowledge bases",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/knowledge-base/:id
 * @desc Get a specific knowledge base by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?`,
      {
        replacements: [req.params.id, req.user.id],
      },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Knowledge base not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error fetching knowledge base ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/knowledge-base
 * @desc Create a new knowledge base
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, source_type, content_type, settings } = req.body;

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

    const knowledgeBaseId = uuidv4();
    const sequelize = await getMySQLClient();

    await sequelize.query(
      `INSERT INTO knowledge_bases (
        id, name, description, user_id, source_type, content_type, 
        settings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          knowledgeBaseId,
          name,
          description || "",
          req.user.id,
          source_type || "manual",
          content_type || "text",
          settings ? JSON.stringify(settings) : null,
          new Date(),
          new Date(),
        ],
      },
    );

    // Fetch the created knowledge base
    const [results] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ?`,
      {
        replacements: [knowledgeBaseId],
      },
    );

    return res.status(201).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error creating knowledge base:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to create knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route PUT /api/knowledge-base/:id
 * @desc Update a knowledge base
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      source_type,
      content_type,
      settings,
      is_active,
    } = req.body;
    const sequelize = await getMySQLClient();

    // Check if knowledge base exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?`,
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
            "Knowledge base not found or you don't have permission to update it",
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

    if (source_type !== undefined) {
      updateFields.push("source_type = ?");
      replacements.push(source_type);
    }

    if (content_type !== undefined) {
      updateFields.push("content_type = ?");
      replacements.push(content_type);
    }

    if (settings !== undefined) {
      updateFields.push("settings = ?");
      replacements.push(JSON.stringify(settings));
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = ?");
      replacements.push(is_active);
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
      `UPDATE knowledge_bases SET ${updateFields.join(", ")} WHERE id = ?`,
      {
        replacements,
      },
    );

    // Fetch the updated knowledge base
    const [results] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ?`,
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
    logger.error(`Error updating knowledge base ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to update knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/knowledge-base/:id
 * @desc Delete a knowledge base
 */
router.delete("/:id", async (req, res) => {
  try {
    const sequelize = await getMySQLClient();

    // Check if knowledge base exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?`,
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
            "Knowledge base not found or you don't have permission to delete it",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete all documents in the knowledge base first
    await sequelize.query(
      `DELETE FROM knowledge_base_documents WHERE knowledge_base_id = ?`,
      {
        replacements: [req.params.id],
      },
    );

    // Delete the knowledge base
    await sequelize.query(`DELETE FROM knowledge_bases WHERE id = ?`, {
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
    logger.error(`Error deleting knowledge base ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to delete knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/knowledge-base/:id/documents
 * @desc Add a document to a knowledge base
 */
router.post("/:id/documents", async (req, res) => {
  try {
    const { title, content, source_url, metadata } = req.body;
    const knowledgeBaseId = req.params.id;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Content is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();

    // Check if knowledge base exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?`,
      {
        replacements: [knowledgeBaseId, req.user.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message:
            "Knowledge base not found or you don't have permission to add documents",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const documentId = uuidv4();

    await sequelize.query(
      `INSERT INTO knowledge_base_documents (
        id, knowledge_base_id, title, content, source_url, 
        metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          documentId,
          knowledgeBaseId,
          title || "",
          content,
          source_url || "",
          metadata ? JSON.stringify(metadata) : null,
          new Date(),
          new Date(),
        ],
      },
    );

    // Fetch the created document
    const [results] = await sequelize.query(
      `SELECT * FROM knowledge_base_documents WHERE id = ?`,
      {
        replacements: [documentId],
      },
    );

    return res.status(201).json({
      success: true,
      data: results[0],
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error(
      `Error adding document to knowledge base ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to add document to knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/knowledge-base/:id/documents
 * @desc Get all documents in a knowledge base
 */
router.get("/:id/documents", async (req, res) => {
  try {
    const knowledgeBaseId = req.params.id;
    const sequelize = await getMySQLClient();

    // Check if knowledge base exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?`,
      {
        replacements: [knowledgeBaseId, req.user.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message:
            "Knowledge base not found or you don't have permission to view documents",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Fetch documents with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [documents] = await sequelize.query(
      `SELECT * FROM knowledge_base_documents 
       WHERE knowledge_base_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      {
        replacements: [knowledgeBaseId, limit, offset],
      },
    );

    // Get total count for pagination
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM knowledge_base_documents WHERE knowledge_base_id = ?`,
      {
        replacements: [knowledgeBaseId],
      },
    );

    const totalCount = countResult[0].count;

    return res.status(200).json({
      success: true,
      data: documents,
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
    logger.error(
      `Error fetching documents from knowledge base ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to fetch documents from knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/knowledge-base/:id/documents/:documentId
 * @desc Delete a document from a knowledge base
 */
router.delete("/:id/documents/:documentId", async (req, res) => {
  try {
    const { id: knowledgeBaseId, documentId } = req.params;
    const sequelize = await getMySQLClient();

    // Check if knowledge base exists and belongs to user
    const [checkResults] = await sequelize.query(
      `SELECT * FROM knowledge_bases WHERE id = ? AND user_id = ?`,
      {
        replacements: [knowledgeBaseId, req.user.id],
      },
    );

    if (!checkResults || checkResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message:
            "Knowledge base not found or you don't have permission to delete documents",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if document exists in the knowledge base
    const [documentCheck] = await sequelize.query(
      `SELECT * FROM knowledge_base_documents 
       WHERE id = ? AND knowledge_base_id = ?`,
      {
        replacements: [documentId, knowledgeBaseId],
      },
    );

    if (!documentCheck || documentCheck.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_NOT_FOUND",
          message: "Document not found in the specified knowledge base",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete the document
    await sequelize.query(`DELETE FROM knowledge_base_documents WHERE id = ?`, {
      replacements: [documentId],
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
      `Error deleting document ${req.params.documentId} from knowledge base ${req.params.id}:`,
      error,
    );
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to delete document from knowledge base",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/knowledge-base/query
 * @desc Query knowledge bases for relevant information
 */
router.post("/query", async (req, res) => {
  try {
    const { query, knowledgeBaseIds, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Query is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    const sequelize = await getMySQLClient();
    let queryResults = [];

    // If specific knowledge base IDs are provided, query only those
    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      // Verify user has access to these knowledge bases
      const [accessCheck] = await sequelize.query(
        `SELECT id FROM knowledge_bases 
         WHERE id IN (?) AND (user_id = ? OR is_public = true)`,
        {
          replacements: [knowledgeBaseIds, req.user.id],
        },
      );

      const accessibleIds = accessCheck.map((kb) => kb.id);

      if (accessibleIds.length === 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: "ERR_FORBIDDEN",
            message: "You don't have access to the specified knowledge bases",
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Perform a simple text search (in production, you'd use a vector database or search engine)
      const [results] = await sequelize.query(
        `SELECT d.*, kb.name as knowledge_base_name 
         FROM knowledge_base_documents d
         JOIN knowledge_bases kb ON d.knowledge_base_id = kb.id
         WHERE d.knowledge_base_id IN (?)
         AND (d.content LIKE ? OR d.title LIKE ?)
         ORDER BY 
           CASE 
             WHEN d.title LIKE ? THEN 1
             ELSE 2
           END,
           LENGTH(d.content) ASC
         LIMIT ?`,
        {
          replacements: [
            accessibleIds,
            `%${query}%`,
            `%${query}%`,
            `%${query}%`,
            limit,
          ],
        },
      );

      queryResults = results;
    } else {
      // Query all knowledge bases the user has access to
      const [results] = await sequelize.query(
        `SELECT d.*, kb.name as knowledge_base_name 
         FROM knowledge_base_documents d
         JOIN knowledge_bases kb ON d.knowledge_base_id = kb.id
         WHERE (kb.user_id = ? OR kb.is_public = true)
         AND (d.content LIKE ? OR d.title LIKE ?)
         ORDER BY 
           CASE 
             WHEN d.title LIKE ? THEN 1
             ELSE 2
           END,
           LENGTH(d.content) ASC
         LIMIT ?`,
        {
          replacements: [
            req.user.id,
            `%${query}%`,
            `%${query}%`,
            `%${query}%`,
            limit,
          ],
        },
      );

      queryResults = results;
    }

    // Format the results
    const formattedResults = queryResults.map((doc) => ({
      id: doc.id,
      knowledgeBaseId: doc.knowledge_base_id,
      knowledgeBaseName: doc.knowledge_base_name,
      title: doc.title,
      content: doc.content,
      sourceUrl: doc.source_url,
      relevanceScore: 1.0, // In a real implementation, this would be a similarity score
      createdAt: doc.created_at,
    }));

    // Log the query for analytics
    await sequelize.query(
      `INSERT INTO knowledge_base_query_logs (
        id, user_id, query, results_count, knowledge_base_ids, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          uuidv4(),
          req.user.id,
          query,
          formattedResults.length,
          knowledgeBaseIds ? JSON.stringify(knowledgeBaseIds) : null,
          new Date(),
        ],
      },
    );

    return res.status(200).json({
      success: true,
      data: formattedResults,
      meta: {
        timestamp: new Date().toISOString(),
        query,
        resultsCount: formattedResults.length,
      },
    });
  } catch (error) {
    logger.error("Error querying knowledge bases:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_INTERNAL_SERVER",
        message: "Failed to query knowledge bases",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
