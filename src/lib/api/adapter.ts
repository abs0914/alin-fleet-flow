import { OPERATIONS, type OperationId, type OperationMapping, type RouteBinding } from "./operations";
import type { ApiErrorCode, CommandMeta } from "./types";
import { createDemoBackend, type DemoBackend } from "../demo/backend";

export type AppMode = "production" | "demo";

export class IntegrationRequiredError extends Error {
  readonly code = "INTEGRATION_UNAVAILABLE" as const;
  constructor(
    readonly operation: OperationId,
    readonly reason: "config_missing" | "route_unverified" | "unknown_operation" | "response_schema_missing",
  ) {
    super(
      reason === "config_missing"
        ? "Integration required: the ALiN API origin isn't configured for this portal."
        : reason === "response_schema_missing"
          ? `Integration required: "${operation}" has no verified response schema yet.`
          : `Integration required: "${operation}" has no verified backend route yet.`,
    );
    this.name = "IntegrationRequiredError";
  }
}

/** Client-side request construction failure. Raised before any token is read or request is sent. */
export class RequestBuildError extends Error {
  constructor(
    readonly code:
      | "INVALID_ORIGIN"
      | "INVALID_ROUTE_MAPPING"
      | "ORIGIN_MISMATCH"
      | "MISSING_PARAM"
      | "UNUSED_PARAM"
      | "INVALID_PARAM"
      | "QUERY_NOT_ALLOWED"
      | "INVALID_QUERY_VALUE"
      | "BODY_NOT_ALLOWED"
      | "MISSING_COMMAND_METADATA",
    message: string,
  ) {
    super(message);
    this.name = "RequestBuildError";
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

/**
 * The outcome of a command is unknown (network failure, timeout, 5xx). The
 * attempt MUST be retried with the identical key/payload or reconciled with
 * the backend; a fresh idempotency key must never be minted.
 */
export class OutcomeUnknownError extends Error {
  readonly code = "OUTCOME_UNKNOWN" as const;
  constructor(readonly attempt: CommandAttempt) {
    super("We couldn't confirm whether this went through. Retry safely or check status before trying anything new.");
    this.name = "OutcomeUnknownError";
  }
}

export type QueryValue = string | number | boolean;
export interface RequestInput {
  params?: Readonly<Record<string, string | number>>;
  query?: Readonly<Record<string, QueryValue | undefined>>;
  body?: unknown;
}

/** A frozen logical command attempt. Retries reuse it verbatim. */
export interface CommandAttempt {
  readonly op: OperationId;
  readonly input: Readonly<RequestInput>;
  readonly meta: Readonly<CommandMeta>;
  readonly payloadHash: string;
}

export interface AdapterConfig {
  mode: AppMode;
  apiOrigin?: string | undefined;
  operations?: OperationMapping[];
  getAccessToken?: () => Promise<string | null>;
  fetchImpl?: typeof fetch;
  demo?: DemoBackend;
}

export interface Adapter {
  mode: AppMode;
  call<T>(op: OperationId, input?: RequestInput, meta?: CommandMeta): Promise<T>;
  /** Whether an operation can be attempted at all (still subject to server authorization). */
  isAvailable(op: OperationId): boolean;
}

/** Deterministic JSON with sorted object keys, used for payload hashing/comparison. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

function deepFreeze<T>(v: T): T {
  if (v && typeof v === "object") {
    for (const k of Object.keys(v)) deepFreeze((v as Record<string, unknown>)[k]);
    Object.freeze(v);
  }
  return v;
}

export function newCommandMeta(expectedVersion?: number): CommandMeta {
  return {
    idempotencyKey: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    ...(expectedVersion !== undefined ? { expectedVersion } : {}),
  };
}

/** Create a logical attempt once; every retry of it reuses the same key and frozen payload. */
export function createCommandAttempt(op: OperationId, input: RequestInput, expectedVersion?: number): CommandAttempt {
  const frozen = deepFreeze(structuredClone(input));
  return Object.freeze({ op, input: frozen, meta: Object.freeze(newCommandMeta(expectedVersion)), payloadHash: canonicalJson({ op, input: frozen }) });
}

export function sameLogicalPayload(attempt: CommandAttempt, op: OperationId, input: RequestInput): boolean {
  return attempt.payloadHash === canonicalJson({ op, input });
}

function parseOrigin(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new RequestBuildError("INVALID_ORIGIN", "Configured API origin is not a valid URL.");
  }
  if (u.protocol !== "https:" && !(u.protocol === "http:" && (u.hostname === "localhost" || u.hostname === "127.0.0.1"))) {
    throw new RequestBuildError("INVALID_ORIGIN", "API origin must use https.");
  }
  if (u.username || u.password || (u.pathname !== "/" && u.pathname !== "") || u.search || u.hash) {
    throw new RequestBuildError("INVALID_ORIGIN", "API origin must be a bare origin (scheme://host[:port]).");
  }
  return u;
}

const SEGMENT = /^[A-Za-z0-9._~-]+$/;
const PARAM = /^:([A-Za-z][A-Za-z0-9_]*)$/;
const PARAM_VALUE = /^[A-Za-z0-9._~-]{1,128}$/;

/**
 * Build the destination URL for a verified mapping. Rejects absolute,
 * network-path, traversal or malformed templates; requires every path param;
 * serializes only allowlisted query keys; and confirms the final URL stays on
 * the configured origin. Pure: no token, no network.
 */
export function buildUrl(apiOrigin: string, route: RouteBinding, input: RequestInput = {}): URL {
  const origin = parseOrigin(apiOrigin);
  const t = route.pathTemplate;
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("\\") || t.includes("?") || t.includes("#") || /^[a-z][a-z0-9+.-]*:/i.test(t)) {
    throw new RequestBuildError("INVALID_ROUTE_MAPPING", "Route mapping must be an origin-relative path.");
  }
  const params = input.params ?? {};
  const used = new Set<string>();
  const segments = t
    .slice(1)
    .split("/")
    .map((seg) => {
      const m = PARAM.exec(seg);
      if (m) {
        const name = m[1] as string;
        const raw = params[name];
        if (raw === undefined || String(raw) === "") throw new RequestBuildError("MISSING_PARAM", `Missing path parameter "${name}".`);
        const value = String(raw);
        // Dynamic IDs must be a single opaque segment: no traversal, separators, encodings or control chars.
        if (!PARAM_VALUE.test(value) || /^\.+$/.test(value)) throw new RequestBuildError("INVALID_PARAM", `Path parameter "${name}" is not a valid identifier.`);
        used.add(name);
        return encodeURIComponent(String(raw));
      }
      if (seg === "" || seg === "." || seg === ".." || !SEGMENT.test(seg)) {
        throw new RequestBuildError("INVALID_ROUTE_MAPPING", `Invalid path segment "${seg}".`);
      }
      return seg;
    });
  for (const k of Object.keys(params)) {
    if (!used.has(k)) throw new RequestBuildError("UNUSED_PARAM", `Parameter "${k}" is not part of this route.`);
  }
  const url = new URL(`/${segments.join("/")}`, origin);
  const allow = new Set(route.query ?? []);
  for (const [k, v] of Object.entries(input.query ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    if (v === undefined) continue;
    if (!allow.has(k)) throw new RequestBuildError("QUERY_NOT_ALLOWED", `Query key "${k}" is not allowlisted for this route.`);
    if (typeof v === "number" && !Number.isFinite(v)) throw new RequestBuildError("INVALID_QUERY_VALUE", `Query "${k}" must be finite.`);
    url.searchParams.append(k, String(v));
  }
  if (url.origin !== origin.origin) throw new RequestBuildError("ORIGIN_MISMATCH", "Resolved URL left the configured API origin.");
  return url;
}

const isUnknownStatus = (s: number) => s === 408 || s === 425 || s === 429 || s >= 500;

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
      call: <T,>(op: OperationId, input?: RequestInput) => {
        const merged = { ...(input?.params ?? {}), ...(input?.query ?? {}), ...((input?.body as object | undefined) ?? {}) };
        return demo.handle(op, merged) as Promise<T>;
      },
    };
  }

  const ops = cfg.operations ?? OPERATIONS;
  const resolve = (id: OperationId): OperationMapping & { route: RouteBinding } => {
    if (!cfg.apiOrigin) throw new IntegrationRequiredError(id, "config_missing");
    const m = ops.find((o) => o.id === id);
    if (!m) throw new IntegrationRequiredError(id, "unknown_operation");
    if (m.status !== "verified" || !m.route) throw new IntegrationRequiredError(id, "route_unverified");
    if (typeof m.route.validateResponse !== "function") throw new IntegrationRequiredError(id, "response_schema_missing");
    return m as OperationMapping & { route: RouteBinding };
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
    async call<T>(id: OperationId, input: RequestInput = {}, meta?: CommandMeta): Promise<T> {
      const m = resolve(id);
      // 1. Validate everything that doesn't need a secret first.
      if (m.kind === "command" && (!meta || !meta.idempotencyKey || !meta.correlationId)) {
        throw new RequestBuildError("MISSING_COMMAND_METADATA", "Commands require an idempotency key and correlation ID.");
      }
      if (m.route.method === "GET" && input.body !== undefined) {
        throw new RequestBuildError("BODY_NOT_ALLOWED", "GET requests carry params/query, not a body.");
      }
      const url = buildUrl(cfg.apiOrigin as string, m.route, input);
      // 2. Only now read the token — destination is proven to be the configured origin.
      const token = cfg.getAccessToken ? await cfg.getAccessToken() : null;
      if (!token) throw new ApiError("UNAUTHENTICATED", "Please sign in again.", 401);
      const headers: Record<string, string> = { accept: "application/json", authorization: `Bearer ${token}` };
      if (m.route.method !== "GET") headers["content-type"] = "application/json";
      if (meta) {
        headers["idempotency-key"] = meta.idempotencyKey;
        headers["x-correlation-id"] = meta.correlationId;
        if (meta.expectedVersion !== undefined) headers["if-match"] = String(meta.expectedVersion);
      }
      const init: RequestInit = { method: m.route.method, headers, redirect: "error", credentials: "omit" };
      if (m.route.method !== "GET") init.body = JSON.stringify(input.body ?? {});
      const f = cfg.fetchImpl ?? fetch;
      let res: Response;
      try {
        res = await f(url.toString(), init);
      } catch {
        if (m.kind === "command" && meta) throw new OutcomeUnknownError(attemptOf(id, input, meta));
        throw new ApiError("NETWORK_ERROR", "Couldn't reach ALiN. Check your connection and retry.", 0);
      }
      if (res.ok) {
        // A 2xx whose body can't be parsed or fails the verified schema is not proof of success.
        let parsed: unknown;
        let valid = false;
        try {
          parsed = await res.json();
          valid = m.route.validateResponse?.(parsed) === true;
        } catch {
          valid = false;
        }
        if (!valid) {
          if (m.kind === "command" && meta) throw new OutcomeUnknownError(attemptOf(id, input, meta));
          throw new ApiError("MALFORMED_RESPONSE", "ALiN sent an unexpected response. Please retry.", res.status);
        }
        return parsed as T;
      }
      const body = (await res.json().catch(() => ({}))) as { message?: string; code?: string; requestId?: string };
      {
        if (m.kind === "command" && meta && isUnknownStatus(res.status)) throw new OutcomeUnknownError(attemptOf(id, input, meta));
        throw new ApiError(body.code ?? `HTTP_${res.status}`, body.message ?? "Request failed", res.status, body.requestId);
      }
    },
  };
}

function attemptOf(op: OperationId, input: RequestInput, meta: CommandMeta): CommandAttempt {
  return Object.freeze({ op, input, meta, payloadHash: canonicalJson({ op, input }) });
}

/** Send (or resend) a logical attempt. Always uses the attempt's own key and frozen payload. */
export function sendAttempt<T>(adapter: Adapter, attempt: CommandAttempt): Promise<T> {
  return adapter.call<T>(attempt.op, attempt.input, attempt.meta);
}
