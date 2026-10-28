import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdapter,
  createCommandAttempt,
  OutcomeUnknownError,
  sameLogicalPayload,
  sendAttempt,
  type Adapter,
  type AppMode,
  type CommandAttempt,
  type RequestInput,
} from "./api/adapter";
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
          apiOrigin: mode === "production" ? (import.meta.env["VITE_ALIN_API_ORIGIN"] as string | undefined) : undefined,
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

export function useOp<T>(op: OperationId, input?: RequestInput) {
  const { session } = useSession();
  const id = useIdentity();
  return useQuery({
    queryKey: [session?.mode, id.data?.fleet.id ?? "nofleet", op, input ?? null],
    queryFn: () => session!.adapter.call<T>(op, input),
    enabled: !!session,
    retry: false,
  });
}

export class PendingUnknownError extends Error {
  readonly code = "OUTCOME_UNKNOWN_PENDING" as const;
  constructor() {
    super("A previous attempt's outcome is still unknown. Retry that exact request or ask operations to reconcile it before sending a different one.");
  }
}

/**
 * Server-confirmed commands invalidate related reads. No optimistic writes.
 * After an unknown outcome the same logical attempt (same idempotency key and
 * frozen payload) is reused on retry; a different payload is refused until
 * the unknown attempt is resolved. Pending attempts live in memory only.
 */
export function useCommand<T>(op: OperationId, invalidate: OperationId[]) {
  const { session } = useSession();
  const qc = useQueryClient();
  const pending = useRef<CommandAttempt | null>(null);
  return useMutation({
    mutationFn: async ({ payload, version }: { payload?: unknown; version?: number }) => {
      const input: RequestInput = payload === undefined ? {} : { body: payload };
      let attempt = pending.current;
      if (attempt) {
        if (!sameLogicalPayload(attempt, op, input)) throw new PendingUnknownError();
      } else {
        attempt = createCommandAttempt(op, input, version);
      }
      try {
        const r = await sendAttempt<T>(session!.adapter, attempt);
        pending.current = null;
        return r;
      } catch (e) {
        pending.current = e instanceof OutcomeUnknownError ? attempt : null;
        throw e;
      }
    },
    onSettled: () => {
      qc.invalidateQueries({
        predicate: (q) => invalidate.includes(q.queryKey[2] as OperationId),
      });
    },
  });
}
