# VUTAI Rate Matrix — DRAFT REFERENCE ONLY

Status: **DRAFT · REFERENCE_ONLY · UNCONFIRMED.** Not approved ALiN commercial pricing.

- Source title: `VUTAI LOCAL TRUCKING BOBTAIL (PUTOL) RATES 2026 EXCLUSIVE OF VAT`
- Source file: `d92e453d-429b-49bf-9f11-b75f7f59a793.jpg` (supplied image; viewable in the portal Rate Reference page)
- Origin label as printed: `CIP TO` (not expanded; boundary unconfirmed)
- Currency: PHP, whole pesos as printed. App displays integer centavos (`pesos × 100`).
- VAT: printed "exclusive of VAT". VAT rate and taxable base unconfirmed; no VAT is calculated.
- Band labels (literal): `CURRENT RATE UP TO 50`, `51-69`, `70-89`, `90-109`. Unit not printed (null).
- Header prints `1000` under each "ADDITIONAL FUEL SURCHARGES" column. Row values are shown **as printed totals**; no surcharge is added on top. Interpretation unconfirmed.
- `SOUTH HARBOR ADDITIONAL RATE ₱500`: conditional reference note only; never auto-applied.
- Equipment `20FTR`/`40FTR` = 20-ft / 40-ft **container length option** under tractor head / container / trailer equipment. Not a wheel count; no dimensions or capacity inferred. Existing heavy types (10-wheeler, long-haul, reefer, trailer, tractor head/container, boom) are unchanged. This sheet does not price reefer, boom, general 10-wheeler or long-haul jobs.
- Production authority: existing backend catalog/pricing. Module: `src/lib/reference/rateMatrix.ts` (no imports, no network, frozen).

## Rows (pesos)

| CIP to | Equipment | Up to 50 | 51-69 | 70-89 | 90-109 | Review |
|---|---|---:|---:|---:|---:|---|
| CITY LIMITS | 20FTR | 6,000 | 7,000 | 8,000 | 9,000 |  |
| CITY LIMITS | 40FTR | 7,000 | 8,000 | 9,000 | 10,000 |  |
| MANDAUE AFTER | 20FTR | 7,000 | 8,000 | 9,000 | 10,000 |  |
| MANDAUE AFTER | 40FTR | 8,000 | 9,000 | 10,000 | 11,000 |  |
| BUTUANON RIVER | 20FTR | 8,000 | 9,000 | 10,000 | 11,000 |  |
| BUTUANON RIVER | 40FTR | 9,000 | 10,000 | 11,000 | 12,000 |  |
| CONSOLACION | 20FTR | 9,000 | 10,000 | 11,000 | 12,000 |  |
| CONSOLACION | 40FTR | 10,000 | 11,000 | 12,000 | 13,000 |  |
| LILOAN | 20FTR | 10,000 | 11,000 | 12,000 | 14,000 | YES |
| LILOAN | 40FTR | 11,000 | 12,000 | 13,000 | 14,000 |  |
| COMPOSTELA | 20FTR | 11,000 | 12,000 | 13,000 | 14,000 |  |
| COMPOSTELA | 40FTR | 12,000 | 13,000 | 14,000 | 15,000 |  |
| LAPULAPU CITY PROPER | 20FTR | 7,000 | 8,000 | 9,000 | 10,000 |  |
| LAPULAPU CITY PROPER | 40FTR | 8,000 | 9,000 | 10,000 | 11,000 |  |
| MEPZ 1 | 20FTR | 7,000 | 8,000 | 9,000 | 10,000 |  |
| MEPZ 1 | 40FTR | 8,000 | 9,000 | 10,000 | 11,000 |  |
| MEPZ 2 | 20FTR | 8,000 | 9,000 | 10,000 | 11,000 |  |
| MEPZ 2 | 40FTR | 9,000 | 10,000 | 11,000 | 12,000 |  |
| TALISAY | 20FTR | 7,500 | 8,500 | 9,500 | 10,500 |  |
| TALISAY | 40FTR | 8,500 | 9,500 | 10,500 | 11,500 |  |
| MINGLANILLA | 20FTR | 8,500 | 9,500 | 10,500 | 11,500 |  |
| MINGLANILLA | 40FTR | 9,500 | 105,000 | 11,500 | 12,500 | YES |
| NAGA | 20FTR | 10,500 | 11,500 | 12,500 | 13,500 |  |
| NAGA | 40FTR | 11,500 | 12,500 | 13,500 | 14,500 |  |
| SAN FERNANDO | 20FTR | 11,500 | 12,500 | 13,500 | 14,500 |  |
| SAN FERNANDO | 40FTR | 12,500 | 13,500 | 14,500 | 15,500 |  |
| MARIGONDON/NEWTOWN | 20FTR | 9,000 | 10,000 | 11,000 | 12,000 |  |
| MARIGONDON/NEWTOWN | 40FTR | 10,000 | 11,000 | 12,000 | 13,000 |  |
| CORDOVA/PUNTAENGANO | 20FTR | 10,000 | 11,000 | 12,000 | 13,000 |  |
| CORDOVA/PUNTAENGANO | 40FTR | 11,000 | 12,000 | 13,000 | 14,000 |  |

## Anomalies (raw retained; cells blocked as proposal references)

1. MINGLANILLA · 40FTR · 51-69 = **105,000** as printed. Possible typo; no corrected value approved.
2. LILOAN · 20FTR · 90-109 = **14,000** as printed; jump differs from adjacent +1,000 pattern. Preserve; confirm.

## Unconfirmed (do not resolve by guessing)

- CIP origin expansion/location boundary
- CITY LIMITS and MANDAUE AFTER boundaries
- BOBTAIL (PUTOL) operational definition
- fuel-band units and effective source/date
- band boundary/decimal handling and values above 109
- header incremental surcharge vs displayed total interpretation
- South Harbor applicability and one-way/return-trip scope
- VAT rate and taxable base
- operator approval to use as commercial ALiN pricing

## Usage rules in the portal

- Read-only table with search and filters (destination, 20FTR/40FTR, literal band, flagged only) plus source-image viewer.
- RFQ proposal form links here; fleet managers enter amounts **manually**. Nothing is copied, applied or sent automatically.
- The reference never changes a quote total, approved pricing, customer wallet, accepted quote, hold, capture, platform fee or settlement.
- Any future "copy to proposal" helper requires explicit user confirmation, must keep source provenance, and must block flagged cells.
