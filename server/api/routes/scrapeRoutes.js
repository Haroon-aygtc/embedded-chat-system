/**
 * Scrape Routes
 *
 * This file defines the API routes for web scraping functionality.
 */

import express from "express";
import mysqlScrappingService from "../../../src/services/mysqlScrappingService.js";
import { getMySQLClient } from "../../services/mysqlClient.js";

const router = express.Router();

/**
 * @route   POST /api/scrape/start
 * @desc    Start a new scraping job
 * @access  Private
 */
router.post("/start", async (req, res) => {
  try {
    const options = req.body;
    const jobId = await mysqlScrappingService.startScraping(options);
    res.status(200).json({
      success: true,
      data: { jobId },
      message: "Scraping job started successfully",
    });
  } catch (error) {
    console.error("Error starting scraping job:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_SCRAPE_START",
        message: error.message || "Failed to start scraping job",
      },
    });
  }
});

/**
 * @route   GET /api/scrape/jobs
 * @desc    Get all scraping jobs
 * @access  Private
 */
router.get("/jobs", async (req, res) => {
  try {
    const jobs = await mysqlScrappingService.getAllJobs();
    res.status(200).json({
      success: true,
      data: { jobs },
    });
  } catch (error) {
    console.error("Error fetching scraping jobs:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_SCRAPE_JOBS",
        message: error.message || "Failed to fetch scraping jobs",
      },
    });
  }
});

/**
 * @route   GET /api/scrape/jobs/:id
 * @desc    Get a specific scraping job by ID
 * @access  Private
 */
router.get("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const job = await mysqlScrappingService.getJobStatus(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_SCRAPE_JOB_NOT_FOUND",
          message: "Scraping job not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { job },
    });
  } catch (error) {
    console.error(`Error fetching scraping job ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_SCRAPE_JOB",
        message: error.message || "Failed to fetch scraping job",
      },
    });
  }
});

/**
 * @route   DELETE /api/scrape/jobs/:id
 * @desc    Delete a scraping job
 * @access  Private
 */
router.delete("/jobs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const success = await mysqlScrappingService.deleteJob(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_SCRAPE_JOB_NOT_FOUND",
          message: "Scraping job not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Scraping job deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting scraping job ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_SCRAPE_DELETE",
        message: error.message || "Failed to delete scraping job",
      },
    });
  }
});

/**
 * @route   GET /api/scrape/vectors/:jobId
 * @desc    Search vector store for similar content
 * @access  Private
 */
router.get("/vectors/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { query, limit = 5 } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: {
          code: "ERR_MISSING_QUERY",
          message: "Query parameter is required",
        },
      });
    }

    const results = await mysqlScrappingService.searchVectorStore(
      query,
      parseInt(limit),
    );

    res.status(200).json({
      success: true,
      data: { results },
    });
  } catch (error) {
    console.error(`Error searching vector store:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_VECTOR_SEARCH",
        message: error.message || "Failed to search vector store",
      },
    });
  }
});

/**
 * @route   GET /api/scrape/exports/:name
 * @desc    Get exported data
 * @access  Private
 */
router.get("/exports/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const format = name.split(".").pop();

    // Get the export from MySQL database
    const sequelize = await getMySQLClient();
    const [results] = await sequelize.query(
      `SELECT * FROM scrape_exports WHERE name = ? AND format = ?`,
      { replacements: [name.replace(`.${format}`, ""), format] },
    );

    if (!results || results.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_EXPORT_NOT_FOUND",
          message: "Export not found",
        },
      });
    }

    const exportData = results[0];
    // Determine content type based on format
    const contentType = getContentType(format);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename=${name}`);
    res.send(exportData.content);
  } catch (error) {
    console.error(`Error fetching export:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_EXPORT_FETCH",
        message: error.message || "Failed to fetch export",
      },
    });
  }
});

/**
 * @route   GET /api/scrape/datasets/:id
 * @desc    Get dataset by ID
 * @access  Private
 */
router.get("/datasets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dataset = await mysqlScrappingService.getDataset(id);

    if (!dataset) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ERR_DATASET_NOT_FOUND",
          message: "Dataset not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: { dataset },
    });
  } catch (error) {
    console.error(`Error fetching dataset ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: {
        code: "ERR_DATASET_FETCH",
        message: error.message || "Failed to fetch dataset",
      },
    });
  }
});

/**
 * Get content type for export format
 */
function getContentType(format) {
  switch (format) {
    case "json":
      return "application/json";
    case "csv":
      return "text/csv";
    case "xml":
      return "application/xml";
    case "excel":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    default:
      return "text/plain";
  }
}

export default router;
