import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { HfInference } from "@huggingface/inference";
import { env } from "@/config/env";

// Types
export interface ScrapeOptions {
  url: string;
  includeHeader: boolean;
  includeFooter: boolean;
  scrapeFullPage: boolean;
  scrapeImages: boolean;
  scrapeVideos: boolean;
  scrapeText: boolean;
  handleDynamicContent: boolean;
  maxPages?: number;
  waitTime?: number;
  selector?: string;
  loginRequired?: boolean;
  loginCredentials?: {
    username: string;
    password: string;
    usernameSelector: string;
    passwordSelector: string;
    submitSelector: string;
  };
  pagination?: {
    enabled: boolean;
    nextButtonSelector: string;
    maxPages: number;
  };
  aiOptions?: {
    performSentimentAnalysis: boolean;
    performNER: boolean;
    generateSummary: boolean;
    extractKeywords: boolean;
    categorizeContent: boolean;
  };
  exportOptions?: {
    format: "json" | "csv" | "xml" | "excel";
    saveToPublic: boolean;
    overwriteExisting: boolean;
  };
}

export interface ScrapeResult {
  id: string;
  url: string;
  timestamp: string;
  status: "in-progress" | "completed" | "failed";
  progress: number;
  error?: string;
  data: {
    text: string[];
    images: string[];
    videos: string[];
    tables: any[];
    lists: any[];
  };
  aiAnalysis?: {
    sentiment?: {
      overall: string;
      score: number;
    };
    entities?: {
      name: string;
      type: string;
      count: number;
    }[];
    summary?: string;
    keywords?: string[];
    categories?: string[];
  };
  metadata: {
    pageTitle: string;
    pageDescription: string;
    pageKeywords: string[];
    totalElements: number;
  };
  exportPath?: string;
}

class ScrappingService {
  private activeJobs: Map<string, ScrapeResult> = new Map();
  private hfInference: HfInference | null = null;

  constructor() {
    this.initializeHuggingFace();
  }

  private async initializeHuggingFace() {
    try {
      const apiKey = env.HUGGINGFACE_API_KEY;
      if (apiKey) {
        this.hfInference = new HfInference(apiKey);
      } else {
        logger.warn(
          "Hugging Face API key not found. AI features will be limited.",
        );
      }
    } catch (error) {
      logger.error("Failed to initialize Hugging Face client:", error);
    }
  }

  /**
   * Start a new scraping job
   */
  async startScraping(options: ScrapeOptions): Promise<string> {
    const jobId = uuidv4();
    const result: ScrapeResult = {
      id: jobId,
      url: options.url,
      timestamp: new Date().toISOString(),
      status: "in-progress",
      progress: 0,
      data: {
        text: [],
        images: [],
        videos: [],
        tables: [],
        lists: [],
      },
      metadata: {
        pageTitle: "",
        pageDescription: "",
        pageKeywords: [],
        totalElements: 0,
      },
    };

    this.activeJobs.set(jobId, result);

    // Start the scraping process in the background
    this.processScraping(jobId, options).catch((error) => {
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = "failed";
        job.error = error.message;
        this.activeJobs.set(jobId, job);
      }
      logger.error(`Scraping job ${jobId} failed:`, error);
    });

    return jobId;
  }

  /**
   * Get the status and results of a scraping job
   */
  getJobStatus(jobId: string): ScrapeResult | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all scraping jobs
   */
  getAllJobs(): ScrapeResult[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Process the scraping job
   */
  private async processScraping(
    jobId: string,
    options: ScrapeOptions,
  ): Promise<void> {
    try {
      let job = this.activeJobs.get(jobId);
      if (!job) throw new Error("Job not found");

      // Update progress
      job.progress = 10;
      this.activeJobs.set(jobId, job);

      let content: string;

      // Use Axios for static content
      const response = await axios.get(options.url);
      content = response.data;

      // Update progress
      job = this.activeJobs.get(jobId)!;
      job.progress = 30;
      this.activeJobs.set(jobId, job);

      // Parse the HTML content
      const $ = cheerio.load(content);

      // Extract metadata
      job.metadata.pageTitle = $("title").text().trim();
      job.metadata.pageDescription =
        $('meta[name="description"]').attr("content") || "";
      job.metadata.pageKeywords =
        $('meta[name="keywords"]')
          .attr("content")
          ?.split(",")
          .map((k) => k.trim()) || [];

      // Extract content based on options
      if (!options.includeHeader) {
        $("header").remove();
      }

      if (!options.includeFooter) {
        $("footer").remove();
      }

      // Extract specific content if selector is provided
      let mainContent = options.selector ? $(options.selector) : $("body");

      // Extract text content
      if (options.scrapeText) {
        job.data.text = this.extractTextContent(mainContent);
      }

      // Extract images
      if (options.scrapeImages) {
        job.data.images = this.extractImages(mainContent);
      }

      // Extract videos
      if (options.scrapeVideos) {
        job.data.videos = this.extractVideos(mainContent);
      }

      // Extract tables
      job.data.tables = this.extractTables(mainContent);

      // Extract lists
      job.data.lists = this.extractLists(mainContent);

      // Update progress
      job.progress = 60;
      job.metadata.totalElements =
        job.data.text.length +
        job.data.images.length +
        job.data.videos.length +
        job.data.tables.length +
        job.data.lists.length;
      this.activeJobs.set(jobId, job);

      // Perform AI analysis if requested
      if (options.aiOptions && this.hfInference) {
        await this.performAIAnalysis(job, options.aiOptions);
      }

      // Export the data if requested
      if (options.exportOptions) {
        await this.exportData(job, options.exportOptions);
      }

      // Mark job as completed
      job.status = "completed";
      job.progress = 100;
      this.activeJobs.set(jobId, job);
    } catch (error: any) {
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = "failed";
        job.error = error.message;
        this.activeJobs.set(jobId, job);
      }
      throw error;
    }
  }

  /**
   * Extract text content from the page
   */
  private extractTextContent(
    content: cheerio.Cheerio<cheerio.Element>,
  ): string[] {
    const textElements: string[] = [];

    // Extract headings
    content.find("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const text = cheerio(el).text().trim();
      if (text) textElements.push(text);
    });

    // Extract paragraphs
    content.find("p").each((_, el) => {
      const text = cheerio(el).text().trim();
      if (text) textElements.push(text);
    });

    // Extract other text elements
    content.find("div, span, article, section").each((_, el) => {
      // Only get direct text nodes to avoid duplication
      const $el = cheerio(el);
      if ($el.children().length === 0) {
        const text = $el.text().trim();
        if (text) textElements.push(text);
      }
    });

    return textElements.filter((text) => text.length > 0);
  }

  /**
   * Extract images from the page
   */
  private extractImages(content: cheerio.Cheerio<cheerio.Element>): string[] {
    const images: string[] = [];

    content.find("img").each((_, el) => {
      const src = cheerio(el).attr("src");
      if (src && !src.startsWith("data:")) {
        images.push(src);
      }
    });

    return images;
  }

  /**
   * Extract videos from the page
   */
  private extractVideos(content: cheerio.Cheerio<cheerio.Element>): string[] {
    const videos: string[] = [];

    // Extract video elements
    content.find("video").each((_, el) => {
      const src = cheerio(el).attr("src");
      if (src) videos.push(src);
    });

    // Extract video sources
    content.find("video source").each((_, el) => {
      const src = cheerio(el).attr("src");
      if (src) videos.push(src);
    });

    // Extract iframes (YouTube, Vimeo, etc.)
    content.find("iframe").each((_, el) => {
      const src = cheerio(el).attr("src");
      if (src && (src.includes("youtube") || src.includes("vimeo"))) {
        videos.push(src);
      }
    });

    return videos;
  }

  /**
   * Extract tables from the page
   */
  private extractTables(content: cheerio.Cheerio<cheerio.Element>): any[] {
    const tables: any[] = [];

    content.find("table").each((tableIndex, tableEl) => {
      const $table = cheerio(tableEl);
      const tableData: any = {
        id: `table-${tableIndex}`,
        headers: [],
        rows: [],
      };

      // Extract table headers
      $table.find("thead th, thead td").each((_, headerEl) => {
        tableData.headers.push(cheerio(headerEl).text().trim());
      });

      // If no headers found in thead, try the first row
      if (tableData.headers.length === 0) {
        $table
          .find("tr:first-child th, tr:first-child td")
          .each((_, headerEl) => {
            tableData.headers.push(cheerio(headerEl).text().trim());
          });
      }

      // Extract table rows
      $table.find("tbody tr, tr").each((rowIndex, rowEl) => {
        // Skip the first row if it was used for headers
        if (
          rowIndex === 0 &&
          tableData.headers.length > 0 &&
          $table.find("thead").length === 0
        ) {
          return;
        }

        const rowData: string[] = [];
        cheerio(rowEl)
          .find("td, th")
          .each((_, cellEl) => {
            rowData.push(cheerio(cellEl).text().trim());
          });

        if (rowData.length > 0) {
          tableData.rows.push(rowData);
        }
      });

      if (tableData.headers.length > 0 || tableData.rows.length > 0) {
        tables.push(tableData);
      }
    });

    return tables;
  }

  /**
   * Extract lists from the page
   */
  private extractLists(content: cheerio.Cheerio<cheerio.Element>): any[] {
    const lists: any[] = [];

    content.find("ul, ol").each((listIndex, listEl) => {
      const $list = cheerio(listEl);
      const listData: any = {
        id: `list-${listIndex}`,
        type: $list.is("ol") ? "ordered" : "unordered",
        items: [],
      };

      $list.find("li").each((_, itemEl) => {
        const text = cheerio(itemEl).text().trim();
        if (text) {
          listData.items.push(text);
        }
      });

      if (listData.items.length > 0) {
        lists.push(listData);
      }
    });

    return lists;
  }

  /**
   * Perform AI analysis on the scraped content
   */
  private async performAIAnalysis(
    job: ScrapeResult,
    aiOptions: NonNullable<ScrapeOptions["aiOptions"]>,
  ): Promise<void> {
    if (!this.hfInference) {
      logger.warn("Hugging Face client not initialized. Skipping AI analysis.");
      return;
    }

    job.aiAnalysis = {};

    // Combine all text for analysis
    const fullText = job.data.text.join(" ");
    if (!fullText) return;

    try {
      // Sentiment Analysis
      if (aiOptions.performSentimentAnalysis) {
        const sentimentResult = await this.hfInference.textClassification({
          model: "distilbert-base-uncased-finetuned-sst-2-english",
          inputs: fullText.substring(0, 1000), // Limit text length
        });

        job.aiAnalysis.sentiment = {
          overall: sentimentResult.label,
          score: sentimentResult.score,
        };
      }

      // Named Entity Recognition
      if (aiOptions.performNER) {
        const nerResult = await this.hfInference.tokenClassification({
          model: "dbmdz/bert-large-cased-finetuned-conll03-english",
          inputs: fullText.substring(0, 1000), // Limit text length
        });

        // Group entities by type and count occurrences
        const entityMap = new Map<string, { type: string; count: number }>();

        nerResult.forEach((entity) => {
          const key = entity.word.toLowerCase();
          if (entityMap.has(key)) {
            entityMap.get(key)!.count++;
          } else {
            entityMap.set(key, { type: entity.entity_group, count: 1 });
          }
        });

        job.aiAnalysis.entities = Array.from(entityMap.entries()).map(
          ([name, data]) => ({
            name,
            type: data.type,
            count: data.count,
          }),
        );
      }

      // Text Summarization
      if (aiOptions.generateSummary) {
        const summaryResult = await this.hfInference.summarization({
          model: "facebook/bart-large-cnn",
          inputs: fullText.substring(0, 1000), // Limit text length
          parameters: {
            max_length: 100,
            min_length: 30,
          },
        });

        job.aiAnalysis.summary = summaryResult.summary_text;
      }

      // Keyword Extraction
      if (aiOptions.extractKeywords) {
        // Use a simple frequency-based approach for keywords
        const words = fullText
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 3); // Filter out short words

        const wordFreq = new Map<string, number>();
        words.forEach((word) => {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        });

        // Sort by frequency and take top 10
        job.aiAnalysis.keywords = Array.from(wordFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([word]) => word);
      }

      // Content Categorization
      if (aiOptions.categorizeContent) {
        const categoryResult = await this.hfInference.zeroShotClassification({
          model: "facebook/bart-large-mnli",
          inputs: fullText.substring(0, 1000),
          parameters: {
            candidate_labels: [
              "business",
              "technology",
              "politics",
              "entertainment",
              "health",
              "sports",
              "science",
              "education",
              "travel",
            ],
          },
        });

        // Get top 3 categories
        job.aiAnalysis.categories = categoryResult.labels.slice(0, 3);
      }
    } catch (error) {
      logger.error("Error performing AI analysis:", error);
    }
  }

  /**
   * Export the scraped data in the specified format
   */
  private async exportData(
    job: ScrapeResult,
    exportOptions: NonNullable<ScrapeOptions["exportOptions"]>,
  ): Promise<void> {
    // In browser environment, we'll just set a mock export path
    job.exportPath = `/exports/scrape-${job.id.substring(0, 8)}.${exportOptions.format}`;
  }

  /**
   * Delete a scraping job
   */
  deleteJob(jobId: string): boolean {
    return this.activeJobs.delete(jobId);
  }
}

// Create a singleton instance
const scrappingService = new ScrappingService();

export default scrappingService;
