# Phase 2: Architecture Concepts Overview

**Project:** Environmental Monitoring Sensor Node
**Date:** 2026-04-05
**Draft Count:** 5

## Comparison Matrix

| Dimension | Concept A | Concept B | Concept C | Concept D | Concept E |
|-----------|-----------|-----------|-----------|-----------|-----------|
| **Name** | Ultra-Low-Power MCU | Module-Based + OTA | Nordic BLE+LoRa | Distributed Sensor+Radio | Edge Processing |
| **MCU Class** | Cortex-M0+ | Cortex-M4 (in SoM) | Cortex-M4F (BLE SoC) | Cortex-M0+ | Cortex-M4 |
| **Topology** | Single board | Single board + SoM | Single board | Two-board stackup | Single board |
| **Radios** | LoRa only | LoRa only (in SoM) | BLE + LoRa | LoRa only | LoRa only |
| **Power Arch** | Nano-power LDO | Buck-boost | SoC DC-DC | Load switch + LDO | Hybrid LDO + buck |
| **TX Frequency** | Hourly (24/day) | Hourly (24/day) | Hourly (24/day) | Hourly (24/day) | 4x/day (aggregated) |
| **FCC Path** | Pre-cert module | Pre-cert SoM | Pre-cert LoRa module | Pre-cert module | Pre-cert module |
| **OTA Capable** | No (without effort) | Yes (LoRaWAN FUOTA) | Yes (BLE DFU) | No (without effort) | No (without effort) |
| **Est. Sleep I** | <5 uA | ~10-15 uA | ~5-8 uA | <3 uA (radio gated) | ~5-8 uA |
| **Board Count** | 1 | 1 | 1 | 2 | 1 |
| **Component Count** | Lowest | Low (SoM) | Medium | Highest | Medium |
| **Design Effort** | Medium | Lowest | Highest | High | Medium-High |
| **Firmware Complexity** | Low | Medium (OTA) | High (dual stack) | Low-Medium | High (edge analytics) |

## Diversity Verification

Each concept is unique across all four architecture dimensions:

| Concept | Processing | Topology | Communication | Power |
|---------|-----------|----------|---------------|-------|
| A | M0+ bare MCU | Single monolithic | LoRa module (SPI) | Nano-power LDO |
| B | M4 in SoM | Single + SoM | LoRa SoM (integrated) | Buck-boost |
| C | M4F BLE SoC | Single + discrete LoRa | Dual radio (BLE+LoRa) | SoC integrated DC-DC |
| D | M0+ bare MCU | Two-board stackup | LoRa module (power-gated) | Load switch + LDO |
| E | M4 bare MCU | Single monolithic | LoRa module (infrequent TX) | Hybrid LDO/buck |

## Power Budget Estimates (Order of Magnitude)

Assumptions: 3000mAh 18650 cell, 80% usable capacity = 2400mAh

| Concept | Sleep Current | Active Duty | TX Events/Day | Est. Battery Life |
|---------|--------------|-------------|---------------|-------------------|
| A | ~3 uA | 3s/hr | 24 | 2.5-3.5 years |
| B | ~12 uA | 3s/hr | 24 | 1.5-2 years |
| C | ~6 uA | 3s/hr | 24 | 2-2.5 years |
| D | ~2 uA | 5s/hr (wake latency) | 24 | 3-4 years |
| E | ~6 uA | 1s/5min + 3s/6hr | 4 | 2.5-3.5 years |

Note: These are rough estimates for concept comparison only. Detailed power analysis requires specific part selection in Phase 3.

## Key Trade-offs

**Battery Life vs. Features:**
- Concepts A and D maximize battery life by minimizing everything else
- Concepts B and C sacrifice battery life for OTA/BLE features
- Concept E recovers battery life through smarter TX scheduling

**Development Speed vs. Flexibility:**
- Concept B (SoM) is fastest to prototype but least flexible
- Concept D (distributed) is most flexible but hardest to prototype
- Concepts A, C, E fall in between

**Board Complexity vs. RF Performance:**
- Concept D isolates RF physically -- best signal integrity
- Concept C has dual-antenna challenge on small board -- hardest RF layout
- Concepts A, B, E have single antenna with varying layout difficulty

## Risk Summary

| Concept | Primary Risk | Mitigation |
|---------|-------------|------------|
| A | MCU too constrained for future needs | Accept as purpose-built; no feature creep |
| B | SoM cost blows BOM budget | Validate SoM pricing early; fall back to discrete |
| C | Dual antenna on <30mm board | Layout feasibility study before committing |
| D | Connector reliability outdoors | Select automotive-rated B2B connector; conformal coat |
| E | Firmware complexity / data loss | Extensive testing; watchdog + data backup to flash |

## Concept Files

1. [Concept A: Ultra-Low-Power MCU](concept-a-ultra-low-power-mcu.md)
2. [Concept B: Module-Based + OTA](concept-b-performance-mcu-ota.md)
3. [Concept C: Nordic BLE+LoRa](concept-c-nordic-module.md)
4. [Concept D: Distributed Sensor+Radio](concept-d-distributed-sensor-radio.md)
5. [Concept E: Edge Processing](concept-e-edge-processing.md)
