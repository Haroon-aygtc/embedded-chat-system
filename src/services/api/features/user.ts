/**
 * User Service Module
 *
 * This module provides functionality for user management.
 */

import { getSupabaseClient } from "../core/supabase";
import logger from "@/utils/logger";

/**
 * User profile interface
 */
export interface UserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  role: "admin" | "user" | "guest";
  isActive: boolean;
  metadata?: Record<string, any>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User activity interface
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * Get a user by ID
 * @param userId User ID
 * @returns User profile or null if not found
 */
export const getUser = async (userId: string): Promise<UserProfile | null> => {
  try {
    const supabase = getSupabaseClient();

    // Get user from auth.users
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(userId);

    if (authError) {
      throw authError;
    }

    if (!authUser.user) {
      return null;
    }

    // Get user profile from public.users
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      // Ignore not found error
      throw profileError;
    }

    // Combine auth user and profile data
    return {
      id: authUser.user.id,
      email: authUser.user.email,
      fullName: profileData?.full_name || authUser.user.user_metadata?.name,
      avatarUrl:
        profileData?.avatar_url || authUser.user.user_metadata?.avatar_url,
      role: profileData?.role || authUser.user.user_metadata?.role || "user",
      isActive: !authUser.user.banned_until,
      metadata: {
        ...authUser.user.user_metadata,
        ...profileData?.metadata,
      },
      lastLoginAt: authUser.user.last_sign_in_at,
      createdAt: authUser.user.created_at,
      updatedAt: profileData?.updated_at || authUser.user.updated_at,
    };
  } catch (error) {
    logger.error(`Error getting user ${userId}`, error);
    return null;
  }
};

/**
 * Get all users
 * @param limit Maximum number of users to return
 * @param offset Offset for pagination
 * @param includeInactive Include inactive users
 * @returns Array of user profiles
 */
export const getUsers = async (
  limit: number = 50,
  offset: number = 0,
  includeInactive: boolean = false,
): Promise<UserProfile[]> => {
  try {
    const supabase = getSupabaseClient();

    // Get users from public.users table
    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Map to UserProfile interface
    return (data || []).map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role || "user",
      isActive: user.is_active,
      metadata: user.metadata,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  } catch (error) {
    logger.error("Error getting users", error);
    return [];
  }
};

/**
 * Update a user profile
 * @param userId User ID
 * @param updates Updates to apply
 * @returns Updated user profile
 */
export const updateUser = async (
  userId: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile | null> => {
  try {
    const supabase = getSupabaseClient();

    // Update auth.users metadata
    if (updates.fullName || updates.avatarUrl || updates.metadata) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          user_metadata: {
            name: updates.fullName,
            avatar_url: updates.avatarUrl,
            ...updates.metadata,
          },
        },
      );

      if (authError) throw authError;
    }

    // Update public.users profile
    const updateData: Record<string, any> = {};
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.avatarUrl !== undefined)
      updateData.avatar_url = updates.avatarUrl;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Get the updated user
    return getUser(userId);
  } catch (error) {
    logger.error(`Error updating user ${userId}`, error);
    throw error;
  }
};

/**
 * Deactivate a user
 * @param userId User ID
 * @returns Success status
 */
export const deactivateUser = async (userId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    // Update public.users
    const { error: profileError } = await supabase
      .from("users")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // Ban user in auth.users
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        banned_until: "2100-01-01T00:00:00Z", // Far future date
      },
    );

    if (authError) throw authError;

    return true;
  } catch (error) {
    logger.error(`Error deactivating user ${userId}`, error);
    throw error;
  }
};

/**
 * Reactivate a user
 * @param userId User ID
 * @returns Success status
 */
export const reactivateUser = async (userId: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient();

    // Update public.users
    const { error: profileError } = await supabase
      .from("users")
      .update({
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // Unban user in auth.users
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        banned_until: null,
      },
    );

    if (authError) throw authError;

    return true;
  } catch (error) {
    logger.error(`Error reactivating user ${userId}`, error);
    throw error;
  }
};

/**
 * Get user activity
 * @param userId User ID
 * @param limit Maximum number of activities to return
 * @param offset Offset for pagination
 * @returns Array of user activities
 */
export const getUserActivity = async (
  userId: string,
  limit: number = 50,
  offset: number = 0,
): Promise<UserActivity[]> => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map((activity) => ({
      id: activity.id,
      userId: activity.user_id,
      action: activity.action,
      ipAddress: activity.ip_address,
      userAgent: activity.user_agent,
      metadata: activity.metadata,
      createdAt: activity.created_at,
    }));
  } catch (error) {
    logger.error(`Error getting activity for user ${userId}`, error);
    return [];
  }
};

/**
 * Log user activity
 * @param userId User ID
 * @param action Activity action
 * @param metadata Optional metadata
 * @param ipAddress Optional IP address
 * @param userAgent Optional user agent
 */
export const logUserActivity = async (
  userId: string,
  action: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> => {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("user_activity").insert({
      user_id: userId,
      action,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata,
      created_at: new Date().toISOString(),
    });

    // Update last_login_at if action is login
    if (action === "login") {
      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);
    }
  } catch (error) {
    logger.error(`Error logging activity for user ${userId}`, error);
    // Don't throw - logging failures shouldn't break the application
  }
};

/**
 * Get user statistics
 * @returns User statistics
 */
export const getUserStats = async (): Promise<any> => {
  try {
    const supabase = getSupabaseClient();

    // Get total users count
    const { count: totalUsers, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) throw countError;

    // Get active users count
    const { count: activeUsers, error: activeError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    if (activeError) throw activeError;

    // Get users by role
    const { data: roleData, error: roleError } = await supabase
      .from("users")
      .select("role, count")
      .group("role");

    if (roleError) throw roleError;

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: newUsers, error: newError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    if (newError) throw newError;

    return {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      inactiveUsers: (totalUsers || 0) - (activeUsers || 0),
      newUsersLast30Days: newUsers || 0,
      usersByRole: roleData || [],
    };
  } catch (error) {
    logger.error("Error getting user statistics", error);
    throw error;
  }
};
