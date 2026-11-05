import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionProvider, useSession } from "@/lib/session";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function setup() {
  const client = new QueryClient();
  let current: ReturnType<typeof useSession> | undefined;
  function Probe() { current = useSession(); return null; }
  render(<QueryClientProvider client={client}><SessionProvider><Probe /></SessionProvider></QueryClientProvider>);
  return { client, context: () => { if (!current) throw new Error("Missing test context"); return current; } };
}
const credentials = { email: "fleet@example.test", password: "fixture-password" };
const response = () => new Response(JSON.stringify({ access_token: "fixture-token", expires_in: 3600 }));

describe("Memory-only login session", () => {
  it("opens production only after login success, clears caches on logout, and persists no credentials", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response()));
    const store = vi.spyOn(Storage.prototype, "setItem");
    const { client, context } = setup();
    expect(context().session).toBeNull();
    await act(async () => { await context().signIn(credentials); });
    expect(context().session?.mode).toBe("production");
    expect(context().session?.adapter.isAvailable("identity.getContext")).toBe(false);
    client.setQueryData(["private"], "fixture-data");
    act(() => context().signOut());
    expect(context().session).toBeNull();
    expect(client.getQueryData(["private"])).toBeUndefined();
    expect(store).not.toHaveBeenCalled();
    store.mockRestore();
  });

  it("never opens a session or falls back to demo on a CORS/network error", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")));
    const { context } = setup();
    await act(async () => { await expect(context().signIn(credentials)).rejects.toMatchObject({ code: "NETWORK_OR_CORS" }); });
    expect(context().session).toBeNull();
  });

  it("expires the memory session and clears caches after the reported lifetime", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(response()));
    const { client, context } = setup();
    await act(async () => { await context().signIn(credentials); });
    client.setQueryData(["private"], "fixture-data");
    act(() => vi.advanceTimersByTime(3600000));
    expect(context().session).toBeNull();
    expect(client.getQueryData(["private"])).toBeUndefined();
  });

  it("ignores a late login response after sign-out", async () => {
    let finish: ((response: Response) => void) | undefined;
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(() => new Promise((resolve) => { finish = resolve; })));
    const { context } = setup();
    let pending: Promise<boolean> | undefined;
    act(() => { pending = context().signIn(credentials); });
    act(() => context().signOut());
    await act(async () => { finish?.(response()); expect(await pending).toBe(false); });
    expect(context().session).toBeNull();
  });
});