import supabase from "./supabaseClient";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";

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
      // Get active moderation rules
      const { data: rules, error } = await supabase
        .from("moderation_rules")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

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
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("flagged_content")
        .insert({
          id: uuidv4(),
          content_id: contentId,
          content_type: contentType,
          reason,
          status: "pending",
          reported_by: reportedBy,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapFlaggedContentFromDb(data);
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
      let query = supabase
        .from("flagged_content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this.mapFlaggedContentFromDb);
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
      const { data, error } = await supabase
        .from("flagged_content")
        .update({
          status,
          reviewed_by: reviewedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("id", flaggedContentId)
        .select()
        .single();

      if (error) throw error;

      return this.mapFlaggedContentFromDb(data);
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
      const now = new Date().toISOString();

      if (rule.id) {
        // Update existing rule
        const { data, error } = await supabase
          .from("moderation_rules")
          .update({
            name: rule.name,
            description: rule.description,
            pattern: rule.pattern,
            action: rule.action,
            replacement: rule.replacement,
            is_active: rule.isActive,
            updated_at: now,
          })
          .eq("id", rule.id)
          .select()
          .single();

        if (error) throw error;
        return this.mapRuleFromDb(data);
      } else {
        // Create new rule
        const { data, error } = await supabase
          .from("moderation_rules")
          .insert({
            id: uuidv4(),
            name: rule.name,
            description: rule.description,
            pattern: rule.pattern,
            action: rule.action,
            replacement: rule.replacement,
            is_active: rule.isActive,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return this.mapRuleFromDb(data);
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
   * Get moderation rules
   */
  async getRules(activeOnly = false): Promise<ModerationRule[]> {
    try {
      let query = supabase
        .from("moderation_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(this.mapRuleFromDb);
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
      const now = new Date();
      let expiresAt = null;

      if (duration) {
        expiresAt = new Date(now.getTime() + duration * 1000).toISOString();
      }

      const { error } = await supabase.from("user_bans").insert({
        id: uuidv4(),
        user_id: userId,
        reason,
        banned_by: bannedBy,
        created_at: now.toISOString(),
        expires_at: expiresAt,
      });

      if (error) throw error;
      return true;
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
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("user_bans")
        .select("*")
        .eq("user_id", userId)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .limit(1);

      if (error) throw error;
      return data.length > 0;
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
