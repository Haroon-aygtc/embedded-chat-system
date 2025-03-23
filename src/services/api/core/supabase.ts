/**
 * DEPRECATED: This file is kept for reference during migration
 * All code should now use the MySQL client instead
 */

import logger from "@/utils/logger";

// Placeholder for compatibility during migration
export const getSupabaseClient = () => {
  logger.warn(
    "getSupabaseClient is deprecated. Use getMySQLClientForAPI instead.",
  );
  return null;
};

// Export a warning function for any code still trying to use Supabase
export const supabaseDeprecationWarning = () => {
  logger.warn(
    "Supabase is no longer used in this application. Please update your code to use MySQL.",
  );
};

export const getCurrentSession = async () => {
  logger.warn(
    "getCurrentSession is deprecated. Use MySQL authentication instead.",
  );
  return null;
};

export const getCurrentUser = async () => {
  logger.warn(
    "getCurrentUser is deprecated. Use MySQL authentication instead.",
  );
  return null;
};

// Export a mock supabase object for compatibility
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ data: null, error: null }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
  }),
};

export default {
  getSupabaseClient,
  supabaseDeprecationWarning,
  getCurrentSession,
  getCurrentUser,
  supabase,
};
