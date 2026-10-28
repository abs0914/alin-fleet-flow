# Proposed ALiN Move fleet integration contract

Status: **DRAFT**. This is a design contract for implementation in the **existing backend** (Fastify / Prisma / PostgreSQL, Supabase auth, Maya payments, AI Wallet, existing riders/jobs/ledger). Logical operation IDs below are not verified routes. No base URL or credentials are supplied. A backend-owned OpenAPI spec and staging contract tests must bind each operation to a real method/path before integration.

Portal binding: `src/lib/api/operations.ts` holds the operation → real-route mapping. Every entry is `status: "unverified"`, `route: null`. The production adapter (`src/lib/api/adapter.ts`) fails closed until an entry is verified. The live matrix is at `/dev/capabilities` in the portal.

## 1. Ownership and compatibility

Extend existing Fastify routes/services, Prisma migrations and PostgreSQL transactions. Reuse users/riders, delivery_jobs, ai_wallets/transactions, payments, proof_of_deliveries, ledger_entries and finance reconciliation. Proposed new entities below must live in the same authoritative backend, not a Lovable replica. Inspect current schema first, use existing equivalents where possible. Do not overload cargo-manifest fleet tiers as fleet ownership without evidence.

References document GET `/api/me`, `/api/rider/offers/pending`, `/api/rider/batch-offers/pending`, POST `/api/rider/offers/:id/respond`, PUT `/api/rider/jobs/:id/status` and POST `/api/rider/jobs/:id/pod`. These are historical documented routes, not live-verified interfaces; schemas, auth and all alternate acceptance routes need code inspection. Existing error shape is documented as `{message}`; preserve compatibility while adding optional stable `code`, `requestId`, `details` and retryability.

## 2. Identity and authorization

Validate token signature, issuer, audience, expiry and revocation policy using the existing auth system. Resolve active user, roles, fleet memberships and resource ownership server-side on every request/event subscription. Never accept role, fleet ownership or approval from submitted JSON. Client fleetId is only a selector validated against membership. Validate authorization on exports, uploads/downloads, notifications, maps and cached read models too.

Proposed permissions (map to existing roles, do not assume these enums exist):

| Principal | Allowed scope |
|---|---|
| Fleet owner | Own fleet profile, approved delegates, assets, jobs/proposals, assignment, settlement view; payout request only if approved policy allows |
| Fleet dispatcher | Own fleet operations and assignment; no payout/financial adjustments or membership privilege escalation |
| Fleet viewer | Own fleet read-only operational views; financial visibility only by explicit grant |
| Fleet driver | Own valid manager-issued assignments, authorized milestones, GPS, POD; never browse public offers/RFQs, accept public jobs or edit price/settlement |
| Customer | Own RFQs, quote selection/confirmation, wallet authorization, tracking and cancellation request |
| Operations approver | Explicit administrative scopes for onboarding, incident resolution and overrides with reason/audit; no implicit wallet debit |
| Finance | Explicit financial review, ledger adjustment and payout approval; no dispatch authority unless separately granted |

Critical backend invariant: for a rider with fleet-managed membership, public single-job, batch, manifest, fallback/escalation, scheduled and direct-ID offer reads/acceptance are denied. Inventory every acceptance path. Broadcast generation and push/WS targeting exclude those riders; read endpoints suppress already-created offers; acceptance commands independently deny them. Fleet drivers may accept/acknowledge only a current manager-issued assignment for their active fleet. A stale push cannot grant acceptance rights. Membership change transaction revokes outstanding public offers, closes subscriptions and prevents concurrent public acceptance. Leaving a fleet does not automatically activate independent-rider eligibility. Legacy clients must also receive denial.

## 3. Proposed authoritative entities

All carry IDs, created/updated UTC timestamps, version and sandbox classification where applicable.

- **Fleet**: business identity, onboarding status, service areas, approved capabilities, suspension reason.
- **FleetMembership**: user/rider reference, fleet, permission set, managed/independent mode, effective intervals; proposed unique active managed membership per driver.
- **FleetVehicle**: fleet, canonical category, plate/identity, capacity/dimensions, special capabilities, document references, approval/maintenance status. Vehicle pairing references for tractor/trailer equipment.
- **FleetDocument**: subject, document type from configured checklist, private storage key, expiry, review status; no public KYC URLs.
- **RFQ**: customer reference, cargo requirements, pickup/dropoff/recipient, window, expiry, immutable requirements version and eligibility snapshot.
- **Proposal**: RFQ/fleet, quote version, integer PHP total and itemization, assumptions, validity, capacity reference, terms hash and status. Unique selection per RFQ.
- **FleetBookingExtension**: existing delivery_job reference, fleet owner, source standard/RFQ, selected proposal/version, pricing/fee snapshot and financial state. One canonical job ID.
- **Assignment**: job, fleet, driver, vehicle/pair, issuing manager, effective/revoked timestamps and version. Unique active assignment per job and non-overlapping capacity reservations for driver/equipment.
- **WalletReservation**: existing wallet reference, booking, purpose cancellation/funding, amount, state and unique business key. Use existing reservation model if present; add capability in backend if absent.
- **FleetSettlement**: operator, booking, captured gross, fee snapshot, approved adjustments, payable, ledger references and payout reference. Unique booking entitlement, no parallel rider earning.
- **DomainEvent/outbox**, notification inbox/delivery attempts, immutable audit/transition history: same backend transaction boundary or reliable equivalent.

## 4. Common transport contract

Use backend-bound operation mapping, JSON schemas validated at boundary, opaque IDs, `currency: PHP`, integer centavos within safe integer bounds, ISO UTC timestamps and cursor pagination with bounded limits. Required command metadata: unique idempotency key, expected resource version and correlation ID. Bind idempotency to actor, fleet, operation, resource and canonical payload hash. Same key+payload returns original result; same key+different payload conflicts. Durable retention must cover financial replay/reconciliation horizons, to be configured with finance/operations. Authentication tokens never appear in URLs or logs.

Proposed response: resource plus version and correlation ID; list responses include items, nextCursor and serverTime. Optional capabilities tell clients which operations are enabled, but never replace authorization. Proposed error codes: UNAUTHENTICATED, FORBIDDEN, FLEET_DRIVER_PUBLIC_OFFER_DENIED, VALIDATION_FAILED, VERSION_CONFLICT, JOB_UNAVAILABLE, QUOTE_EXPIRED, CAPACITY_CONFLICT, NOT_APPROVED, INSUFFICIENT_AVAILABLE_FUNDS, PAYMENT_PENDING, POLICY_UNRESOLVED and INTEGRATION_UNAVAILABLE. Map to 401/403/422/409/503 as appropriate while retaining `{message}`. Do not reveal cross-fleet record existence in error detail.

Portal headers currently sent once a route is verified (proposed, to be confirmed by backend): `Authorization: Bearer`, `Idempotency-Key`, `X-Correlation-Id`, `If-Match: <expectedVersion>`.

## 5. Logical operations requiring route mapping

Every write returns the authoritative resource/version; financial commands additionally return operation/ledger references and pending/unknown status when needed.

| Proposed operation | Request → response | Required server guard |
|---|---|---|
| identity.getContext | authenticated session → user, allowed fleets/permissions, enabled capabilities | Active account; no client role claims |
| fleet.get / submitOnboarding / resubmit | profile, checklist document IDs, expectedVersion → fleet/review status | Ownership; validated private uploads; resubmission version |
| fleet.review / suspend | decision, reason, expectedVersion → fleet | Operations scope; audit; suspend new work and triage active jobs |
| membership.invite / activate / revoke | identity reference, approved grants, effective time → membership | No self-escalation; active-job migration; revoke public offers atomically |
| vehicle.list / upsert / availability | vehicle details, schedule, document IDs → vehicle | Fleet ownership, unique identity, category schema, approval and capacity locks |
| driver.list / invite / update | identity, fleet role, document IDs → driver/membership | Approved invitation/account linkage; no arbitrary rider adoption |
| catalog.get | scope → categories, checklist, serviceability, policy versions | Backend-managed taxonomy, no client pricing authority |
| standardOffer.list / accept | offer ID, expectedVersion, capacity ref → fleet-owned job | Eligible active fleet; expiry; atomic winner; no fleet-driver principal |
| booking.list (portal addition) | cursor/filter → fleet-owned jobs with timeline, physical and financial state | Fleet ownership; minimal customer data |
| rfq.create / list / detail | customer route/recipient/cargo/window → RFQ or eligible list | Customer ownership; valid heavy category; serviceability; privacy minimization |
| proposal.submit / revise / withdraw | RFQ/version, total/itemization, terms, validity → proposal | Approved eligible fleet; RFQ open; valid capacity; no edits after selection |
| quotation.confirm | proposal ID/version, terms hash, idempotency → booking, cancellation hold | Customer owns RFQ; proposal current/unexpired; atomic selection+₱1,000 hold |
| assignment.create / replace / acknowledge | job, driver/vehicle, version → assignment | Manager grants; same fleet; approval; no schedule overlaps; revoked assignment denied |
| dispatch.authorize | booking/version → funding and dispatch authorization | Current assignment, policy, active approvals and 70% funding revalidated atomically |
| pickup.record | assignment, pickup evidence, version → milestone + 70% capture status | Assigned driver; valid sequence; idempotent debit; preserve evidence if payment fails |
| delivery.record | assignment, POD reference, recipient evidence, version → completion + 30% capture status | Valid POD and sequence; final debit once; release hold only after financial success |
| job.reportException / requestCancel | job, reason/evidence, version → case and policy outcome | Actor scope; no unapproved hold forfeiture or arbitrary state jump |
| tracking.publish / latest | job/assignment, sequence, capturedAt, coords, accuracy → acknowledgment/latest | Assigned driver, allowed trip window, rate/size limits; scoped readers |
| settlement.list / statement | cursor/filter or settlement ID → backend totals, ledger refs | Fleet financial read grant; sandbox excluded from live reports |
| settlement.review / payoutRequest | settlement IDs, reason/payment destination reference → review/payout | Finance policy, positive eligible payable, verified destination, dedupe; no browser payout API secret |
| notifications.list / markRead / subscribe | cursor or IDs → inbox/events | Recipient and fleet scope on connect and each delivery |
| documents.uploadIntent / finalize / download | subject/type/MIME/size/checksum → short-lived URL/private document ref | Scoped upload path, configured limits, type/content validation, malware checks and expiring links |

Wallet available/holds, top-up and transaction history must map to existing wallet operations after verification. A top-up is usable only after backend-confirmed provider success; browser return/receipt screenshot is not proof. Customer app supplies RFQ and quote confirmation views; driver app supplies fleet assignment views; backend supports both before portal claims end-to-end readiness.

## 6. State machines and transaction boundaries

These are proposed extensions. Map to current enums without breaking existing jobs.

**Onboarding:** draft → submitted → under_review → approved | changes_requested | rejected; changes_requested → submitted. Approved → suspended by authorized operations; reactivation requires review. Suspension blocks new acceptance/assignment, with active-trip safety handled through incident workflow.

**RFQ:** draft → open → selected | expired | cancelled. **Proposal:** draft → submitted → selected | not_selected | withdrawn | expired. Customer confirmation atomically verifies proposal version/validity, locks RFQ, reserves cancellation funds, creates/links canonical job and freezes pricing. If hold fails, selection/job creation rolls back. Two customers/devices cannot select two proposals. Selected proposal immutable; amendments require renewed consent and funds recalculation.

**Fleet job allocation:** offered → fleet_accepted → assignment_pending → assigned → dispatch_authorized. RFQ confirmation starts at fleet_accepted. Standard acceptance atomically claims unowned job and expires sibling offers; no pretend assigned rider until manager assigns. Map driver execution to documented accepted → en_route_pickup → at_pickup → picked_up → in_transit → at_dropoff → delivered/failed, with explicit mapping between allocation and execution states. Maintain separate physical and financial states so funds failure cannot erase pickup or delivery truth. Assignment acknowledgment may gate dispatch only once policy is approved. Reassignment revokes previous actor and all tokens/subscriptions tied to assignment, revalidates equipment/funds, and records audit.

**Financial flow for quotation total Q centavos:**

1. Confirmation: lock wallet and RFQ; available balance must cover 100000 centavos. Create unique cancellation reservation C=100000, reducing spendable availability without treating it as revenue. Booking/selection/hold commit together.
2. Proposed dispatch funding gate: calculate P1=roundHalfUp(Q×70/100), P2=Q−P1. Verify spendable funds excluding C and all other holds. Prefer reserve P1 as a separate funding reservation F, atomically with dispatch authorization. Reservation semantics/expiry need approval; absent approval/capability, keep live dispatch blocked instead of unsafe balance-only checks. Hold remains C in addition to F.
3. Pickup: validate assignment/evidence; convert F to a P1 capture with balanced ledger posting exactly once, or perform approved atomic debit if policy uses another funding guarantee. Record actual pickup independently if financial operation fails/unknown; flag payment exception, prohibit duplicate debit and auto settlement. Do not quietly confiscate C.
4. Delivery: record POD and physical completion; capture P2 atomically when funds available. If insufficient, physical delivered + final_payment_due; retry only through authorized funded command. Customer receives top-up instruction. Full successful capture → paid, release C exactly once, create settlement eligibility in same transaction/outbox boundary. If hold release fails, release_pending and settlement blocked pending reconciliation.
5. Fee frozen at customer acceptance/confirmation from server policy: introductory 39900 or regular 100000 centavos plus eligibility/version snapshot. No invented introduction end date. Fee deducted once from gross operator entitlement; no double application of legacy rider commission/earnings.
6. Settlement: draft → blocked | eligible → approved → payout_pending → paid; payout_pending → failed | outcome_unknown. Only captured, reconciled, undisputed proceeds are eligible under approved policy. Net=attributable captured gross−frozen platform fee+signed approved ledger adjustments. Do not invent tax, withholding or cancellation proceeds. Negative payable or below-fee booking goes to review. Payout uses existing verified rails, idempotency and reconciliation. Never reissue unknown payout without querying/reconciling provider status.

**Reservation lifecycle:** active → consumed | released; cancellation reservation may become captured only under approved cancellation policy/evidence. No timeout may release an in-use reservation without approved recovery policy. Funding reservation expiry revokes dispatch authorization and requires re-funding. Successful hold release is independent of consuming F. Available wallet = posted balance − active reservations; avoid subtracting consumed reservations twice. Validate invariant nonnegative spendable balance under concurrent top-ups, holds and spending.

Proposed rounding examples, pending finance approval: Q=1,000,000 (₱10,000): P1=700,000, P2=300,000; intro payable before adjustments=960,100 (₱9,601). C=100,000 is separate and returned; never counted in payable. Q=100001: P1=70001, P2=30000, exact sum Q. Reject nonpositive/unsafe totals; below-fee pricing requires policy review. Use integer/rational arithmetic, not binary floating-point percentages.

All money movements use wallet locks/serializable equivalent, immutable balanced journal legs, unique business references per hold/capture/release/fee/settlement, and transactional outbox. Exact chart-of-account mapping requires finance review. External provider operations use durable command records and reconciliation; distributed success is not assumed atomic. Timeout → unknown/pending queryable status, not automatic second charge. Refunds use compensating entries, never edits/deletes of posted ledger entries.

> The portal's `src/lib/money.ts` mirrors these examples **for display estimates only**. It is not authoritative and must never be used to move money.

### 6a. AI Wallet scope (customer evidence)

Per `role-customer.md` (stakeholder-supplied evidence; not present in this repository and not independently verified): the AI Wallet is **prepaid only** — top-up and spend. There is **no cashout and no peer-to-peer transfer**. This contract preserves that:

- Cancellation holds (C) and funding reservations (F) are reservations against the customer's own prepaid balance; releasing C returns spendable balance inside the same wallet, never a cashout.
- Fleet operator proceeds are **not** an AI Wallet balance and are **not** a transfer from the customer's wallet to the operator's wallet. They are a separate, authorized fleet-finance settlement entitlement (FleetSettlement) paid through existing verified payout rails after finance approval.
- No portal, driver or customer operation may expose wallet withdrawal, wallet-to-wallet transfer or "pay out my wallet". The portal's "Request payout" refers only to the fleet settlement entitlement and stays disabled until an approved payout policy exists.
- Refunds use compensating ledger entries back to the original prepaid wallet under approved policy.

## 6b. Command idempotency and unknown-outcome reconciliation (portal requirement)

The portal adapter (`src/lib/api/adapter.ts`) enforces client-side:

1. Every command carries `Idempotency-Key` and `X-Correlation-Id`; the adapter refuses to send a command without them (before reading the auth token).
2. A logical attempt is created once (`createCommandAttempt`) with a frozen payload. Network failure, timeout, 408/425/429 or 5xx is reported as **outcome unknown** and returns the same attempt.
3. A retry of an unknown attempt reuses the identical key, correlation ID, expected version and body. The UI refuses a *different* payload for that action until the unknown attempt resolves. A fresh key is never minted after an unknown outcome.
4. Pending attempts are held in memory only; a reload/sign-out loses them, so the backend must support reconciliation.

Backend must provide (pending, not implemented or verified):

- Same key + same canonical payload → original result (including after the original request completed server-side).
- Same key + different payload → 409/422 conflict, no side effect.
- A status read by idempotency key or correlation ID (e.g. a logical `commands.status` operation) so the portal can reconcile an unknown outcome after reload instead of re-sending.
- Key retention covering the finance replay/reconciliation horizon.
- Financial commands return pending/unknown states explicitly; provider timeouts are reconciled server-side, never resolved by a client retry with a new key.

Request construction rules (portal): mappings use origin-relative `pathTemplate` with `:param` segments and an explicit query allowlist. Absolute URLs, `//host` network paths, traversal segments, missing/unused params and non-allowlisted query keys are rejected, and the final URL is checked against the configured API origin before the Bearer token is read. Tests in `src/test/adapter.test.ts` use fixture routes only (`/fixture/...`), not real ALiN routes.

## 7. Notifications and tracking

Proposed event envelope: eventId, type, aggregateId/type, aggregateVersion, occurredAt UTC, correlationId, sandbox classification and minimal payload. Recipient/fleet scope derived server-side. Outbox created in same transaction as domain change. At-least-once delivery; consumers dedupe eventId and reject stale aggregate versions, refetch canonical state on gaps/reconnect. Durable inbox supports cursor replay; notifications do not carry secrets, document links or full recipient information.

| Event | Recipients/action |
|---|---|
| fleet.review_changed | Fleet owner; onboarding inbox |
| standard_offer.opened / expired | Eligible managers only; never fleet drivers |
| rfq.opened / amended / closed | Eligible managers, affected customer; new proposal version if requirements change |
| proposal.submitted / selected / not_selected / expired | Owning customer and relevant managers; no competitor pricing disclosure |
| assignment.created / replaced / revoked | Assigned driver and manager only; revoked driver loses job access |
| funds.required / verified / capture_failed | Owning customer, manager with limited payment status, finance for exceptions; no disclosure of full wallet balance |
| pickup.recorded / delivery.recorded / booking.cancelled | Owning customer, manager, assigned driver as scoped |
| hold.released / settlement.updated / payout.updated | Wallet owner or authorized fleet financial recipients respectively |

Proposed delivery attempts: pending → sending → provider_accepted → delivered (only if receipt exists) | retry_wait | permanently_failed. Provider acceptance alone is not delivered. Retry transient failures with bounded exponential backoff/jitter; invalid token disables that token and falls back to inbox. Exhausted attempts → dead-letter queue and operations alert; no repeated job creation or debit. Exact retry limits, escalation channels and SMS usage require configuration. Push is advisory; queues remain usable when it fails.

Tracking samples include assignment ID, monotonically increasing sequence, device capture time, server receipt time and accuracy. Validate ranges and plausibility; store only authorized trip samples, bound offline upload window and reject revoked assignment data. Mark stale using configurable threshold (proposed 120 seconds); no false live indicator. Disconnect/reconnect reauthorizes current membership. Exact retention and location consent policy require approval.

## 8. Exceptions and recovery

| Condition | Required behavior |
|---|---|
| Expired quote / competing confirmation | 409-style conflict; no hold/debit; refetch proposals |
| Hold insufficient / wallet conflict | Confirmation rolls back entirely; show top-up requirement |
| Vehicle/driver conflict, approval expired, suspension | Assignment/dispatch denied atomically; manager selects valid capacity |
| Driver declines / assignment times out | If acknowledgment configured, return assignment to manager queue; no public redistribution to fleet driver |
| GPS outage / offline app | Stale badge, queued scoped evidence with dedupe; no payment authorization based on offline client state |
| Capture timeout | Query durable operation outcome; unknown state blocks automatic retry/settlement until resolved |
| Partial/failed delivery or damage | Preserve evidence, open case, freeze settlement; no automatic full completion or forfeiture |
| Customer no-show/cancellation | Record reason/evidence and request; approved policy governs C, funding release and refunds; unresolved policy blocks automatic money action |
| Fleet cancellation / vehicle breakdown | Incident workflow, reassignment or reviewed refund; do not default customer cancellation charge |
| Final 30% unavailable | delivered + payment_due, notify customer; hold remains pending resolution; no settlement or invented debt fees |
| Repeated webhook/event | Authenticate/signature-check per provider spec, dedupe, acknowledge applied result; no double credit |
| Settlement/payout timeout or dispute | Freeze appropriate entitlement; reconcile provider/ledger; compensating entries approved and audited |

Audit captures actor, effective role/fleet, action, resource/version, before/after state, reason, evidence references and correlation ID with redacted sensitive fields. Rate-limit authentication, proposals, location ingestion and uploads. Use scoped CORS, TLS, request size limits, private signed storage, log redaction and existing session security conventions. Verify OTP enforcement, disabled development bypass, identity linkage and Maya webhook signature/idempotency in actual source before production. These issues are reported by historical SOPs, not independently reproduced here.
