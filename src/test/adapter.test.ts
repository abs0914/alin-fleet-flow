import { describe, expect, it, vi } from "vitest";
import { createAdapter, IntegrationRequiredError } from "@/lib/api/adapter";
import { OPERATIONS, type OperationMapping } from "@/lib/api/operations";

describe("fail-closed production adapter", () => {
  it("every shipped operation is unverified with no route", () => {
    expect(OPERATIONS.every((o) => o.status === "unverified" && o.route === null)).toBe(true);
  });

  it("missing API origin throws IntegrationRequired without any network call", async () => {
    const fetchImpl = vi.fn();
    const a = createAdapter({ mode: "production", fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(a.call("vehicle.list")).rejects.toMatchObject({ reason: "config_missing", code: "INTEGRATION_UNAVAILABLE" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(a.isAvailable("vehicle.list")).toBe(false);
  });

  it("configured origin but unverified route still fails closed", async () => {
    const fetchImpl = vi.fn();
    const a = createAdapter({ mode: "production", apiOrigin: "https://api.example.test", fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(a.call("standardOffer.accept", { id: "x" })).rejects.toBeInstanceOf(IntegrationRequiredError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not fall back to demo data on API failure", async () => {
    const ops: OperationMapping[] = [{ id: "vehicle.list", kind: "read", status: "verified", route: { method: "GET", path: "/test-only" } }];
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ message: "down" }), { status: 503 }));
    const a = createAdapter({ mode: "production", apiOrigin: "https://api.example.test", operations: ops, getAccessToken: async () => "t", fetchImpl });
    await expect(a.call("vehicle.list")).rejects.toMatchObject({ status: 503, message: "down" });
  });

  it("refuses to call without an access token", async () => {
    const ops: OperationMapping[] = [{ id: "vehicle.list", kind: "read", status: "verified", route: { method: "GET", path: "/test-only" } }];
    const fetchImpl = vi.fn();
    const a = createAdapter({ mode: "production", apiOrigin: "https://api.example.test", operations: ops, getAccessToken: async () => null, fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(a.call("vehicle.list")).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("demo mode is explicit and returns conflict for a lost standard job", async () => {
    const a = createAdapter({ mode: "demo" });
    await expect(a.call("standardOffer.accept", { id: "off-3" })).rejects.toMatchObject({ code: "JOB_UNAVAILABLE", message: "This job is no longer available." });
  });
});
