# Comparison Matrix: Environmental Monitoring Sensor Node

**Generated:** 2026-04-05
**Phase:** 7 — Final Output
**Concepts evaluated:** 2 (Concept A, Concept E)

## Trade-off Table

| Dimension | Concept A: Ultra-Low-Power MCU | Concept E: Edge Processing |
|-----------|-------------------------------|---------------------------|
| Quality Score | **93.3%** | 75.0% |
| BOM Cost (active) | **$21.29** ($3.71 headroom) | $24.68 ($0.32 headroom) |
| BOM Cost (full est.) | **~$22.89** | ~$26.48 (exceeds $25 target) |
| Battery Life | **~4.9 yr** | ~2.8 yr (post Phase 6 revision) |
| Active IC Count | **4** | 5 |
| Power Architecture | LDO only (single rail) | LDO + buck (dual rail, gated) |
| MCU Core | Cortex-M0+ 32MHz 0.43µA stop | Cortex-M4+FPU 80MHz 0.95µA stop |
| Payload per TX | Single instantaneous reading | Min/max/mean over 1-hr window |
| TX Rate | Hourly (24/day) | Hourly (24/day, post Phase 6) |
| Supply Risk | Best — 4 Tier-1 parts | Mid — 5 Tier-1 parts, cost edge |
| Layout Complexity | Best — 4 ICs, simple topology | Mid — 5 ICs, inductor EMI constraint |
| FCC Path | Pre-certified module | Pre-certified module |
| Coverage | 93% | 90% |
| Cost Rank | **Best** | Worst |
| Complexity Rank | **Best** | Mid |
| Battery Rank | **Best** | Mid |
| Overall Rank | **Best** | Runner-up |

## Recommendation

Recommend Concept A. It achieves 93.3% quality against 15 requirements, costs $21.29 active (17% cheaper than E), runs 4.9 years on a single 18650 (2.5× the 2-year target), and uses only 4 active ICs with a single LDO power rail. Though the payload carries a single instantaneous reading per hour rather than hourly min/max/mean statistics, that trade-off is irrelevant unless the product specification explicitly requires aggregated telemetry — standard environmental monitoring networks accept per-reading payloads. Mitigate the two open gaps (REQ-06, REQ-08) at the layout phase: select a Hammond 1551-series IP65 enclosure to constrain PCB dimensions, and run a KiCad placement study before schematic commit to confirm 25×25mm fits.

Runner-up: Consider Concept E only if the product backlog requires hourly min/max/mean aggregation in the LoRaWAN payload. If that requirement is confirmed, substitute the SHT31 with HDC2080DMBR (~$1.80) to restore the $25 BOM headroom before proceeding to schematic.
