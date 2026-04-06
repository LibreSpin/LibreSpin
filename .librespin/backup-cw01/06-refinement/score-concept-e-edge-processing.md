# Quality Score: Concept E — Edge Processing with Aggregated TX

**Overall Score:** 75.0% (Passing)

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Coverage | 90% | 60% | 54.0% |
| Cost | 0% | 15% | 0.0% |
| Availability | 90% | 15% | 13.5% |
| Complexity | 75% | 10% | 7.5% |
| **TOTAL** | | 100% | **75.0%** |

**Status:** Passing (≥70%)

## Dimension Notes

**Coverage (90%):** Weighted coverage reflects Phase 6 REQ-04 and REQ-10 closures via the 1-hour aggregation window architecture tweak. Before Phase 6 the coverage was 83%; after closing two gaps it rises to 90%. Remaining gaps: REQ-06 (IP65 enclosure, enclosure-level deferral) and REQ-07 (BOM cost marginal, HDC2080 substitution documented as mitigation).

**Cost (0%):** Concept E is the most expensive active BOM in the two-concept comparison ($24.68 vs. Concept A $21.29). On the relative cost scale (cheapest = 100%, most expensive = 0%), Concept E scores 0%. This is the primary penalty and reflects the real cost of adding the M4 MCU ($3.53 vs. $2.22) and TPS62840 buck converter ($2.08).

**Availability (90%):** All five active parts are In Stock at DigiKey. TPS62840DLCR has exceptional depth (14,134 units). Same single-point deduction as Concept A for TPS7A0233PDQNR intermittent TI.com stock.

**Complexity (75%):** 5 active ICs, dual power rail (LDO always-on + buck TX-only), MOSFET gate control, switching inductor, edge statistics firmware engine. Higher PCB layout complexity than Concept A. Assembly risk is higher due to additional components and inductor placement EMI constraint near LoRa module antenna keep-out.

## Phase 6 Iteration Summary

- Iterations run: 1
- Architecture tweak applied: Aggregation window reduced from 6 hours to 1 hour
- REQ-04: Partial (50%) → Full (100%) — CLOSED
- REQ-10: Partial (50%) → Full (100%) — CLOSED (consequence of REQ-04)
- REQ-07 mitigation: HDC2080DMBR substitution documented (saves $2.52, restores BOM headroom)
- Score change: Phase 5 quality score (pre-formula) → Phase 6 final 75.0%
- Coverage improvement: 83% → 90% (+7 percentage points)
- Plateau check: Score improvement >5% relative — plateau not triggered
- Battery life revised: ~3.2yr (6hr TX) → ~2.8yr (1hr TX); still above 2-year target
