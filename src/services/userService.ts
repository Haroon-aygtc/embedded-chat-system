import supabase from "./supabaseClient";
import { User } from "@/types/auth";
import { Tables } from "@/types/supabase";

type SupabaseUser = Tables<"users">;

// Convert Supabase user to our app's User type
const mapSupabaseUser = (user: SupabaseUser): User => ({
  id: user.id,
  email: user.email,
  name: user.full_name || user.email.split("@")[0],
  role: user.role as "admin" | "user",
  avatar: user.avatar_url || undefined,
});

// User management service
export const userService = {
  // Get all users with pagination and filtering
  getUsers: async ({
    page = 1,
    pageSize = 10,
    searchTerm = "",
    roleFilter = null,
    statusFilter = null,
  }: {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    roleFilter?: string | null;
    statusFilter?: string | null;
  }) => {
    try {
      let query = supabase.from("users").select("*", { count: "exact" });

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`,
        );
      }

      // Apply role filter
      if (roleFilter) {
        query = query.eq("role", roleFilter);
      }

      // Apply status filter
      if (statusFilter) {
        query = query.eq("is_active", statusFilter === "active");
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        users: data.map(mapSupabaseUser),
        totalCount: count || 0,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data ? mapSupabaseUser(data) : null;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return null;
    }
  },

  // Create a new user
  createUser: async ({
    email,
    name,
    role,
    isActive,
    password,
  }: {
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    password?: string;
  }): Promise<User | null> => {
    try {
      // First create the auth user if password is provided
      let authId = null;
      if (password) {
        const { data: authData, error: authError } =
          await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });

        if (authError) throw authError;
        authId = authData.user.id;
      }

      // Then create the user record in our users table
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            email,
            full_name: name,
            role,
            is_active: isActive,
            auth_id: authId,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data ? mapSupabaseUser(data) : null;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Update an existing user
  updateUser: async (
    id: string,
    {
      email,
      name,
      role,
      isActive,
    }: {
      email?: string;
      name?: string;
      role?: string;
      isActive?: boolean;
    },
  ): Promise<User | null> => {
    try {
      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.full_name = name;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.is_active = isActive;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data ? mapSupabaseUser(data) : null;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  // Delete a user
  deleteUser: async (id: string): Promise<boolean> => {
    try {
      // First get the user to check if they have an auth_id
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("auth_id")
        .eq("id", id)
        .single();

      if (userError) throw userError;

      // If the user has an auth_id, delete the auth user
      if (userData?.auth_id) {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          userData.auth_id,
        );
        if (authError) throw authError;
      }

      // Delete the user from our users table
      const { error } = await supabase.from("users").delete().eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Get user activity logs
  getUserActivity: async (userId: string) => {
    try {
      // Query user_activity table (we'll create this in the migration)
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching activity for user ${userId}:`, error);
      return [];
    }
  },

  // Get user sessions
  getUserSessions: async (userId: string) => {
    try {
      // Query user_sessions table (we'll create this in the migration)
      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("last_active_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching sessions for user ${userId}:`, error);
      return [];
    }
  },

  // Log user activity
  logUserActivity: async ({
    userId,
    action,
    ipAddress,
    userAgent,
    metadata = {},
  }: {
    userId: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { error } = await supabase.from("user_activity").insert([
        {
          user_id: userId,
          action,
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata,
        },
      ]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error logging user activity:", error);
      return false;
    }
  },
};

export default userService;
