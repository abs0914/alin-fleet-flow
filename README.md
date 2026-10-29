# Alin Fleet Flow

Create a new project named ALiN Move Fleet Manager Portal. Build the portal now according to the complete brief below. Do not provision Lovable Cloud, a database, Supabase project, or separate authentication. Do not publish. No backend API access has been verified, so implement a polished navigable portal, typed API adapter that fails closed, explicit in-memory DEMO mode and actionable integration-required states. Production cannot falsely claim backend enforcement. Implement meaningful frontend tests for wallet display arithmetic, permission presentation and fail-closed adapter; document pending real backend acceptance tests. Place the full integration contract and acceptance plan below into docs/ files for the backend and mobile teams. Our documented existing backend is Fastify/Prisma/PostgreSQL with Supabase auth, Maya payments, AI Wallet, existing riders/jobs/ledger. Do not send commands to any guessed endpoint. Mark status DRAFT. Build screens and meaningful forms/interactions, not only an overview. Financial logic shown in the client is display-only; real money logic belongs exclusively to existing backend. Include a developer integration capability matrix outside ordinary product flow. Onboarding/Jobs/RFQs/Vehicles/Drivers/Tracking/Settlements/Notifications/Settings must be navigable. Return preview and exact tests executed plus limitations.

# Paste into Lovable: ALiN Move Fleet Manager Portal

Build the ALiN Move Fleet Manager Portal using this prompt plus INTEGRATION-CONTRACT.md and ACCEPTANCE-AND-ROLLOUT.md. Current artifact status is DRAFT. Implement a responsive, accessible operations portal using TypeScript, React, Tailwind and reusable UI components where supported by the existing project. First inspect project files and existing API adapters. Preserve compatible conventions. Do not publish automatically.

## Hard boundaries

The existing ALiN Move backend is the sole authority for users, fleet membership, vehicle/driver approval, jobs, RFQs, proposals, assignments, GPS, AI Wallet, ledger and settlements. Do not provision a separate database, Supabase project, auth system, wallet, pricing engine or payout backend. Existing Supabase authentication is documented but its exact integration must be verified. No service-role or provider secret in the client. Never connect directly to transactional database tables from the browser to bypass the API.

No API origin, endpoint payloads, credentials or fleet routes are confirmed. Define a typed adapter against the logical operations in the contract. Maintain an explicit operation-to-real-route mapping. Keep unverified operations disabled with an actionable “Integration required” state. Do not guess URLs or claim successful writes. A separate explicit “Demo — sample data” mode may use in-memory fixtures; no persisted business records or network writes, no production credentials, and no fabricated live tracking or balances. Production mode must fail closed if adapter configuration is missing. Never silently fall back to demo on API failure.

## Product and visual design

Practical, confident, conversational ALiN Move voice. Yellow/black/white branding, provisional yellow #FFD400, black #111111, white #FFFFFF; use supplied ALiN logo if available, preserve aspect ratio. Dark text on yellow; accessible focus states, keyboard navigation, labelled controls, useful validation and non-color status labels. Avoid decorative charts with invented performance data. Display PHP amounts with two decimals, times in Asia/Manila and explicit timezone; transport UTC ISO timestamps. Desktop sidebar and compact mobile navigation. No unsupported delivery guarantees or promotions beyond the configured fee.

Navigation: Overview, Jobs, RFQs & Proposals, Fleet Vehicles, Drivers, Tracking, Settlements, Notifications, Fleet Settings. Profile menu shows actual backend role and fleet. No client role switch in production. Show data freshness and connection state. Clear tenant-scoped caches on logout or fleet change.

## Screens and flows

1. Sign in with existing ALiN auth; session expiry/refresh, forbidden and suspended states. Fleet onboarding wizard: business/contact details, service area, configurable document uploads, review summary, submit, requested changes, resubmit and approval status. Exact required documents come from backend configuration. Pending fleets cannot accept jobs or propose.
2. Vehicles: searchable table and details; add/edit vehicle identity, backend category, capacity, dimensions, special capabilities (temperature range for reefers, lifting capacity for boom trucks, tractor/trailer compatibility), document validity, approval and availability. Show schedule conflict, maintenance and expired-document blocks. Categories come from backend catalog. Offer taxonomy labels for 10-wheelers, long-haul, reefers, trailers, tractor heads/container trucks and boom trucks pending backend mapping. Support compatible tractor/trailer pairing with shared capacity locks.
3. Drivers: invitation tied to existing identity, onboarding/approval status, active fleet membership, license validity from approved checklist, availability and current assignment. Backend membership controls the fleet-only driver mode. Removal/suspension handles active assignments through operations; never silently converts a driver into a public-market rider.
4. Standard jobs: scoped live/polled broadcast queue, expiry and canonical fare; details with pickup/dropoff, suitable vehicle, capacity and time. Accept with server revalidation and one atomic winner. A conflict refreshes and explains “This job is no longer available.” Fleet acceptance is separate from driver assignment.
5. Heavy-truck RFQs: eligible request queue and expiry, category, route, pickup window, recipient requirements, cargo dimensions/weight, temperature/lifting/container specifications when applicable. Proposal form includes amount, itemized inclusions/exclusions, availability, validity and version. Show draft/submitted/withdrawn/expired/selected/not selected. Customer selects and confirms in customer app; portal cannot impersonate customer or charge their wallet. Quote amendments require new version and customer acceptance.
6. Booking detail: authoritative progress timeline, immutable accepted proposal, hold/funding/capture status, fee and estimated net settlement, assignment, contacts scoped to job, documents, exception history. Assignment selector requires approved compatible available driver and vehicle from same fleet; optional driver acknowledgment is a configurable pending decision. Reassignment before pickup invalidates old assignment; after pickup requires operations workflow.
7. Dispatch: allow only after backend verifies eligibility and 70% funding under approved policy. Never trust a green client balance indicator as authorization. At pickup show capture pending/paid/failed/unknown. Track physical pickup/delivery evidence independently of financial status. Driver app is updated by its own team: manager assignments only, acknowledgment if configured, milestones, GPS, POD, failure reporting; no public offer feed or acceptance for fleet drivers.
8. Tracking: job map using verified existing mapping integration, last GPS timestamp/accuracy, stale/offline badge and timeline. Missing coordinates show “Location unavailable”; do not interpolate a fake live location. Access only for active authorized jobs, subject to approved retention. Provide text timeline when map integration is missing.
9. Settlements: earned gross, captured amounts, server-frozen ₱399 intro or ₱1,000 regular fee, adjustments, net payable, disputed/blocked amounts, payout state and downloadable server-generated statement with references. Fleet operator receives proceeds; do not create driver earnings or a second platform commission. Show fee and cancellation hold separately. UI estimates are labelled; settlement totals come from backend. No payout request enabled before approved payout policy exists.
10. Notifications and settings: in-app durable inbox, read state, event deep links, retryable fetch; limited business/contact edits and permissions. Operations approve onboarding and investigate exceptions; finance approves authorized adjustments and settlements via existing or explicitly added scoped screens. Backend, not hidden buttons, enforces access.

## Required financial behavior

For a confirmed heavy quote total Q, reserve ₱1,000 separately on confirmation. Verify 70% funding before dispatch; proposed separate reservation needs approval. Charge 70% at pickup, remaining 30% on evidenced completed delivery, release cancellation hold after successful completion. Backend performs all calculations in integer centavos and owns rounding, concurrency, idempotency and ledger transactions. Fee is deducted once from operator settlement, not charged on top to customer. Intro fee eligibility/expiry is server-configured; no invented deadline. Cancellation rules beyond the stated customer cancellation fee require approved policy; show finance review instead of guessing forfeiture.

## Engineering deliverables

Typed domain models and adapter, all screens above, authorization-aware routes, accessible loading/empty/error/stale/conflict states, validated forms, test fixtures in explicit demo mode, unit/UI tests where useful, and a capability mapping that states which operations are live, unavailable or demo. Never put auth tokens, exact GPS or customer data in analytics logs. Avoid browser persistence of sensitive job/KYC data. Server-confirmed commands invalidate/refetch relevant lists and details. A notification never authorizes an action; always fetch and reauthorize the resource.

Implement in this order: inspect and map existing project → UI and adapter scaffolding → onboarding and fleet management → standard jobs/RFQs → assignment/tracking → finance read views → staging integration and acceptance tests. Do not simulate passing backend tests with client mocks. Report backend/mobile work separately from portal work. Mark capabilities blocked until actual route schemas and ownership checks are verified. Finish with changed-file summary, real checks executed, unresolved decisions and connection steps. Keep status DRAFT until human review and approval.

# Proposed ALiN Move fleet integration contract

Status: DRAFT. This is a design contract for implementation in the **existing backend**. Logical operation IDs below are not verified routes. No base URL or credentials are supplied. A backend-owned OpenAPI spec and staging contract tests must bind each operation to a real method/path before integration.

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

- Fleet: business identity, onboarding status, service areas, approved capabilities, suspension reason.
- FleetMembership: user/rider reference, fleet, permission set, managed/independent mode, effective intervals; proposed unique active managed membership per driver.
- FleetVehicle: fleet, canonical category, plate/identity, capacity/dimensions, special capabilities, document references, approval/maintenance status. Vehicle pairing references for tractor/trailer equipment.
- FleetDocument: subject, document type from configured checklist, private storage key, expiry, review status; no public KYC URLs.
- RFQ: customer reference, cargo requirements, pickup/dropoff/recipient, window, expiry, immutable requirements version and eligibility snapshot.
- Proposal: RFQ/fleet, quote version, integer PHP total and itemization, assumptions, validity, capacity reference, terms hash and status. Unique selection per RFQ.
- FleetBookingExtension: existing delivery_job reference, fleet owner, source standard/RFQ, selected proposal/version, pricing/fee snapshot and financial state. One canonical job ID.
- Assignment: job, fleet, driver, vehicle/pair, issuing manager, effective/revoked timestamps and version. Unique active assignment per job and non-overlapping capacity reservations for driver/equipment.
- WalletReservation: existing wallet reference, booking, purpose cancellation/funding, amount, state and unique business key. Use existing reservation model if present; add capability in backend if absent.
- FleetSettlement: operator, booking, captured gross, fee snapshot, approved adjustments, payable, ledger references and payout reference. Unique booking entitlement, no parallel rider earning.
- DomainEvent/outbox, notification inbox/delivery attempts, immutable audit/transition history: same backend transaction boundary or reliable equivalent.

## 4. Common transport contract

Use backend-bound operation mapping, JSON schemas validated at boundary, opaque IDs, `currency: PHP`, integer centavos within safe integer bounds, ISO UTC timestamps and cursor pagination with bounded limits. Required command metadata: unique idempotency key, expected resource version and correlation ID. Bind idempotency to actor, fleet, operation, resource and canonical payload hash. Same key+payload returns original result; same key+different payload conflicts. Durable retention must cover financial replay/reconciliation horizons, to be configured with finance/operations. Authentication tokens never appear in URLs or logs.

Proposed response: resource plus version and correlation ID; list responses include items, nextCursor and serverTime. Optional capabilities tell clients which operations are enabled, but never replace authorization. Proposed error codes: UNAUTHENTICATED, FORBIDDEN, FLEET_DRIVER_PUBLIC_OFFER_DENIED, VALIDATION_FAILED, VERSION_CONFLICT, JOB_UNAVAILABLE, QUOTE_EXPIRED, CAPACITY_CONFLICT, NOT_APPROVED, INSUFFICIENT_AVAILABLE_FUNDS, PAYMENT_PENDING, POLICY_UNRESOLVED and INTEGRATION_UNAVAILABLE. Map to 401/403/422/409/503 as appropriate while retaining `{message}`. Do not reveal cross-fleet record existence in error detail.

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

Onboarding: draft → submitted → under_review → approved | changes_requested | rejected; changes_requested → submitted. Approved → suspended by authorized operations; reactivation requires review. Suspension blocks new acceptance/assignment, with active-trip safety handled through incident workflow.

RFQ: draft → open → selected | expired | cancelled. Proposal: draft → submitted → selected | not_selected | withdrawn | expired. Customer confirmation atomically verifies proposal version/validity, locks RFQ, reserves cancellation funds, creates/links canonical job and freezes pricing. If hold fails, selection/job creation rolls back. Two customers/devices cannot select two proposals. Selected proposal immutable; amendments require renewed consent and funds recalculation.

Fleet job allocation: offered → fleet_accepted → assignment_pending → assigned → dispatch_authorized. RFQ confirmation starts at fleet_accepted. Standard acceptance atomically claims unowned job and expires sibling offers; no pretend assigned rider until manager assigns. Map driver execution to documented accepted → en_route_pickup → at_pickup → picked_up → in_transit → at_dropoff → delivered/failed, with explicit mapping between allocation and execution states. Maintain separate physical and financial states so funds failure cannot erase pickup or delivery truth. Assignment acknowledgment may gate dispatch only once policy is approved. Reassignment revokes previous actor and all tokens/subscriptions tied to assignment, revalidates equipment/funds, and records audit.

Financial flow for quotation total Q centavos:

1. Confirmation: lock wallet and RFQ; available balance must cover 100000 centavos. Create unique cancellation reservation C=100000, reducing spendable availability without treating it as revenue. Booking/selection/hold commit together.
2. Proposed dispatch funding gate: calculate P1=roundHalfUp(Q×70/100), P2=Q−P1. Verify spendable funds excluding C and all other holds. Prefer reserve P1 as a separate funding reservation F, atomically with dispatch authorization. Reservation semantics/expiry need approval; absent approval/capability, keep live dispatch blocked instead of unsafe balance-only checks. Hold remains C in addition to F.
3. Pickup: validate assignment/evidence; convert F to a P1 capture with balanced ledger posting exactly once, or perform approved atomic debit if policy uses another funding guarantee. Record actual pickup independently if financial operation fails/unknown; flag payment exception, prohibit duplicate debit and auto settlement. Do not quietly confiscate C.
4. Delivery: record POD and physical completion; capture P2 atomically when funds available. If insufficient, physical delivered + final_payment_due; retry only through authorized funded command. Customer receives top-up instruction. Full successful capture → paid, release C exactly once, create settlement eligibility in same transaction/outbox boundary. If hold release fails, release_pending and settlement blocked pending reconciliation.
5. Fee frozen at customer acceptance/confirmation from server policy: introductory 39900 or regular 100000 centavos plus eligibility/version snapshot. No invented introduction end date. Fee deducted once from gross operator entitlement; no double application of legacy rider commission/earnings.
6. Settlement: draft → blocked | eligible → approved → payout_pending → paid; payout_pending → failed | outcome_unknown. Only captured, reconciled, undisputed proceeds are eligible under approved policy. Net=attributable captured gross−frozen platform fee+signed approved ledger adjustments. Do not invent tax, withholding or cancellation proceeds. Negative payable or below-fee booking goes to review. Payout uses existing verified rails, idempotency and reconciliation. Never reissue unknown payout without querying/reconciling provider status.

Reservation lifecycle: active → consumed | released; cancellation reservation may become captured only under approved cancellation policy/evidence. No timeout may release an in-use reservation without approved recovery policy. Funding reservation expiry revokes dispatch authorization and requires re-funding. Successful hold release is independent of consuming F. Available wallet = posted balance − active reservations; avoid subtracting consumed reservations twice. Validate invariant nonnegative spendable balance under concurrent top-ups, holds and spending.

Proposed rounding examples, pending finance approval: Q=1,000,000 (₱10,000): P1=700,000, P2=300,000; intro payable before adjustments=960,100 (₱9,601). C=100,000 is separate and returned; never counted in payable. Q=100001: P1=70001, P2=30000, exact sum Q. Reject nonpositive/unsafe totals; below-fee pricing requires policy review. Use integer/rational arithmetic, not binary floating-point percentages.

All money movements use wallet locks/serializable equivalent, immutable balanced journal legs, unique business references per hold/capture/release/fee/settlement, and transactional outbox. Exact chart-of-account mapping requires finance review. External provider operations use durable command records and reconciliation; distributed success is not assumed atomic. Timeout → unknown/pending queryable status, not automatic second charge. Refunds use compensating entries, never edits/deletes of posted ledger entries.

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

# Acceptance tests and rollout

Status: DRAFT specification. **No application or backend tests have been executed.** Run backend tests against the actual existing ALiN staging API and database; mocked UI tests cannot certify backend enforcement.

## Required fixtures

Isolated staging/sandbox environment with production payouts disabled; fleets A/B, approved/suspended managers and assets, two fleet drivers and one independent rider, customer C and unrelated customer D, operations and finance users, standard offers, RFQs, paired tractor/trailer equipment, expired proposals and wallet balances around each threshold. Test using backend-known IDs; no real customer data. All created records/events retain sandbox classification, excluded from live reports.

## Executable acceptance scenarios for implementers

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
| REG-01 | Existing independent-rider offers, customer bookings, branch/cargo workflows, finance reports | Existing supported flows preserved; sandbox excluded; fleet data only where authorized |

## Implementation work packages

1. Backend discovery: inspect actual route registry, schema, auth middleware, offer generation/acceptance paths, wallet mutation service, commission freeze, POD completion, finance and provider integration. Produce verified capability/route matrix and OpenAPI schemas. Resolve policy questions in README.
2. Backend foundation: additive migrations for fleet membership/assets and history, scoped authorization, explicit driver mode and global public-offer exclusion. Add onboarding and review, private documents, inventory APIs and tests.
3. Marketplace: fleet acceptance with transactional claim, heavy RFQs/proposals, customer confirmation, assignment/capacity locks and customer/driver mobile changes. Gate new features with backend flags.
4. Money: reservation support, two captures, fee snapshot, fleet ledger entitlement and settlement/payout integration, outbox/reconciliation. Finance reviews journals and policy configuration before real money.
5. Portal: adapter mapping, screens, stale/conflict handling, authorized notifications/tracking, backend-provided statements and UI tests. Keep demo isolated.
6. Staging verification: execute scenarios above, record environment/build IDs, command/test names, actual versus expected output and evidence. Load-test competing acceptance/wallet locks, worker replay and retry recovery at agreed volume; no claimed scale numbers without measurement.

## Launch and recovery gates

- Human review of open policies, UI and financial examples; DRAFT → REVIEW → APPROVED. Publishing changes artifact status only after actual publication.
- All critical authorization/financial tests pass against live staging integrations; no unresolved auth bypass or wallet duplication; migration backup/rollback and reconciliation runbooks verified.
- Existing backend owner supplies API origin/spec, secure auth configuration and project access. Configure browser origins/redirects and approved secret storage. Never request secrets in a prompt.
- Begin with allowlisted fleets and test RFQs under backend feature flags; observe acceptance conflicts, denied public-driver attempts, wallet invariants, pending/unknown payments, hold-release lag, notification failures and reconciliation differences. Alert thresholds require operations agreement.
- Kill switch stops new RFQs, confirmations, acceptance and dispatch if necessary while preserving active-trip tracking, POD evidence and authorized financial recovery. Never release reservations or delete jobs simply because a frontend is rolled back.
- Rollback uses additive/backward-compatible migrations and previous frontend/API versions; do not roll back posted ledger facts. Reconcile in-flight charges, reservations and payouts with durable keys and compensating entries. Assign operational owners before launch.

Completion means real portal/API/mobile integration and tested backend invariants, not a rendered dashboard alone. This package is ready for implementation planning; it does not certify production readiness.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://alin-fleet-flow.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/43f824f6-9553-46ea-bde0-4c9ffb79a3c1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
