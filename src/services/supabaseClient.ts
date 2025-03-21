import { createClient } from "@supabase/supabase-js";
import mockSupabase from "./mockSupabase";

// Check if Supabase credentials are available
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Use mock client if credentials are missing
let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials are missing. Using mock client for development.",
  );
  supabase = mockSupabase;
} else {
  // Initialize real Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

export default supabase;
