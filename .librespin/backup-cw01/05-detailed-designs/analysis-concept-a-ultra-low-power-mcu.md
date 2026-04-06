# Concept Analysis: Ultra-Low-Power MCU

**Generated:** 2026-04-05
**Phase 3 Confidence:** 86%
**BOM Source:** .librespin/04-bom/bom-concept-a-ultra-low-power-mcu.md

## Block Diagram

```
POWER FLOW (top-to-bottom)
══════════════════════════════════════════════════════════════════

  ┌─────────────────────────┐
  │   18650 LiPo (2.5-4.2V) │
  └────────────┬────────────┘
               │ VBAT
               ▼
  ┌─────────────────────────┐
  │  TPS7A02 (U4)           │
  │  LDO  25nA Iq  3.3V out │
  └──────────┬──────────────┘
             │ 3.3V rail
             │
SIGNAL FLOW (left-to-right)
══════════════════════════════════════════════════════════════════
             │
     ┌───────┴──────────────────────────────┐
     │ 3.3V                                 │ 3.3V
     ▼                                      ▼
┌────────────────────────┐        ┌─────────────────────┐
│  SHT31 (U3)            │        │  STM32L072 (U1)     │
│  Temp/Humidity Sensor  │        │  MCU  M0+  32MHz    │
│  ±0.3°C  ±2%RH         │        │  0.43µA stop+RTC    │
│  0.2µA standby         │        │  128KB flash        │
│  DFN-8  2.4×2.4mm      │        │  20KB RAM           │
│                        │        │                     │
│  SDA ◄────────────────►│ I2C    │  SDA  SCL           │
│  SCL ◄─────────────────┤────────┤                     │
│  VDD ◄─────────────────┤ 3.3V   │                     │
│  GND ──────────────────┤ GND    │  RTC WAKE           │
└────────────────────────┘        │  (hardware, no SW)  │
                                  │                     │
  R1,R2: 4.7k I2C pull-ups        │  SPI  ──────────────┼──►
  on SDA, SCL to 3.3V             │  NSS  ──────────────┼──►
                                  │  RESET ─────────────┼──►
                                  │  DIO0-1 ◄───────────┼──
                                  └────────────┬────────┘
                                               │ SPI + GPIO
                                               ▼
                                  ┌─────────────────────┐
                                  │  CMWX1ZZ (U2)       │
                                  │  LoRa Module US915  │
                                  │  FCC certified      │
                                  │  SX1276 + STM32L0   │
                                  │  12.5×11.6mm        │
                                  │  sleep <1µA         │
                                  │  TX +14dBm  44mA    │
                                  │           │         │
                                  └───────────┼─────────┘
                                              │ RF
                                              ▼
                                          [Antenna]

DEBUG
══════
  STM32L072 SWD ──► TC2030 (J1) Tag-Connect no-footprint

LEGEND
══════
  ──► : unidirectional signal
  ◄──►: bidirectional signal (I2C SDA)
  3.3V: regulated supply rail
  GND : common ground
```

## Component Summary

| Ref | Component | MPN | Function |
|-----|-----------|-----|----------|
| U1 | MCU | STM32L072KBU6 | Cortex-M0+ host, LoRaWAN stack, RTC wake, SPI/I2C master |
| U2 | LoRa Module | CMWX1ZZABZ-078 | FCC-certified US915 LoRaWAN transceiver, SX1276 core |
| U3 | Temp/Humidity Sensor | SHT31-DIS-B2.5KS | Digital I2C temp (±0.3°C) and humidity (±2%RH) |
| U4 | LDO Regulator | TPS7A0233PDQNR | 25nA Iq 3.3V rail from 18650 input |
| C1-C4 | Decoupling Cap | 100nF 0402 X7R | Supply bypass at each IC |
| C5-C6 | Bulk Cap | 10µF 0402 X5R | Power rail hold-up |
| R1-R2 | I2C Pull-up | 4.7k 0402 1% | SHT31 SDA/SCL to 3.3V |
| J1 | Debug Header | TC2030-CTX-NL | SWD programming/debug, no PCB footprint |

## Specification Traceability Matrix

| Req ID | Requirement | Priority | Addressed By | Status | Score |
|--------|-------------|----------|--------------|--------|-------|
| REQ-01 | Temperature sensor ±1-2% accuracy | Critical | SHT31 (±0.3°C, exceeds spec) | Full | 100% |
| REQ-02 | Humidity sensor ±1-2% accuracy | Critical | SHT31 (±2%RH, meets spec) | Full | 100% |
| REQ-03 | LoRaWAN US915 connectivity | Critical | CMWX1ZZABZ-078 (FCC-certified US915) | Full | 100% |
| REQ-04 | Hourly data transmission rate | Critical | RTC wake every 3600s, TX each cycle | Full | 100% |
| REQ-05 | 2+ year battery life on 18650 LiPo | Critical | Power budget: ~4.9yr practical | Full | 100% |
| REQ-06 | IP65 outdoor enclosure | Critical | Enclosure-level (not PCB); design assumes sealed case | Partial | 50% |
| REQ-07 | BOM cost <$25 | Important | $21.29 active BOM ($3.71 headroom) | Full | 100% |
| REQ-08 | PCB fits <30mm form factor | Important | Single board; CMWX1ZZ 12.5×11.6mm is dominant; feasible at ~25×25mm | Partial | 50% |
| REQ-09 | No HMI (buttons, LEDs, display) | Important | No HMI components in BOM | Full | 100% |
| REQ-10 | Soft real-time latency | Important | Hourly TX; LoRaWAN ADR inherent; no hard RT constraint | Full | 100% |
| REQ-11 | FCC certification path clear | Important | Pre-certified module; host design exempt from RF cert | Full | 100% |
| REQ-12 | Parts from established vendors | Nice-to-have | STM, Murata, Sensirion, TI — all Tier-1 | Full | 100% |
| REQ-13 | DigiKey/Mouser stock availability | Nice-to-have | All parts In Stock at DigiKey | Full | 100% |
| REQ-14 | Reference designs available | Nice-to-have | STM32L0 + SX1276 reference designs exist; LoRaMac-node ported | Full | 100% |
| REQ-15 | Power budget analysis completed | Nice-to-have | Full budget in BOM doc; 4.9yr result | Full | 100% |

## Coverage Summary

**Overall Coverage:** 93.3%
**Status:** PASS (threshold: 80%)

### Weighted Score Calculation

| Priority | Requirements | Coverage | Weight | Contribution |
|----------|-------------|----------|--------|--------------|
| Critical | REQ-01..06: 5 Full + 1 Partial = 550/600 | 91.7% | 50% | 45.8% |
| Important | REQ-07..11: 4 Full + 1 Partial = 450/500 | 90.0% | 30% | 27.0% |
| Nice-to-have | REQ-12..15: 4 Full = 400/400 | 100.0% | 20% | 20.0% |

**Weighted Overall: 45.8 + 27.0 + 20.0 = 92.8% (rounds to 93%)**

| Priority | Coverage |
|----------|----------|
| Critical | 91.7% |
| Important | 90.0% |
| Nice-to-have | 100.0% |

**Gaps Identified:** 2 requirements not fully addressed (REQ-06, REQ-08)

## Gaps and Suggestions

### REQ-06: IP65 Outdoor Enclosure — Partial (50%)

**What is missing:** The PCB design itself does not address weatherproofing. IP65 protection (dust-tight, water jet) is an enclosure-level requirement, but the PCB must be designed to function inside a sealed case, which imposes constraints not yet reflected in the design: connector sealing, condensation tolerance, and temperature derating.

**Why it matters:** Outdoor deployment in -10°C to +40°C with precipitation exposure is the primary use case. A PCB that works on a bench but fails in a sealed enclosure due to condensation or connector ingress defeats the product requirement.

**Actionable suggestions:**
1. Specify a commercially available IP65-rated enclosure during layout (e.g., Hammond 1551 series or Polycase WC-series) and constrain PCB dimensions to fit the enclosure's PCB mounting tray — this converts the enclosure requirement into a PCB dimensional constraint.
2. Add a conformal coating step to the assembly BOM (e.g., MG Chemicals 422B acrylic, brush-on, no added component cost) to protect against condensation inside the sealed enclosure.
3. Eliminate or seal all external connectors: the debug TC2030 footprint should be covered by the enclosure; the 18650 battery contacts should use spring-loaded contacts (e.g., Keystone 5213) rated for the temperature range with no external PCB exposure.

### REQ-08: PCB <30mm Form Factor — Partial (50%)

**What is missing:** The <30mm requirement is nominally met by the component selection (CMWX1ZZ at 12.5×11.6mm is the largest component), but layout feasibility has not been verified. The STM32L072 (5×5mm UFQFPN32), SHT31 (2.4×2.4mm DFN-8), TPS7A02 (0.8×0.8mm X2SON-4), passive components, and the Murata module must all fit on a board small enough to mount in the IP65 enclosure. No actual PCB layout or mechanical clearance check has been performed.

**Why it matters:** 30mm is very tight. The Murata module alone consumes 12.5×11.6mm. With the external MCU, sensor, LDO, passives, and debug connector, a naive placement may require 35×30mm or larger — failing the constraint.

**Actionable suggestions:**
1. Perform a preliminary component placement study in KiCad before committing to schematic capture: place the CMWX1ZZ footprint, STM32L072 UFQFPN32, SHT31 DFN-8, and TPS7A02 X2SON-4 on a 25×25mm board outline to verify all components fit with 0.5mm keepout margins.
2. Consider placing the SHT31 sensor on the opposite board side from the Murata module to recover top-side area (double-sided SMT is standard and adds no significant cost at prototype scale).
3. If the 25×25mm target cannot be met, evaluate whether the Murata module's integrated STM32L0 MCU can replace the external STM32L072, eliminating U1 entirely — this would reduce the external component count to 3 ICs (module, sensor, LDO) and likely fit in 20×20mm. The trade-off is reduced flash headroom and dependency on Murata's firmware framework.

## Refinement (Phase 6)

**Phase 6 Date:** 2026-04-05
**Iteration:** 1 of 1 (score ≥80% threshold met immediately — no further iteration required)

### Lifecycle Verification Pass

All four active components confirmed Active lifecycle as of Phase 4 research:

| MPN | Lifecycle | Verified Via | Notes |
|-----|-----------|-------------|-------|
| STM32L072KBU6 | Active | DigiKey / ST.com | In production since 2016, no NRND flag |
| CMWX1ZZABZ-078 | Active | DigiKey / Murata | Current production; -091 is newer pin-compatible alt |
| SHT31-DIS-B2.5KS | Active | DigiKey / Sensirion | Standard catalog part |
| TPS7A0233PDQNR | Active | DigiKey / TI.com | Current production — verify stock at order time |

No lifecycle concerns. All parts ship from authorized distributors with no NRND or last-time-buy notices.

### Gap Disposition — REQ-06 (IP65)

**Decision: Acceptable as-is for concept phase.** IP65 is an enclosure-level requirement that cannot be closed at the concept/BOM stage — it requires enclosure selection during layout. The gap is structurally identical across all competing concepts and does not differentiate Concept A. The three actionable suggestions in the Gaps section (enclosure selection, conformal coating, sealed connectors) constitute the full closure path. No iteration needed.

### Gap Disposition — REQ-08 (<30mm layout)

**Decision: Acceptable as-is for concept phase.** Layout feasibility has not been verified, but component dimensions are consistent with a 25×25mm board: CMWX1ZZ (12.5×11.6mm) + STM32L072 (5×5mm) + SHT31 (2.4×2.4mm) + TPS7A02 (0.8×0.8mm) + passives (0402). No single component forces a board dimension above 30mm. The gap is flagged for Phase 7 (schematic/layout) action. No score adjustment required.

### Quality Score Summary

**Final Quality Score: 93.3%** — Passing (threshold: 70%)

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Coverage | 93% | 60% | 55.8% |
| Cost | 100% | 15% | 15.0% |
| Availability | 90% | 15% | 13.5% |
| Complexity | 90% | 10% | 9.0% |
| **TOTAL** | | 100% | **93.3%** |

Concept A passes Phase 6 on the first verification pass. No further iteration warranted.

## References

- BOM: .librespin/04-bom/bom-concept-a-ultra-low-power-mcu.md
- Concept: .librespin/02-concepts/concept-a-ultra-low-power-mcu.md
- Requirements: .librespin/01-requirements/requirements.yaml
- Validation: .librespin/03-validation/validation-summary.md
