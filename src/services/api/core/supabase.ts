/**
 * Supabase Client Module
 *
 * This module initializes and exports the Supabase client for use throughout the application.
 */

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials missing. Features requiring database access will not work.",
  );
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export { supabase };
export default supabase;
