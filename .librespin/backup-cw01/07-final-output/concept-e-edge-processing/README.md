# Concept E: Edge Processing with Aggregated TX

**Quality Score:** 75.0% (Passing)
**BOM Cost (active):** $24.68 ($0.32 headroom) | **BOM Cost (full est.):** ~$26.48 (exceeds $25 with commodities)
**Battery Life:** ~2.8 years on 18650 LiPo (revised from 3.2yr after Phase 6 TX rate change)
**Status:** RUNNER-UP — proceed only if hourly min/max/mean payload is a confirmed product requirement

---

## Architecture Block Diagram

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

**Architecture summary:** Dual-rail power path — TPS7A02 LDO powers MCU and sensor always-on; TPS62840 buck converter powers LoRa module only during TX (gated via MOSFET Q1). STM32L412 M4 core samples every 5-10 minutes, maintains a circular buffer of readings, computes min/max/mean per 1-hour window, and transmits the aggregated statistics at top of each hour. Buck converter improves TX efficiency (88% vs. ~75% LDO) at the cost of added components and layout complexity.

---

## Bill of Materials

### Active Components

| Ref | Category | MPN | Manufacturer | Description | Qty | Unit Price | Stock | Lead Time | Datasheet |
|-----|----------|-----|--------------|-------------|-----|------------|-------|-----------|-----------|
| U1 | MCU | STM32L412KBU6 | STMicroelectronics | 32-bit Cortex-M4+FPU 80MHz 128KB flash 40KB RAM UFQFPN32 | 1 | $3.53 | >500 | In Stock | [ST.com](https://www.st.com/resource/en/datasheet/stm32l412kb.pdf) |
| U2 | LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | FCC-certified LoRaWAN US915 module, SX1276+STM32L0, 12.5×11.6mm | 1 | $14.00 | >500 | In Stock | [Murata](https://media.digikey.com/pdf/Data%20Sheets/Murata%20PDFs/CMWX1ZZABZ_LoRa_Module.pdf) |
| U3 | Sensor | SHT31-DIS-B2.5KS | Sensirion | Temp/humidity I2C ±0.3°C ±2%RH DFN-8 2.5mm pitch | 1 | $4.32 | >1000 | In Stock | [Sensirion](https://sensirion.com/products/catalog/SHT31-DIS-B) |
| U4 | LDO (sleep) | TPS7A0233PDQNR | Texas Instruments | 25nA Iq 200mA LDO 3.3V fixed X2SON-4, always-on | 1 | $0.75 | >1000 | In Stock | [TI.com](https://www.ti.com/lit/ds/symlink/tps7a02.pdf) |
| U5 | Buck (TX) | TPS62840DLCR | Texas Instruments | 60nA Iq 750mA buck converter 1.8-6.5Vin VSON-8, TX-gated | 1 | $2.08 | >14000 | In Stock | [TI.com](https://www.ti.com/product/TPS62840) |

**Active parts subtotal: $24.68** (only $0.32 under $25 target — zero margin)

**Cost mitigation:** Replace U3 SHT31 ($4.32) with HDC2080DMBR (~$1.80, TI) to save $2.52. HDC2080 meets ±1-2% spec (±0.5°C, ±2%RH) with lower standby current (50nA vs. 200nA). Revised active BOM with substitution: ~$22.16.

### Commodity Components

| Ref | Category | Description | Qty | Unit Price | Notes |
|-----|----------|-------------|-----|------------|-------|
| C1-C4 | Decoupling Cap | 100nF 0402 16V X7R | 4 | ~$0.01 | Supply bypass |
| C5-C7 | Bulk Cap | 10µF 0402 10V X5R | 3 | ~$0.05 | Rail hold-up + buck output filter |
| L1 | Inductor | 2.2µH 0402 500mA DCR <0.3Ω | 1 | ~$0.15 | TPS62840 output inductor (required) |
| R1-R2 | Pull-up | 4.7k 0402 1% | 2 | ~$0.01 | SHT31 I2C SDA/SCL |
| Q1 | MOSFET | 2N7002 SOT-23 | 1 | ~$0.05 | Buck EN control from MCU GPIO |
| J1 | Debug Header | TC2030-CTX-NL Tag-Connect | 1 | ~$1.50 | SWD no-footprint connector |

**Commodity subtotal: ~$1.80 | Total BOM est.: ~$26.48** (exceeds $25 target with commodities; HDC2080 substitution restores headroom)

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
| REQ-07 | BOM cost <$25 | Important | Partial | 50% |
| REQ-08 | PCB fits <30mm form factor | Important | Partial | 50% |
| REQ-09 | No HMI (buttons, LEDs, display) | Important | Full | 100% |
| REQ-10 | Soft real-time latency | Important | Full | 100% |
| REQ-11 | FCC certification path clear | Important | Full | 100% |
| REQ-12 | Parts from established vendors | Nice-to-have | Full | 100% |
| REQ-13 | DigiKey/Mouser stock availability | Nice-to-have | Full | 100% |
| REQ-14 | Reference designs available | Nice-to-have | Full | 100% |
| REQ-15 | Power budget analysis completed | Nice-to-have | Full | 100% |

**Overall coverage: 90% | Weighted quality score: 75.0%**

| Priority | Coverage |
|----------|----------|
| Critical (50% weight) | 91.7% |
| Important (30% weight) | 80.0% |
| Nice-to-have (20% weight) | 100.0% |

---

## Power Budget Summary

| State | Current | Duration/cycle |
|-------|---------|----------------|
| Sleep (stop2+RTC) | ~1.68 µA | ~3558s/hr |
| Sample-only active | ~2,700 µA | ~0.5s per 5-10min |
| TX active | ~24,000 µA | ~3s/hr |
| Average | ~9.45 µA | — |

**Practical battery life: ~2.8 years** (24.2yr theoretical × 0.13 practical factor; higher wake frequency vs. Concept A drives the larger derating). Still above the 2-year target with 40% margin.

Phase 6 revision: original estimate was 3.2yr at 6hr TX (4 events/day). After REQ-04 closure to hourly TX (24 events/day), additional ~0.73mAh/day LoRa TX energy reduces estimate to ~2.8yr.

---

## Gaps

### REQ-06: IP65 Outdoor Enclosure (Partial — enclosure-level deferral)

Same structural gap as Concept A. Additional note for E: TPS62840 switching losses (~6mW during TX) add a small heat source inside the sealed enclosure. Run a thermal budget at 40°C ambient before layout signoff (total TX dissipation ~19mW — not a risk for a sealed plastic enclosure, but document it).

### REQ-07: BOM Cost <$25 (Partial — cost edge)

Active-only BOM is $24.68 with $0.32 headroom. With commodity components the total exceeds $25. Primary mitigation: replace SHT31 ($4.32) with HDC2080DMBR (~$1.80) before schematic capture to restore $2.52 headroom. This is the recommended first action if this concept is selected.

### REQ-08: PCB <30mm Form Factor (Partial — layout-phase deferral)

Five ICs plus one inductor, one MOSFET, and 11 passives on a sub-30mm board has not been verified. Closure path:
1. KiCad placement study on 28×28mm outline before schematic commit.
2. Place TPS62840 (U5) and inductor (L1) on board underside, beneath the Murata module keep-out shadow.
3. Inductor must clear CMWX1ZZ antenna keep-out by at least 5mm — flag as a hard layout constraint.
4. If layout cannot close at <30mm with 5 ICs, fall back to LDO-only power path for first prototype spin (removes U5, Q1, L1).

---

## Lifecycle Verification

| MPN | Lifecycle | Verified Via | Notes |
|-----|-----------|-------------|-------|
| STM32L412KBU6 | Active | DigiKey / ST.com | Current production, full datasheet Dec 2022 |
| CMWX1ZZABZ-078 | Active | DigiKey / Murata | Current; -091 is pin-compatible alternate |
| SHT31-DIS-B2.5KS | Active | DigiKey / Sensirion | Standard catalog part |
| TPS7A0233PDQNR | Active | DigiKey / TI.com | Current — verify stock at order time |
| TPS62840DLCR | Active | DigiKey (14,134 stock) | Excellent availability |

---

## References

- [STM32L412 product page](https://www.st.com/en/microcontrollers-microprocessors/stm32l412kb.html) — STMicroelectronics
- [CMWX1ZZABZ-078 product page](https://www.murata.com/en-us/products/connectivitymodule/lpwa/overview/lineup/type-abz) — Murata
- [SHT31 product page](https://sensirion.com/products/catalog/SHT31-DIS-B) — Sensirion
- [TPS7A02 product page](https://www.ti.com/product/TPS7A02) — Texas Instruments
- [TPS62840 product page](https://www.ti.com/product/TPS62840) — Texas Instruments
- [HDC2080 product page](https://www.ti.com/product/HDC2080) — Texas Instruments (cost-reduction substitute for SHT31)
- Phase 5 analysis: `.librespin/05-detailed-designs/analysis-concept-e-edge-processing.md`
- Phase 6 score: `.librespin/06-refinement/score-concept-e-edge-processing.md`
- BOM source: `.librespin/04-bom/bom-concept-e-edge-processing.md`
