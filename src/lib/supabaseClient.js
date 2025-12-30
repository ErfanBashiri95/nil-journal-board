import { createClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://nwiftmoqepjnroibrbpb.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "<<<anon-key>>>";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
