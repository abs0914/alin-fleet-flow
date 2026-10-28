<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules (ALiN Move Fleet Portal, DRAFT)
- The existing ALiN backend is the only authority for data, auth and money; never add Lovable Cloud, a DB, or browser money logic — the portal is a client.
- All backend calls go through `src/lib/api/adapter.ts` using logical operation IDs mapped in `src/lib/api/operations.ts`; only mark an operation verified after staging contract tests — prevents guessed endpoints.
- Production adapter fails closed and never falls back to demo; demo lives only in `src/lib/demo/` in memory — avoids fake success claims.
- `src/lib/money.ts` is display/estimate only with integer centavos — real calculations are backend-owned.
- Session and caches are in-memory and cleared on sign-out — no sensitive data in browser storage.
- Portal pages live under the `_portal` pathless layout; developer tooling lives outside it (`/dev/*`).
- Keep tsconfig strict flags (noUncheckedIndexedAccess, exactOptionalPropertyTypes, noPropertyAccessFromIndexSignature) on; fix source rather than weaken them.
- Route mappings are origin-relative templates with query allowlists; commands go through frozen CommandAttempts so retries after unknown outcomes reuse the same idempotency key.
- Backend/mobile contract and acceptance plan live in `docs/`.
- Commercial rate sheets live as frozen, import-free reference modules under `src/lib/reference/` and never feed price/payment code — reference data must not silently change money.
