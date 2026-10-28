# Acceptance tests and rollout

Status: **DRAFT** specification. **No backend acceptance tests have been executed.** Run backend tests against the actual existing ALiN staging API and database; mocked UI tests cannot certify backend enforcement.

## Portal-side tests that DO exist (frontend only)

These run with `bunx vitest run` and test only portal code. They certify nothing about the backend.

| File | What it checks |
|---|---|
| `src/test/money.test.ts` | BigInt-safe split at MAX_SAFE_INTEGER, nonnegative gross/fee, positive quote; display formatting (₱, two decimals), integer 70/30 estimate incl. odd-cent case, ₱9,601 / ₱9,000 net estimates, below-fee → review, peso input parsing, Asia/Manila time label |
| `src/test/permissions.test.ts` | Permission presentation per role/onboarding state, payout always disabled, tracking "Location unavailable"/stale labels |
| `src/test/adapter.test.ts` | Fail closed (no config, unverified route, no token); no demo fallback; fixture-only request builder (path params, query allowlist, unsafe mapping/origin rejection, token only to configured origin, GET body rejected); command metadata required; unknown-outcome retry reuses key/payload |
| `src/test/demo-assignment.test.ts` | DEMO-only simulation: seed consistency, compatible assignment commits, double-booking rejected, incompatible category/expired docs/expired license/revoked membership/overweight rejected, paired tractor+trailer reserved together, pre-pickup replacement releases old assets, post-pickup refused, proposal/vehicle payloads commit. **Not security** — ASSET-01/02 and DRIVER-04/05 remain pending on real backend |
| `src/test/app-routing.test.tsx` | Route tree resolves `/` |

## Required fixtures

Isolated staging/sandbox environment with production payouts disabled; fleets A/B, approved/suspended managers and assets, two fleet drivers and one independent rider, customer C and unrelated customer D, operations and finance users, standard offers, RFQs, paired tractor/trailer equipment, expired proposals and wallet balances around each threshold. Test using backend-known IDs; no real customer data. All created records/events retain sandbox classification, excluded from live reports.

## Executable acceptance scenarios for implementers (PENDING — not run)

| ID | Action / setup | Expected assertion |
|---|---|---|
| AUTH-01 | No/expired/wrong-audience token on every fleet operation and subscription | Denied; no data or mutation |
| AUTH-02 | Fleet A user substitutes B IDs in jobs, docs, exports, proposals, settlement and GPS | Denied consistently; no existence or PII leak |
| AUTH-03 | Driver posts owner role/fleetId; dispatcher submits financial adjustment | No privilege change; denied by server |
| AUTH-04 | Test reported arbitrary OTP and development bypass against staging auth | Both rejected in production-equivalent configuration; legitimate authentication passes |
| DRIVER-01 | Fleet driver requests public single/batch/manifest offers and attempts direct-ID acceptance with legacy client | Feed contains no public offers; every public accept path denied; no assignment/job changes |
| DRIVER-02 | Convert independent rider to fleet mode while public offers/pushes exist; race conversion with public acceptance | Transaction yields legal state only; no public acceptance after membership effective; old offers revoked |
| DRIVER-03 | Inspect broadcaster, fallback/escalation, scheduled jobs, WS and push recipients | No fleet-managed driver targeted; eligible independent riders still work |
| DRIVER-04 | Manager assigns A driver; B manager/driver acknowledges or uploads POD/GPS | Cross-fleet attempts denied; only current assigned A driver works |
| DRIVER-05 | Revoke or replace assignment, replay old assignment command/token | Denied; subscriptions close; active assignment unique |
| ONBOARD-01 | Pending/suspended fleet attempts accept/propose/dispatch; resubmit documents | New work denied; review version/audit retained; legitimate resubmit works |
| ASSET-01 | Expired documents, maintenance, incompatible reefer/boom/container specification | Assignment/dispatch blocked; clear reason; valid alternatives work |
| ASSET-02 | Concurrent jobs reserve same driver/vehicle or shared trailer in overlapping windows | One permitted allocation only; conflict response for loser |
| STANDARD-01 | Two fleet managers accept same offer concurrently | One canonical fleet owner; sibling offers expire; retry returns same result |
| STANDARD-02 | Expired/cancelled offer and spoofed client fare | Acceptance denied; fare always backend authority |
| RFQ-01 | Heavy category booking versus standard category | Heavy routes to RFQ; no automatic per-km heavy quote; standard broadcast still works |
| RFQ-02 | Customer selects expired/withdrawn/old version proposal | No booking/hold created; conflict returned |
| RFQ-03 | Confirm two proposals simultaneously from different customer devices | One selection, one booking and one cancellation hold only |
| RFQ-04 | Inspect eligible notifications and proposal reads | Approved eligible managers receive request; no fleet drivers or competitor proposal prices |
| MONEY-01 | Confirm with ₱999.99 available then ₱1,000 available | First fails atomically; second creates exactly ₱1,000 hold and booking; spendable balance reduced |
| MONEY-02 | Q=₱10,000; hold exists; available balance after other holds below ₱7,000 | Dispatch denied; adding funds and approved funding reservation enables it |
| MONEY-03 | Race dispatch funding with another wallet spend | No negative available balance; no dispatch without guarantee; separate cancellation hold preserved |
| MONEY-04 | Dispatch authorized but no pickup evidence | No 70% charge yet; only approved reservation exists |
| MONEY-05 | Pickup + duplicate command/event, same key changed payload | Exactly ₱7,000 capture once; changed payload rejected; ledger balanced |
| MONEY-06 | Delivery POD and sufficient final funds; duplicate completion | Exactly ₱3,000 final capture, ₱1,000 hold release once; paid state; exactly one settlement entitlement |
| MONEY-07 | Delivery evidence with insufficient final funds | Physical delivered, payment_due, no settlement; top-up/retry captures only outstanding amount |
| MONEY-08 | Timeout at each hold/capture/release step; restart worker | Durable pending/unknown queried and reconciled; no double movement; release_pending blocks settlement |
| MONEY-09 | Odd-cent Q=₱1,000.01 using proposed rounding | P1 ₱700.01 + P2 ₱300.00 = Q; no floating-point drift |
| MONEY-10 | Concurrent holds, existing unrelated holds and top-up webhook replay | Spendable invariants hold; top-up credited exactly once after verified success |
| MONEY-11 | Intro fee changes after quote confirmation | Frozen fee retained; ₱10,000 gross yields ₱9,601 intro or ₱9,000 regular before approved adjustments |
| MONEY-12 | Complete fleet job through legacy rider delivery handler | No rider earning or legacy commission in addition to fleet fee/entitlement |
| MONEY-13 | Below-fee fare; cancellation/no-show/partial delivery without approved policy | Financial review state; no guessed forfeiture/negative automatic payable |
| MONEY-14 | Refund, adjustment and payout retries; unknown provider payout result | Compensating journal only; single payout; query unknown result before retry; trial balance balanced |
| NOTIFY-01 | Roll back booking transaction and inspect outbox | No committed notification about rolled-back booking |
| NOTIFY-02 | Push outage, invalid token, duplicate/out-of-order events and reconnect | Inbox remains usable; bounded retry/dead-letter; dedupe; canonical refresh; authorization rechecked |
| TRACK-01 | Wrong job GPS, revoked driver, stale/invalid coordinates, delayed offline upload | Unauthorized rejected; stale clearly labelled; no fabricated positions |
| DOC-01 | Oversize/disallowed content, expired signed URL, foreign-fleet document ID | Upload/download denied; private file not leaked |
| UI-01 | Keyboard/mobile, loading/empty/403/409/offline states, session logout | Accessible controls; clear states; sensitive caches cleared; no silent demo fallback |
| UI-02 | Missing API mapping/configuration | Integration-required state; production mutations disabled; demo visibly labelled |
| WALLET-01 | Attempt wallet cashout, peer transfer, or operator payout sourced from a customer AI Wallet balance | No such operation exists; fleet proceeds only via FleetSettlement after finance approval |
| IDEM-01 | Replay command with same key+payload after timeout; same key+different payload; status lookup by key after client reload | Original result returned; conflict on changed payload; reconcilable status without re-send |
| REG-01 | Existing independent-rider offers, customer bookings, branch/cargo workflows, finance reports | Existing supported flows preserved; sandbox excluded; fleet data only where authorized |

UI-02 is partially covered by `src/test/adapter.test.ts` at the portal level only.

## Implementation work packages

1. **Backend discovery:** inspect actual route registry, schema, auth middleware, offer generation/acceptance paths, wallet mutation service, commission freeze, POD completion, finance and provider integration. Produce verified capability/route matrix and OpenAPI schemas. Resolve policy questions.
2. **Backend foundation:** additive migrations for fleet membership/assets and history, scoped authorization, explicit driver mode and global public-offer exclusion. Add onboarding and review, private documents, inventory APIs and tests.
3. **Marketplace:** fleet acceptance with transactional claim, heavy RFQs/proposals, customer confirmation, assignment/capacity locks and customer/driver mobile changes. Gate new features with backend flags.
4. **Money:** reservation support, two captures, fee snapshot, fleet ledger entitlement and settlement/payout integration, outbox/reconciliation. Finance reviews journals and policy configuration before real money.
5. **Portal:** adapter mapping, screens, stale/conflict handling, authorized notifications/tracking, backend-provided statements and UI tests. Keep demo isolated. *(Scaffolded in this repo; mapping pending.)*
6. **Staging verification:** execute scenarios above, record environment/build IDs, command/test names, actual versus expected output and evidence. Load-test competing acceptance/wallet locks, worker replay and retry recovery at agreed volume; no claimed scale numbers without measurement.

### Mobile team (separate from portal)
- Driver app: manager assignments only, acknowledgment if configured, milestones, GPS, POD, failure reporting; no public offer feed or acceptance for fleet drivers.
- Customer app: RFQ creation, proposal comparison/selection/confirmation, ₱1,000 hold authorization, top-up instructions.

## Connecting the portal (steps)

1. Backend owner supplies API origin + OpenAPI for each operation in `src/lib/api/operations.ts`.
2. Set `VITE_ALIN_API_ORIGIN` (public origin only — never a secret).
3. Wire existing ALiN Supabase auth token retrieval into `getAccessToken` in `src/lib/session.tsx` after verifying issuer/audience.
4. For each operation: set `route`, flip `status` to `verified` only after staging contract tests pass and ownership checks are confirmed.
5. Configure CORS/redirects on the backend for the portal origin.

## Unresolved decisions

- Standard-job payment terms (holds, split, fee applicability): portal shows "awaiting backend confirmation"; ₱1,000 hold and 70/30 labels appear only on accepted RFQ quotes.
- Demo fixtures are Cebu / Mandaue / Lapu-Lapu sample data only.

- Backend command-status/reconciliation operation (by idempotency key) — required before any portal command is enabled.
- `role-customer.md` is referenced as evidence for prepaid-only AI Wallet but is not in this repo; backend must confirm.

- 70% funding reservation semantics/expiry; dispatch stays blocked until approved.
- Driver assignment acknowledgment gating dispatch.
- Cancellation/no-show/forfeiture policy beyond the stated customer cancellation fee.
- Intro fee eligibility/expiry (server-configured; no date invented).
- Payout policy (payout requests disabled).
- Location retention and consent; stale threshold (proposed 120 s).
- Mapping integration provider.
- Mapping of proposed roles to existing backend roles.
- Brand colors are provisional. Official ALiN Move logo supplied and used (sidebar, sign-in, favicon), aspect ratio preserved.

## Launch and recovery gates

- Human review of open policies, UI and financial examples; DRAFT → REVIEW → APPROVED. Publishing changes artifact status only after actual publication.
- All critical authorization/financial tests pass against live staging integrations; no unresolved auth bypass or wallet duplication; migration backup/rollback and reconciliation runbooks verified.
- Existing backend owner supplies API origin/spec, secure auth configuration and project access. Configure browser origins/redirects and approved secret storage. Never request secrets in a prompt.
- Begin with allowlisted fleets and test RFQs under backend feature flags; observe acceptance conflicts, denied public-driver attempts, wallet invariants, pending/unknown payments, hold-release lag, notification failures and reconciliation differences. Alert thresholds require operations agreement.
- Kill switch stops new RFQs, confirmations, acceptance and dispatch if necessary while preserving active-trip tracking, POD evidence and authorized financial recovery. Never release reservations or delete jobs simply because a frontend is rolled back.
- Rollback uses additive/backward-compatible migrations and previous frontend/API versions; do not roll back posted ledger facts. Reconcile in-flight charges, reservations and payouts with durable keys and compensating entries. Assign operational owners before launch.

Completion means real portal/API/mobile integration and tested backend invariants, not a rendered dashboard alone. This package is ready for implementation planning; it does not certify production readiness.
