// Server-only environment access + validation.
// These values must NEVER be imported into frontend code.

export function optionalEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function requireEnv(name: string): string {
  const v = optionalEnv(name);
  if (!v) {
    throw new EnvError(`Missing required environment variable: ${name}`);
  }
  return v;
}

export class EnvError extends Error {}

export function supabaseUrl(): string {
  // The URL is browser-safe; functions may read either name.
  return optionalEnv("SUPABASE_URL") ?? requireEnv("VITE_SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return optionalEnv("SUPABASE_ANON_KEY") ?? requireEnv("VITE_SUPABASE_ANON_KEY");
}

export function serviceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function siteUrl(): string | undefined {
  return optionalEnv("ALLOWED_ORIGIN") ?? optionalEnv("VITE_SITE_URL");
}
