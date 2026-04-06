# Phase 6 Refinement Log

**Project:** Environmental Monitoring Sensor Node
**Phase 6 Date:** 2026-04-05
**Iteration Limit:** 5
**Confidence Threshold:** 70%

## Iteration Summary

| Concept | Iteration | Coverage Before | Coverage After | Score Before | Score After | Action Taken | Status |
|---------|-----------|----------------|----------------|--------------|-------------|--------------|--------|
| A | 1 (verify) | 93% | 93% | — | 93.3% | Lifecycle check passed; REQ-06/08 gaps accepted as layout deferrals | PASS — no further iteration |
| E | 1 (tweak) | 83% | 90% | — | 75.0% | REQ-04 closed: 6hr→1hr aggregation; REQ-10 closed as consequence; REQ-07 mitigation documented | PASS — score >70%, improvement >5% plateau |

## Quality Score Formula

```
qualityScore = (coverage% × 0.60) + (costScore% × 0.15) + (availScore% × 0.15) + (complexScore% × 0.10)
```

**Cost score normalization:**
- Cheapest concept (A, $21.29 active) = 100%
- Most expensive concept (E, $24.68 active) = 0%
- Linear interpolation across this range

## Concept A — Refinement Detail

**Iteration 1: Verification Pass**

Trigger: Score ≥80% from Phase 5 — verification only, no iteration needed.

Lifecycle verification:
- STM32L072KBU6: Active (ST.com, DigiKey) — confirmed
- CMWX1ZZABZ-078: Active (Murata, DigiKey) — confirmed; -091 is pin-compatible alternate
- SHT31-DIS-B2.5KS: Active (Sensirion, DigiKey) — confirmed
- TPS7A0233PDQNR: Active (TI.com, DigiKey) — confirmed; verify stock at order time

Gap disposition decisions:
- REQ-06 (IP65): Accepted as enclosure-level deferral. Three actionable mitigations documented in analysis. Not closeable at concept stage — applies equally to all concepts.
- REQ-08 (<30mm layout): Accepted as layout-phase deferral. Component dimensions are consistent with 25×25mm board. No single component forces a violation. KiCad placement study recommended before schematic commit.

**Final Score: 93.3% — PASSING**

No further iterations required. Concept A is the highest-quality concept in this evaluation set.

## Concept E — Refinement Detail

**Iteration 1: REQ-04 Architecture Tweak**

Trigger: REQ-04 was non-negotiable per user confirmation. Original Concept E transmitted every 6 hours, failing REQ-04.

Change applied: Reduced aggregation window from 6 hours to 1 hour.

- Sample rate: unchanged at every 5-10 minutes (6-12 samples per hour)
- TX rate: changed from 4×/day to 24×/day (every 3600s)
- Payload: min/max/mean computed per 1-hour window (richer than Concept A's single reading)
- Hardware: no changes — purely a firmware parameter change
- BOM cost: unchanged at $24.68 active

Impact analysis:
- REQ-04: Partial → Full. TX now occurs hourly as required.
- REQ-10: Partial → Full. Max delivery latency is now 1 hour, meeting soft real-time for environmental monitoring.
- Battery life: Revised from ~3.2yr (6hr TX) to ~2.8yr (1hr TX). Increased TX events (4→24/day) add ~0.73mAh/day LoRa TX energy. Practical estimate still exceeds 2-year target.
- Cost: No change.

REQ-07 mitigation documented: Replace SHT31 ($4.32) with HDC2080DMBR (~$1.80) to save $2.52. HDC2080 meets ±1-2% spec at lower cost and lower standby current (50nA vs. 200nA). Recommended for production builds or if CMWX1ZZ prices at DigiKey list ($17.82).

Plateau check: Coverage 83% → 90% = +7 percentage points. Score improved >5% relative. Plateau not triggered.

**Final Score: 75.0% — PASSING (above 70% threshold)**

No further iterations required. All remaining gaps (REQ-06, REQ-07, REQ-08) are either enclosure-level deferrals or documented mitigations. No additional architecture changes would improve the score above the plateau threshold without changing core components.

## Final Results

| Concept | Final Quality Score | Status | Recommendation |
|---------|--------------------|---------| ---------------|
| A: Ultra-Low-Power MCU | 93.3% | PASSING | Recommended — best balance of coverage, cost, and simplicity |
| E: Edge Processing | 75.0% | PASSING | Viable — richer payload per TX; accepts cost and complexity penalty |

Both concepts proceed to Phase 7 (Final Output / Comparison Matrix).
