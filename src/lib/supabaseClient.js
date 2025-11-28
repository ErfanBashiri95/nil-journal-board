import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Supabase env vars missing. لطفاً VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY را در فایل .env.local تنظیم کن."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
