import supabase from "./supabaseClient";
import logger from "@/utils/logger";

export interface UserActivity {
  id?: string;
  user_id: string;
  action: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface UserSession {
  id?: string;
  user_id: string;
  device_info: {
    type: string;
    name: string;
    browser: string;
    os: string;
  };
  ip_address?: string;
  location?: string;
  last_active_at: string;
  created_at?: string;
  is_active: boolean;
}

const userActivityService = {
  /**
   * Log a user activity
   */
  logActivity: async (activity: UserActivity): Promise<void> => {
    try {
      // Get IP address and user agent from browser if not provided
      if (!activity.ip_address || !activity.user_agent) {
        try {
          const response = await fetch("https://api.ipify.org?format=json");
          const data = await response.json();
          activity.ip_address = activity.ip_address || data.ip;
          activity.user_agent = activity.user_agent || navigator.userAgent;
        } catch (error) {
          // Silently fail if we can't get IP address
          logger.warn("Failed to get IP address", error);
        }
      }

      const { error } = await supabase.from("user_activity").insert([activity]);

      if (error) throw error;
    } catch (error) {
      logger.error("Error logging user activity:", error);
      // Don't throw error to prevent disrupting user flow
    }
  },

  /**
   * Get user activity history
   */
  getUserActivity: async (
    userId: string,
    limit = 20,
  ): Promise<UserActivity[]> => {
    try {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching user activity:", error);
      throw error;
    }
  },

  /**
   * Create or update a user session
   */
  updateSession: async (session: UserSession): Promise<void> => {
    try {
      // Check if session exists
      const { data: existingSession, error: fetchError } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", session.user_id)
        .eq("device_info->name", session.device_info.name)
        .eq("device_info->browser", session.device_info.browser)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "no rows returned"
        throw fetchError;
      }

      if (existingSession) {
        // Update existing session
        const { error: updateError } = await supabase
          .from("user_sessions")
          .update({
            last_active_at: new Date().toISOString(),
            is_active: session.is_active,
            ip_address: session.ip_address,
            location: session.location,
          })
          .eq("id", existingSession.id);

        if (updateError) throw updateError;
      } else {
        // Create new session
        const { error: insertError } = await supabase
          .from("user_sessions")
          .insert([
            {
              ...session,
              created_at: new Date().toISOString(),
              last_active_at: new Date().toISOString(),
            },
          ]);

        if (insertError) throw insertError;
      }
    } catch (error) {
      logger.error("Error updating user session:", error);
      // Don't throw error to prevent disrupting user flow
    }
  },

  /**
   * Get active user sessions
   */
  getUserSessions: async (userId: string): Promise<UserSession[]> => {
    try {
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("last_active_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error("Error fetching user sessions:", error);
      throw error;
    }
  },

  /**
   * Terminate a specific user session
   */
  terminateSession: async (sessionId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("id", sessionId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error terminating user session:", error);
      throw error;
    }
  },

  /**
   * Terminate all user sessions except the current one
   */
  terminateAllSessions: async (
    userId: string,
    currentSessionId: string,
  ): Promise<void> => {
    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({ is_active: false })
        .eq("user_id", userId)
        .neq("id", currentSessionId);

      if (error) throw error;
    } catch (error) {
      logger.error("Error terminating all user sessions:", error);
      throw error;
    }
  },

  /**
   * Log a login attempt (successful or failed)
   */
  logLoginAttempt: async (
    userId: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> => {
    return userActivityService.logActivity({
      user_id: userId,
      action: success ? "login_success" : "login_failed",
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: { success },
    });
  },

  /**
   * Log a security event (password change, MFA setup, etc.)
   */
  logSecurityEvent: async (
    userId: string,
    eventType: string,
    metadata?: Record<string, any>,
  ): Promise<void> => {
    return userActivityService.logActivity({
      user_id: userId,
      action: `security_${eventType}`,
      metadata,
    });
  },
};

export default userActivityService;
