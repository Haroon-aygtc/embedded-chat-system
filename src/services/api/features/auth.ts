import { getSupabaseClient } from "../core/supabase";
import logger from "@/utils/logger";
import { getWebSocketService } from "../core/websocket";

/**
 * User authentication state
 */
export interface AuthState {
  user: any | null;
  session: any | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegistrationData extends LoginCredentials {
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update data
 */
export interface PasswordUpdateData {
  password: string;
}

/**
 * User profile data
 */
export interface UserProfileData {
  name?: string;
  avatar_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Sign in with email and password
 * @param credentials Login credentials
 * @returns User session data
 */
export const signIn = async (credentials: LoginCredentials) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error) throw error;

    // Log user activity
    await logUserActivity(data.user.id, "login");

    // Connect WebSocket with auth
    const ws = getWebSocketService();
    await ws.connect();
    await ws.send({
      type: "auth",
      payload: {
        userId: data.user.id,
        sessionId: data.session.id,
      },
    });

    return data;
  } catch (error) {
    logger.error("Error signing in", error);
    throw error;
  }
};

/**
 * Sign up with email and password
 * @param registrationData Registration data
 * @returns User session data
 */
export const signUp = async (registrationData: RegistrationData) => {
  try {
    const supabase = getSupabaseClient();
    const { email, password, name, metadata } = registrationData;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split("@")[0],
          ...metadata,
        },
      },
    });

    if (error) throw error;

    // Create user profile in public.users table
    if (data.user) {
      await createUserProfile(data.user.id, {
        name: name || email.split("@")[0],
        metadata,
      });

      // Log user activity
      await logUserActivity(data.user.id, "signup");
    }

    return data;
  } catch (error) {
    logger.error("Error signing up", error);
    throw error;
  }
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    // Disconnect WebSocket
    const ws = getWebSocketService();
    ws.disconnect();

    return true;
  } catch (error) {
    logger.error("Error signing out", error);
    throw error;
  }
};

/**
 * Request a password reset email
 * @param request Password reset request
 * @returns Success status
 */
export const requestPasswordReset = async (request: PasswordResetRequest) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(request.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    logger.error("Error requesting password reset", error);
    throw error;
  }
};

/**
 * Update user password
 * @param data Password update data
 * @returns Success status
 */
export const updatePassword = async (data: PasswordUpdateData) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) throw error;

    // Log user activity
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await logUserActivity(userData.user.id, "password_update");
    }

    return { success: true };
  } catch (error) {
    logger.error("Error updating password", error);
    throw error;
  }
};

/**
 * Get the current user session
 * @returns Current session or null
 */
export const getSession = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
  } catch (error) {
    logger.error("Error getting session", error);
    return null;
  }
};

/**
 * Get the current user
 * @returns Current user or null
 */
export const getUser = async () => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    return data.user;
  } catch (error) {
    logger.error("Error getting user", error);
    return null;
  }
};

/**
 * Update user profile
 * @param userId User ID
 * @param profileData Profile data to update
 * @returns Updated profile data
 */
export const updateUserProfile = async (
  userId: string,
  profileData: UserProfileData,
) => {
  try {
    const supabase = getSupabaseClient();

    // Update auth.users metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: profileData.name,
        avatar_url: profileData.avatar_url,
        ...profileData.metadata,
      },
    });

    if (authError) throw authError;

    // Update public.users profile
    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: profileData.name,
        avatar_url: profileData.avatar_url,
        metadata: profileData.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    // Log user activity
    await logUserActivity(userId, "profile_update");

    return data;
  } catch (error) {
    logger.error("Error updating user profile", error);
    throw error;
  }
};

/**
 * Create user profile in public.users table
 * @param userId User ID
 * @param profileData Profile data
 * @returns Created profile data
 */
export const createUserProfile = async (
  userId: string,
  profileData: UserProfileData,
) => {
  try {
    const supabase = getSupabaseClient();

    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (checkError) throw checkError;

    // If profile exists, update it
    if (existingProfile) {
      return updateUserProfile(userId, profileData);
    }

    // Create new profile
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: userId,
        full_name: profileData.name,
        avatar_url: profileData.avatar_url,
        metadata: profileData.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Error creating user profile", error);
    throw error;
  }
};

/**
 * Get user profile from public.users table
 * @param userId User ID
 * @returns User profile data
 */
export const getUserProfile = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Error getting user profile", error);
    throw error;
  }
};

/**
 * Log user activity
 * @param userId User ID
 * @param action Activity action
 * @param metadata Optional metadata
 */
export const logUserActivity = async (
  userId: string,
  action: string,
  metadata: Record<string, any> = {},
) => {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("user_activity").insert({
      user_id: userId,
      action,
      metadata,
      ip_address: await getClientIp(),
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    logger.error("Error logging user activity", error);
  }
};

/**
 * Get client IP address
 * @returns IP address or 'unknown'
 */
const getClientIp = async (): Promise<string> => {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return "unknown";
  }
};

/**
 * Set up auth state change listener
 * @param callback Callback function for auth state changes
 * @returns Unsubscribe function
 */
export const onAuthStateChange = (callback: (state: AuthState) => void) => {
  const supabase = getSupabaseClient();

  // Initial state
  callback({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Subscribe to auth changes
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === "SIGNED_IN") {
      const { data: userData } = await supabase.auth.getUser();
      callback({
        user: userData?.user || null,
        session,
        loading: false,
        error: null,
      });

      // Connect WebSocket with auth
      if (session) {
        const ws = getWebSocketService();
        await ws.connect();
        await ws.send({
          type: "auth",
          payload: {
            userId: userData?.user?.id,
            sessionId: session.id,
          },
        });
      }
    } else if (event === "SIGNED_OUT") {
      callback({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      // Disconnect WebSocket
      const ws = getWebSocketService();
      ws.disconnect();
    } else if (event === "USER_UPDATED") {
      const { data: userData } = await supabase.auth.getUser();
      callback({
        user: userData?.user || null,
        session,
        loading: false,
        error: null,
      });
    } else if (event === "PASSWORD_RECOVERY") {
      callback({
        user: null,
        session,
        loading: false,
        error: null,
      });
    }
  });

  // Initialize auth state
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      callback({
        user: null,
        session: null,
        loading: false,
        error,
      });
      return;
    }

    if (session) {
      supabase.auth.getUser().then(({ data: { user }, error: userError }) => {
        callback({
          user: user,
          session,
          loading: false,
          error: userError,
        });

        // Connect WebSocket with auth
        if (user) {
          const ws = getWebSocketService();
          ws.connect()
            .then(() => {
              ws.send({
                type: "auth",
                payload: {
                  userId: user.id,
                  sessionId: session.id,
                },
              }).catch((error) => {
                logger.error("Error sending auth message to WebSocket", error);
              });
            })
            .catch((error) => {
              logger.error("Error connecting to WebSocket", error);
            });
        }
      });
    } else {
      callback({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    }
  });

  // Return unsubscribe function
  return () => {
    data.subscription.unsubscribe();
  };
};
