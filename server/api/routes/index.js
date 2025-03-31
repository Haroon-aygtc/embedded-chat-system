/**
 * API Routes Index
 *
 * This file exports all API route modules and configures the API router.
 */

import express from "express";
import authRoutes from "./authRoutes.js";
import chatRoutes from "./chatRoutes.js";
import contextRuleRoutes from "./contextRuleRoutes.js";
import knowledgeBaseRoutes from "./knowledgeBaseRoutes.js";
import userRoutes from "./userRoutes.js";
import widgetRoutes from "./widgetRoutes.js";
import aiRoutes from "./aiRoutes.js";
import promptTemplateRoutes from "./promptTemplateRoutes.js";
import responseFormatRoutes from "./responseFormatRoutes.js";
import scrapeRoutes from "./scrapeRoutes.js";
import {
  authenticateJWT,
  authenticateOptional,
} from "../../middleware/authMiddleware.js";
import { formatSuccess, sendResponse } from "../../utils/responseFormatter.js";

const router = express.Router();

// Health check endpoint (no auth required)
router.get("/health", (req, res) => {
  return sendResponse(
    res,
    formatSuccess({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    }),
  );
});

// Public routes (no auth required)
router.use("/auth", authRoutes);

// Routes with optional authentication
router.use("/chat", authenticateOptional, chatRoutes);

// Protected routes (auth required)
router.use("/users", authenticateJWT, userRoutes);
router.use("/context-rules", authenticateJWT, contextRuleRoutes);
router.use("/knowledge-base", authenticateJWT, knowledgeBaseRoutes);
router.use("/widget-configs", authenticateJWT, widgetRoutes);
router.use("/ai", authenticateJWT, aiRoutes);
router.use("/prompt-templates", authenticateJWT, promptTemplateRoutes);
router.use("/response-formats", authenticateJWT, responseFormatRoutes);
router.use("/scrape", authenticateJWT, scrapeRoutes);

// 404 handler for API routes
router.use((req, res) => {
  return sendResponse(res, {
    status: 404,
    body: {
      success: false,
      error: {
        code: "ERR_NOT_FOUND",
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
  });
});

export default router;
