import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "./env";

// When configuration is missing (e.g. before Netlify env vars are set) we still
// construct a client with harmless placeholders so the app can render a clear
// "not configured" state instead of crashing at import time.
const url = isSupabaseConfigured ? env.supabaseUrl : "https://placeholder.supabase.co";
const anon = isSupabaseConfigured ? env.supabaseAnonKey : "public-anon-placeholder";

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export function publicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
