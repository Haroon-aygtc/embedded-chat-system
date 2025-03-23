/**
 * DEPRECATED: This file is kept for reference during migration
 * All code should now use the MySQL client instead
 */

import logger from "@/utils/logger";

// Export a warning function for any code still trying to use Supabase
export const supabaseDeprecationWarning = () => {
  logger.error(
    "Supabase is no longer used in this application. Please update your code to use MySQL.",
  );
  throw new Error("Supabase is deprecated. Use MySQL instead.");
};

// Export a mock supabase object that throws errors when used
const supabase = new Proxy(
  {},
  {
    get: function (target, prop) {
      if (
        prop === "auth" ||
        prop === "from" ||
        prop === "storage" ||
        prop === "rpc" ||
        prop === "channel"
      ) {
        return new Proxy(
          {},
          {
            get: function () {
              supabaseDeprecationWarning();
              return null;
            },
            apply: function () {
              supabaseDeprecationWarning();
              return null;
            },
          },
        );
      }
      supabaseDeprecationWarning();
      return null;
    },
    apply: function () {
      supabaseDeprecationWarning();
      return null;
    },
  },
);

export default supabase;
