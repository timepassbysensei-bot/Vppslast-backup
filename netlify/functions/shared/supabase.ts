import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl, serviceRoleKey } from "./env";

// Full-power client. Bypasses RLS. Use only after authorization checks.
export function serviceClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Client bound to a caller's JWT. Subject to RLS as that user.
export function userClient(accessToken: string): SupabaseClient {
  return createClient(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
