# Concept A: Ultra-Low-Power MCU

**Quality Score:** 93.3% (Passing)
**BOM Cost (active):** $21.29 | **BOM Cost (full est.):** ~$22.89
**Battery Life:** ~4.9 years on 18650 LiPo
**Status:** RECOMMENDED — proceed to schematic capture

---

## Architecture Block Diagram

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

**Architecture summary:** Single LDO provides 3.3V always-on to all components. STM32L072 wakes from RTC stop mode every 3600s, reads SHT31 over I2C, transmits via CMWX1ZZ SPI, returns to stop. No switching components. Minimum firmware and layout complexity.

---

## Bill of Materials

### Active Components

| Ref | Category | MPN | Manufacturer | Description | Qty | Unit Price | Stock | Lead Time | Datasheet |
|-----|----------|-----|--------------|-------------|-----|------------|-------|-----------|-----------|
| U1 | MCU | STM32L072KBU6 | STMicroelectronics | 32-bit Cortex-M0+ 32MHz 128KB flash 20KB RAM UFQFPN32 | 1 | $2.22 | >1000 | In Stock | [ST.com](https://www.st.com/resource/en/datasheet/stm32l072v8.pdf) |
| U2 | LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | FCC-certified LoRaWAN US915 module, SX1276+STM32L0, 12.5×11.6mm | 1 | $14.00 | >500 | In Stock | [Murata](https://media.digikey.com/pdf/Data%20Sheets/Murata%20PDFs/CMWX1ZZABZ_LoRa_Module.pdf) |
| U3 | Sensor | SHT31-DIS-B2.5KS | Sensirion | Temp/humidity I2C ±0.3°C ±2%RH DFN-8 2.5mm pitch | 1 | $4.32 | >1000 | In Stock | [Sensirion](https://sensirion.com/products/catalog/SHT31-DIS-B) |
| U4 | LDO | TPS7A0233PDQNR | Texas Instruments | 25nA Iq 200mA LDO 3.3V fixed X2SON-4 | 1 | $0.75 | >1000 | In Stock | [TI.com](https://www.ti.com/lit/ds/symlink/tps7a02.pdf) |

**Active parts subtotal: $21.29**

### Commodity Components

| Ref | Category | Description | Qty | Unit Price | Notes |
|-----|----------|-------------|-----|------------|-------|
| C1-C4 | Decoupling Cap | 100nF 0402 16V X7R | 4 | ~$0.01 | MCU/LDO/sensor supply bypass |
| C5-C6 | Bulk Cap | 10µF 0402 10V X5R | 2 | ~$0.05 | Power supply hold-up |
| R1-R2 | Pull-up | 4.7k 0402 1% | 2 | ~$0.01 | SHT31 I2C SDA/SCL |
| J1 | Debug Header | TC2030-CTX-NL Tag-Connect | 1 | ~$1.50 | SWD no-footprint connector |

**Commodity subtotal: ~$1.60 | Total BOM est.: ~$22.89**

---

## Coverage Analysis

| Req ID | Requirement | Priority | Status | Score |
|--------|-------------|----------|--------|-------|
| REQ-01 | Temperature sensor ±1-2% accuracy | Critical | Full | 100% |
| REQ-02 | Humidity sensor ±1-2% accuracy | Critical | Full | 100% |
| REQ-03 | LoRaWAN US915 connectivity | Critical | Full | 100% |
| REQ-04 | Hourly data transmission rate | Critical | Full | 100% |
| REQ-05 | 2+ year battery life on 18650 LiPo | Critical | Full | 100% |
| REQ-06 | IP65 outdoor enclosure | Critical | Partial | 50% |
| REQ-07 | BOM cost <$25 | Important | Full | 100% |
| REQ-08 | PCB fits <30mm form factor | Important | Partial | 50% |
| REQ-09 | No HMI (buttons, LEDs, display) | Important | Full | 100% |
| REQ-10 | Soft real-time latency | Important | Full | 100% |
| REQ-11 | FCC certification path clear | Important | Full | 100% |
| REQ-12 | Parts from established vendors | Nice-to-have | Full | 100% |
| REQ-13 | DigiKey/Mouser stock availability | Nice-to-have | Full | 100% |
| REQ-14 | Reference designs available | Nice-to-have | Full | 100% |
| REQ-15 | Power budget analysis completed | Nice-to-have | Full | 100% |

**Overall coverage: 93% | Weighted quality score: 93.3%**

| Priority | Coverage |
|----------|----------|
| Critical (50% weight) | 91.7% |
| Important (30% weight) | 90.0% |
| Nice-to-have (20% weight) | 100.0% |

---

## Power Budget Summary

| State | Current | Duration/cycle |
|-------|---------|----------------|
| Sleep (stop+RTC) | ~1.96 µA | 3598s/hr |
| Active (read + TX) | ~26,000 µA | 2s/hr |
| Average | ~16.4 µA | — |

**Practical battery life: ~4.9 years** (13.9yr theoretical × 0.35 practical factor for LDO dropout, LoRaWAN join overhead, winter derating, aging).

---

## Gaps

### REQ-06: IP65 Outdoor Enclosure (Partial — enclosure-level deferral)

Not closeable at concept stage. Applies equally to all concepts. Closure path:
1. Select a Hammond 1551-series or Polycase WC-series IP65 enclosure during layout; constrain PCB outline to the mounting tray dimensions.
2. Specify conformal coating (e.g., MG Chemicals 422B acrylic brush-on) in assembly BOM.
3. Use spring-loaded battery contacts (e.g., Keystone 5213); keep TC2030 debug header inside the sealed enclosure.

### REQ-08: PCB <30mm Form Factor (Partial — layout-phase deferral)

Layout feasibility not verified. CMWX1ZZ (12.5×11.6mm) is the dominant component; all others are smaller. Component dimensions are consistent with a 25×25mm board. Closure path:
1. Run a KiCad placement study before schematic commit: place CMWX1ZZ, STM32L072 UFQFPN32, SHT31 DFN-8, and TPS7A02 X2SON-4 on a 25×25mm outline.
2. Consider placing SHT31 on the board underside to recover top-side area.
3. If 25×25mm cannot close, evaluate using the CMWX1ZZ's integrated STM32L0 as the host MCU — eliminates U1, reducing to 3 external ICs, likely fits 20×20mm.

---

## Lifecycle Verification

| MPN | Lifecycle | Verified Via | Notes |
|-----|-----------|-------------|-------|
| STM32L072KBU6 | Active | DigiKey / ST.com | In production since 2016, no NRND |
| CMWX1ZZABZ-078 | Active | DigiKey / Murata | Current; -091 is pin-compatible alternate |
| SHT31-DIS-B2.5KS | Active | DigiKey / Sensirion | Standard catalog part |
| TPS7A0233PDQNR | Active | DigiKey / TI.com | Current — verify stock at order time |

---

## References

- [STM32L072 product page](https://www.st.com/en/microcontrollers-microprocessors/stm32l072kb.html) — STMicroelectronics
- [CMWX1ZZABZ-078 product page](https://www.murata.com/en-us/products/connectivitymodule/lpwa/overview/lineup/type-abz) — Murata
- [SHT31 product page](https://sensirion.com/products/catalog/SHT31-DIS-B) — Sensirion
- [TPS7A02 product page](https://www.ti.com/product/TPS7A02) — Texas Instruments
- LoRaMac-node firmware: https://github.com/Lora-net/LoRaMac-node (STM32L0 port confirmed)
- Phase 5 analysis: `.librespin/05-detailed-designs/analysis-concept-a-ultra-low-power-mcu.md`
- Phase 6 score: `.librespin/06-refinement/score-concept-a-ultra-low-power-mcu.md`
- BOM source: `.librespin/04-bom/bom-concept-a-ultra-low-power-mcu.md`
