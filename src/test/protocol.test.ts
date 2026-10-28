/** Fixture-only protocol tests ("/fixture/..." are NOT real ALiN routes). */
import { describe, expect, it, vi } from "vitest";
import { buildUrl, createAdapter, createCommandAttempt, OutcomeUnknownError, RequestBuildError, sendAttempt } from "@/lib/api/adapter";
import type { OperationMapping, RouteBinding } from "@/lib/api/operations";

const ORIGIN = "https://api.fixture.test";
const ok = (b: unknown) => typeof b === "object" && b !== null && (b as { id?: unknown }).id === "prp-9";
const route: RouteBinding = { method: "POST", pathTemplate: "/fixture/rfqs/:rfqId/proposals", validateResponse: ok };
const cmdOps: OperationMapping[] = [{ id: "proposal.submit", kind: "command", status: "verified", route }];
const mk = (ops: OperationMapping[], f: (u: string, i?: RequestInit) => Promise<Response>) => {
  const getAccessToken = vi.fn(async () => "tok");
  return { a: createAdapter({ mode: "production", apiOrigin: ORIGIN, operations: ops, getAccessToken, fetchImpl: f as unknown as typeof fetch }), getAccessToken };
};

describe("dynamic ID traversal is rejected before token/network", () => {
  it.each(["..", ".", "...", "a/b", "..%2f", "%2e%2e", "a\\b", "a b", "x?y", "x#y", "é", "a".repeat(129)])("rejects %j", async (bad) => {
    expect(() => buildUrl(ORIGIN, { method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" }, { params: { rfqId: bad } })).toThrow(
      expect.objectContaining({ code: expect.stringMatching(/INVALID_PARAM/) }),
    );
    const f = vi.fn();
    const { a, getAccessToken } = mk(cmdOps, f);
    const at = createCommandAttempt("proposal.submit", { params: { rfqId: bad }, body: {} });
    await expect(sendAttempt(a, at)).rejects.toBeInstanceOf(RequestBuildError);
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });
  it("accepts an opaque id", () => {
    expect(buildUrl(ORIGIN, { method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" }, { params: { rfqId: "rfq_01.A-9" } }).pathname).toBe("/fixture/rfqs/rfq_01.A-9");
  });
});

describe("response schema validation gates bindings", () => {
  it("a verified route without a response schema stays unavailable and sends nothing", async () => {
    const f = vi.fn();
    const { a } = mk([{ id: "proposal.submit", kind: "command", status: "verified", route: { method: "POST", pathTemplate: "/fixture/x" } }], f);
    expect(a.isAvailable("proposal.submit")).toBe(false);
    await expect(sendAttempt(a, createCommandAttempt("proposal.submit", { body: {} }))).rejects.toMatchObject({ reason: "response_schema_missing" });
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    ["non-JSON 200", () => new Response("<html>", { status: 200 })],
    ["empty 200", () => new Response("", { status: 200 })],
    ["schema mismatch 200", () => new Response(JSON.stringify({ id: "other" }), { status: 200 })],
  ])("malformed successful command response (%s) is outcome-unknown with the same key", async (_n, resp) => {
    const seen: string[] = [];
    const f = vi.fn(async (_u: string, i?: RequestInit) => { seen.push((i?.headers as Record<string, string>)["idempotency-key"] ?? ""); return resp(); });
    const { a } = mk(cmdOps, f);
    const at = createCommandAttempt("proposal.submit", { params: { rfqId: "rfq-1" }, body: { totalCentavos: 100 } });
    const e1 = await sendAttempt(a, at).catch((e: unknown) => e);
    expect(e1).toBeInstanceOf(OutcomeUnknownError);
    const retry = (e1 as OutcomeUnknownError).attempt;
    expect(retry.meta.idempotencyKey).toBe(at.meta.idempotencyKey);
    await sendAttempt(a, retry).catch(() => undefined);
    expect(seen).toEqual([at.meta.idempotencyKey, at.meta.idempotencyKey]);
  });

  it("valid successful response is returned", async () => {
    const { a } = mk(cmdOps, async () => new Response(JSON.stringify({ id: "prp-9" }), { status: 201 }));
    await expect(sendAttempt(a, createCommandAttempt("proposal.submit", { params: { rfqId: "rfq-1" }, body: {} }))).resolves.toEqual({ id: "prp-9" });
  });

  it("malformed read response is an error, never demo data", async () => {
    const { a } = mk([{ id: "rfq.detail", kind: "read", status: "verified", route: { method: "GET", pathTemplate: "/fixture/r/:rfqId", validateResponse: ok } }], async () => new Response("{}", { status: 200 }));
    await expect(a.call("rfq.detail", { params: { rfqId: "r1" } })).rejects.toMatchObject({ code: "MALFORMED_RESPONSE" });
  });
});
