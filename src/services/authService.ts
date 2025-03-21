import supabase from "./supabaseClient";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  PasswordResetRequest,
  PasswordResetConfirmation,
  AuthResponse,
  SupabaseAuthResponse,
} from "@/types/auth";

/**
 * Converts a Supabase user to our application User type
 */
const mapSupabaseUser = (supabaseUser: any): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name:
      supabaseUser.user_metadata?.name ||
      supabaseUser.email?.split("@")[0] ||
      "User",
    role: supabaseUser.user_metadata?.role || "user",
    avatar:
      supabaseUser.user_metadata?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.id}`,
    metadata: supabaseUser.user_metadata,
    lastLogin: supabaseUser.last_sign_in_at,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at,
  };
};

/**
 * Handle authentication errors and provide consistent error messages
 */
const handleAuthError = (error: any): string => {
  console.error("Auth error:", error);

  // Map common Supabase error messages to user-friendly messages
  if (error.message?.includes("Email not confirmed")) {
    return "Please verify your email address before logging in";
  }
  if (error.message?.includes("Invalid login credentials")) {
    return "Invalid email or password";
  }
  if (error.message?.includes("Email already registered")) {
    return "An account with this email already exists";
  }
  if (error.message?.includes("Password should be")) {
    return "Password must be at least 6 characters long";
  }

  return error.message || "An authentication error occurred";
};

/**
 * Authentication service for handling user authentication with Supabase
 */
const authService = {
  /**
   * Login a user with email and password
   */
  login: async ({
    email,
    password,
  }: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("User not found");

      const user = mapSupabaseUser(data.user);
      const token = data.session?.access_token || "";

      return { user, token, session: data.session };
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Register a new user
   */
  register: async ({
    email,
    password,
    name,
  }: RegisterCredentials): Promise<void> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role: "user",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Logout the current user
   */
  logout: async (): Promise<void> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Logout error:", error);
      // We don't throw here as we want to clear local state regardless
    }
  },

  /**
   * Get the current authenticated user
   */
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!data.user) return null;

      return mapSupabaseUser(data.user);
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  /**
   * Get the current session
   */
  getSession: async (): Promise<SupabaseAuthResponse> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { user: data.session?.user || null, session: data.session, error };
    } catch (error) {
      console.error("Get session error:", error);
      return { user: null, session: null, error: error as Error };
    }
  },

  /**
   * Request a password reset for a user
   */
  requestPasswordReset: async ({
    email,
  }: PasswordResetRequest): Promise<void> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Reset a user's password with a reset token
   */
  resetPassword: async ({
    newPassword,
  }: PasswordResetConfirmation): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Update a user's profile
   */
  updateProfile: async (updates: Partial<User>): Promise<User> => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          name: updates.name,
          avatar: updates.avatar,
          ...updates.metadata,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("User not found");

      return mapSupabaseUser(data.user);
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Change a user's email
   */
  changeEmail: async (newEmail: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Change a user's password
   */
  changePassword: async (newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Send a verification email to the current user
   */
  sendVerificationEmail: async (): Promise<void> => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("No user logged in");

      // This is a workaround as Supabase doesn't have a direct method to resend verification
      await supabase.auth.signInWithOtp({
        email: data.user.email || "",
      });
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },

  /**
   * Check if a user has a specific role
   */
  hasRole: async (role: string): Promise<boolean> => {
    try {
      const user = await authService.getCurrentUser();
      return user?.role === role;
    } catch (error) {
      return false;
    }
  },

  /**
   * Sign in with a third-party provider
   */
  signInWithProvider: async (
    provider: "google" | "github" | "facebook",
  ): Promise<void> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      throw new Error(handleAuthError(error));
    }
  },
};

export default authService;
