// Browser-safe configuration only. These values are compiled into the bundle
// and are NOT secret. Server-only secrets never appear here.

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  siteUrl: import.meta.env.VITE_SITE_URL ?? "",
  turnstileSiteKey: import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "",
};

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
export const isTurnstileConfigured = Boolean(env.turnstileSiteKey);

export function canonicalUrl(path: string): string {
  const base = env.siteUrl.replace(/\/+$/, "");
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
