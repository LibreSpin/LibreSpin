# Detailed Design Analysis: Concept C — Nordic Module-Based

**Project:** Example IoT Sensor Node
**Generated:** 2026-04-05
**BOM Ref:** bom-concept-c-nordic-module.md

## Detailed Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              CONCEPT C: NORDIC MODULE (RAK4631)                 │
│              Pre-certified LoRaWAN on custom carrier board      │
└─────────────────────────────────────────────────────────────────┘

  [2xAA Battery 3V]
        │
        ▼
  ┌──────────────┐
  │ MCP1700      │ 3.3V, IQ = 0.6µA
  │ LDO 3.3V     │
  └──────┬───────┘
         │ 3.3V
         │
         ▼
  ┌─────────────────────────────────────────────────────────────┐
  │                    Custom Carrier Board (50×30mm)           │
  │                                                             │
  │   ┌─────────────────────────────────────────────────────┐  │
  │   │              RAK4631 Module                         │  │
  │   │    (castellated pads soldered to carrier)           │  │
  │   │                                                     │  │
  │   │   ┌────────────────┐   ┌────────────────────────┐  │  │
  │   │   │  nRF52840      │   │  SX1262 LoRa           │  │  │
  │   │   │  Cortex-M4     │   │  US915 Pre-certified   │  │  │
  │   │   │  256KB/1MB     │   │  FCC/CE/ISED           │  │  │
  │   │   └──────┬─────────┘   └────────┬───────────────┘  │  │
  │   │          │ SPI (internal)       │                   │  │
  │   │          │──────────────────────┘                   │  │
  │   │                                                     │  │
  │   │   P0.13: LED1 (red)      LoRa Antenna (module SMA) │  │
  │   │   P0.14: LED2 (green)    └──► External Antenna     │  │
  │   │   P0.15: SW1 (wake)                                 │  │
  │   │   P0.16/P0.17: I2C0 (SDA/SCL)                      │  │
  │   │   P0.26: 1-Wire                                     │  │
  │   │   P0.28: ADC (AIN4)                                 │  │
  │   └─────────────────────────────────────────────────────┘  │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
         │           │              │
         ▼           ▼              ▼
  ┌───────────┐ ┌─────────┐ ┌────────────────────┐
  │ DS18B20+  │ │  SW1    │ │ SEN0193            │
  │ 1-Wire    │ │ Button  │ │ Soil Moisture      │
  │ Temp ±0.5°│ │ (SPST)  │ │ Analog Out→ P0.28  │
  └───────────┘ └─────────┘ └────────────────────┘

Legend:
  ──► : RF path to antenna
  → : Signal flow
  ─── : Power rail
```

## Spec Analysis vs Requirements

| Requirement | Spec | Implementation | Gap? |
|-------------|------|----------------|------|
| LoRaWAN US915 | 902-928 MHz | RAK4631 US915 variant (factory configured) | None |
| Battery life 12 months | ~23µA budget | nRF52840 sleep: 2.5µA; MCP1700 IQ: 0.6µA; RAK module total: ~5µA; avg ~12µA | Well within budget |
| Outdoor -20 to 50°C | Operating temp | nRF52840: -40 to 85°C; SX1262: -40 to 85°C | None |
| Temperature ±0.5°C | Accuracy | DS18B20 guaranteed ±0.5°C (0-70°C); marginal at -20°C | See note |
| PCB 50×30mm | Physical constraint | Custom carrier: 50×30mm; RAK4631 is 15×23mm | Fits with careful layout |
| FCC compliance | Regulatory | RAK4631 pre-certified FCC ID (confirmed) | None — no additional testing for RF |
| BOM ≤ $25/unit | Cost target | $26-28/unit landed | Slightly over ($1-3) |

## Power Budget

| State | Current | Time/Hour | Charge/Hour |
|-------|---------|-----------|-------------|
| nRF52840 system-off | 2.5µA | 3600s | 2.5µA (constant) |
| MCP1700 LDO IQ | 0.6µA | 3600s | 0.6µA |
| RAK module overhead | 1.5µA | 3600s | 1.5µA |
| Sensor read + TX (1/hr) | 28mA | 1.5s | 11.7µAh |
| **Total average** | — | — | **~16µA** |

**Battery life:** 2500mAh × 2 / 16µA = 312,500 hours = **35.7 years**
**12-month target:** Easily exceeded.

## FCC Advantage Analysis

For a 50-unit production run, FCC certification economics matter:

| Path | Upfront Cost | Per-Unit Cost | Break-even |
|------|-------------|--------------|------------|
| RAK4631 pre-certified module | $0 | $15 module | Always better for <333 units |
| Custom PCB + FCC certification | $6,000 test lab | $5 radio parts | 333 units |

**At 50 units, Concept C saves ~$5,000 in test costs vs. Concepts A or B.**

## Design Notes

1. **Custom carrier board:** RAK4631 uses castellated edge pads (0.5mm pitch). Carrier board exposes nRF52840 GPIO pins via through-holes or castellated pads. Standard PCB assembly process.

2. **Antenna connector:** RAK4631 has onboard SMA-female RF connector. Carrier board routes this to edge-mount SMA for external antenna. Short RF trace preferred.

3. **Temperature note:** DS18B20 accuracy degrades below 0°C. Consider STS40 (±0.2°C full range, I2C) for better cold-temperature accuracy at similar cost ($2.50).
