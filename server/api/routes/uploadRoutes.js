/**
 * Upload Routes
 *
 * Handles file uploads for chat attachments and other purposes
 */

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import logger from "../../utils/logger.js";

const router = express.Router();

// Get current file directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create user-specific directory
    const userDir = req.user ? path.join(uploadsDir, req.user.id) : uploadsDir;
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueId = uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, `${uniqueId}${fileExt}`);
  },
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, PDFs, and documents are allowed.",
      ),
      false,
    );
  }
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * @route POST /api/uploads/chat
 * @desc Upload file for chat attachment
 */
router.post("/chat", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_NO_FILE",
          message: "No file uploaded",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get file information
    const file = req.file;
    const userId = req.user ? req.user.id : "anonymous";
    const sessionId = req.body.sessionId;

    // Generate public URL
    const baseUrl =
      process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/uploads/${userId}/${file.filename}`;

    // Save file metadata to database if needed
    // This would typically include the file URL, original name, session ID, etc.

    return res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error uploading file:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_UPLOAD_FAILED",
        message: error.message || "Failed to upload file",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route POST /api/uploads/knowledge-base
 * @desc Upload file for knowledge base
 */
router.post("/knowledge-base", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_NO_FILE",
          message: "No file uploaded",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Get file information
    const file = req.file;
    const userId = req.user.id;
    const knowledgeBaseId = req.body.knowledgeBaseId;

    if (!knowledgeBaseId) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_VALIDATION",
          message: "Knowledge base ID is required",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Generate public URL
    const baseUrl =
      process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
    const fileUrl = `${baseUrl}/uploads/${userId}/${file.filename}`;

    // Extract text from file (simplified - in production would use proper text extraction)
    let fileContent = "";

    if (file.mimetype === "text/plain") {
      // Read text file
      fileContent = fs.readFileSync(file.path, "utf8");
    } else if (file.mimetype === "application/pdf") {
      // For PDF, we'd use a library like pdf-parse
      // Simplified for this example
      fileContent = `Content extracted from PDF: ${file.originalname}`;
    } else if (file.mimetype.startsWith("image/")) {
      // For images, we'd use OCR like Tesseract
      // Simplified for this example
      fileContent = `Image content: ${file.originalname}`;
    } else {
      // For other document types
      fileContent = `Document content: ${file.originalname}`;
    }

    // Save to knowledge base (simplified)
    // In a real implementation, this would properly parse and store the content

    return res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: file.filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        content: fileContent.substring(0, 100) + "...", // Preview only
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error uploading knowledge base file:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_UPLOAD_FAILED",
        message: error.message || "Failed to upload file",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route DELETE /api/uploads/:filename
 * @desc Delete an uploaded file
 */
router.delete("/:filename", async (req, res) => {
  try {
    const filename = req.params.filename;
    const userId = req.user.id;

    // Validate filename to prevent directory traversal attacks
    if (filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_INVALID_FILENAME",
          message: "Invalid filename",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Check if file exists
    const filePath = path.join(uploadsDir, userId, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_FILE_NOT_FOUND",
          message: "File not found",
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    return res.status(200).json({
      success: true,
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
        message: "File deleted successfully",
      },
    });
  } catch (error) {
    logger.error("Error deleting file:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "ERR_DELETE_FAILED",
        message: "Failed to delete file",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
});

export default router;
