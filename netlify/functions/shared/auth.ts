import type { HandlerEvent } from "@netlify/functions";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { serviceClient } from "./supabase";

export function getBearerToken(event: HandlerEvent): string | null {
  const raw = event.headers["authorization"] ?? event.headers["Authorization"];
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw.trim());
  return match && match[1] ? match[1].trim() : null;
}

export type RoleRow = {
  user_id: string;
  role: "principal" | "teacher";
  status: "pending" | "approved" | "rejected" | "suspended";
};

export type AuthedCaller = { user: User; role: RoleRow; admin: SupabaseClient };

// Validates the caller's JWT with Supabase and loads the authoritative role row
// server-side. Never trusts any role/status sent by the browser.
export async function authenticate(event: HandlerEvent): Promise<AuthedCaller | null> {
  const token = getBearerToken(event);
  if (!token) return null;

  const admin = serviceClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: role, error: roleErr } = await admin
    .from("user_roles")
    .select("user_id, role, status")
    .eq("user_id", data.user.id)
    .single();

  if (roleErr || !role) return null;
  return { user: data.user, role: role as RoleRow, admin };
}

export function isApprovedPrincipal(caller: AuthedCaller): boolean {
  return caller.role.role === "principal" && caller.role.status === "approved";
}

export function isActiveStaff(caller: AuthedCaller): boolean {
  return caller.role.status === "approved" && (caller.role.role === "teacher" || caller.role.role === "principal");
}
