/**
 * Content Moderation Service
 *
 * This module provides functionality for moderating user-generated content.
 */

import { getSupabaseClient } from "../core/supabase";
import logger from "@/utils/logger";

/**
 * Moderation result interface
 */
export interface ModerationResult {
  isAllowed: boolean;
  flagged: boolean;
  modifiedContent?: string;
  reason?: string;
  score?: number;
  categories?: Record<string, number>;
}

/**
 * Moderation rule interface
 */
export interface ModerationRule {
  id: string;
  name: string;
  description?: string;
  type: "keyword" | "regex" | "ai";
  pattern: string;
  action: "block" | "flag" | "modify";
  replacement?: string;
  severity: "low" | "medium" | "high";
  isActive: boolean;
}

/**
 * Check content against moderation rules
 * @param content Content to check
 * @param userId User ID who created the content
 * @returns Moderation result
 */
export const checkContent = async (
  content: string,
  userId: string,
): Promise<ModerationResult> => {
  try {
    // Check if user is banned first
    const isBanned = await isUserBanned(userId);
    if (isBanned) {
      return {
        isAllowed: false,
        flagged: true,
        reason: "User is banned",
      };
    }

    // Get active moderation rules
    const rules = await getModerationRules();

    // Default result
    let result: ModerationResult = {
      isAllowed: true,
      flagged: false,
    };

    // Apply each rule
    let modifiedContent = content;

    for (const rule of rules) {
      // Skip inactive rules
      if (!rule.isActive) continue;

      let matched = false;

      if (rule.type === "keyword") {
        // Simple keyword matching
        const keywords = rule.pattern
          .split(",")
          .map((k) => k.trim().toLowerCase());
        matched = keywords.some((keyword) =>
          content.toLowerCase().includes(keyword),
        );
      } else if (rule.type === "regex") {
        // Regex matching
        try {
          const regex = new RegExp(rule.pattern, "i");
          matched = regex.test(content);

          // If it's a modification action, apply the replacement
          if (matched && rule.action === "modify" && rule.replacement) {
            modifiedContent = modifiedContent.replace(regex, rule.replacement);
          }
        } catch (regexError) {
          logger.error(
            `Invalid regex in moderation rule ${rule.id}`,
            regexError,
          );
        }
      }

      // Handle match based on action
      if (matched) {
        // Log the moderation event
        await logModerationEvent({
          userId,
          content,
          ruleId: rule.id,
          action: rule.action,
          severity: rule.severity,
        });

        if (rule.action === "block") {
          // Block the content
          return {
            isAllowed: false,
            flagged: true,
            reason: `Content blocked by rule: ${rule.name}`,
          };
        } else if (rule.action === "flag") {
          // Flag the content but allow it
          result.flagged = true;
        } else if (rule.action === "modify") {
          // Content has already been modified above
          result.modifiedContent = modifiedContent;
          result.flagged = true;
        }
      }
    }

    // If content was modified, return the modified version
    if (modifiedContent !== content) {
      result.modifiedContent = modifiedContent;
    }

    return result;
  } catch (error) {
    logger.error("Error checking content moderation", error);
    // Default to allowing content in case of error
    return { isAllowed: true, flagged: false };
  }
};

/**
 * Check if a user is banned
 * @param userId User ID
 * @returns Boolean indicating if the user is banned
 */
export const isUserBanned = async (userId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_bans")
      .select("id")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (error) throw error;

    return !!data;
  } catch (error) {
    logger.error(`Error checking if user ${userId} is banned`, error);
    // Default to not banned in case of error
    return false;
  }
};

/**
 * Ban a user
 * @param userId User ID
 * @param reason Ban reason
 * @param expiresAt Optional expiration date
 * @param adminId Admin who issued the ban
 * @returns Success status
 */
export const banUser = async (
  userId: string,
  reason: string,
  expiresAt?: string,
  adminId?: string,
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("user_bans").insert({
      user_id: userId,
      reason,
      admin_id: adminId,
      created_at: new Date().toISOString(),
      expires_at: expiresAt || null,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error(`Error banning user ${userId}`, error);
    throw error;
  }
};

/**
 * Unban a user
 * @param userId User ID
 * @param adminId Admin who removed the ban
 * @returns Success status
 */
export const unbanUser = async (
  userId: string,
  adminId?: string,
): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("user_bans")
      .update({
        expires_at: new Date().toISOString(),
        updated_by: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString());

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error(`Error unbanning user ${userId}`, error);
    throw error;
  }
};

/**
 * Get all moderation rules
 * @param activeOnly Only return active rules
 * @returns Array of moderation rules
 */
export const getModerationRules = async (
  activeOnly: boolean = true,
): Promise<ModerationRule[]> => {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from("moderation_rules")
      .select("*")
      .order("severity", { ascending: false });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      type: rule.type,
      pattern: rule.pattern,
      action: rule.action,
      replacement: rule.replacement,
      severity: rule.severity,
      isActive: rule.is_active,
    }));
  } catch (error) {
    logger.error("Error getting moderation rules", error);
    return [];
  }
};

/**
 * Create a new moderation rule
 * @param rule Moderation rule
 * @returns Created rule
 */
export const createModerationRule = async (
  rule: Omit<ModerationRule, "id">,
): Promise<ModerationRule> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("moderation_rules")
      .insert({
        name: rule.name,
        description: rule.description,
        type: rule.type,
        pattern: rule.pattern,
        action: rule.action,
        replacement: rule.replacement,
        severity: rule.severity,
        is_active: rule.isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      pattern: data.pattern,
      action: data.action,
      replacement: data.replacement,
      severity: data.severity,
      isActive: data.is_active,
    };
  } catch (error) {
    logger.error("Error creating moderation rule", error);
    throw error;
  }
};

/**
 * Update a moderation rule
 * @param id Rule ID
 * @param updates Updates to apply
 * @returns Updated rule
 */
export const updateModerationRule = async (
  id: string,
  updates: Partial<Omit<ModerationRule, "id">>,
): Promise<ModerationRule> => {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.pattern !== undefined) updateData.pattern = updates.pattern;
    if (updates.action !== undefined) updateData.action = updates.action;
    if (updates.replacement !== undefined)
      updateData.replacement = updates.replacement;
    if (updates.severity !== undefined) updateData.severity = updates.severity;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("moderation_rules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      pattern: data.pattern,
      action: data.action,
      replacement: data.replacement,
      severity: data.severity,
      isActive: data.is_active,
    };
  } catch (error) {
    logger.error(`Error updating moderation rule ${id}`, error);
    throw error;
  }
};

/**
 * Delete a moderation rule
 * @param id Rule ID
 * @returns Success status
 */
export const deleteModerationRule = async (id: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("moderation_rules")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error(`Error deleting moderation rule ${id}`, error);
    throw error;
  }
};

/**
 * Log a moderation event
 * @param event Moderation event details
 */
export const logModerationEvent = async (event: {
  userId: string;
  content: string;
  ruleId: string;
  action: string;
  severity: string;
}): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("moderation_events").insert({
      user_id: event.userId,
      content: event.content,
      rule_id: event.ruleId,
      action: event.action,
      severity: event.severity,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error logging moderation event", error);
    // Don't throw - logging failures shouldn't break the application
  }
};

/**
 * Get moderation events
 * @param limit Maximum number of events to return
 * @param offset Offset for pagination
 * @returns Array of moderation events
 */
export const getModerationEvents = async (
  limit: number = 50,
  offset: number = 0,
): Promise<any[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("moderation_events")
      .select("*, moderation_rules(name, type, action, severity)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error("Error getting moderation events", error);
    throw error;
  }
};
