/**
 * This file has been removed as part of the migration from Supabase to MySQL.
 * All code should now use the MySQL client instead.
 */

import logger from "@/utils/logger";

// Throw error for any code still trying to use Supabase
export const supabaseError = () => {
  const error = new Error(
    "Supabase is no longer used in this application. Please update your code to use MySQL.",
  );
  logger.error(error);
  throw error;
};

// All methods now throw errors to prevent accidental usage
export const getSupabaseClient = supabaseError;
export const supabaseDeprecationWarning = supabaseError;
export const getCurrentSession = supabaseError;
export const getCurrentUser = supabaseError;

// Export a proxy that throws errors when used
export const supabase = new Proxy(
  {},
  {
    get: () => supabaseError(),
    apply: () => supabaseError(),
  },
);

export default {
  supabaseError,
};
