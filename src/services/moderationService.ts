import { getMySQLClient } from "./mysqlClient";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export interface FlaggedContent {
  id: string;
  contentId: string;
  contentType: "message" | "user" | "attachment";
  reason: string;
  status: "pending" | "approved" | "rejected";
  reportedBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationRule {
  id: string;
  name: string;
  description: string;
  pattern: string;
  action: "flag" | "block" | "replace";
  replacement?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class ModerationService {
  /**
   * Check content against moderation rules
   */
  async checkContent(
    content: string,
    userId: string,
  ): Promise<{
    isAllowed: boolean;
    flagged: boolean;
    modifiedContent?: string;
  }> {
    try {
      // Try API first
      try {
        const response = await axios.post("/api/moderation/check", {
          content,
          userId,
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API moderation check failed, falling back to local implementation",
          apiError,
        );

        // Get active moderation rules
        const sequelize = await getMySQLClient();
        const rules = await sequelize.query(
          `SELECT * FROM moderation_rules WHERE is_active = true`,
          { type: sequelize.QueryTypes.SELECT },
        );

        let isAllowed = true;
        let flagged = false;
        let modifiedContent = content;

        // Apply each rule
        for (const rule of rules || []) {
          try {
            const regex = new RegExp(rule.pattern, "gi");
            const matches = content.match(regex);

            if (matches) {
              flagged = true;

              // Apply action based on rule
              if (rule.action === "block") {
                isAllowed = false;
                break;
              } else if (rule.action === "replace" && rule.replacement) {
                modifiedContent = modifiedContent.replace(
                  regex,
                  rule.replacement,
                );
              }
            }
          } catch (regexError) {
            logger.error(
              `Invalid regex pattern in moderation rule: ${rule.id}`,
              regexError instanceof Error
                ? regexError
                : new Error(String(regexError)),
            );
          }
        }

        return {
          isAllowed,
          flagged,
          modifiedContent:
            modifiedContent !== content ? modifiedContent : undefined,
        };
      }
    } catch (error) {
      logger.error(
        "Error checking content against moderation rules",
        error instanceof Error ? error : new Error(String(error)),
      );

      // Default to allowing content if there's an error
      return { isAllowed: true, flagged: false };
    }
  }

  /**
   * Report content for moderation
   */
  async reportContent(
    contentId: string,
    contentType: "message" | "user" | "attachment",
    reason: string,
    reportedBy: string,
  ): Promise<FlaggedContent | null> {
    try {
      // Try API first
      try {
        const response = await axios.post("/api/moderation/report", {
          contentId,
          contentType,
          reason,
          reportedBy,
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API moderation report failed, falling back to local implementation",
          apiError,
        );

        const now = new Date().toISOString();
        const id = uuidv4();
        const sequelize = await getMySQLClient();

        await sequelize.query(
          `INSERT INTO flagged_content 
           (id, content_id, content_type, reason, status, reported_by, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              id,
              contentId,
              contentType,
              reason,
              "pending",
              reportedBy,
              now,
              now,
            ],
            type: sequelize.QueryTypes.INSERT,
          },
        );

        // Fetch the newly created record
        const [data] = await sequelize.query(
          `SELECT * FROM flagged_content WHERE id = ?`,
          {
            replacements: [id],
            type: sequelize.QueryTypes.SELECT,
          },
        );

        return this.mapFlaggedContentFromDb(data);
      }
    } catch (error) {
      logger.error(
        "Error reporting content for moderation",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Get moderation queue items
   */
  async getModerationQueue(
    status?: "pending" | "approved" | "rejected",
    limit = 50,
  ): Promise<FlaggedContent[]> {
    try {
      // Try API first
      try {
        const response = await axios.get("/api/moderation/queue", {
          params: { status, limit },
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API moderation queue fetch failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();

        let query = `SELECT * FROM flagged_content ORDER BY created_at DESC LIMIT ?`;
        let replacements: any[] = [limit];

        if (status) {
          query = `SELECT * FROM flagged_content WHERE status = ? ORDER BY created_at DESC LIMIT ?`;
          replacements = [status, limit];
        }

        const data = await sequelize.query(query, {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        });

        return data.map(this.mapFlaggedContentFromDb);
      }
    } catch (error) {
      logger.error(
        "Error fetching moderation queue",
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Review flagged content
   */
  async reviewContent(
    flaggedContentId: string,
    status: "approved" | "rejected",
    reviewedBy: string,
  ): Promise<FlaggedContent | null> {
    try {
      // Try API first
      try {
        const response = await axios.post(
          `/api/moderation/review/${flaggedContentId}`,
          {
            status,
            reviewedBy,
          },
        );
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API moderation review failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();
        const now = new Date().toISOString();

        await sequelize.query(
          `UPDATE flagged_content 
           SET status = ?, reviewed_by = ?, updated_at = ? 
           WHERE id = ?`,
          {
            replacements: [status, reviewedBy, now, flaggedContentId],
            type: sequelize.QueryTypes.UPDATE,
          },
        );

        // Fetch the updated record
        const [data] = await sequelize.query(
          `SELECT * FROM flagged_content WHERE id = ?`,
          {
            replacements: [flaggedContentId],
            type: sequelize.QueryTypes.SELECT,
          },
        );

        if (!data) return null;
        return this.mapFlaggedContentFromDb(data);
      }
    } catch (error) {
      logger.error(
        "Error reviewing flagged content",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Create or update moderation rule
   */
  async saveRule(
    rule: Omit<ModerationRule, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ): Promise<ModerationRule | null> {
    try {
      // Try API first
      try {
        const method = rule.id ? "put" : "post";
        const url = rule.id
          ? `/api/moderation/rules/${rule.id}`
          : "/api/moderation/rules";
        const response = await axios[method](url, rule);
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API moderation rule save failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();
        const now = new Date().toISOString();

        if (rule.id) {
          // Update existing rule
          await sequelize.query(
            `UPDATE moderation_rules 
             SET name = ?, description = ?, pattern = ?, action = ?, 
                 replacement = ?, is_active = ?, updated_at = ? 
             WHERE id = ?`,
            {
              replacements: [
                rule.name,
                rule.description,
                rule.pattern,
                rule.action,
                rule.replacement,
                rule.isActive,
                now,
                rule.id,
              ],
              type: sequelize.QueryTypes.UPDATE,
            },
          );

          // Fetch the updated rule
          const [data] = await sequelize.query(
            `SELECT * FROM moderation_rules WHERE id = ?`,
            {
              replacements: [rule.id],
              type: sequelize.QueryTypes.SELECT,
            },
          );

          if (!data) return null;
          return this.mapRuleFromDb(data);
        } else {
          // Create new rule
          const id = uuidv4();

          await sequelize.query(
            `INSERT INTO moderation_rules 
             (id, name, description, pattern, action, replacement, is_active, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                id,
                rule.name,
                rule.description,
                rule.pattern,
                rule.action,
                rule.replacement,
                rule.isActive,
                now,
                now,
              ],
              type: sequelize.QueryTypes.INSERT,
            },
          );

          // Fetch the newly created rule
          const [data] = await sequelize.query(
            `SELECT * FROM moderation_rules WHERE id = ?`,
            {
              replacements: [id],
              type: sequelize.QueryTypes.SELECT,
            },
          );

          if (!data) return null;
          return this.mapRuleFromDb(data);
        }
      }
    } catch (error) {
      logger.error(
        "Error saving moderation rule",
        error instanceof Error ? error : new Error(String(error)),
      );
      return null;
    }
  }

  /**
   * Delete a moderation rule
   */
  async deleteRule(ruleId: string): Promise<boolean> {
    try {
      // Try API first
      try {
        await axios.delete(`/api/moderation/rules/${ruleId}`);
        return true;
      } catch (apiError) {
        logger.warn(
          "API moderation rule delete failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();
        await sequelize.query("DELETE FROM moderation_rules WHERE id = ?", {
          replacements: [ruleId],
          type: sequelize.QueryTypes.DELETE,
        });
        return true;
      }
    } catch (error) {
      logger.error(
        "Error deleting moderation rule",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Get moderation rules
   */
  async getRules(activeOnly = false): Promise<ModerationRule[]> {
    try {
      // Try API first
      try {
        const response = await axios.get("/api/moderation/rules", {
          params: { activeOnly },
        });
        return response.data;
      } catch (apiError) {
        logger.warn(
          "API moderation rules fetch failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();

        let query = `SELECT * FROM moderation_rules ORDER BY created_at DESC`;
        let replacements: any[] = [];

        if (activeOnly) {
          query = `SELECT * FROM moderation_rules WHERE is_active = true ORDER BY created_at DESC`;
        }

        const data = await sequelize.query(query, {
          replacements,
          type: sequelize.QueryTypes.SELECT,
        });

        return data.map(this.mapRuleFromDb);
      }
    } catch (error) {
      logger.error(
        "Error fetching moderation rules",
        error instanceof Error ? error : new Error(String(error)),
      );
      return [];
    }
  }

  /**
   * Ban a user
   */
  async banUser(
    userId: string,
    reason: string,
    bannedBy: string,
    duration?: number,
  ): Promise<boolean> {
    try {
      // Try API first
      try {
        await axios.post("/api/moderation/ban", {
          userId,
          reason,
          bannedBy,
          duration,
        });
        return true;
      } catch (apiError) {
        logger.warn(
          "API user ban failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();
        const now = new Date();
        let expiresAt = null;

        if (duration) {
          expiresAt = new Date(now.getTime() + duration * 1000).toISOString();
        }

        await sequelize.query(
          `INSERT INTO user_bans 
           (id, user_id, reason, banned_by, created_at, expires_at) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          {
            replacements: [
              uuidv4(),
              userId,
              reason,
              bannedBy,
              now.toISOString(),
              expiresAt,
            ],
            type: sequelize.QueryTypes.INSERT,
          },
        );

        return true;
      }
    } catch (error) {
      logger.error(
        "Error banning user",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Check if a user is banned
   */
  async isUserBanned(userId: string): Promise<boolean> {
    try {
      // Try API first
      try {
        const response = await axios.get(`/api/moderation/ban/${userId}`);
        return response.data.banned;
      } catch (apiError) {
        logger.warn(
          "API user ban check failed, falling back to local implementation",
          apiError,
        );

        const sequelize = await getMySQLClient();
        const now = new Date().toISOString();

        const bans = await sequelize.query(
          `SELECT * FROM user_bans 
           WHERE user_id = ? AND (expires_at IS NULL OR expires_at > ?) 
           LIMIT 1`,
          {
            replacements: [userId, now],
            type: sequelize.QueryTypes.SELECT,
          },
        );

        return bans.length > 0;
      }
    } catch (error) {
      logger.error(
        "Error checking if user is banned",
        error instanceof Error ? error : new Error(String(error)),
      );
      return false;
    }
  }

  /**
   * Map database object to FlaggedContent
   */
  private mapFlaggedContentFromDb(data: any): FlaggedContent {
    return {
      id: data.id,
      contentId: data.content_id,
      contentType: data.content_type,
      reason: data.reason,
      status: data.status,
      reportedBy: data.reported_by,
      reviewedBy: data.reviewed_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Map database object to ModerationRule
   */
  private mapRuleFromDb(data: any): ModerationRule {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      pattern: data.pattern,
      action: data.action,
      replacement: data.replacement,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

// Create a singleton instance
const moderationService = new ModerationService();

export default moderationService;
