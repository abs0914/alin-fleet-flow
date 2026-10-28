/**
 * Fixture-only tests. Routes below ("/fixture/...") are test fixtures, NOT real
 * ALiN routes. They prove client-side guards; they certify nothing about the backend.
 */
import { describe, expect, it, vi } from "vitest";
import {
  buildUrl,
  createAdapter,
  createCommandAttempt,
  IntegrationRequiredError,
  OutcomeUnknownError,
  RequestBuildError,
  sameLogicalPayload,
  sendAttempt,
} from "@/lib/api/adapter";
import { OPERATIONS, type OperationMapping, type RouteBinding } from "@/lib/api/operations";

const ORIGIN = "https://api.fixture.test";
const TOKEN = "fixture-token-SECRET";

const okSchema = (b: unknown) => typeof b === "object" && b !== null && (b as { ok?: unknown }).ok === true;
const withSchema = (route: RouteBinding): RouteBinding => ("validateResponse" in route ? route : { ...route, validateResponse: okSchema });
const read = (route: RouteBinding): OperationMapping[] => [{ id: "rfq.detail", kind: "read", status: "verified", route: withSchema(route) }];
const cmd = (route: RouteBinding): OperationMapping[] => [{ id: "proposal.submit", kind: "command", status: "verified", route: withSchema(route) }];
const okFetch = () => vi.fn(async (_u: string, _i?: RequestInit) => new Response(JSON.stringify({ ok: true }), { status: 200 }));

function mk(ops: OperationMapping[], fetchImpl: ReturnType<typeof okFetch>, token: string | null = TOKEN) {
  const getAccessToken = vi.fn(async () => token);
  const a = createAdapter({ mode: "production", apiOrigin: ORIGIN, operations: ops, getAccessToken, fetchImpl: fetchImpl as unknown as typeof fetch });
  return { a, getAccessToken };
}

describe("fail-closed production adapter", () => {
  it("every shipped operation is unverified with no route", () => {
    expect(OPERATIONS.every((o) => o.status === "unverified" && o.route === null)).toBe(true);
  });

  it("missing API origin throws IntegrationRequired without any network call", async () => {
    const f = vi.fn();
    const a = createAdapter({ mode: "production", fetchImpl: f as unknown as typeof fetch });
    await expect(a.call("vehicle.list")).rejects.toMatchObject({ reason: "config_missing", code: "INTEGRATION_UNAVAILABLE" });
    expect(f).not.toHaveBeenCalled();
    expect(a.isAvailable("vehicle.list")).toBe(false);
  });

  it("configured origin but unverified (shipped) route still fails closed", async () => {
    const f = vi.fn();
    const a = createAdapter({ mode: "production", apiOrigin: ORIGIN, fetchImpl: f as unknown as typeof fetch });
    await expect(a.call("standardOffer.accept", { body: { id: "x" } })).rejects.toBeInstanceOf(IntegrationRequiredError);
    expect(f).not.toHaveBeenCalled();
  });

  it("does not fall back to demo data on API failure", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ message: "down" }), { status: 503 }));
    const { a } = mk(read({ method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" }), f as never);
    await expect(a.call("rfq.detail", { params: { rfqId: "r1" } })).rejects.toMatchObject({ status: 503, message: "down" });
  });

  it("refuses to call without an access token", async () => {
    const f = okFetch();
    const { a } = mk(read({ method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" }), f, null);
    await expect(a.call("rfq.detail", { params: { rfqId: "r1" } })).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(f).not.toHaveBeenCalled();
  });
});

describe("request builder", () => {
  it("fills encoded path params and serializes allowlisted query on GET", async () => {
    const f = okFetch();
    const { a } = mk(read({ method: "GET", pathTemplate: "/fixture/rfqs/:rfqId", query: ["cursor", "limit"] }), f);
    await a.call("rfq.detail", { params: { rfqId: "rfq_1.A-b" }, query: { limit: 20, cursor: "x&y" } });
    const [url, init] = f.mock.calls[0]!;
    expect(url).toBe(`${ORIGIN}/fixture/rfqs/rfq_1.A-b?cursor=x%26y&limit=20`);
    expect(init?.method).toBe("GET");
    expect(init?.body).toBeUndefined();
    expect(init?.redirect).toBe("error");
  });

  it("rejects missing, empty and unused params", () => {
    const r: RouteBinding = { method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" };
    expect(() => buildUrl(ORIGIN, r, {})).toThrow(expect.objectContaining({ code: "MISSING_PARAM" }));
    expect(() => buildUrl(ORIGIN, r, { params: { rfqId: "" } })).toThrow(expect.objectContaining({ code: "MISSING_PARAM" }));
    expect(() => buildUrl(ORIGIN, r, { params: { rfqId: "1", fleetId: "2" } })).toThrow(expect.objectContaining({ code: "UNUSED_PARAM" }));
  });

  it("rejects non-allowlisted query keys", () => {
    expect(() => buildUrl(ORIGIN, { method: "GET", pathTemplate: "/fixture/list", query: ["limit"] }, { query: { fleetId: "B" } })).toThrow(
      expect.objectContaining({ code: "QUERY_NOT_ALLOWED" }),
    );
  });

  it.each(["https://evil.test/x", "//evil.test/x", "fixture/x", "/fixture/../admin", "/fixture/./x", "/a\\b", "/x?y=1", "javascript:alert(1)", "/a//b"])(
    "rejects unsafe mapping %s",
    (pathTemplate) => {
      expect(() => buildUrl(ORIGIN, { method: "GET", pathTemplate })).toThrow(RequestBuildError);
    },
  );

  it.each(["http://api.fixture.test", "https://user:pw@api.fixture.test", "https://api.fixture.test/base", "not a url"])("rejects unsafe origin %s", (o) => {
    expect(() => buildUrl(o, { method: "GET", pathTemplate: "/fixture" })).toThrow(expect.objectContaining({ code: "INVALID_ORIGIN" }));
  });

  it("never reads the token or calls fetch when the mapping is unsafe", async () => {
    const f = okFetch();
    const { a, getAccessToken } = mk(read({ method: "GET", pathTemplate: "//evil.test/steal" }), f);
    await expect(a.call("rfq.detail")).rejects.toBeInstanceOf(RequestBuildError);
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the bearer token only to the configured origin", async () => {
    const f = okFetch();
    const { a } = mk(read({ method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" }), f);
    await a.call("rfq.detail", { params: { rfqId: "r1" } });
    const [url, init] = f.mock.calls[0]!;
    expect(new URL(url).origin).toBe(ORIGIN);
    expect((init?.headers as Record<string, string>)["authorization"]).toBe(`Bearer ${TOKEN}`);
    expect(url).not.toContain(TOKEN);
  });

  it("rejects a body on GET", async () => {
    const f = okFetch();
    const { a } = mk(read({ method: "GET", pathTemplate: "/fixture/rfqs/:rfqId" }), f);
    await expect(a.call("rfq.detail", { params: { rfqId: "r" }, body: { x: 1 } })).rejects.toMatchObject({ code: "BODY_NOT_ALLOWED" });
    expect(f).not.toHaveBeenCalled();
  });
});

describe("command metadata and retries", () => {
  const route: RouteBinding = { method: "POST", pathTemplate: "/fixture/rfqs/:rfqId/proposals" };

  it("refuses a command without idempotency/correlation metadata before reading token or network", async () => {
    const f = okFetch();
    const { a, getAccessToken } = mk(cmd(route), f);
    await expect(a.call("proposal.submit", { params: { rfqId: "r" }, body: {} })).rejects.toMatchObject({ code: "MISSING_COMMAND_METADATA" });
    await expect(a.call("proposal.submit", { params: { rfqId: "r" } }, { idempotencyKey: "", correlationId: "c" })).rejects.toMatchObject({ code: "MISSING_COMMAND_METADATA" });
    expect(getAccessToken).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });

  it("unknown outcome returns the same attempt; retry reuses identical key and body", async () => {
    let n = 0;
    const f = vi.fn(async (_u: string, _i?: RequestInit) => {
      n++;
      if (n === 1) throw new TypeError("network down");
      return new Response(JSON.stringify({ ok: true, id: "p1" }), { status: 201 });
    });
    const { a } = mk(cmd(route), f as never);
    const attempt = createCommandAttempt("proposal.submit", { params: { rfqId: "r1" }, body: { totalCentavos: 3_500_000 } }, 4);
    const err = await sendAttempt(a, attempt).catch((e) => e);
    expect(err).toBeInstanceOf(OutcomeUnknownError);
    expect((err as OutcomeUnknownError).attempt.meta.idempotencyKey).toBe(attempt.meta.idempotencyKey);
    await sendAttempt(a, (err as OutcomeUnknownError).attempt);
    const h = f.mock.calls.map(([, i]) => i?.headers as Record<string, string>);
    expect(h[0]!["idempotency-key"]).toBe(h[1]!["idempotency-key"]);
    expect(h[0]!["x-correlation-id"]).toBe(h[1]!["x-correlation-id"]);
    expect(h[0]!["if-match"]).toBe("4");
    expect(f.mock.calls[0]![1]?.body).toBe(f.mock.calls[1]![1]?.body);
  });

  it("5xx on a command is treated as unknown outcome, not failure", async () => {
    const f = vi.fn(async () => new Response("{}", { status: 504 }));
    const { a } = mk(cmd(route), f as never);
    const attempt = createCommandAttempt("proposal.submit", { params: { rfqId: "r1" }, body: {} });
    await expect(sendAttempt(a, attempt)).rejects.toBeInstanceOf(OutcomeUnknownError);
  });

  it("attempt payload is frozen and changed payloads are detected", () => {
    const body = { totalCentavos: 100 };
    const attempt = createCommandAttempt("proposal.submit", { body });
    body.totalCentavos = 999; // caller mutation must not leak in
    expect((attempt.input.body as { totalCentavos: number }).totalCentavos).toBe(100);
    expect(() => {
      (attempt.input.body as { totalCentavos: number }).totalCentavos = 5;
    }).toThrow();
    expect(sameLogicalPayload(attempt, "proposal.submit", { body: { totalCentavos: 100 } })).toBe(true);
    expect(sameLogicalPayload(attempt, "proposal.submit", { body: { totalCentavos: 101 } })).toBe(false);
  });
});

describe("demo mode", () => {
  it("is explicit and returns conflict for a lost standard job", async () => {
    const a = createAdapter({ mode: "demo" });
    await expect(a.call("standardOffer.accept", { body: { id: "off-3" } })).rejects.toMatchObject({ code: "JOB_UNAVAILABLE", message: "This job is no longer available." });
  });
});
