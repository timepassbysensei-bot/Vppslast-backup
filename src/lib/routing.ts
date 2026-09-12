import type { UserRole, UserStatus } from "./types";

export type AdminDestination = "login" | "pending" | "teacher" | "principal";

// Pure role-routing rule shared by the auth guard and the pending page.
export function resolveDestination(args: {
  hasSession: boolean;
  role: { role: UserRole; status: UserStatus } | null;
}): AdminDestination {
  if (!args.hasSession) return "login";
  const r = args.role;
  if (!r) return "pending";
  if (r.role === "principal" && r.status === "approved") return "principal";
  if (r.status === "approved" && (r.role === "teacher" || r.role === "principal")) return "teacher";
  return "pending";
}
