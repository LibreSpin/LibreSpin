# Detailed Design Analysis: Concept B — Performance MCU with OTA

**Project:** Example IoT Sensor Node
**Generated:** 2026-04-05
**BOM Ref:** bom-concept-b-performance-mcu-ota.md

## Detailed Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              CONCEPT B: PERFORMANCE MCU WITH OTA                │
│              STM32WL55 — Integrated LoRa + OTA Updates          │
└─────────────────────────────────────────────────────────────────┘

  [2xAA Battery 3V]
        │
        │ VIN (2.0V–5.5V)
        ▼
  ┌──────────────┐
  │ TPS63031     │ VOUT = 3.3V, 500mA max
  │ Buck-Boost   │ η = 96%, IQ = 50µA
  └──────┬───────┘
         │ 3.3V
         │
         ▼
  ┌─────────────────────────────────────────────────────────────┐
  │               STM32WL55JCIx                                 │
  │   ┌──────────────────┐  ┌────────────────────────────────┐  │
  │   │  CPU1: Cortex-M4 │  │  CPU2: Cortex-M0+              │  │
  │   │  Application Core│  │  Radio Core                    │  │
  │   │  256KB flash A   │  │  Runs LoRaWAN stack            │  │
  │   │  256KB flash B   │  │  Direct RF register access     │  │
  │   │  (FUOTA backup)  │  │                                │  │
  │   └──────────────────┘  └────────────────────────────────┘  │
  │                                    │                         │
  │   PA5/PA4: SPI1 (sensor)           │ Sub-GHz radio          │
  │   PB6/PB7: I2C1 (TMP117)          │ US915 integrated       │
  │   PA9/PA10: UART1                  │ TX power: +22dBm max   │
  │   PA0: LED1 (red)                  │                        │
  │   PA1: LED2 (green)               └────────────────────────┘
  │   PA2: SW1 (wake)                           │
  └─────────────────────────────────────────────┼─────────────┘
                                                │
                                          RF Match → SMA → Antenna 915MHz

  External connections:
  ┌───────────────────────────┐    ┌───────────────────────────┐
  │    TMP117NAIDRVR          │    │   SEN0193 Soil Moisture   │
  │    I2C Temperature Sensor │    │   Capacitive Sensor       │
  │    ±0.1°C, SON-8          │    │                           │
  │                           │    │   AOUT ──→ ADC (PA4)     │
  │    SDA ←→ PB7            │    │   VCC = gated 3.3V        │
  │    SCL ──→ PB6            │    └───────────────────────────┘
  │    ADDR → GND (addr=0x48) │
  │    ALERT → PA3 (optional) │
  └───────────────────────────┘

Legend:
  ──→  : Signal flow (unidirectional)
  ←→  : Bidirectional (I2C, SPI)
  →    : RF path
```

## Spec Analysis vs Requirements

| Requirement | Spec | Implementation | Gap? |
|-------------|------|----------------|------|
| LoRaWAN US915 | 902-928 MHz | STM32WL55 integrated sub-GHz, US915 band plan | None |
| Battery life 12 months | ~23µA budget | TPS63031 IQ=50µA (dominates!); STM32WL55 stop: ~1µA; total avg ~55µA | Borderline — TPS63031 quiescent too high |
| Outdoor -20 to 50°C | Operating temp | STM32WL55: -40 to 85°C industrial; TMP117: -40 to 125°C | None |
| Temperature ±0.5°C | Accuracy | TMP117 guaranteed ±0.1°C → exceeds spec | None (exceeds) |
| PCB 50×30mm | Physical | STM32WL55 is UFQFPN-48 (7×7mm); small footprint; 2-layer possible | PCB layout tight but feasible |
| BOM ≤ $25/unit | Cost target | Estimated $26-28/unit landed | Over by $1-3 |

## Power Budget — Corrected

**Issue Found:** TPS63031 quiescent current is 50µA — this alone exceeds the 23µA average budget.

| State | Current | Time/Hour | Charge/Hour |
|-------|---------|-----------|-------------|
| TPS63031 IQ (always-on) | 50µA | 3600s | 50µA (constant) |
| STM32WL55 sleep | 1µA | 3600s | 1µA |
| Sensor read + TX (1/hr) | 25mA | 1.5s | 10.4µAh |
| **Total average** | — | — | **~61µA** |

**Battery life:** 2500mAh × 2 / 61µA = 82,000 hours = **9.4 years** — this exceeds 12 months.
**BUT: TPS63031 is over-specified.** For 2×AA (2.4-3.0V), a simple LDO works fine (3.0V → 3.3V works when fresh). If using an LDO instead of TPS63031, average drops to ~10µA and battery life to >25 years.

**Recommendation:** Replace TPS63031 with MCP1700 LDO for this use case. Buck-boost only needed if deep battery discharge (below 3.0V) must be supported.

## Design Notes

1. **FUOTA architecture:** STM32WL55 has 512KB flash split into two 256KB banks. Bank A runs current firmware; bank B receives new firmware via LoRaWAN FUOTA. After download, MCU reboots into bank B. ST application note AN5554 provides reference implementation.

2. **Dual-core partitioning:** CPU1 (M4) runs application code and wakes on RTC. CPU2 (M0+) runs the LoRaWAN stack and RF driver. Inter-processor communication via IPCC (Inter-Processor Communication Controller). This is well-documented in ST UM2592.

3. **Cost reduction path:** Replace TMP117 with MCP9808 ($0.80 vs $2.80) to hit $25 target. TMP117 is overkill for ±0.5°C requirement.
