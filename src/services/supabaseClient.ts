/**
 * DEPRECATED: This file is kept for reference during migration
 * All code should now use the MySQL client instead
 */

import logger from "@/utils/logger";
import mockSupabase from "./mockSupabase";

// Check if Supabase credentials are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create a mock Supabase client for compatibility during migration
const supabase = {
  from: (table: string) => {
    logger.warn(
      `Supabase client is deprecated. Use MySQL client instead. Attempted to access table: ${table}`,
    );
    return {
      select: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      insert: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      update: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      delete: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      upsert: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      eq: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      neq: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      gt: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      lt: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      gte: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      lte: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      like: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      ilike: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      is: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      in: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      contains: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      containedBy: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      range: () => ({ data: null, error: new Error("Supabase is deprecated") }),
      single: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
      maybeSingle: () => ({
        data: null,
        error: new Error("Supabase is deprecated"),
      }),
    };
  },
  auth: {
    signInWithPassword: () => ({
      data: null,
      error: new Error("Supabase auth is deprecated"),
    }),
    signUp: () => ({
      data: null,
      error: new Error("Supabase auth is deprecated"),
    }),
    signOut: () => ({ error: new Error("Supabase auth is deprecated") }),
    getSession: () => ({
      data: { session: null },
      error: new Error("Supabase auth is deprecated"),
    }),
    getUser: () => ({
      data: { user: null },
      error: new Error("Supabase auth is deprecated"),
    }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    admin: {
      createUser: () => ({
        data: { user: { id: null } },
        error: new Error("Supabase auth is deprecated"),
      }),
      deleteUser: () => ({ error: new Error("Supabase auth is deprecated") }),
    },
  },
  storage: {
    from: () => ({
      upload: () => ({
        data: null,
        error: new Error("Supabase storage is deprecated"),
      }),
      download: () => ({
        data: null,
        error: new Error("Supabase storage is deprecated"),
      }),
      remove: () => ({
        data: null,
        error: new Error("Supabase storage is deprecated"),
      }),
      list: () => ({
        data: null,
        error: new Error("Supabase storage is deprecated"),
      }),
    }),
  },
  rpc: () => ({ data: null, error: new Error("Supabase RPC is deprecated") }),
};

export default supabase;
