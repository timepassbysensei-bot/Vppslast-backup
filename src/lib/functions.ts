import { supabase } from "./supabase";

const BASE = "/.netlify/functions";

export class FunctionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function accessToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

async function parse(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// Calls a protected function, attaching the caller's Supabase JWT.
export async function callAuthed<T = unknown>(name: string, body: unknown): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${BASE}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await parse(res)) as { error?: string };
  if (!res.ok) {
    throw new FunctionError(data.error ?? "Request failed.", res.status);
  }
  return data as T;
}

// Calls an anonymous/public function (no auth token).
export async function callPublic<T = unknown>(name: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await parse(res)) as { error?: string };
  if (!res.ok) {
    throw new FunctionError(data.error ?? "Request failed.", res.status);
  }
  return data as T;
}

export async function getPublic<T = unknown>(name: string): Promise<T> {
  const res = await fetch(`${BASE}/${name}`, { method: "GET" });
  const data = (await parse(res)) as { error?: string };
  if (!res.ok) {
    throw new FunctionError(data.error ?? "Request failed.", res.status);
  }
  return data as T;
}
