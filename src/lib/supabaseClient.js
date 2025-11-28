import { createClient } from "@supabase/supabase-js";

// ⛔ مقدارهای خودت رو اینجا بذار
const FALLBACK_SUPABASE_URL = "https://nwiftmoqepjnroibrbpb.supabase.co"
const FALLBACK_SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aWZ0bW9xZXBqbnJvaWJyYnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0NTIwNjYsImV4cCI6MjA2OTAyODA2Nn0.q8xYS7rYzh79fQW9YbHzOC0lnhS_ptdH5uR1SlwlzpM"

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase config missing – check env or fallback values.");
  throw new Error("supabaseUrl is required");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
