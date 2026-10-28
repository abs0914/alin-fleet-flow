import { OPERATIONS, type OperationId, type OperationMapping } from "./operations";
import type { ApiErrorCode, CommandMeta } from "./types";
import { createDemoBackend, type DemoBackend } from "../demo/backend";

export type AppMode = "production" | "demo";

export class IntegrationRequiredError extends Error {
  readonly code = "INTEGRATION_UNAVAILABLE" as const;
  constructor(
    readonly operation: OperationId,
    readonly reason: "config_missing" | "route_unverified" | "unknown_operation",
  ) {
    super(
      reason === "config_missing"
        ? "Integration required: the ALiN API origin isn't configured for this portal."
        : `Integration required: "${operation}" has no verified backend route yet.`,
    );
    this.name = "IntegrationRequiredError";
  }
}

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode | string,
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface AdapterConfig {
  mode: AppMode;
  apiOrigin?: string;
  operations?: OperationMapping[];
  getAccessToken?: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
  demo?: DemoBackend;
}

export interface Adapter {
  mode: AppMode;
  call<T>(op: OperationId, payload?: unknown, meta?: CommandMeta): Promise<T>;
  /** Whether an operation can be attempted at all (still subject to server authorization). */
  isAvailable(op: OperationId): boolean;
}

/**
 * Production adapter fails closed: missing config or unverified route throws
 * IntegrationRequiredError before any network request. It NEVER falls back to demo.
 */
export function createAdapter(cfg: AdapterConfig): Adapter {
  if (cfg.mode === "demo") {
    const demo = cfg.demo ?? createDemoBackend();
    return {
      mode: "demo",
      isAvailable: () => true,
      call: <T,>(op: OperationId, payload?: unknown) => demo.handle(op, payload) as Promise<T>,
    };
  }

  const ops = cfg.operations ?? OPERATIONS;
  const resolve = (id: OperationId) => {
    if (!cfg.apiOrigin) throw new IntegrationRequiredError(id, "config_missing");
    const m = ops.find((o) => o.id === id);
    if (!m) throw new IntegrationRequiredError(id, "unknown_operation");
    if (m.status !== "verified" || !m.route) throw new IntegrationRequiredError(id, "route_unverified");
    return m;
  };

  return {
    mode: "production",
    isAvailable(id) {
      try {
        resolve(id);
        return true;
      } catch {
        return false;
      }
    },
    async call<T>(id: OperationId, payload?: unknown, meta?: CommandMeta): Promise<T> {
      const m = resolve(id);
      const route = m.route!;
      const f = cfg.fetchImpl ?? fetch;
      const token = cfg.getAccessToken ? await cfg.getAccessToken() : null;
      if (!token) throw new ApiError("UNAUTHENTICATED", "Please sign in again.", 401);
      const headers: Record<string, string> = {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      };
      if (meta) {
        headers["idempotency-key"] = meta.idempotencyKey;
        headers["x-correlation-id"] = meta.correlationId;
        if (meta.expectedVersion !== undefined) headers["if-match"] = String(meta.expectedVersion);
      }
      const res = await f(new URL(route.path, cfg.apiOrigin).toString(), {
        method: route.method,
        headers,
        body: route.method === "GET" ? undefined : JSON.stringify(payload ?? {}),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string; requestId?: string };
      if (!res.ok) {
        throw new ApiError(body.code ?? `HTTP_${res.status}`, body.message ?? "Request failed", res.status, body.requestId);
      }
      return body as T;
    },
  };
}

export function newCommandMeta(expectedVersion?: number): CommandMeta {
  return { idempotencyKey: crypto.randomUUID(), correlationId: crypto.randomUUID(), expectedVersion };
}
