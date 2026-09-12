import type { HandlerResponse } from "@netlify/functions";

export function json(
  statusCode: number,
  body: unknown,
  headers: Record<string, string> = {},
): HandlerResponse {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  };
}

export function ok(data: unknown = { ok: true }, headers: Record<string, string> = {}): HandlerResponse {
  return json(200, data, headers);
}

// Public error messages are intentionally generic. Details go to logs only.
export function badRequest(message = "Invalid request.", headers: Record<string, string> = {}): HandlerResponse {
  return json(400, { error: message }, headers);
}

export function unauthorized(headers: Record<string, string> = {}): HandlerResponse {
  return json(401, { error: "Not authorized." }, headers);
}

export function forbidden(headers: Record<string, string> = {}): HandlerResponse {
  return json(403, { error: "Not authorized." }, headers);
}

export function notFound(headers: Record<string, string> = {}): HandlerResponse {
  return json(404, { error: "Not found." }, headers);
}

export function methodNotAllowed(headers: Record<string, string> = {}): HandlerResponse {
  return json(405, { error: "Method not allowed." }, headers);
}

export function tooManyRequests(headers: Record<string, string> = {}): HandlerResponse {
  return json(429, { error: "Too many requests. Please try again later." }, headers);
}

export function serverError(headers: Record<string, string> = {}): HandlerResponse {
  return json(500, { error: "Something went wrong. Please try again later." }, headers);
}

export function serviceUnavailable(
  message = "This feature is not configured yet.",
  headers: Record<string, string> = {},
): HandlerResponse {
  return json(503, { error: message }, headers);
}
