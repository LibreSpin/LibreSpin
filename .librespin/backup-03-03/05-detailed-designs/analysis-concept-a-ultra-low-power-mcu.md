# Detailed Design Analysis: Concept A — Ultra-Low-Power MCU

**Project:** Example IoT Sensor Node
**Generated:** 2026-04-05
**BOM Ref:** bom-concept-a-ultra-low-power-mcu.md

## Detailed Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONCEPT A: ULTRA-LOW-POWER MCU               │
│                    LoRaWAN Agricultural Sensor Node              │
└─────────────────────────────────────────────────────────────────┘

  [2xAA Battery 3V]
        │
        │ VIN (2.4V–3.6V)
        ▼
  ┌──────────────┐
  │ MCP1700      │ VOUT = 3.3V, 200mA max
  │ LDO 3.3V     │ IQ = 0.6µA
  └──────┬───────┘
         │ 3.3V
         ├────────────────────────────────────────┐
         │                                        │
         ▼                                        ▼
  ┌──────────────────────────────┐    ┌───────────────────────────┐
  │     STM32L053C8T6            │    │    RFM95W-915S2           │
  │     Cortex-M0+ @ 32MHz       │    │    SX1276 LoRa Transceiver│
  │                              │    │    US915 Band             │
  │  ADC_IN ←── Soil Moisture    │    │                           │
  │  PB6/PB7 (I2C1)              │    │   MOSI ←── PA7           │
  │  PA9/PA10 (UART1)            │    │   MISO ──→ PA6           │
  │  SPI1: PA4/PA5/PA6/PA7       │    │   SCK  ←── PA5           │
  │                              │    │   NSS  ←── PA4           │
  │  GPIO: PA0 → LED1 (red)      │    │   DIO0 ──→ PB0 (IRQ)    │
  │  GPIO: PA1 → LED2 (green)    │    │   RESET ←── PB1          │
  │  GPIO: PA2 ← SW1 (wake)      │    └───────────────────────────┘
  │                              │                │
  │  PB8 (1-Wire) ──┐            │          RF SMA Connector
  │                 │            │          └─► Antenna 915MHz
  │  NRST ← Prog   │            │
  │  PA13/PA14 SWD  │            │
  └──────────────────────────────┘
                    │
                    ▼
  ┌──────────────────────────────┐    ┌───────────────────────────┐
  │    DS18B20+                  │    │   SEN0193 Soil Moisture   │
  │    1-Wire Temperature        │    │   Capacitive Sensor       │
  │    ±0.5°C, TO-92             │    │                           │
  │                              │    │   AOUT ──→ ADC_IN (PA4)  │
  │    DQ ──→ PB8 (pull-up 4.7k)│    │   VCC = 3.3V (gated GPIO)│
  │    VCC = 3.3V                │    │   GND                     │
  └──────────────────────────────┘    └───────────────────────────┘

  Power gating: Sensor VCC supplied via GPIO-controlled transistor
  → Sensors powered only during measurement (2s active per hour)

Legend:
  ──→  : Signal flow (digital)
  ←──  : Reverse signal flow
  ──►  : RF/Antenna connection
  ↓    : Power supply
```

## Spec Analysis vs Requirements

| Requirement | Spec | Implementation | Gap? |
|-------------|------|----------------|------|
| LoRaWAN US915 | 902-928 MHz, SF7-SF12 | RFM95W SX1276, US915 factory config | None |
| Battery life 12 months | 2500mAh / 12mo = ~23µA budget | STM32L053 stop: 0.4µA + RFM95W off: 0.2µA + LDO IQ: 0.6µA = 1.2µA sleep; tx burst ~30mA × 1s/hr; avg ~8µA | Exceeds spec by 3× |
| Outdoor -20 to 50°C | Operating temp | STM32L053: -40 to 85°C; RFM95W: -40 to 85°C; DS18B20: -55 to 125°C | None |
| Soil moisture (analog) | Capacitive analog sensor | SEN0193 0-3.3V analog output → 12-bit ADC (0.8mV resolution) | None |
| Temperature ±0.5°C | Accuracy spec | DS18B20 guaranteed ±0.5°C over 0-70°C | None — marginal at -20°C (±1°C) |
| PCB 50×30mm | Physical constraint | Component count low; 2-layer PCB, 50×30mm feasible | TBD — needs layout verification |
| BOM ≤ $25/unit | Cost target | Estimated $21-23/unit landed | Within target |
| FCC compliance | Regulatory | Product-level FCC Part 15 testing required | Requires ~$6,000 test lab budget |

## Power Budget

| State | Current | Time/Hour | Charge/Hour |
|-------|---------|-----------|-------------|
| Deep sleep (stop mode) | 1.2µA | 3590s | 1.2µA (continuous) |
| Wakeup + sensor read | 5mA | 2s | 2.78µAh |
| LoRa TX (SF10, 125kHz) | 32mA | 0.5s | 4.44µAh |
| LoRa RX window | 12mA | 0.5s | 1.67µAh |
| **Total average** | — | — | **~8µA** |

**Battery life:** 2500mAh × 2 / 8µA = 625,000 hours = **71 years** (practical limit: 5-10 years leakage)
**12-month target:** Easily met with >10× margin.

## Design Notes

1. **Temperature accuracy at -20°C:** DS18B20 spec is ±0.5°C (0 to 70°C) and ±1°C (-10°C to +85°C). At -20°C to -10°C the device operates but accuracy degrades to ±2°C. If ±0.5°C is required at -20°C, consider STS40 (±0.2°C over full range) or MCP9808 (±0.25°C).

2. **FCC Certification path:** RFM95W uses the SX1276 RF IC directly — not a certified end-product module. Full FCC Part 15 Subpart C testing required. Budget ~$5,000-8,000 for certification. Alternatively, swap to a pre-certified module (Concept C or D) to avoid this cost.

3. **Sensor power gating:** Use PNP transistor (e.g., MMBT3906) with base controlled by MCU GPIO. Powers sensors off during sleep → saves ~3mA from SEN0193 quiescent current.
