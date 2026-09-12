import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { corsHeaders, sameOriginOk } from "./cors";
import { badRequest, json, methodNotAllowed, tooManyRequests } from "./errors";
import { checkRateLimit, clientIp, sweep } from "./rate-limit";

const MAX_BODY_BYTES = 20 * 1024; // 20 KB JSON cap for ordinary functions.

export type GuardOptions = {
  route: string;
  method?: "POST" | "GET";
  requireJson?: boolean;
  rateLimit?: { limit: number; windowMs: number };
  maxBodyBytes?: number;
};

export type GuardResult =
  | { type: "response"; response: HandlerResponse }
  | { type: "ok"; body: unknown; ip: string; cors: Record<string, string> };

function bodyByteLength(event: HandlerEvent): number {
  if (!event.body) return 0;
  if (event.isBase64Encoded) {
    // Base64 expands ~4/3; measure decoded size.
    return Buffer.from(event.body, "base64").length;
  }
  return Buffer.byteLength(event.body, "utf8");
}

export function guard(event: HandlerEvent, opts: GuardOptions): GuardResult {
  const cors = corsHeaders(event);
  const method = opts.method ?? "POST";

  if (event.httpMethod === "OPTIONS") {
    return { type: "response", response: { statusCode: 204, headers: cors, body: "" } };
  }

  if (event.httpMethod !== method) {
    return { type: "response", response: methodNotAllowed(cors) };
  }

  // Reject cross-site state-changing requests.
  if (!sameOriginOk(event)) {
    return { type: "response", response: { ...json(403, { error: "Not authorized." }, cors) } };
  }

  const ip = clientIp(event);
  sweep();
  if (opts.rateLimit) {
    const allowed = checkRateLimit(`${opts.route}:${ip}`, opts.rateLimit.limit, opts.rateLimit.windowMs);
    if (!allowed) {
      return { type: "response", response: tooManyRequests(cors) };
    }
  }

  let body: unknown = undefined;
  const requireJson = opts.requireJson ?? method === "POST";
  if (requireJson) {
    const contentType = event.headers["content-type"] ?? event.headers["Content-Type"] ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return { type: "response", response: badRequest("Expected application/json.", cors) };
    }
    if (bodyByteLength(event) > (opts.maxBodyBytes ?? MAX_BODY_BYTES)) {
      return { type: "response", response: json(413, { error: "Request body too large." }, cors) };
    }
    try {
      const raw = event.isBase64Encoded && event.body ? Buffer.from(event.body, "base64").toString("utf8") : event.body;
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return { type: "response", response: badRequest("Invalid JSON.", cors) };
    }
  }

  return { type: "ok", body, ip, cors };
}
