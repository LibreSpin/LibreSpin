# Detailed Design Analysis: Concept D — Distributed Sensor + Radio

**Project:** Example IoT Sensor Node
**Generated:** 2026-04-05
**BOM Ref:** bom-concept-d-distributed-sensor-radio.md

## Detailed Block Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│           CONCEPT D: DISTRIBUTED SENSOR + RADIO                 │
│           ATtiny1616 Sensor MCU + Murata CMWX1ZZABZ            │
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
    ═════╪═══════════════════════════════════════════
         │           GROUND PLANE SPLIT
    ANALOG SIDE                           DIGITAL SIDE
         │                                     │
         ▼                                     ▼
  ┌──────────────────┐              ┌─────────────────────────────┐
  │   ATtiny1616-MFR │              │  Murata CMWX1ZZABZ-091      │
  │   Cortex-M0+     │              │  STM32L0 + SX1276            │
  │   8KB flash      │◄─ UART TX ──►│  LoRaWAN AT-cmd stack       │
  │                  │              │  US915, FCC certified        │
  │  ADC4 (PORTA4) ──┼── Soil Moist│                              │
  │  PB2 (1-Wire)  ──┼── DS18B20+  │  LoRa RF ──► SMA → Antenna  │
  │                  │              │                              │
  │  PA5 (UART TX) ──┼────────────►│  UART RX                    │
  │  PA4 (UART RX) ──┼◄────────────│  UART TX                    │
  │                  │              │                              │
  │  PA6 → LED1 (red)│              │  RESET ←── ATtiny PA7      │
  │  PA7 → LED2 (grn)│              │  WAKEUP ←── ATtiny PB3     │
  │  PB4 ← SW1 (wake)│              │                              │
  └──────────────────┘              └─────────────────────────────┘
         │                                     │
    ANALOG SENSORS                         RF SECTION
         │
         ├──[SEN0193 Soil Moisture]
         │   AOUT → ATtiny ADC4
         │   VCC = gated via PMOS
         │
         └──[DS18B20+ Temperature ±0.5°C]
             DQ → ATtiny PB2 (1-Wire, 4.7kΩ pullup)
             VCC = 3.3V (analog rail)

  ═══════════════ Ground plane split at PCB center ═══════════════
  Left: AGND (analog, sensor return currents)
  Right: DGND (digital, Murata module, MCU digital logic)
  Star connection: LDO GND pin (single return path)

Legend:
  ──► : Unidirectional signal
  ◄── : Reverse signal
  ═══ : Ground plane boundary
```

## Spec Analysis vs Requirements

| Requirement | Spec | Implementation | Gap? |
|-------------|------|----------------|------|
| LoRaWAN US915 | 902-928 MHz | Murata CMWX1ZZABZ-091 (US915 variant) | None |
| Battery life 12 months | ~23µA budget | ATtiny sleep: 0.7µA; Murata sleep: 1.5µA; LDO IQ: 0.6µA; avg ~5µA | Well within budget |
| Outdoor -20 to 50°C | Operating temp | ATtiny1616: -40 to 85°C; Murata CMWX1ZZABZ: -40 to 85°C | None |
| Temperature ±0.5°C | Accuracy | DS18B20 ±0.5°C (0-70°C) | Marginal at -20°C (see note) |
| Soil moisture (analog) | ADC input | ATtiny1616 10-bit SAR ADC, PORTA4, VREF=3.3V | None — 3.2mV resolution |
| FCC compliance | Regulatory | Murata CMWX1ZZABZ FCC pre-certified | None |
| PCB 50×30mm | Physical | Two-IC layout with ground plane split — requires careful planning | Layout study needed |
| BOM ≤ $25/unit | Cost target | $22-24/unit landed | Within target |

## AT Command Interface

Murata CMWX1ZZABZ communicates via UART AT commands:

```
ATtiny → Murata
AT+JOIN                    // Join LoRaWAN network
OK+JOINED                  // Network joined

ATtiny → Murata
AT+SEND=0,0,01234AABB      // Unconfirmed uplink, port 0, hex data
OK+SENT                    // Confirmed sent

ATtiny → Murata
AT+SLEEP=1                 // Murata enters sleep mode
OK                         // Sleep acknowledged
```

Firmware on ATtiny sends `AT+JOIN` on first boot, then `AT+SEND` each hour with sensor data (8 bytes: 4 bytes moisture, 4 bytes temperature as IEEE 754 float).

## Power Budget

| State | Current | Time/Hour | Charge/Hour |
|-------|---------|-----------|-------------|
| ATtiny1616 sleep (STANDBY) | 0.7µA | 3600s | 0.7µA (constant) |
| Murata CMWX1ZZABZ sleep | 1.5µA | 3600s | 1.5µA |
| MCP1700 LDO IQ | 0.6µA | 3600s | 0.6µA |
| ATtiny wake + read sensors | 5mA | 1.5s | 2.1µAh |
| Murata TX (LoRaWAN uplink) | 35mA | 0.5s | 4.9µAh |
| Murata RX (ACK + windows) | 12mA | 1.0s | 3.3µAh |
| **Total average** | — | — | **~13µA** |

**Battery life:** 2500mAh × 2 / 13µA = 384,615 hours = **43.9 years**
**12-month target:** Exceeded by >40×.

## PCB Ground Plane Split Notes

1. Ground plane split runs horizontally at PCB mid-height (y=15mm on 50×30mm board)
2. AGND (analog) occupies bottom half: DS18B20, SEN0193, ATtiny analog pins, ADC VREF
3. DGND (digital) occupies top half: Murata module, ATtiny digital logic, UART lines
4. Single star point connection at MCP1700 GND pad (bottom layer via)
5. Keep UART lines short (< 20mm); route on DGND side

## Design Notes

1. **Temperature at low range:** DS18B20 accuracy is ±2°C below -10°C. If field is in North American climate, median temperature is well above this. For cold-climate monitoring (<-10°C regular), upgrade to STS40 ($2.50, I2C, ±0.2°C full range).

2. **UART level compatibility:** ATtiny1616 and Murata CMWX1ZZABZ both operate at 3.3V logic — no level shifter needed. Series 1kΩ resistor on TX line for ESD protection.

3. **AT command library:** Lightweight AT command parser needed on ATtiny (< 2KB firmware). Reference: Murata Type ABZ Application Note LBAD0ZZ1RD (LoRaWAN AT commands reference).
