---
phase: '7-final-output'
completed: '2026-04-05'
completeness_score: 80
source: interactive
schema_version: 1
---

# Requirements

See: .librespin/01-requirements/requirements.yaml

# Success Criteria

- Battery life minimum 2+ years on single 18650 LiPo
- BOM cost under $25 at low volume (1-10 units)
- Fits in <30mm enclosure
- FCC certified path clear — use pre-certified LoRa module
- Ready for schematic capture with verified parts
- Prototype BOM with lead times from DigiKey/Mouser
- Reference designs identified for key components
- Power budget analysis for battery life verification
- Accept new parts from established vendors (TI, Nordic, STM)
- Single-source acceptable if no alternative exists
- Priority: Battery life > Cost > Size (but cost wins in direct trade-off)
- Optimize for maximum battery life as primary design goal
- Lower cost preferred over longer battery life when forced to choose

# Phase 2: Architecture Drafting

**Status:** Complete
**Concepts generated:** 5

| Concept | Architecture | Est. Battery Life | Key Trade-off |
|---------|-------------|-------------------|---------------|
| A | Ultra-low-power M0+ + LDO | 2.5-3.5 yr | Min power, no OTA |
| B | LoRa SoM + buck-boost + OTA | 1.5-2 yr | Fast dev, higher cost |
| C | BLE SoC + discrete LoRa | 2-2.5 yr | Dual radio, complex layout |
| D | Two-board stackup + load switch | 3-4 yr | Best RF isolation, complex mfg |
| E | M4 edge processing + hybrid power | 2.5-3.5 yr | Smart TX, complex firmware |

See: .librespin/02-concepts/overview.md

# Phase 2.5: Requirements-to-Component Mapping

**Status:** Complete
**Terminology collisions found:** 0
**Concepts cleared:** 5/5

All concepts passed pre-validation. No terminology collisions detected. Project uses simple IoT vocabulary with no USB, no SPI mode ambiguity, and no multi-modal IC configuration terms.

# Phase 3: Validation Gate

**Status:** Complete
**Threshold:** 80% (auto-pass >=85%); manually lowered to 70% for Phase 4 promotion
**Concepts evaluated:** 5

| Concept | Score | Status |
|---------|-------|--------|
| A: Ultra-Low-Power MCU | 86.0% | auto_passed |
| B: Module-Based OTA | 71.6% | auto_failed |
| C: Nordic BLE+LoRa | 62.0% | auto_failed |
| D: Distributed Stackup | 67.4% | auto_failed |
| E: Edge Processing | 73.0% | manually_promoted (threshold 70%) |

**Validated concepts proceeding to Phase 4:** Concept A and Concept E

See: .librespin/03-validation/validation-summary.md

# Phase 4: Component Research

**Status:** Complete
**Concepts researched:** 2 (A, E)
**All parts verified:** DigiKey authorized distributor, Active lifecycle

## Concept A — Ultra-Low-Power MCU

| Role | MPN | Manufacturer | Unit Price | Status |
|------|-----|--------------|------------|--------|
| MCU | STM32L072KBU6 | STMicroelectronics | $2.22 | Active, In Stock |
| LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | ~$14.00 | Active, In Stock |
| Temp/Humidity | SHT31-DIS-B2.5KS | Sensirion | $4.32 | Active, In Stock |
| LDO | TPS7A0233PDQNR | Texas Instruments | $0.75 | Active, In Stock |

Active BOM cost: $21.29 — PASS ($3.71 under $25 target)
Battery life: ~4.9 years — PASS

## Concept E — Edge Processing

| Role | MPN | Manufacturer | Unit Price | Status |
|------|-----|--------------|------------|--------|
| MCU | STM32L412KBU6 | STMicroelectronics | $3.53 | Active, In Stock |
| LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | ~$14.00 | Active, In Stock |
| Temp/Humidity | SHT31-DIS-B2.5KS | Sensirion | $4.32 | Active, In Stock |
| LDO (sleep) | TPS7A0233PDQNR | Texas Instruments | $0.75 | Active, In Stock |
| Buck (TX) | TPS62840DLCR | Texas Instruments | $2.08 | Active, In Stock |

Active BOM cost: $24.68 — MARGINAL ($0.32 under $25 target; cost risk if module prices at list)
Battery life: ~3.2 years — PASS

See: .librespin/04-bom/

# Phase 5: Concept Generation (Detailed Analysis)

**Status:** Complete
**Concepts analyzed:** 2 (A, E)

## Concept A — Ultra-Low-Power MCU

**Coverage:** 93% weighted overall
**Status:** PASS

| Priority | Coverage |
|----------|----------|
| Critical | 91.7% |
| Important | 90.0% |
| Nice-to-have | 100.0% |

**Gaps (2):** REQ-06 IP65 enclosure design (enclosure-level, not PCB) | REQ-08 PCB layout feasibility unverified

## Concept E — Edge Processing

**Coverage:** 83% weighted overall (pre-Phase 6)
**Status:** PASS (above 80% after weighting; promoted from Phase 3 threshold 70%)

| Priority | Coverage |
|----------|----------|
| Critical | 83.3% |
| Important | 70.0% |
| Nice-to-have | 100.0% |

**Gaps (5):** REQ-04 hourly data rate vs. 6hr aggregation | REQ-06 IP65 enclosure | REQ-07 BOM cost marginal | REQ-08 layout feasibility | REQ-10 soft real-time latency ambiguity

See: .librespin/05-detailed-designs/

# Phase 6: Self-Critique and Refinement

**Status:** Complete
**Concepts refined:** 2 (A, E)
**Iterations used:** 1 each (both passed threshold on first pass)

## Concept A — Ultra-Low-Power MCU

**Quality Score: 93.3% — PASSING**

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Coverage | 93% | 60% | 55.8% |
| Cost | 100% | 15% | 15.0% |
| Availability | 90% | 15% | 13.5% |
| Complexity | 90% | 10% | 9.0% |

Actions: Lifecycle verification pass (all 4 parts Active). REQ-06 and REQ-08 gaps accepted as enclosure/layout deferrals.

## Concept E — Edge Processing

**Quality Score: 75.0% — PASSING**

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Coverage | 90% | 60% | 54.0% |
| Cost | 0% | 15% | 0.0% |
| Availability | 90% | 15% | 13.5% |
| Complexity | 75% | 10% | 7.5% |

Actions: REQ-04 closed (aggregation window 6hr→1hr, no BOM change). REQ-10 closed as consequence. REQ-07 mitigation documented (HDC2080 substitution). Battery life revised to ~2.8yr (still above 2yr target).

See: .librespin/06-refinement/

# Phase 7: Final Output

**Status:** Complete
**Recommendation:** Concept A — Ultra-Low-Power MCU

| Concept | Quality Score | Active BOM | Battery Life | Verdict |
|---------|--------------|------------|--------------|---------|
| A: Ultra-Low-Power MCU | 93.3% | $21.29 | ~4.9 yr | RECOMMENDED |
| E: Edge Processing | 75.0% | $24.68 | ~2.8 yr | Runner-up |

See: .librespin/07-final-output/
