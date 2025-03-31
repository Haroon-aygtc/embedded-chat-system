/**
 * Knowledge Base Routes
 *
 * Handles all API endpoints related to knowledge base management
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

// JSON fields that need to be parsed in knowledge bases
const jsonFields = ["settings", "metadata"];

/**
 * @route GET /api/knowledge-base
 * @desc Get all knowledge bases for the authenticated user
 */
router.get("/", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition(
      "knowledge_bases",
      { user_id: req.user.id },
      { orderBy: "created_at DESC" },
    );
    const processedResults = dbHelpers.processJsonFields(results, jsonFields);

    return sendResponse(res, formatSuccess(processedResults));
  } catch (error) {
    logger.error("Error fetching knowledge bases:", error);
    return sendResponse(
      res,
      errors.internal("Failed to fetch knowledge bases"),
    );
  }
});

/**
 * @route GET /api/knowledge-base/:id
 * @desc Get a specific knowledge base by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const results = await dbHelpers.findByCondition("knowledge_bases", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!results || results.length === 0) {
      return sendResponse(res, errors.notFound("Knowledge base not found"));
    }

    const knowledgeBase = dbHelpers.processJsonFields(results[0], jsonFields);
    return sendResponse(res, formatSuccess(knowledgeBase));
  } catch (error) {
    logger.error(`Error fetching knowledge base ${req.params.id}:`, error);
    return sendResponse(res, errors.internal("Failed to fetch knowledge base"));
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
      return sendResponse(res, errors.validation("Name is required"));
    }

    const knowledgeBaseId = uuidv4();
    const data = {
      id: knowledgeBaseId,
      name,
      description: description || "",
      user_id: req.user.id,
      source_type: source_type || "manual",
      content_type: content_type || "text",
      settings: settings ? JSON.stringify(settings) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await dbHelpers.insert("knowledge_bases", data);

    // Fetch the created knowledge base
    const result = await dbHelpers.findById("knowledge_bases", knowledgeBaseId);
    const processedResult = dbHelpers.processJsonFields(result, jsonFields);

    return sendResponse(res, formatSuccess(processedResult, { status: 201 }));
  } catch (error) {
    logger.error("Error creating knowledge base:", error);
    return sendResponse(
      res,
      errors.internal("Failed to create knowledge base"),
    );
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

    // Check if knowledge base exists and belongs to user
    const knowledgeBase = await dbHelpers.findByCondition("knowledge_bases", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!knowledgeBase || knowledgeBase.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Knowledge base not found or you don't have permission to update it",
        ),
      );
    }

    // Build update data object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (source_type !== undefined) updateData.source_type = source_type;
    if (content_type !== undefined) updateData.content_type = content_type;
    if (settings !== undefined) updateData.settings = JSON.stringify(settings);
    if (is_active !== undefined) updateData.is_active = is_active;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      // Only updated_at
      return sendResponse(res, errors.validation("No fields to update"));
    }

    // Execute the update
    await dbHelpers.update("knowledge_bases", updateData, {
      id: req.params.id,
    });

    // Fetch the updated knowledge base
    const updatedKnowledgeBase = await dbHelpers.findById(
      "knowledge_bases",
      req.params.id,
    );
    const processedResult = dbHelpers.processJsonFields(
      updatedKnowledgeBase,
      jsonFields,
    );

    return sendResponse(res, formatSuccess(processedResult));
  } catch (error) {
    logger.error(`Error updating knowledge base ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to update knowledge base"),
    );
  }
});

/**
 * @route DELETE /api/knowledge-base/:id
 * @desc Delete a knowledge base
 */
router.delete("/:id", async (req, res) => {
  try {
    // Check if knowledge base exists and belongs to user
    const knowledgeBase = await dbHelpers.findByCondition("knowledge_bases", {
      id: req.params.id,
      user_id: req.user.id,
    });

    if (!knowledgeBase || knowledgeBase.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Knowledge base not found or you don't have permission to delete it",
        ),
      );
    }

    // Delete all documents in the knowledge base first
    await dbHelpers.remove("knowledge_base_documents", {
      knowledge_base_id: req.params.id,
    });

    // Delete the knowledge base
    await dbHelpers.remove("knowledge_bases", { id: req.params.id });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(`Error deleting knowledge base ${req.params.id}:`, error);
    return sendResponse(
      res,
      errors.internal("Failed to delete knowledge base"),
    );
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
      return sendResponse(res, errors.validation("Content is required"));
    }

    // Check if knowledge base exists and belongs to user
    const knowledgeBase = await dbHelpers.findByCondition("knowledge_bases", {
      id: knowledgeBaseId,
      user_id: req.user.id,
    });

    if (!knowledgeBase || knowledgeBase.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Knowledge base not found or you don't have permission to add documents",
        ),
      );
    }

    const documentId = uuidv4();
    const data = {
      id: documentId,
      knowledge_base_id: knowledgeBaseId,
      title: title || "",
      content,
      source_url: source_url || "",
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await dbHelpers.insert("knowledge_base_documents", data);

    // Fetch the created document
    const document = await dbHelpers.findById(
      "knowledge_base_documents",
      documentId,
    );
    const processedDocument = dbHelpers.processJsonFields(document, [
      "metadata",
    ]);

    return sendResponse(res, formatSuccess(processedDocument, { status: 201 }));
  } catch (error) {
    logger.error(
      `Error adding document to knowledge base ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to add document to knowledge base"),
    );
  }
});

/**
 * @route GET /api/knowledge-base/:id/documents
 * @desc Get all documents in a knowledge base
 */
router.get("/:id/documents", async (req, res) => {
  try {
    const knowledgeBaseId = req.params.id;

    // Check if knowledge base exists and belongs to user
    const knowledgeBase = await dbHelpers.findByCondition("knowledge_bases", {
      id: knowledgeBaseId,
      user_id: req.user.id,
    });

    if (!knowledgeBase || knowledgeBase.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Knowledge base not found or you don't have permission to view documents",
        ),
      );
    }

    // Fetch documents with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const documents = await dbHelpers.findByCondition(
      "knowledge_base_documents",
      { knowledge_base_id: knowledgeBaseId },
      { orderBy: "created_at DESC", limit, offset },
    );

    // Get total count for pagination
    const countResult = await dbHelpers.executeQuery(
      `SELECT COUNT(*) as count FROM knowledge_base_documents WHERE knowledge_base_id = ?`,
      [knowledgeBaseId],
    );

    const totalCount = countResult[0].count;
    const processedDocuments = dbHelpers.processJsonFields(documents, [
      "metadata",
    ]);

    return sendResponse(
      res,
      formatSuccess(processedDocuments, {
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
    logger.error(
      `Error fetching documents from knowledge base ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to fetch documents from knowledge base"),
    );
  }
});

/**
 * @route DELETE /api/knowledge-base/:id/documents/:documentId
 * @desc Delete a document from a knowledge base
 */
router.delete("/:id/documents/:documentId", async (req, res) => {
  try {
    const { id: knowledgeBaseId, documentId } = req.params;

    // Check if knowledge base exists and belongs to user
    const knowledgeBase = await dbHelpers.findByCondition("knowledge_bases", {
      id: knowledgeBaseId,
      user_id: req.user.id,
    });

    if (!knowledgeBase || knowledgeBase.length === 0) {
      return sendResponse(
        res,
        errors.notFound(
          "Knowledge base not found or you don't have permission to delete documents",
        ),
      );
    }

    // Check if document exists in the knowledge base
    const document = await dbHelpers.findByCondition(
      "knowledge_base_documents",
      { id: documentId, knowledge_base_id: knowledgeBaseId },
    );

    if (!document || document.length === 0) {
      return sendResponse(
        res,
        errors.notFound("Document not found in the specified knowledge base"),
      );
    }

    // Delete the document
    await dbHelpers.remove("knowledge_base_documents", { id: documentId });

    return sendResponse(res, formatSuccess(null));
  } catch (error) {
    logger.error(
      `Error deleting document ${req.params.documentId} from knowledge base ${req.params.id}:`,
      error,
    );
    return sendResponse(
      res,
      errors.internal("Failed to delete document from knowledge base"),
    );
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
      return sendResponse(res, errors.validation("Query is required"));
    }

    let queryResults = [];

    // If specific knowledge base IDs are provided, query only those
    if (knowledgeBaseIds && knowledgeBaseIds.length > 0) {
      // Verify user has access to these knowledge bases
      const accessCheck = await dbHelpers.executeQuery(
        `SELECT id FROM knowledge_bases WHERE id IN (?) AND (user_id = ? OR is_public = true)`,
        [knowledgeBaseIds, req.user.id],
      );

      const accessibleIds = accessCheck.map((kb) => kb.id);

      if (accessibleIds.length === 0) {
        return sendResponse(
          res,
          errors.forbidden(
            "You don't have access to the specified knowledge bases",
          ),
        );
      }

      // Perform a simple text search (in production, you'd use a vector database or search engine)
      queryResults = await dbHelpers.executeQuery(
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
        [accessibleIds, `%${query}%`, `%${query}%`, `%${query}%`, limit],
      );
    } else {
      // Query all knowledge bases the user has access to
      queryResults = await dbHelpers.executeQuery(
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
        [req.user.id, `%${query}%`, `%${query}%`, `%${query}%`, limit],
      );
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
    await dbHelpers.insert("knowledge_base_query_logs", {
      id: uuidv4(),
      user_id: req.user.id,
      query,
      results_count: formattedResults.length,
      knowledge_base_ids: knowledgeBaseIds
        ? JSON.stringify(knowledgeBaseIds)
        : null,
      created_at: new Date(),
    });

    return sendResponse(
      res,
      formatSuccess(formattedResults, {
        meta: {
          query,
          resultsCount: formattedResults.length,
        },
      }),
    );
  } catch (error) {
    logger.error("Error querying knowledge bases:", error);
    return sendResponse(
      res,
      errors.internal("Failed to query knowledge bases"),
    );
  }
});

export default router;
