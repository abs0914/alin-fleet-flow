# ALiN Move Backend Integration Specification — Fleet Manager Portal

**Status:** DRAFT — for backend and finance review, not production approval  
**Updated:** 5 November 2026, Asia/Manila (UTC+8)  
**Audience:** ALiN Move backend engineers, mobile engineers, DevOps, operations and finance  
**Portal:** https://fleet.alinmove.com  
**Architecture:** Existing Fastify / Prisma / PostgreSQL backend, canonical ALiN Move Supabase authentication, Maya and existing AI Wallet / ledger services

## 1. Purpose and integration status

Connect the Fleet Manager Portal to the existing ALiN Move system without creating duplicate identities, jobs, wallets, ledgers or settlement records. The portal is a client; the existing backend owns authorization, prices, money movements, fleet membership and execution state.

The portal has an explicit, labelled, in-memory DEMO mode. Production fails closed: unmapped operations show **Integration required**, send no commands and never fall back to demo. Sample recipient labels and frontend tests do not establish actual wallet credits or backend enforcement.

### Reported backend details requiring staging validation

The preceding backend discussion reported:

- Business API base: `https://app.alinmove.com/api`.
- Existing sign-in: `POST /api/auth/login`.
- Existing refresh: `POST /api/auth/login/refresh`.
- Canonical authentication authority: `https://imewvxrqjgjkdtpyaijf.supabase.co/auth/v1`.
- Reported JWT configuration: ES256, approximately one-hour lifetime; JWKS under the authority's `/.well-known/jwks.json`.
- Existing partner/staff APIs are not evidence of a supported external fleet-manager API.

These details were discussed previously; this document does **not** certify current route availability, request/response schemas, CORS, token settings or fleet capabilities. Backend engineers must return an OpenAPI contract and staging evidence. No fleet endpoint is enabled by this specification.

`https://app.alinmove.com` is the origin; `/api` is a path prefix. If route mappings contain `/api/...`, configure the origin without adding `/api` again.

The Lovable attachment `alinmove-fleet` (`vvtawsbcghckfhkkmtor`) stays intact. It is not the canonical business-data or identity authority. Do not create duplicate business records or a separate sign-in there.

## 2. Confirmed settlement routing — latest business decision

For a delivery performed by an actively managed fleet driver:

```text
Customer tops up existing prepaid AI Wallet
                  |
        Backend collects delivery fare
                  |
      Backend settlement / ledger service
             /                    \
 Platform fee once             Net delivery proceeds
 per booking                   through existing driver
             |                 cashout/settlement module
             v                          |
 ALiN Move revenue                      v
 ₱399 introductory             Fleet management wallet
 OR ₱1,000 regular              NOT individual fleet driver
```

### Required invariants

1. **Platform fee → ALiN Move revenue:** ₱399 introductory (`39900` centavos) or ₱1,000 regular (`100000` centavos), deducted exactly once per booking from fleet proceeds. This applies to standard fleet bookings as well as confirmed heavy quotes. No introductory expiry has been supplied.
2. **Net delivery proceeds → fleet management wallet:** redirect managed-fleet delivery earnings through the existing driver cashout/settlement service to the authoritative fleet management wallet/entity. Do not create an individual fleet-driver delivery-earnings credit or a duplicate legacy commission.
3. Derive the fleet recipient from server-owned booking entitlement and membership history. A submitted `fleetId`, `walletId` or role must never redirect money.
4. Independent-rider earnings and cashout remain unchanged. The fleet manager compensates employed/contracted drivers independently.
5. Customer AI Wallet remains prepaid: top-up and spend, **no customer cashout or peer-to-peer transfers**. Fleet settlement is an authorized earnings entitlement, not a customer wallet-transfer feature.
6. This update does not establish a required fleet-manager top-up, withdrawable balance, credit timing, payout rail or settlement schedule. Those capabilities require backend and finance confirmation.
7. An `eligible` settlement is not proof of a posted wallet credit. Pending/unknown credits must be reconciled, never labelled successful by the portal.

### Concrete examples — no adjustments

| Captured fare | Fee to ALiN Move revenue | Net fleet management settlement | Individual fleet-driver earnings credit |
|---|---:|---:|---:|
| ₱10,000.00 | ₱399.00 introductory | ₱9,601.00 | ₱0.00 |
| ₱10,000.00 | ₱1,000.00 regular | ₱9,000.00 | ₱0.00 |

The separate cancellation hold is excluded from both platform revenue and net delivery proceeds. Account names and journal legs must be reviewed by finance. Examples do not authorize live posting.

## 3. Quote payments and unresolved financial policy

For a customer-confirmed heavy quote:

- Reserve a separate **₱1,000 cancellation hold** at confirmation.
- Verify **70% fare funding before dispatch**; capture 70% at evidenced pickup.
- Capture the remaining **30% at completed delivery**.
- Release the cancellation hold on successful financial completion.
- Never use the cancellation hold to pay the fare.

The backend freezes accepted quote/version and fee eligibility, computes integer centavos, and controls all money transitions. Client arithmetic is display/estimate only.

A separate 70% funding reservation at dispatch is a **proposal**, not approved policy. Finance must resolve reservation versus balance verification, expiry and concurrent-spend protection. Unresolved financial exceptions stay blocked for review.

**Still unresolved:** standard-job hold/70–30 applicability; cancellation/no-show triggers, grace, evidence, beneficiary and refunds; insufficient final funds recovery; failed/partial delivery; taxes, tolls, loading and waiting; low fare versus fee; settlement credit timing, payout rails, withholding and withdrawal eligibility. Do not silently invent these policies. The standard fleet platform fee itself is confirmed, not unresolved.

## 4. Authentication, authorization and CORS

Reuse canonical ALiN Move sign-in and token authority only after verifying the login/refresh contract and fleet role mapping. Do not automatically use the attached fleet project's generated auth client. No service-role, provider secret or OAuth client secret belongs in browser code.

Backend verification must cover signature, issuer, audience, expiry and account/membership validity. Resolve active fleets and permissions server-side on every read, command, export, document access and subscription.

- Fleet owners: own-fleet operations and financial reads; payout only when policy and grants permit.
- Dispatchers: permitted fleet operations, no default financial adjustment or payout authority.
- Viewers: read-only operations; financial visibility requires an explicit grant.
- Fleet drivers: current manager assignments, scoped milestones, GPS and POD only.
- Operations/finance: explicit reviewed scopes; no implicit financial or dispatch privilege.

### Fleet-driver exclusion is a backend requirement

Deny public single-job, batch, manifest, fallback, scheduled, direct-ID and legacy acceptance for managed fleet drivers. Exclude them from public push/WS targeting, suppress existing public offers and revoke stale access on membership changes. Hiding portal controls is not enforcement. Assignment replacement/revocation must revoke old job and location access. Do not automatically activate independent-rider eligibility when someone leaves a fleet.

### CORS requirements

Allow only reviewed, exact HTTPS portal origins:

- `https://fleet.alinmove.com`
- `https://alin-fleet-flow.lovable.app`
- `https://id-preview--43f824f6-9553-46ea-bde0-4c9ffb79a3c1.lovable.app` when staging access is needed

Do **not** allow every `*.lovable.app` origin; unrelated projects must not receive authenticated API access. Review changed preview origins explicitly. Allow supported methods and preflight for `Authorization`, `Content-Type`, `Idempotency-Key`, `X-Correlation-Id` and `If-Match`. Expose required response headers only. Credential/cookie settings depend on the verified existing session contract; do not invent them. CORS is not authorization.

Publish backend-owned OpenAPI JSON schemas in staging. The documentation URL and route namespace are for backend engineers to confirm, not guessed by the portal.

## 5. Common transport and retry contract

- Currency: PHP; monetary API values are integer centavos within agreed safe bounds, never floating-point pesos. Reject nonpositive quote totals and invalid negative gross/fees; approved signed adjustments are distinct.
- Timestamps: UTC ISO-8601 in transport, explicit Asia/Manila display.
- Reads: allowlisted filters, bounded pagination, opaque IDs; proposed list shape `{ items, nextCursor, serverTime }`.
- Commands: bearer authorization, `Idempotency-Key`, `X-Correlation-Id` and expected resource version (`If-Match` where appropriate).
- Bind idempotency to actor, fleet, operation, resource and canonical payload hash. Same key/same payload returns the original result; changed payload conflicts without side effects.
- Financial writes require durable operation records, balanced immutable ledger entries, unique business references, atomic wallet/capacity locks and transactional outbox or equivalent.
- Unknown network/provider outcome is pending/unknown, not failure-proof permission for a second charge. Reconcile before retry; compensating entries for refunds, never edits to posted ledger facts.

### Portal adapter gates

All business calls go through `src/lib/api/adapter.ts`; operation mappings live in `src/lib/api/operations.ts`. A binding stays unavailable until its real method/path and response validator are verified in staging.

Mappings use origin-relative templates and explicit query allowlists. Reject absolute/network-path URLs, traversal IDs, missing parameters and unknown query keys **before reading/attaching the bearer token**. Validate the resolved origin.

Commands use frozen attempts: retries preserve the same key, correlation ID, expected version and payload. A malformed successful command response is **outcome unknown**. Backend must supply a reviewed operation-status lookup by key/correlation ID for reconciliation after reload/sign-out. No guessed status endpoint may be used.

Proposed error envelope: `{ code, message, correlationId, details? }`, compatible with existing `{ message }` consumers. Distinguish unauthenticated, forbidden, validation failure, version/capacity conflict, unavailable/expired job or quote, insufficient funds, policy unresolved and pending/unknown payment. Never leak foreign-fleet record existence or sensitive data.

## 6. Portal operation contract checklist

**Every method/path below is to be supplied by the backend.** Logical IDs are not proposed live endpoint URLs. Preserve existing APIs or provide reviewed extensions; do not expose internal staff routes to fleet users without scoped authorization.

| Logical operation | Required input/read scope | Authoritative response / guard |
|---|---|---|
| `identity.getContext` | Existing authenticated principal | User, fleet, role, onboarding, financial grants; no client role claims |
| `fleet.get` | Authorized fleet scope | Profile, approved service areas, checklist and review status |
| `fleet.submitOnboarding` | Business details, areas, private document refs, version | Submitted fleet/review state; ownership and checklist validation |
| `fleet.resubmit` | Reviewed amendments, version | Updated review state and audit |
| `catalog.get` | Authorized service scope | Categories, heavy flags, checklist and policy versions |
| `vehicle.list` | Fleet scope, cursor/filters | Fleet-owned assets only |
| `vehicle.upsert` | Plate, category, capacity/dimensions, equipment attributes, document refs, version | Validated vehicle; no arbitrary approval grants |
| `vehicle.availability` | Vehicle, permitted availability change, version | Backend-approved state, active-assignment conflict checks |
| `driver.list` | Fleet scope, cursor/filters | Managed membership/status, masked contact, expiry and availability |
| `driver.invite` | Existing identity/invitation reference | Reviewed invitation/linkage; no arbitrary rider adoption |
| `driver.update` | Driver, permitted updates, version | Membership/status; active-job handling and audit |
| `membership.revoke` | Membership/driver, reason, version | Revoked membership and scoped access; resolve active work first |
| `standardOffer.list` | Eligible manager, scoped filters/cursor | Unexpired standard offers, canonical fare and version |
| `standardOffer.accept` | Offer ID, expected version | One fleet-owned booking; atomic single winner |
| `booking.list` | Authorized fleet, cursor/filters | Execution/payment states, canonical fee and timeline |
| `rfq.list` | Eligible fleet, filters/cursor | Heavy RFQs with minimal customer data |
| `rfq.detail` | RFQ ID in authorized scope | Requirements/version and own proposals only |
| `proposal.submit` | RFQ/version, total, inclusions/exclusions, availability, validity | Valid proposal/version; approved eligible fleet, open RFQ |
| `proposal.revise` | Proposal/RFQ version and amendment | New immutable version; no amendment after selection |
| `proposal.withdraw` | Own proposal/version | Withdrawn state; selected proposal protected |
| `assignment.create` | Booking, driver, vehicle/pair, expected version | Valid same-fleet allocation, atomic capacity reservation |
| `assignment.replace` | Booking/new assets, expected version | Pre-pickup replacement, release previous reservations and revoke old access |
| `dispatch.authorize` | Booking/version | Server-approved assignment/funding decision; unresolved policy blocked |
| `tracking.latest` | Authorized active-booking scope | Agreed list/per-job shape, capturedAt, accuracy, nullable coordinates; scoped GPS |
| `settlement.list` | Financial grant, cursor/filters | Backend totals, state, recipients and ledger refs; no wallet credit on read |
| `settlement.statement` | Settlement ID, financial grant | Itemized backend statement or reviewed private download contract |
| `settlement.payoutRequest` | Authorized settlement IDs/version | Disabled until approved policy, verified destination and reconciliation exist |
| `notifications.list` | Recipient/fleet scope, cursor/filters | Durable inbox, read state and safe links |
| `notifications.markRead` | Own notification IDs | Committed read state; no cross-recipient updates |
| `documents.uploadIntent` | Subject/type, size/MIME/checksum | Scoped, short-lived private upload intent |
| `documents.finalize` | Authorized intent/document ref, metadata | Validated private document; content/security checks |
| `documents.download` | Document ID, authorized subject scope | Expiring scoped download URL; never public KYC storage |

The portal currently requests tracking for a collection of active jobs. Backend must confirm the request/response shape or an explicit aggregation plan; do not bind a per-job object endpoint directly to a list consumer.

### Settlement response additions — proposed schema

```json
{
  "items": [
    {
      "id": "stl_example",
      "bookingId": "bk_example",
      "settlementRecipient": {
        "kind": "fleet_management_wallet",
        "fleetId": "fleet_example"
      },
      "platformFeeRecipient": "alin_move_revenue",
      "grossCentavos": 1000000,
      "capturedCentavos": 1000000,
      "feeCentavos": 39900,
      "feeKind": "intro",
      "adjustmentsCentavos": 0,
      "netPayableCentavos": 960100,
      "disputedCentavos": 0,
      "holdNote": "Cancellation hold released; excluded from settlement",
      "state": "eligible",
      "ledgerRefs": ["ledger_example"]
    }
  ],
  "nextCursor": null,
  "serverTime": "2026-11-05T06:45:00Z"
}
```

IDs and values are examples only. Recipient fields are optional in the current portal for compatibility; absence displays **destination awaiting confirmation**, never a fabricated production recipient. Backend must validate all fields before binding. A separate reviewed credit-status/ledger contract is needed to assert wallet credit; `netPayableCentavos` is not a wallet balance.

## 7. Backend and mobile dependencies beyond portal operations

Implement or verify in the existing system:

- Customer RFQ creation and atomic proposal confirmation: freeze selected proposal/fee, reserve cancellation hold, create/link one canonical job.
- Driver assignment acknowledgment if approved; scoped execution, pickup evidence, POD, exception reporting and GPS.
- Pickup/final fare captures, hold release and fleet management settlement credit with unique durable references.
- Existing wallet top-up verification and transaction history; browser return or receipt screenshot is not payment proof.
- Independent-rider regression protection across public offers, earnings and cashout.
- Authenticated notifications with outbox, dedupe/replay and server-derived recipients. Notification failure must not recreate a job or debit.
- Private signed documents, minimal customer exposure and current-assignment location access.

No separate business database, wallet, authentication service or financial calculation engine may be added to the portal.

## 8. Assets, tracking and reference rates

Backend assignment checks must enforce approved, active managed membership; license/document validity; same fleet; compatible category, cargo capacity, temperature/lifting/container requirements; nonoverlapping driver/vehicle reservations. Reserve paired tractor/trailer equipment together. Pre-pickup replacement releases the old assignment only when the new allocation commits. After-pickup reassignment needs an operations workflow.

Dashboard contains map and tracking; the old tracking page redirects to Dashboard. Location samples require assignment scope, capture/receipt times, accuracy, sequence checks and explicit stale/unavailable states. A map marker is not dispatch authorization or evidence of live location.

VUTAI 2026 bobtail rate matrix is **DRAFT REFERENCE only**, VAT excluded. Its 30 rows, band units, CIP origin, surcharge interpretation and South Harbor applicability are not approved ALiN pricing. Preserve flagged Minglanilla 40FTR/51–69 ₱105,000 and Liloan 20FTR/90–109 ₱14,000. Container length 20-ft/40-ft is not wheel count or capacity. Viewing/filtering reference data never updates a quote, wallet or settlement. Keep other heavy categories, including reefer, boom, 10-wheeler and long-haul.

## 9. Staging acceptance requirements — all backend checks pending

Use isolated sandbox fleets A/B, authorized/unauthorized users, fleet drivers and an independent rider, eligible/expired assets, customer wallets around thresholds and production payouts disabled. Exclude sandbox records from live reports.

| Check | Required result |
|---|---|
| Cross-fleet IDs, documents, exports, settlement/GPS reads | Denied without data or existence leakage |
| Managed fleet-driver public offers and every legacy/direct acceptance route | Denied; public push/WS excluded; independent rider unchanged |
| Concurrent offer acceptance / proposal confirmation | One booking/selection; one cancellation hold |
| Double assignment, incompatible/expired/revoked assets, shared trailer | Atomic conflict; no double reservation; valid allocation succeeds |
| Assignment replacement/revocation | Old driver loses job/POD/GPS access; correct assets released |
| Confirm with ₱999.99 then ₱1,000 available | First denied atomically; second creates one separate ₱1,000 hold |
| Quote ₱10,000, funded milestones and duplicate events | One ₱7,000 pickup capture and one ₱3,000 final capture; one hold release |
| Insufficient/unknown capture or release | Physical evidence retained; financial exception blocked/reconciled; no duplicate debit |
| ₱10,000 captured, intro fee | One ₱399 ALiN Move revenue posting, ₱9,601 fleet settlement, fleet-driver earnings credit ₱0 |
| ₱10,000 captured, regular fee | One ₱1,000 ALiN Move revenue posting, ₱9,000 fleet settlement, fleet-driver earnings credit ₱0 |
| Concurrent/unknown fleet settlement credits | One entitlement/credit; reconcile before retry; balanced journals |
| Submitted foreign fleet/wallet recipient | Ignored/rejected; server-owned entitlement controls destination |
| Below-fee, disputed, partial or unresolved-policy case | Review state; no negative/guessed automatic payable |
| Same idempotency key/payload; changed payload; reload status read | Original result; conflict without effect; recoverable unknown status |
| Customer cashout/peer transfer; provider top-up webhook replay | Cashout/transfer denied; verified top-up credited once |
| Notification outage/replay, stale GPS and private document misuse | No duplicate money; scoped access; stale/unavailable accurately labelled |
| Historical OTP/dev bypass and payment webhook concerns | Verify actual source; production-equivalent bypass rejected; provider authenticity checked |

Portal evidence as of this revision: **124 frontend tests passed**, including six sample settlement/display checks; desktop/mobile settlement page and disconnected production state checked. These are not real ledger, wallet-credit, auth, CORS or backend acceptance tests.

## 10. Delivery and release checklist

Backend team to provide:

1. Reviewed business API origin, route registry/OpenAPI and staging environment.
2. Verified canonical auth/login/refresh schemas and server-resolved fleet roles/grants.
3. Reviewed exact CORS origins and auth/session security settings.
4. Operation-by-operation method/path, parameter/query/body schema, success/error validator, permissions and staging test evidence.
5. Existing settlement/cashout module ownership and exact fleet-wallet/revenue ledger mapping; no duplicate driver credit.
6. Finance decisions for unresolved payment/credit/payout policies and durable reconciliation retention.
7. Customer/driver mobile changes plus independent-rider regression results.
8. Acceptance evidence: environment/build IDs, command/test names, expected versus actual outputs, redacted ledger references and recovery tests.

Portal team binds operations **only after staging contract tests pass**. Keep unsupported actions unavailable and DEMO separate. Human review follows **DRAFT → REVIEW → APPROVED → PUBLISHED**; this specification does not authorize publication, schema changes or live money movement.

### Companion repository references

- `docs/INTEGRATION-CONTRACT.md`: expanded state machines, transaction boundaries, protocol and exception requirements.
- `docs/ACCEPTANCE-AND-ROLLOUT.md`: detailed pending acceptance IDs and launch/recovery gates.
- `docs/RATE-MATRIX-REFERENCE.md`: literal reference transcription and unresolved interpretation.
- `src/lib/api/types.ts` and `src/lib/api/operations.ts`: current portal types and logical operation inventory; backend-owned reviewed schemas remain the integration authority.
