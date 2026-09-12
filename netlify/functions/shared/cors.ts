import type { HandlerEvent } from "@netlify/functions";
import { siteUrl } from "./env";

// Same-origin CORS. If VITE_SITE_URL / ALLOWED_ORIGIN is configured we echo it
// only when it matches; otherwise we fall back to the request's own origin so
// local previews keep working. State-changing requests are additionally checked
// with `sameOriginOk`.

export function corsHeaders(event: HandlerEvent): Record<string, string> {
  const allowed = siteUrl();
  const origin = event.headers["origin"] ?? event.headers["Origin"];
  const allowOrigin = allowed ?? origin ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (allowOrigin) {
    headers["Access-Control-Allow-Origin"] = allowOrigin;
  }
  return headers;
}

// Reject cross-site POSTs. When an allowed origin is configured, the request's
// Origin must match it. When not configured, a present Origin must at least
// share the request host.
export function sameOriginOk(event: HandlerEvent): boolean {
  const origin = event.headers["origin"] ?? event.headers["Origin"];
  const allowed = siteUrl();

  if (allowed) {
    if (!origin) return true; // non-browser or same-origin without Origin
    return normalize(origin) === normalize(allowed);
  }

  if (!origin) return true;
  const host = event.headers["host"] ?? event.headers["Host"];
  if (!host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function normalize(u: string): string {
  try {
    const url = new URL(u);
    return `${url.protocol}//${url.host}`;
  } catch {
    return u.replace(/\/+$/, "");
  }
}
