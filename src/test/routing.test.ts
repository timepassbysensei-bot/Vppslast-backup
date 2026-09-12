import { describe, it, expect } from "vitest";
import { resolveDestination } from "@/lib/routing";

describe("resolveDestination (role routing)", () => {
  it("sends unauthenticated users to login", () => {
    expect(resolveDestination({ hasSession: false, role: null })).toBe("login");
  });

  it("sends unknown/loading role to pending", () => {
    expect(resolveDestination({ hasSession: true, role: null })).toBe("pending");
  });

  it("sends pending teacher to pending", () => {
    expect(resolveDestination({ hasSession: true, role: { role: "teacher", status: "pending" } })).toBe("pending");
  });

  it("sends approved teacher to teacher dashboard", () => {
    expect(resolveDestination({ hasSession: true, role: { role: "teacher", status: "approved" } })).toBe("teacher");
  });

  it("sends approved principal to principal dashboard", () => {
    expect(resolveDestination({ hasSession: true, role: { role: "principal", status: "approved" } })).toBe("principal");
  });

  it("blocks suspended and rejected accounts (routes to pending screen)", () => {
    expect(resolveDestination({ hasSession: true, role: { role: "teacher", status: "suspended" } })).toBe("pending");
    expect(resolveDestination({ hasSession: true, role: { role: "teacher", status: "rejected" } })).toBe("pending");
  });
});
