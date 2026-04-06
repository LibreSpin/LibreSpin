# Concept Analysis: Edge Processing with Aggregated TX

**Generated:** 2026-04-05
**Phase 3 Confidence:** 73%
**BOM Source:** .librespin/04-bom/bom-concept-e-edge-processing.md

## Block Diagram

```
POWER FLOW (top-to-bottom)
══════════════════════════════════════════════════════════════════

  ┌─────────────────────────┐
  │   18650 LiPo (2.5-4.2V) │
  └──────────┬──────────────┘
             │ VBAT
       ┌─────┴──────┐
       │            │
       ▼            ▼ (EN ctrl from MCU GPIO)
  ┌──────────┐  ┌────────────────────────────┐
  │ TPS7A02  │  │  TPS62840 (U5)             │
  │ (U4)     │  │  Buck Conv  60nA Iq sleep  │
  │ LDO 25nA │  │  88% eff @ TX  750mA max   │
  │ 3.3V out │  │  VSON-8  1.5×2.0mm         │
  │ always   │  │  enabled only during TX    │
  │ -on      │  └────────────┬───────────────┘
  └────┬─────┘               │
       │ 3.3V (always-on)    │ 3.3V (TX only)
       │                     │
SIGNAL FLOW (left-to-right)
══════════════════════════════════════════════════════════════════
       │                     │
  ┌────┴───────────────────┐ │
  │ 3.3V (always-on)       │ │
  ▼                        ▼ │
┌────────────────────┐  ┌───┴───────────────────────────┐
│  SHT31 (U3)        │  │  STM32L412 (U1)               │
│  Temp/Humidity     │  │  MCU  M4+FPU  80MHz           │
│  ±0.3°C  ±2%RH     │  │  0.95µA stop2+RTC             │
│  0.2µA standby     │  │  128KB flash  40KB RAM        │
│  DFN-8  2.4×2.4mm  │  │                               │
│                    │  │  Sample buffer (circular)     │
│  SDA ◄────────────►┤  │  12 samples × 1-hour window   │
│  SCL ◄─────────────┤──┤  Min/Max/Mean per channel     │
│  VDD ◄─────────────┤  │                               │
│  GND ──────────────┤  │  RTC WAKE every 5-10 min      │
└────────────────────┘  │  TX WAKE every 1 hour         │
                        │                               │
  Sample every 5-10 min │  GPIO ──────────────────────►Q1
  TX every 1 hour       │  (Buck EN control via MOSFET) │
  I2C pull-ups R1,R2    │                               │
  4.7k to 3.3V          │  SPI ──────────────────────►  │
                        │  NSS ──────────────────────►  │
                        │  RESET ────────────────────►  │
                        │  DIO0-1 ◄──────────────────   │
                        └──────────────┬────────────────┘
                                       │ SPI + GPIO
                                       ▼
                          ┌─────────────────────────────┐
                          │  CMWX1ZZ (U2)               │
                          │  LoRa Module US915           │
                          │  FCC certified               │
                          │  SX1276 + STM32L0            │
                          │  12.5×11.6mm                │
                          │  powered by TPS62840         │
                          │  during TX only              │
                          │  TX +14dBm  44mA peak        │
                          │               │              │
                          └───────────────┼──────────────┘
                                          │ RF
                                          ▼
                                      [Antenna]

  Q1 (2N7002 SOT-23): MCU GPIO → TPS62840 EN pin
  Allows MCU to gate buck power to LoRa module

DEBUG
══════
  STM32L412 SWD ──► TC2030 (J1) Tag-Connect no-footprint

LEGEND
══════
  ──► : unidirectional signal
  ◄──►: bidirectional signal (I2C SDA)
  3.3V (always-on) : TPS7A02 LDO rail, active in all states
  3.3V (TX only)   : TPS62840 buck rail, gated by Q1/MCU GPIO
  GND  : common ground
```

## Component Summary

| Ref | Component | MPN | Function |
|-----|-----------|-----|----------|
| U1 | MCU | STM32L412KBU6 | Cortex-M4+FPU host, edge stats engine, LoRaWAN stack, RTC wake |
| U2 | LoRa Module | CMWX1ZZABZ-078 | FCC-certified US915 LoRaWAN transceiver, SX1276 core |
| U3 | Temp/Humidity Sensor | SHT31-DIS-B2.5KS | Digital I2C temp (±0.3°C) and humidity (±2%RH) |
| U4 | LDO Regulator (sleep) | TPS7A0233PDQNR | 25nA Iq 3.3V always-on rail for MCU and sensor |
| U5 | Buck Converter (TX) | TPS62840DLCR | 60nA Iq 3.3V gated rail for LoRa module during TX only |
| Q1 | Enable MOSFET | 2N7002 SOT-23 | MCU GPIO control of TPS62840 EN pin |
| L1 | Buck Inductor | 2.2µH 0402 500mA | TPS62840 output inductor |
| C1-C4 | Decoupling Cap | 100nF 0402 X7R | Supply bypass at each IC |
| C5-C7 | Bulk Cap | 10µF 0402 X5R | Power rail hold-up and buck output filter |
| R1-R2 | I2C Pull-up | 4.7k 0402 1% | SHT31 SDA/SCL to 3.3V |
| J1 | Debug Header | TC2030-CTX-NL | SWD programming/debug, no PCB footprint |

## Specification Traceability Matrix

| Req ID | Requirement | Priority | Addressed By | Status | Score |
|--------|-------------|----------|--------------|--------|-------|
| REQ-01 | Temperature sensor ±1-2% accuracy | Critical | SHT31 (±0.3°C, exceeds spec) | Full | 100% |
| REQ-02 | Humidity sensor ±1-2% accuracy | Critical | SHT31 (±2%RH, meets spec) | Full | 100% |
| REQ-03 | LoRaWAN US915 connectivity | Critical | CMWX1ZZABZ-078 (FCC-certified US915) | Full | 100% |
| REQ-04 | Hourly data transmission rate | Critical | RTC wake TX every 3600s (1-hour window); 6-12 samples aggregated per TX | Full | 100% |
| REQ-05 | 2+ year battery life on 18650 LiPo | Critical | Power budget: ~3.2yr practical | Full | 100% |
| REQ-06 | IP65 outdoor enclosure | Critical | Enclosure-level (not PCB); design assumes sealed case | Partial | 50% |
| REQ-07 | BOM cost <$25 | Important | $24.68 active BOM ($0.32 headroom — marginal); HDC2080 substitution available | Partial | 50% |
| REQ-08 | PCB fits <30mm form factor | Important | 5-IC BOM adds area vs. Concept A; layout feasibility unverified | Partial | 50% |
| REQ-09 | No HMI (buttons, LEDs, display) | Important | No HMI components in BOM | Full | 100% |
| REQ-10 | Soft real-time latency | Important | Hourly TX; max 1-hour latency for monitoring data; meets soft real-time | Full | 100% |
| REQ-11 | FCC certification path clear | Important | Pre-certified module; host design exempt from RF cert | Full | 100% |
| REQ-12 | Parts from established vendors | Nice-to-have | STM, Murata, Sensirion, TI — all Tier-1 | Full | 100% |
| REQ-13 | DigiKey/Mouser stock availability | Nice-to-have | All parts In Stock at DigiKey | Full | 100% |
| REQ-14 | Reference designs available | Nice-to-have | STM32L4 + SX1276 reference designs exist; LoRaMac-node ported | Full | 100% |
| REQ-15 | Power budget analysis completed | Nice-to-have | Full budget in BOM doc; 3.2yr result | Full | 100% |

## Coverage Summary

**Overall Coverage:** 90%
**Status:** PASS (threshold: 80%)

### Weighted Score Calculation

| Priority | Requirements | Coverage | Weight | Contribution |
|----------|-------------|----------|--------|--------------|
| Critical | REQ-01..06: 5 Full + 1 Partial = 550/600 | 91.7% | 50% | 45.8% |
| Important | REQ-07..11: 3 Full + 2 Partial = 400/500 | 80.0% | 30% | 24.0% |
| Nice-to-have | REQ-12..15: 4 Full = 400/400 | 100.0% | 20% | 20.0% |

**Weighted Overall: 45.8 + 24.0 + 20.0 = 89.8% (rounds to 90%)**

| Priority | Coverage |
|----------|----------|
| Critical | 91.7% |
| Important | 80.0% |
| Nice-to-have | 100.0% |

**Gaps Identified:** 3 requirements not fully addressed (REQ-06, REQ-07, REQ-08)

## Gaps and Suggestions

### REQ-04: Hourly Data Transmission Rate — CLOSED (Phase 6)

**Resolution:** Architecture updated to 1-hour aggregation window. The MCU samples every 5-10 minutes (6-12 samples per hour), computes min/max/mean at the top of each hour, and transmits once per hour. This satisfies REQ-04 exactly. The LoRa TX duty cycle is now identical to Concept A (24 TX events per day). The M4 still provides differentiated value: each payload carries richer statistics (min/max/mean for the preceding hour) rather than a single instantaneous reading.

No hardware or BOM changes required. The architectural update is purely a firmware parameter change (aggregation window reduced from 6 hours to 1 hour).

### REQ-06: IP65 Outdoor Enclosure — Partial (50%)

**What is missing:** Same gap as Concept A — IP65 is an enclosure-level requirement not yet imposed on the PCB design. For Concept E, the additional concern is that the TPS62840 buck converter adds heat dissipation during TX (switching losses ~6mW) and the power switching MOSFET Q1 adds a further element to the thermal path inside a sealed enclosure.

**Why it matters:** Sealed IP65 enclosures have limited thermal dissipation. While 6mW is small, at -10°C the thermal gradient across a sealed enclosure can cause condensation on the PCB surface if the design is not analyzed for the full temperature range.

**Actionable suggestions:**
1. Same as Concept A: select the enclosure early (e.g., Hammond 1551WH or Bud Industries PN-1320) and constrain the PCB outline to the enclosure's mounting tray dimensions before starting layout.
2. Run a basic thermal budget: total power dissipation in TX state (buck losses ~6mW + MCU ~8mW + sensor ~5mW = ~19mW) is low enough that a sealed plastic enclosure presents no thermal risk even at 40°C ambient — document this calculation to close the thermal concern.
3. Apply conformal coating (same recommendation as Concept A) and specify a silica gel desiccant pack inside the enclosure for long-term humidity control.

### REQ-07: BOM Cost <$25 — Partial (50%)

**What is missing:** The active-only BOM is $24.68, leaving only $0.32 margin against the $25 target. The commodity parts (capacitors, resistors, inductor, MOSFET, debug connector) add ~$1.80, bringing total estimated BOM to ~$26.48. The requirement is technically failed at the full-BOM level. This is a cost-edge design with no resilience to module price variation.

**Mitigation documented:** Replace SHT31-DIS-B2.5KS ($4.32) with HDC2080DMBR (TI, ~$1.80, DigiKey in stock) — saves $2.52, which restores headroom even at the $17.82 module list price. HDC2080 meets the ±1-2% spec (±0.5°C, ±2%RH) and has lower standby current (50nA vs. 200nA). This substitution is the primary cost mitigation lever.

### REQ-08: PCB <30mm Form Factor — Partial (50%)

**What is missing:** Concept E adds two components not in Concept A (TPS62840 U5 and 2N7002 Q1) plus one additional passive (inductor L1). The Murata module (12.5×11.6mm) remains the dominant dimension, but the additional components increase placement complexity. A 5-IC design plus one inductor, one MOSFET, and 11 passive components on a sub-30mm board has not been verified by layout.

**Actionable suggestions:**
1. Perform a preliminary placement study in KiCad: place all 5 ICs and key passives on a 28×28mm board outline to establish whether routing is feasible. Flag the inductor placement as a constraint — it must be >5mm from the CMWX1ZZ antenna keep-out zone.
2. Consider routing the buck converter (U5) and inductor (L1) on the bottom side of the PCB, directly beneath the Murata module — the module has a keep-out on its top surface but not below the host PCB.
3. If the layout cannot close at <30mm with 5 ICs, fall back to the LDO-only power path (removes U5, Q1, L1) for the first prototype spin.

### REQ-10: Soft Real-Time Latency — CLOSED (Phase 6)

**Resolution:** With the 1-hour aggregation window applied, the maximum data latency for any environmental reading is 1 hour from the moment of measurement to delivery at the network server. This satisfies "soft real-time" for an environmental monitoring use case: no hard deadline is imposed, and 1-hour delivery is industry-standard for this sensor class. Gap closed — no hardware change required.

## Refinement (Phase 6)

**Phase 6 Date:** 2026-04-05
**Iteration:** 1 of 1 (REQ-04 gap closed via architecture tweak; score improvement: 76.7% → 90.0%, delta = +13.3% — exceeds 5% plateau threshold; no further iteration needed as score is above threshold)

### REQ-04 Gap Closure — Architecture Tweak

**Change applied:** Aggregation window reduced from 6 hours to 1 hour.

**Before (Phase 5):** TX every 6 hours (4 events/day). REQ-04 Partial (50%).

**After (Phase 6):** TX every 1 hour (24 events/day). REQ-04 Full (100%).

**Hardware impact:** None. No BOM changes. The change is a firmware parameter: the RTC alarm interval for the TX event changes from 21600s to 3600s.

**Battery life impact:** Hourly TX increases LoRa TX events from 4/day to 24/day. However, the BOM doc power budget for Concept E was computed with a conservative factor (0.13) applied to the theoretical value. At hourly TX, the duty cycle approaches Concept A's profile. Recalculated practical estimate: ~2.8 years (down from 3.2 years at 6-hour TX), still comfortably above the 2-year target.

**Payload impact:** Each hourly transmission now carries min/max/mean for the preceding hour (6-12 samples depending on 5- or 10-minute sample interval). This is more information per transmission than Concept A's single instantaneous reading — the M4's edge processing capability is fully utilized even at the 1-hour window.

### REQ-10 Gap Closure

Resolved as a direct consequence of REQ-04 closure. 1-hour maximum delivery latency satisfies "soft real-time" for environmental monitoring. No further action needed.

### Lifecycle Verification Pass

All five active components confirmed Active lifecycle:

| MPN | Lifecycle | Verified Via | Notes |
|-----|-----------|-------------|-------|
| STM32L412KBU6 | Active | DigiKey / ST.com | Current production, datasheet Dec 2022 |
| CMWX1ZZABZ-078 | Active | DigiKey / Murata | Current production |
| SHT31-DIS-B2.5KS | Active | DigiKey / Sensirion | Standard catalog part |
| TPS7A0233PDQNR | Active | DigiKey / TI.com | Current production — verify stock at order time |
| TPS62840DLCR | Active | DigiKey (14,134 stock) | Excellent availability |

### Gap Summary After Phase 6

| Req ID | Phase 5 Status | Phase 6 Status | Action |
|--------|----------------|----------------|--------|
| REQ-04 | Partial (50%) | Full (100%) | Closed — 1-hour aggregation window |
| REQ-06 | Partial (50%) | Partial (50%) | Acceptable; enclosure-level, closure at layout phase |
| REQ-07 | Partial (50%) | Partial (50%) | HDC2080 substitution documented as mitigation |
| REQ-08 | Partial (50%) | Partial (50%) | Acceptable; layout feasibility at schematic phase |
| REQ-10 | Partial (50%) | Full (100%) | Closed — consequence of REQ-04 closure |

### Quality Score Summary

**Final Quality Score: 75.0%** — Passing (threshold: 70%)

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Coverage | 90% | 60% | 54.0% |
| Cost | 0% | 15% | 0.0% |
| Availability | 90% | 15% | 13.5% |
| Complexity | 75% | 10% | 7.5% |
| **TOTAL** | | 100% | **75.0%** |

Cost score is 0% because Concept E is the most expensive active BOM ($24.68 vs. Concept A $21.29) in the two-concept comparison. Coverage score reflects the REQ-04 and REQ-10 closures applied in this phase.

## References

- BOM: .librespin/04-bom/bom-concept-e-edge-processing.md
- Concept: .librespin/02-concepts/concept-e-edge-processing.md
- Requirements: .librespin/01-requirements/requirements.yaml
- Validation: .librespin/03-validation/validation-summary.md
