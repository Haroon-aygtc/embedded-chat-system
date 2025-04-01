/**
 * This file has been removed as part of the migration from Supabase to MySQL.
 * All code should now use the MySQL client instead.
 *
 * IMPORTANT: This file is kept only for backward compatibility.
 * New code should directly import from mysqlClient.ts
 */

import logger from "@/utils/logger";
import { getMySQLClient } from "./mysqlClient";

// Throw error for any code still trying to use Supabase directly
export const supabaseError = () => {
  const error = new Error(
    "Supabase is no longer used in this application. Please update your code to use MySQL.",
  );
  logger.error(error);
  throw error;
};

// Export MySQL client as the default to ease migration
export default {
  // Provide a migration path to MySQL
  client: {
    from: () => ({
      select: async () => {
        logger.warn(
          "Using deprecated Supabase client interface. Please update to use MySQL directly.",
        );
        return getMySQLClient();
      },
    }),
  },
  // Throw errors for any other Supabase-specific methods
  auth: new Proxy(
    {},
    {
      get: () => supabaseError(),
    },
  ),
  storage: new Proxy(
    {},
    {
      get: () => supabaseError(),
    },
  ),
  rpc: new Proxy(
    {},
    {
      get: () => supabaseError(),
    },
  ),
};
