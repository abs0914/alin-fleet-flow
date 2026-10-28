import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAdapter, newCommandMeta, type Adapter, type AppMode } from "./api/adapter";
import type { OperationId } from "./api/operations";
import type { IdentityContext } from "./api/types";

interface Session {
  mode: AppMode;
  adapter: Adapter;
}

interface Ctx {
  session: Session | null;
  start: (mode: AppMode) => void;
  signOut: () => void;
}

const SessionCtx = createContext<Ctx | null>(null);

/** Session lives in memory only — nothing sensitive is written to browser storage. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const start = useCallback(
    (mode: AppMode) => {
      qc.clear();
      setSession({
        mode,
        adapter: createAdapter({
          mode,
          apiOrigin: mode === "production" ? (import.meta.env.VITE_ALIN_API_ORIGIN as string | undefined) : undefined,
          // Existing ALiN Supabase auth wiring is unverified; no token source yet.
          getAccessToken: async () => null,
        }),
      });
    },
    [qc],
  );
  const signOut = useCallback(() => {
    qc.clear(); // clear tenant-scoped caches
    setSession(null);
  }, [qc]);
  const value = useMemo(() => ({ session, start, signOut }), [session, start, signOut]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("SessionProvider missing");
  return c;
}

export function useAdapter() {
  const { session } = useSession();
  if (!session) throw new Error("No session");
  return session.adapter;
}

export function useIdentity() {
  const { session } = useSession();
  return useQuery({
    queryKey: [session?.mode, "identity.getContext"],
    queryFn: () => session!.adapter.call<IdentityContext>("identity.getContext"),
    enabled: !!session,
    retry: false,
  });
}

export function useOp<T>(op: OperationId, payload?: unknown) {
  const { session } = useSession();
  const id = useIdentity();
  return useQuery({
    queryKey: [session?.mode, id.data?.fleet.id ?? "nofleet", op, payload ?? null],
    queryFn: () => session!.adapter.call<T>(op, payload),
    enabled: !!session,
    retry: false,
  });
}

/** Server-confirmed commands invalidate related reads. No optimistic writes. */
export function useCommand<T>(op: OperationId, invalidate: OperationId[]) {
  const { session } = useSession();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, version }: { payload?: unknown; version?: number }) =>
      session!.adapter.call<T>(op, payload, newCommandMeta(version)),
    onSettled: () => {
      qc.invalidateQueries({
        predicate: (q) => invalidate.includes(q.queryKey[2] as OperationId),
      });
    },
  });
}
