import { afterEach, describe, expect, it, vi } from "vitest";
import { loginExistingAccount } from "@/lib/api/adapter";
import { OPERATIONS } from "@/lib/api/operations";

const credentials = { email: " fleet@example.test ", password: "sample password " };
const ok = () => new Response(JSON.stringify({ access_token: "fixture-token", expires_in: 3600, refresh_token: "discard-me" }), { status: 200 });

afterEach(() => { vi.useRealTimers(); });

describe("Existing ALiN login", () => {
  it("posts email/password to the exact confirmed URL without cookies, redirects, or bearer", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(ok());
    await loginExistingAccount(credentials, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, options] = fetcher.mock.calls[0] ?? [];
    expect(url).toBe("https://app.alinmove.com/api/auth/login");
    expect(options).toMatchObject({ method: "POST", mode: "cors", credentials: "omit", redirect: "error", cache: "no-store" });
    expect(options?.headers).toEqual({ accept: "application/json", "content-type": "application/json" });
    expect(JSON.parse(String(options?.body))).toEqual({ email: "fleet@example.test", password: "sample password " });
  });

  it("retains only access token and expiry, not refresh token or user roles", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const result = await loginExistingAccount(credentials, vi.fn<typeof fetch>().mockResolvedValue(ok()));
    expect(result).toEqual({ accessToken: "fixture-token", expiresAt: 3601000 });
  });

  it("reports network/CORS ambiguity safely, without retry or raw error leakage", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new TypeError("raw-sensitive-error"));
    await expect(loginExistingAccount(credentials, fetcher)).rejects.toMatchObject({ code: "NETWORK_OR_CORS" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([[400, "INVALID_CREDENTIALS"], [401, "INVALID_CREDENTIALS"], [403, "FORBIDDEN"], [429, "RATE_LIMITED"], [500, "UNAVAILABLE"]])("handles HTTP %i without exposing backend bodies", async (status, code) => {
    await expect(loginExistingAccount(credentials, vi.fn<typeof fetch>().mockResolvedValue(new Response("secret-error", { status: Number(status) })))).rejects.toMatchObject({ code });
  });

  it.each([{}, { access_token: "", expires_in: 3600 }, { access_token: "fixture-token", expires_in: 0 }, { access_token: "fixture-token", expires_in: 3601 }])("rejects a malformed success response %j", async (body) => {
    await expect(loginExistingAccount(credentials, vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(body))))).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects HTML success responses", async () => {
    await expect(loginExistingAccount(credentials, vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>not a token</html>")))).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("aborts a stalled request after 15 seconds", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
    }));
    const assertion = expect(loginExistingAccount(credentials, fetcher)).rejects.toMatchObject({ code: "NETWORK_OR_CORS" });
    await vi.advanceTimersByTimeAsync(15000);
    await assertion;
  });

  it("does not enable any fleet operation just because login is wired", () => {
    expect(OPERATIONS).toHaveLength(32);
    expect(OPERATIONS.every((op) => op.status === "unverified" && op.route === null)).toBe(true);
  });
});