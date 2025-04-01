/**
 * API Routes Index
 *
 * This file exports all API route modules and configures the API router.
 */

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
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

// Health check endpoint (no auth required)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// Public routes (no auth required)
router.use("/auth", authRoutes);

// Protected routes (auth required)
router.use("/chat", authenticateJWT, chatRoutes);
router.use("/context-rules", authenticateJWT, contextRuleRoutes);
router.use("/knowledge-base", authenticateJWT, knowledgeBaseRoutes);
router.use("/users", authenticateJWT, userRoutes);
router.use("/widget-configs", authenticateJWT, widgetRoutes);
router.use("/ai", authenticateJWT, aiRoutes);

// 404 handler for API routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ERR_NOT_FOUND",
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
