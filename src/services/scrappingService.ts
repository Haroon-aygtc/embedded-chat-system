import axios from "axios";
import * as cheerio from "cheerio";
import { v4 as uuidv4 } from "uuid";
import logger from "@/utils/logger";
import { HfInference } from "@huggingface/inference";
import { env } from "@/config/env";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for vector storage
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

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
    createVectorEmbeddings: boolean;
    generateDataset: boolean;
    performContentClustering: boolean;
    extractRelationships: boolean;
    generateStructuredData: boolean;
  };
  exportOptions?: {
    format: "json" | "csv" | "xml" | "excel";
    saveToPublic: boolean;
    overwriteExisting: boolean;
    createVectorStore?: boolean;
    datasetName?: string;
  };
  advancedOptions?: {
    followLinks: boolean;
    maxDepth: number;
    allowedDomains: string[];
    excludeUrls: string[];
    requestDelay: number;
    userAgent?: string;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
    proxy?: string;
    timeout?: number;
    retries?: number;
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
    links: string[];
    structuredData?: Record<string, any>;
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
    contentClusters?: {
      name: string;
      items: string[];
    }[];
    relationships?: {
      source: string;
      target: string;
      type: string;
    }[];
    vectorIds?: string[];
    datasetId?: string;
  };
  metadata: {
    pageTitle: string;
    pageDescription: string;
    pageKeywords: string[];
    totalElements: number;
    scrapedPages?: number;
    totalLinks?: number;
    domainInfo?: {
      domain: string;
      ip?: string;
      server?: string;
      lastModified?: string;
    };
  };
  exportPath?: string;
  vectorStoreUrl?: string;
}

interface VectorRecord {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

class ScrappingService {
  private activeJobs: Map<string, ScrapeResult> = new Map();
  private hfInference: HfInference | null = null;
  private visitedUrls: Set<string> = new Set();
  private pendingUrls: string[] = [];
  private currentDepth: number = 0;
  private maxRetries: number = 3;

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
        links: [],
      },
      metadata: {
        pageTitle: "",
        pageDescription: "",
        pageKeywords: [],
        totalElements: 0,
        scrapedPages: 0,
        totalLinks: 0,
        domainInfo: {
          domain: new URL(options.url).hostname,
        },
      },
    };

    this.activeJobs.set(jobId, result);
    this.visitedUrls.clear();
    this.pendingUrls = [];
    this.currentDepth = 0;

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
      job.progress = 5;
      this.activeJobs.set(jobId, job);

      // Add the initial URL to the pending list
      this.pendingUrls.push(options.url);
      this.visitedUrls.add(options.url);

      // Get domain info
      await this.getDomainInfo(options.url, job);

      // Update progress
      job.progress = 10;
      this.activeJobs.set(jobId, job);

      // Process URLs recursively if followLinks is enabled
      if (options.advancedOptions?.followLinks) {
        const maxDepth = options.advancedOptions?.maxDepth || 1;
        while (
          this.pendingUrls.length > 0 &&
          this.currentDepth <= maxDepth &&
          job.status !== "failed"
        ) {
          const url = this.pendingUrls.shift()!;
          await this.scrapePage(url, jobId, options);

          // Update progress based on processed URLs
          const totalUrls = this.visitedUrls.size + this.pendingUrls.length;
          const processedUrls = this.visitedUrls.size;
          const progressPercentage = Math.min(
            90,
            10 + Math.floor((processedUrls / Math.max(totalUrls, 1)) * 80),
          );

          job = this.activeJobs.get(jobId)!;
          job.progress = progressPercentage;
          job.metadata.scrapedPages = processedUrls;
          job.metadata.totalLinks = totalUrls;
          this.activeJobs.set(jobId, job);

          // Increment depth if we've processed all URLs at the current depth
          if (this.pendingUrls.length === 0 && this.currentDepth < maxDepth) {
            this.currentDepth++;
          }
        }
      } else {
        // Just scrape the initial URL
        await this.scrapePage(options.url, jobId, options);
      }

      // Perform AI analysis if requested
      job = this.activeJobs.get(jobId)!;
      job.progress = 90;
      this.activeJobs.set(jobId, job);

      if (options.aiOptions && this.hfInference) {
        await this.performAIAnalysis(job, options.aiOptions);
      }

      // Export the data if requested
      if (options.exportOptions) {
        await this.exportData(job, options.exportOptions);
      }

      // Mark job as completed
      job = this.activeJobs.get(jobId)!;
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
   * Get domain information
   */
  private async getDomainInfo(url: string, job: ScrapeResult): Promise<void> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const domain = new URL(url).hostname;
      job.metadata.domainInfo = {
        domain,
        server: response.headers["server"],
        lastModified: response.headers["last-modified"],
      };
    } catch (error) {
      logger.warn(`Failed to get domain info for ${url}:`, error);
      // Don't fail the whole job for this
    }
  }

  /**
   * Scrape a single page
   */
  private async scrapePage(
    url: string,
    jobId: string,
    options: ScrapeOptions,
    retryCount: number = 0,
  ): Promise<void> {
    let job = this.activeJobs.get(jobId);
    if (!job) throw new Error("Job not found");

    try {
      // Configure request options
      const requestConfig: any = {
        timeout: options.advancedOptions?.timeout || 30000,
        headers: {
          "User-Agent": options.advancedOptions?.userAgent || "Mozilla/5.0",
          ...options.advancedOptions?.headers,
        },
      };

      // Add proxy if specified
      if (options.advancedOptions?.proxy) {
        requestConfig.proxy = options.advancedOptions.proxy;
      }

      // Use Axios for static content
      const response = await axios.get(url, requestConfig);
      const content = response.data;

      // Parse the HTML content
      const $ = cheerio.load(content);

      // Extract metadata
      if (job.metadata.pageTitle === "") {
        // Only set these for the first page
        job.metadata.pageTitle = $("title").text().trim();
        job.metadata.pageDescription =
          $('meta[name="description"]').attr("content") || "";
        job.metadata.pageKeywords =
          $('meta[name="keywords"]')
            .attr("content")
            ?.split(",")
            .map((k) => k.trim()) || [];
      }

      // Extract content based on options
      let mainContent = $("body");

      if (!options.includeHeader) {
        $("header").remove();
      }

      if (!options.includeFooter) {
        $("footer").remove();
      }

      // Extract specific content if selector is provided
      if (options.selector) {
        mainContent = $(options.selector);
      }

      // Extract text content
      if (options.scrapeText) {
        const textContent = this.extractTextContent(mainContent);
        job.data.text.push(...textContent);
      }

      // Extract images
      if (options.scrapeImages) {
        const images = this.extractImages(mainContent);
        job.data.images.push(...images);
      }

      // Extract videos
      if (options.scrapeVideos) {
        const videos = this.extractVideos(mainContent);
        job.data.videos.push(...videos);
      }

      // Extract tables
      const tables = this.extractTables(mainContent);
      job.data.tables.push(...tables);

      // Extract lists
      const lists = this.extractLists(mainContent);
      job.data.lists.push(...lists);

      // Extract structured data if available
      const structuredData = this.extractStructuredData($);
      if (structuredData && Object.keys(structuredData).length > 0) {
        job.data.structuredData = {
          ...job.data.structuredData,
          ...structuredData,
        };
      }

      // Extract links if followLinks is enabled
      if (
        options.advancedOptions?.followLinks &&
        this.currentDepth < (options.advancedOptions?.maxDepth || 1)
      ) {
        const links = this.extractLinks($, url, options);
        job.data.links.push(...links);

        // Add new links to pending URLs
        for (const link of links) {
          if (!this.visitedUrls.has(link)) {
            this.visitedUrls.add(link);
            this.pendingUrls.push(link);
          }
        }
      }

      // Update job with new data
      job.metadata.totalElements =
        job.data.text.length +
        job.data.images.length +
        job.data.videos.length +
        job.data.tables.length +
        job.data.lists.length;
      this.activeJobs.set(jobId, job);

      // Add delay between requests if specified
      if (options.advancedOptions?.requestDelay) {
        await new Promise((resolve) =>
          setTimeout(resolve, options.advancedOptions!.requestDelay),
        );
      }
    } catch (error: any) {
      logger.error(`Error scraping ${url}:`, error);

      // Retry logic
      if (retryCount < (options.advancedOptions?.retries || this.maxRetries)) {
        logger.info(
          `Retrying ${url} (${retryCount + 1}/${options.advancedOptions?.retries || this.maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retry
        return this.scrapePage(url, jobId, options, retryCount + 1);
      }

      // Add to job errors but don't fail the entire job
      job.error = job.error
        ? `${job.error}\nFailed to scrape ${url}: ${error.message}`
        : `Failed to scrape ${url}: ${error.message}`;
      this.activeJobs.set(jobId, job);
    }
  }

  /**
   * Extract structured data (JSON-LD, microdata, etc.)
   */
  private extractStructuredData(
    $: cheerio.CheerioAPI,
  ): Record<string, any> | null {
    try {
      const structuredData: Record<string, any> = {};

      // Extract JSON-LD
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const jsonText = $(el).html();
          if (jsonText) {
            const data = JSON.parse(jsonText);
            if (data["@type"]) {
              structuredData[data["@type"]] = data;
            } else if (Array.isArray(data) && data.length > 0) {
              data.forEach((item) => {
                if (item["@type"]) {
                  structuredData[item["@type"]] = item;
                }
              });
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      });

      return structuredData;
    } catch (error) {
      logger.error("Error extracting structured data:", error);
      return null;
    }
  }

  /**
   * Extract links from the page
   */
  private extractLinks(
    $: cheerio.CheerioAPI,
    baseUrl: string,
    options: ScrapeOptions,
  ): string[] {
    const links: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    const allowedDomains = options.advancedOptions?.allowedDomains || [
      baseUrlObj.hostname,
    ];
    const excludeUrls = options.advancedOptions?.excludeUrls || [];

    $("a").each((_, el) => {
      try {
        const href = $(el).attr("href");
        if (!href) return;

        // Skip anchors, javascript, mailto links
        if (
          href.startsWith("#") ||
          href.startsWith("javascript:") ||
          href.startsWith("mailto:")
        ) {
          return;
        }

        // Resolve relative URLs
        let fullUrl: string;
        try {
          fullUrl = new URL(href, baseUrl).href;
        } catch (e) {
          return; // Skip invalid URLs
        }

        // Check if URL is from allowed domains
        const urlObj = new URL(fullUrl);
        const isAllowedDomain = allowedDomains.some(
          (domain) =>
            urlObj.hostname === domain ||
            urlObj.hostname.endsWith(`.${domain}`),
        );

        if (!isAllowedDomain) return;

        // Check if URL is excluded
        const isExcluded = excludeUrls.some((pattern) =>
          fullUrl.includes(pattern),
        );
        if (isExcluded) return;

        // Add to links if not already visited
        if (!this.visitedUrls.has(fullUrl)) {
          links.push(fullUrl);
        }
      } catch (e) {
        // Skip problematic links
      }
    });

    return links;
  }

  /**
   * Extract text content from the page
   */
  private extractTextContent(
    content: cheerio.Cheerio<cheerio.Element>,
  ): string[] {
    const textElements: string[] = [];

    // Extract headings with their hierarchy level as metadata
    content.find("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const $el = cheerio(el);
      const text = $el.text().trim();
      if (text) {
        const tagName = el.tagName.toLowerCase();
        const level = parseInt(tagName.substring(1));
        textElements.push(`[${tagName}] ${text}`);
      }
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
      const $el = cheerio(el);
      const src = $el.attr("src");
      if (src && !src.startsWith("data:")) {
        // Also extract alt text and dimensions if available
        const alt = $el.attr("alt") || "";
        const width = $el.attr("width") || "";
        const height = $el.attr("height") || "";

        // Add metadata to the URL
        const imageUrl = src + (alt ? `#alt=${encodeURIComponent(alt)}` : "");
        images.push(imageUrl);
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
      const $el = cheerio(el);
      const src = $el.attr("src");
      if (src) videos.push(src);

      // Also check for poster image
      const poster = $el.attr("poster");
      if (poster) {
        videos.push(`${src}#poster=${poster}`);
      }
    });

    // Extract video sources
    content.find("video source").each((_, el) => {
      const src = cheerio(el).attr("src");
      if (src) videos.push(src);
    });

    // Extract iframes (YouTube, Vimeo, etc.)
    content.find("iframe").each((_, el) => {
      const src = cheerio(el).attr("src");
      if (src) {
        // Extract video ID for common platforms
        if (src.includes("youtube") || src.includes("youtu.be")) {
          const videoId = this.extractYouTubeVideoId(src);
          if (videoId) {
            videos.push(`https://www.youtube.com/watch?v=${videoId}`);
          } else {
            videos.push(src);
          }
        } else if (src.includes("vimeo")) {
          const videoId = this.extractVimeoVideoId(src);
          if (videoId) {
            videos.push(`https://vimeo.com/${videoId}`);
          } else {
            videos.push(src);
          }
        } else {
          videos.push(src);
        }
      }
    });

    return videos;
  }

  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }

  /**
   * Extract Vimeo video ID from URL
   */
  private extractVimeoVideoId(url: string): string | null {
    const regExp =
      /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?))/;
    const match = url.match(regExp);
    return match ? match[1] : null;
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
        caption: $table.find("caption").text().trim() || undefined,
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

    job.aiAnalysis = job.aiAnalysis || {};

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
              "finance",
              "food",
              "fashion",
              "art",
              "environment",
              "legal",
            ],
          },
        });

        // Get top 5 categories
        job.aiAnalysis.categories = categoryResult.labels.slice(0, 5);
      }

      // Content Clustering
      if (aiOptions.performContentClustering && job.data.text.length > 5) {
        job.aiAnalysis.contentClusters = await this.performContentClustering(
          job.data.text,
        );
      }

      // Relationship Extraction
      if (
        aiOptions.extractRelationships &&
        job.aiAnalysis.entities &&
        job.aiAnalysis.entities.length > 0
      ) {
        job.aiAnalysis.relationships = await this.extractRelationships(
          fullText,
          job.aiAnalysis.entities,
        );
      }

      // Vector Embeddings
      if (aiOptions.createVectorEmbeddings) {
        job.aiAnalysis.vectorIds = await this.createVectorEmbeddings(job);
      }

      // Generate Structured Data
      if (aiOptions.generateStructuredData) {
        await this.generateStructuredData(job);
      }

      // Generate Dataset
      if (aiOptions.generateDataset) {
        job.aiAnalysis.datasetId = await this.generateDataset(job);
      }
    } catch (error) {
      logger.error("Error performing AI analysis:", error);
    }
  }

  /**
   * Perform content clustering on text elements
   */
  private async performContentClustering(
    textElements: string[],
  ): Promise<{ name: string; items: string[] }[]> {
    try {
      // For simplicity, we'll use a basic approach to cluster by headings
      const clusters: { name: string; items: string[] }[] = [];
      let currentCluster: { name: string; items: string[] } | null = null;

      for (const text of textElements) {
        if (text.startsWith("[h")) {
          // This is a heading, start a new cluster
          const headingMatch = text.match(/\[h[1-6]\]\s(.+)/);
          if (headingMatch && headingMatch[1]) {
            if (currentCluster && currentCluster.items.length > 0) {
              clusters.push(currentCluster);
            }
            currentCluster = {
              name: headingMatch[1],
              items: [],
            };
          }
        } else if (currentCluster) {
          // Add to current cluster
          currentCluster.items.push(text);
        }
      }

      // Add the last cluster if it exists
      if (currentCluster && currentCluster.items.length > 0) {
        clusters.push(currentCluster);
      }

      // If no clusters were created by headings, try to create them by topic
      if (clusters.length === 0 && this.hfInference) {
        // Group texts into chunks of reasonable size
        const chunks: string[] = [];
        let currentChunk = "";

        for (const text of textElements) {
          if (currentChunk.length + text.length > 500) {
            chunks.push(currentChunk);
            currentChunk = text;
          } else {
            currentChunk += " " + text;
          }
        }

        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // Get topics for each chunk
        for (let i = 0; i < Math.min(chunks.length, 5); i++) {
          try {
            const result = await this.hfInference.summarization({
              model: "facebook/bart-large-cnn",
              inputs: chunks[i],
              parameters: {
                max_length: 10,
                min_length: 5,
              },
            });

            clusters.push({
              name: result.summary_text,
              items: [chunks[i]],
            });
          } catch (e) {
            // Skip if summarization fails
          }
        }
      }

      return clusters;
    } catch (error) {
      logger.error("Error performing content clustering:", error);
      return [];
    }
  }

  /**
   * Extract relationships between entities
   */
  private async extractRelationships(
    text: string,
    entities: { name: string; type: string; count: number }[],
  ): Promise<{ source: string; target: string; type: string }[]> {
    try {
      const relationships: { source: string; target: string; type: string }[] =
        [];

      // Get top entities by count
      const topEntities = entities
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // For each pair of top entities, check if they appear close to each other in the text
      for (let i = 0; i < topEntities.length; i++) {
        for (let j = i + 1; j < topEntities.length; j++) {
          const source = topEntities[i].name;
          const target = topEntities[j].name;

          // Check if they appear within 100 characters of each other
          const sourceIndex = text.toLowerCase().indexOf(source.toLowerCase());
          const targetIndex = text.toLowerCase().indexOf(target.toLowerCase());

          if (
            sourceIndex !== -1 &&
            targetIndex !== -1 &&
            Math.abs(sourceIndex - targetIndex) < 100
          ) {
            // Determine relationship type based on entity types
            let relationType = "related";

            if (
              topEntities[i].type === "PERSON" &&
              topEntities[j].type === "ORG"
            ) {
              relationType = "works_for";
            } else if (
              topEntities[i].type === "ORG" &&
              topEntities[j].type === "PERSON"
            ) {
              relationType = "employs";
            } else if (
              topEntities[i].type === "PERSON" &&
              topEntities[j].type === "PERSON"
            ) {
              relationType = "knows";
            } else if (
              topEntities[i].type === "ORG" &&
              topEntities[j].type === "ORG"
            ) {
              relationType = "partners_with";
            } else if (
              topEntities[i].type === "LOC" ||
              topEntities[j].type === "LOC"
            ) {
              relationType = "located_in";
            }

            relationships.push({
              source,
              target,
              type: relationType,
            });
          }
        }
      }

      return relationships;
    } catch (error) {
      logger.error("Error extracting relationships:", error);
      return [];
    }
  }

  /**
   * Create vector embeddings for the scraped content
   */
  private async createVectorEmbeddings(job: ScrapeResult): Promise<string[]> {
    try {
      if (!this.hfInference || !supabaseUrl || !supabaseKey) {
        logger.warn("Missing required services for vector embeddings");
        return [];
      }

      const vectorIds: string[] = [];
      const chunks = this.createTextChunks(job.data.text, 500);

      for (const chunk of chunks) {
        try {
          // Generate embedding using Hugging Face
          const embeddingResult = await this.hfInference.featureExtraction({
            model: "sentence-transformers/all-MiniLM-L6-v2",
            inputs: chunk,
          });

          // Create record for vector store
          const record: VectorRecord = {
            id: uuidv4(),
            content: chunk,
            metadata: {
              url: job.url,
              title: job.metadata.pageTitle,
              scrapeJobId: job.id,
              timestamp: job.timestamp,
            },
            embedding: embeddingResult,
          };

          // Store in Supabase vector store
          const { data, error } = await supabase
            .from("scraped_content_vectors")
            .insert([
              {
                id: record.id,
                content: record.content,
                metadata: record.metadata,
                embedding: record.embedding,
              },
            ]);

          if (error) {
            logger.error("Error storing vector embedding:", error);
          } else {
            vectorIds.push(record.id);
          }
        } catch (e) {
          logger.error("Error creating vector embedding for chunk:", e);
        }
      }

      // Set vector store URL
      if (vectorIds.length > 0) {
        job.vectorStoreUrl = `${supabaseUrl}/storage/v1/object/public/vector-store/${job.id}`;
      }

      return vectorIds;
    } catch (error) {
      logger.error("Error creating vector embeddings:", error);
      return [];
    }
  }

  /**
   * Generate structured data from scraped content
   */
  private async generateStructuredData(job: ScrapeResult): Promise<void> {
    try {
      if (!this.hfInference) {
        return;
      }

      // If we already have structured data from JSON-LD, use that
      if (
        job.data.structuredData &&
        Object.keys(job.data.structuredData).length > 0
      ) {
        return;
      }

      // Otherwise, try to generate structured data using AI
      const fullText = job.data.text.join(" ").substring(0, 1000);

      // Use zero-shot classification to determine the type of content
      const typeResult = await this.hfInference.zeroShotClassification({
        model: "facebook/bart-large-mnli",
        inputs: fullText,
        parameters: {
          candidate_labels: [
            "Article",
            "Product",
            "Event",
            "Organization",
            "Person",
            "Recipe",
            "Review",
            "Service",
          ],
        },
      });

      const contentType = typeResult.labels[0];

      // Create basic structured data based on the content type
      const structuredData: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": contentType,
        name: job.metadata.pageTitle,
        description:
          job.metadata.pageDescription || job.aiAnalysis?.summary || "",
        url: job.url,
      };

      // Add additional properties based on content type
      if (contentType === "Article") {
        structuredData.headline = job.metadata.pageTitle;
        structuredData.datePublished = job.timestamp;
        if (job.aiAnalysis?.keywords) {
          structuredData.keywords = job.aiAnalysis.keywords.join(", ");
        }
      } else if (contentType === "Product") {
        // Try to find price information
        const priceRegex =
          /\$(\d+(\.\d{1,2})?)|(\d+(\.\d{1,2})?)\s*(USD|EUR|GBP)/i;
        const priceMatch = fullText.match(priceRegex);
        if (priceMatch) {
          structuredData.offers = {
            "@type": "Offer",
            price: priceMatch[0],
            priceCurrency: "USD",
          };
        }
      }

      // Add to job data
      job.data.structuredData = {
        ...job.data.structuredData,
        generatedSchema: structuredData,
      };
    } catch (error) {
      logger.error("Error generating structured data:", error);
    }
  }

  /**
   * Generate a dataset from scraped content
   */
  private async generateDataset(
    job: ScrapeResult,
  ): Promise<string | undefined> {
    try {
      if (!supabaseUrl || !supabaseKey) {
        return undefined;
      }

      const datasetId = uuidv4();
      const datasetName = `scrape-${job.id.substring(0, 8)}`;

      // Create dataset metadata
      const datasetMetadata = {
        id: datasetId,
        name: datasetName,
        description: `Dataset generated from scraping ${job.url}`,
        source_url: job.url,
        created_at: new Date().toISOString(),
        item_count: job.data.text.length,
        metadata: {
          page_title: job.metadata.pageTitle,
          scrape_job_id: job.id,
          categories: job.aiAnalysis?.categories || [],
          keywords: job.aiAnalysis?.keywords || [],
        },
      };

      // Store dataset metadata
      const { error: metadataError } = await supabase
        .from("scraped_datasets")
        .insert([datasetMetadata]);

      if (metadataError) {
        logger.error("Error storing dataset metadata:", metadataError);
        return undefined;
      }

      // Store dataset items
      const datasetItems = job.data.text.map((text, index) => ({
        id: uuidv4(),
        dataset_id: datasetId,
        content: text,
        index: index,
        metadata: {
          type: text.startsWith("[h") ? "heading" : "text",
          url: job.url,
        },
      }));

      // Insert in batches to avoid request size limits
      const batchSize = 100;
      for (let i = 0; i < datasetItems.length; i += batchSize) {
        const batch = datasetItems.slice(i, i + batchSize);
        const { error: itemsError } = await supabase
          .from("scraped_dataset_items")
          .insert(batch);

        if (itemsError) {
          logger.error(`Error storing dataset items batch ${i}:`, itemsError);
        }
      }

      return datasetId;
    } catch (error) {
      logger.error("Error generating dataset:", error);
      return undefined;
    }
  }

  /**
   * Create text chunks of specified size
   */
  private createTextChunks(texts: string[], maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    for (const text of texts) {
      // If this text alone exceeds the chunk size, split it
      if (text.length > maxChunkSize) {
        // First add the current chunk if it's not empty
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }

        // Split the long text into multiple chunks
        let remainingText = text;
        while (remainingText.length > 0) {
          const chunk = remainingText.substring(0, maxChunkSize);
          chunks.push(chunk);
          remainingText = remainingText.substring(maxChunkSize);
        }
      }
      // If adding this text would exceed the chunk size, start a new chunk
      else if (currentChunk.length + text.length > maxChunkSize) {
        chunks.push(currentChunk);
        currentChunk = text;
      }
      // Otherwise, add to the current chunk
      else {
        if (currentChunk) currentChunk += " ";
        currentChunk += text;
      }
    }

    // Add the last chunk if it's not empty
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Export the scraped data in the specified format
   */
  private async exportData(
    job: ScrapeResult,
    exportOptions: NonNullable<ScrapeOptions["exportOptions"]>,
  ): Promise<void> {
    try {
      // Generate export path
      const datasetName =
        exportOptions.datasetName || `scrape-${job.id.substring(0, 8)}`;
      job.exportPath = `/exports/${datasetName}.${exportOptions.format}`;

      // If vector store creation is requested, create it
      if (exportOptions.createVectorStore && !job.aiAnalysis?.vectorIds) {
        job.aiAnalysis = job.aiAnalysis || {};
        job.aiAnalysis.vectorIds = await this.createVectorEmbeddings(job);
      }

      // Store in Supabase if requested
      if (supabaseUrl && supabaseKey && exportOptions.saveToPublic) {
        try {
          // Convert job data to the appropriate format
          let exportData: any;

          switch (exportOptions.format) {
            case "json":
              exportData = JSON.stringify(job, null, 2);
              break;
            case "csv":
              // Simple CSV conversion for text content
              exportData =
                "Content,Type\n" +
                job.data.text
                  .map((text) => `"${text.replace(/"/g, '""')}","text"`)
                  .join("\n");
              break;
            case "xml":
              // Simple XML structure
              exportData =
                `<?xml version="1.0" encoding="UTF-8"?>\n<scrape>\n` +
                `  <url>${job.url}</url>\n` +
                `  <title>${job.metadata.pageTitle}</title>\n` +
                `  <content>\n` +
                job.data.text
                  .map(
                    (text) =>
                      `    <text>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</text>`,
                  )
                  .join("\n") +
                `\n  </content>\n</scrape>`;
              break;
            default:
              exportData = JSON.stringify(job, null, 2);
          }

          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from("scrape-exports")
            .upload(`${datasetName}.${exportOptions.format}`, exportData, {
              contentType: this.getContentType(exportOptions.format),
              upsert: exportOptions.overwriteExisting,
            });

          if (error) {
            logger.error("Error uploading export to Supabase:", error);
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from("scrape-exports")
              .getPublicUrl(`${datasetName}.${exportOptions.format}`);

            if (urlData) {
              job.exportPath = urlData.publicUrl;
            }
          }
        } catch (e) {
          logger.error("Error exporting to Supabase:", e);
        }
      }
    } catch (error) {
      logger.error("Error exporting data:", error);
    }
  }

  /**
   * Get content type for export format
   */
  private getContentType(format: string): string {
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

  /**
   * Delete a scraping job
   */
  deleteJob(jobId: string): boolean {
    return this.activeJobs.delete(jobId);
  }

  /**
   * Search vector store for similar content
   */
  async searchVectorStore(query: string, limit: number = 5): Promise<any[]> {
    try {
      if (!this.hfInference || !supabaseUrl || !supabaseKey) {
        return [];
      }

      // Generate embedding for query
      const embedding = await this.hfInference.featureExtraction({
        model: "sentence-transformers/all-MiniLM-L6-v2",
        inputs: query,
      });

      // Search Supabase vector store
      const { data, error } = await supabase.rpc("match_documents", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: limit,
      });

      if (error) {
        logger.error("Error searching vector store:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error("Error searching vector store:", error);
      return [];
    }
  }

  /**
   * Get dataset by ID
   */
  async getDataset(datasetId: string): Promise<any> {
    try {
      if (!supabaseUrl || !supabaseKey) {
        return null;
      }

      // Get dataset metadata
      const { data: metadata, error: metadataError } = await supabase
        .from("scraped_datasets")
        .select("*")
        .eq("id", datasetId)
        .single();

      if (metadataError || !metadata) {
        logger.error("Error fetching dataset metadata:", metadataError);
        return null;
      }

      // Get dataset items
      const { data: items, error: itemsError } = await supabase
        .from("scraped_dataset_items")
        .select("*")
        .eq("dataset_id", datasetId)
        .order("index", { ascending: true });

      if (itemsError) {
        logger.error("Error fetching dataset items:", itemsError);
        return { ...metadata, items: [] };
      }

      return { ...metadata, items: items || [] };
    } catch (error) {
      logger.error("Error getting dataset:", error);
      return null;
    }
  }
}

// Create a singleton instance
const scrappingService = new ScrappingService();

export default scrappingService;
