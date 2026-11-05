import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAdapter,
  createCommandAttempt,
  OutcomeUnknownError,
  sameLogicalPayload,
  sendAttempt,
  loginExistingAccount,
  type Adapter,
  type AppMode,
  type CommandAttempt,
  type RequestInput,
} from "./api/adapter";
import type { OperationId } from "./api/operations";
import type { IdentityContext } from "./api/types";
import { ALIN_API_ORIGIN, type LoginCredentials, type LoginSession } from "./api/auth";

interface Session {
  mode: AppMode;
  adapter: Adapter;
}

interface Ctx {
  session: Session | null;
  start: (mode: AppMode) => void;
  signIn: (credentials: LoginCredentials) => Promise<boolean>;
  signOut: () => void;
}

const SessionCtx = createContext<Ctx | null>(null);

/** Session lives in memory only — nothing sensitive is written to browser storage. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const auth = useRef<LoginSession | null>(null);
  const generation = useRef(0);
  const start = useCallback(
    (mode: AppMode) => {
      generation.current += 1;
      auth.current = null;
      qc.clear();
      setSession({
        mode,
        adapter: createAdapter({
          mode,
          apiOrigin: mode === "production" ? ALIN_API_ORIGIN : undefined,
          getAccessToken: async () => null,
        }),
      });
    },
    [qc],
  );
  const signOut = useCallback(() => {
    generation.current += 1;
    auth.current = null;
    qc.clear(); // clear tenant-scoped caches
    setSession(null);
  }, [qc]);
  const signIn = useCallback(async (credentials: LoginCredentials) => {
    signOut();
    const attempt = generation.current;
    const result = await loginExistingAccount(credentials);
    if (attempt !== generation.current) return false; // Ignore a login completed after logout/demo change.
    auth.current = result;
    setSession({
      mode: "production",
      adapter: createAdapter({
        mode: "production", apiOrigin: ALIN_API_ORIGIN,
        getAccessToken: async () => {
          if (attempt !== generation.current || !auth.current || Date.now() >= auth.current.expiresAt) return null;
          return auth.current.accessToken;
        },
      }),
    });
    return true;
  }, [signOut]);
  useEffect(() => {
    if (!auth.current) return;
    const timer = setTimeout(signOut, Math.max(0, auth.current.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session, signOut]);
  const value = useMemo(() => ({ session, start, signIn, signOut }), [session, start, signIn, signOut]);
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
    queryFn: () => { if (!session) throw new Error("No session"); return session.adapter.call<IdentityContext>("identity.getContext"); },
    enabled: !!session,
    retry: false,
  });
}

export function useOp<T>(op: OperationId, input?: RequestInput) {
  const { session } = useSession();
  const id = useIdentity();
  return useQuery({
    queryKey: [session?.mode, id.data?.fleet.id ?? "nofleet", op, input ?? null],
    queryFn: () => { if (!session) throw new Error("No session"); return session.adapter.call<T>(op, input); },
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
      if (!session) throw new Error("No session");
      const input: RequestInput = payload === undefined ? {} : { body: payload };
      let attempt = pending.current;
      if (attempt) {
        if (!sameLogicalPayload(attempt, op, input)) throw new PendingUnknownError();
      } else {
        attempt = createCommandAttempt(op, input, version);
      }
      try {
        const r = await sendAttempt<T>(session.adapter, attempt);
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
