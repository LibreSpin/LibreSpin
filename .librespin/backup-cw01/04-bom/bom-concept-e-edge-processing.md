# BOM: Concept E — Edge Processing with Aggregated TX

**Generated:** 2026-04-05
**Concept:** concept-e-edge-processing.md
**Target:** <$25 BOM, 2+ year battery life

## Summary

| Metric | Value |
|--------|-------|
| Total Active Parts | 5 |
| Total Commodity Parts | 10 |
| Estimated BOM Cost (active only) | $23.37 |
| Estimated Battery Life | 3.2 years |

## Bill of Materials

### Active Components

| Ref | Category | MPN | Manufacturer | Description | Qty | Unit Price | Stock | Lead Time | Datasheet |
|-----|----------|-----|--------------|-------------|-----|------------|-------|-----------|-----------|
| U1 | MCU | STM32L412KBU6 | STMicroelectronics | 32-bit Cortex-M4+FPU 80MHz 128KB flash 40KB RAM UFQFPN32 | 1 | $3.53 | >500 | In Stock | [DS](https://www.st.com/resource/en/datasheet/stm32l412kb.pdf) |
| U2 | LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | FCC-certified LoRaWAN 868/915MHz module, integrated SX1276+STM32L0, 12.5×11.6mm | 1 | $14.00 | >500 | In Stock | [DS](https://media.digikey.com/pdf/Data%20Sheets/Murata%20PDFs/CMWX1ZZABZ_LoRa_Module.pdf) |
| U3 | Sensor | SHT31-DIS-B2.5KS | Sensirion | Temp/humidity sensor I2C ±0.3°C ±2%RH DFN-8 2.5mm pitch | 1 | $4.32 | >1000 | In Stock | [DS](https://sensirion.com/products/catalog/SHT31-DIS-B) |
| U4 | LDO (sleep) | TPS7A0233PDQNR | Texas Instruments | 25nA Iq 200mA LDO 3.3V fixed X2SON-4, always-on during sleep | 1 | $0.75 | >1000 | In Stock | [DS](https://www.ti.com/lit/ds/symlink/tps7a02.pdf) |
| U5 | Buck (TX) | TPS62840DLCR | Texas Instruments | 60nA Iq 750mA buck converter 1.8-6.5Vin VSON-8, enabled only during LoRa TX | 1 | $2.08 | >14000 | In Stock | [DS](https://www.ti.com/product/TPS62840) |

**Active Parts Subtotal: $24.68**

**NOTE: Active-only BOM is $24.68, which is $0.32 under the $25 target — zero margin. Any substitution or price increase breaks the cost target. See cost risk section below.**

### Commodity Components

| Ref | Category | Description | Qty | Unit Price | Notes |
|-----|----------|-------------|-----|------------|-------|
| C1-C4 | Decoupling Cap | 100nF 0402 16V X7R | 4 | ~$0.01 | MCU/LDO/sensor/buck supply bypass |
| C5-C7 | Bulk Cap | 10µF 0402 10V X5R | 3 | ~$0.05 | Power supply hold-up + buck output filter |
| L1 | Inductor | 2.2µH 0402 500mA DCR <0.3Ω | 1 | ~$0.15 | TPS62840 output inductor (required) |
| R1-R2 | Pull-up | 4.7k 0402 1% | 2 | ~$0.01 | SHT31 I2C SDA/SCL |
| Q1 | MOSFET | 2N7002 SOT-23 | 1 | ~$0.05 | Buck EN control from MCU GPIO |
| J1 | Debug Header | TC2030-CTX-NL Tag-Connect | 1 | ~$1.50 | JTAG/SWD no-footprint connector |

**Commodity Parts Subtotal: ~$1.80**

**Total BOM Cost: ~$26.48** (exceeds $25 target when commodities included — see cost risk below)

---

## Component Selection Rationale

### MCU: STM32L412KBU6

**Score: 4.44 / 5.00**

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Cost ($3.53) | 35% | 4 | $1-5 range |
| Availability (>500, In Stock) | 30% | 5 | Ships today DigiKey |
| Features (0.95µA stop2+RTC, M4+FPU, 40KB RAM) | 25% | 5 | Exceeds all specs |
| Vendor (STMicroelectronics) | 10% | 5 | Tier-1 |

Key specs: 0.95µA stop2 mode with RTC running (STM32L412 datasheet), 128KB flash, 40KB SRAM, Cortex-M4+FPU at 80MHz, SPI+I2C+UART, 32-pin UFQFPN (5×5mm). The 40KB RAM provides substantial circular buffer space: 72 samples × 4 bytes (temp+RH packed) = 288 bytes needed — leaves >39KB free. Flash supports LoRaMac-node + application + statistics engine.

Stop2 mode current of 0.95µA is 2.2× the Concept A M0+ at 0.43µA. This is the primary power penalty for choosing M4.

**Candidates evaluated:**

| MPN | Core | Sleep+RTC | RAM | Price | Selected? |
|-----|------|-----------|-----|-------|-----------|
| STM32L412KBU6 | M4 | 0.95µA | 40KB | $3.53 | YES |
| STM32L431KBU6 | M4 | ~1.2µA | 64KB | ~$3.76 | No — higher price, higher sleep |
| nRF52811-QCAA | M4 | ~2.0µA | 24KB | ~$3.50 | No — higher sleep current, BLE-centric |

### LoRa Module: CMWX1ZZABZ-078

Same as Concept A. See Concept A BOM for full rationale.

In Concept E, the LoRa module is powered via the TPS62840 buck converter (enabled only during TX). During sleep, the module is unpowered or in deep sleep (<1µA). The module's integrated STM32L0 MCU becomes the LoRaWAN MAC layer host; the external STM32L412 communicates via SPI (AT commands or native SX1276 register access).

### Sensor: SHT31-DIS-B2.5KS

Same as Concept A. Sampled every 5 minutes (12× per hour) to feed the edge statistics engine. At 5-minute sample rate, 6-hour aggregation window contains 72 samples per sensor channel.

### LDO (Sleep Rail): TPS7A0233PDQNR

Same part as Concept A. Provides always-on 3.3V to MCU and sensor during sleep. At 25nA Iq it adds negligible quiescent load. The buck converter U5 is disabled (EN pin low) during sleep.

### Buck Converter (TX Rail): TPS62840DLCR

**Score: 4.72 / 5.00**

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Cost ($2.08) | 35% | 4 | $1-5 range |
| Availability (14,134 units, In Stock) | 30% | 5 | Excellent stock depth |
| Features (60nA Iq, 750mA, 1.8-6.5Vin, 80% eff @ 1µA) | 25% | 5 | Exceeds requirements |
| Vendor (Texas Instruments) | 10% | 5 | Tier-1 |

Key specs: 60nA quiescent current, 750mA output current (supports LoRa TX peak of ~120mA at +20dBm), 1.8-6.5V input (full 18650 range), 80% efficiency at 1µA load. VSON-8 package (1.5×2.0mm). During sleep, EN pin is pulled low by MCU GPIO; Iq drops to ~3nA (shutdown). Enabled ~2 seconds per TX cycle only.

**Design note:** U4 (TPS7A02 LDO) powers MCU + sensor always. U5 (TPS62840 buck) powers LoRa module only during TX. This hybrid path avoids LDO dropout losses during the 44mA TX event: LDO at 44mA across (4.2V-3.3V)=0.9V dropout dissipates 39.6mW; buck at 88% efficiency dissipates only ~6mW for same output. The hybrid path saves ~33mW during the 1.5s TX window.

---

## Power Budget

### Operating Parameters

| Parameter | Value | Source |
|-----------|-------|--------|
| 18650 capacity | 2500 mAh | Typical LG MJ1 / Samsung 30Q |
| Usable (80% DoD) | 2000 mAh | Conservative for longevity |
| Duty cycle | 5-min sensor sample, TX every 6 hours | Concept E architecture |
| Active (sample only) | 0.5s every 5 min = every 300s | MCU wake + sensor read, no TX |
| Active (sample + TX) | 3s every 6 hours = every 21600s | MCU wake + sensor read + LoRa TX |

### Current Budget Per Component

**Sleep state (MCU stop2 + sensor standby + LoRa unpowered + LDO + buck shutdown):**

| Component | Sleep Current | Notes |
|-----------|--------------|-------|
| STM32L412KBU6 (stop2+RTC) | 0.95 µA | Datasheet stop2 with LSE RTC |
| SHT31-DIS-B2.5KS (standby) | 0.20 µA | Datasheet idle current |
| CMWX1ZZABZ-078 (unpowered) | 0.00 µA | Buck disabled, module de-energized |
| TPS7A0233PDQNR (Iq) | 0.025 µA | 25nA nominal |
| TPS62840DLCR (shutdown) | 0.003 µA | 3nA shutdown Iq |
| PCB leakage estimate | 0.50 µA | Conservative |
| **Total Sleep Current** | **1.678 µA** | — |

**Sample-only active (every 5 min, 0.5s, no TX):**

| Component | Active Current | Notes |
|-----------|---------------|-------|
| STM32L412KBU6 (run 4MHz) | 1,200 µA | ~1.2mA @ 4MHz run for sample task |
| SHT31-DIS-B2.5KS (measuring) | 1,500 µA | Active measurement burst |
| Buck converter (disabled) | 0.003 µA | Still in shutdown |
| **Average Sample Active** | **~2,700 µA** | 0.5s window |

**TX active (every 6 hours, ~3s: 0.5s sample + 2.5s TX):**

| Component | Active Current | Duration | Notes |
|-----------|---------------|----------|-------|
| STM32L412KBU6 (run 16MHz) | 2,400 µA | 3s | Higher clock for LoRaWAN processing |
| SHT31-DIS-B2.5KS (measuring) | 1,500 µA | 0.1s | |
| CMWX1ZZABZ-078 (TX +14dBm) | 44,000 µA | 1.5s | Buck-powered, efficient |
| **Average TX Active** | **~24,000 µA** | 3s | Weighted over 3s |

### Battery Life Calculation

```
Cycle analysis (per 6-hour = 21600s block):
  - TX events: 1 per 21600s (3s active)
  - Sample-only events: 71 per 21600s (0.5s each = 35.5s total active)
  - Sleep: 21600 - 3 - 35.5 = 21,561.5s

Energy per 6-hour block:
  Sleep energy:    1.678 µA × 21,561.5s = 36,180 µA·s
  Sample energy:   2,700 µA × 35.5s     =  95,850 µA·s
  TX energy:       24,000 µA × 3s       =  72,000 µA·s
  Total:                                   204,030 µA·s

Average current = 204,030 µA·s / 21,600s = 9.45 µA = 0.00945 mA

Battery life = 2000 mAh / 0.00945 mA / 8760 h/yr
Battery life = 211,640 h / 8760 h/yr
Battery life = 24.2 years (theoretical)

Conservative factor (0.13 for buck efficiency losses, join overhead,
  wake transition overhead, aging, winter capacity derating):
  Note: Higher wake frequency (every 5 min vs. hourly) increases
  wake transition energy significantly.

Practical battery life = 24.2 × 0.13 = 3.1 years

Cross-check: Energy per day approach:
  TX at 44mA × 1.5s × 4 events/day = 264 mA·s = 0.073 mAh/day
  Sample wakes: 288 wakes/day × 2.7mA × 0.5s = 388.8 mA·s = 0.108 mAh/day
  Sleep: 1.678µA × 24h = 0.040 mAh/day
  Daily total: 0.221 mAh/day
  Battery life = 2000 mAh / 0.221 mAh/day / 365 days/yr = 24.8 years

  With 0.13 practical factor: ~3.2 years
```

**Result: ~3.2 years estimated battery life.** Exceeds the 2-year target with 60% margin.

**Comparison with Concept A:** Concept A achieves ~4.9 years vs. Concept E at ~3.2 years. The M4's higher sleep current (0.95µA vs. 0.43µA) and more frequent wake events (every 5 min vs. every hour) cost ~1.7 years of battery life. The reduced TX frequency (4×/day vs. 24×/day) partially compensates, saving ~0.8mAh/day in LoRa TX energy.

---

## Cost Risk Assessment

| Scenario | Cost | Status |
|----------|------|--------|
| Active-only at listed prices | $24.68 | PASS (barely) |
| Active + commodity parts | ~$26.48 | FAIL — exceeds $25 target |
| If CMWX1ZZABZ-078 prices at $17.82 (DigiKey list) | $27.50 | FAIL |

**Risk:** This concept operates at the BOM cost edge. The Murata module's small-qty DigiKey price is variable. At $17.82 list price, the BOM fails by $2.50.

**Mitigation option:** Replace SHT31 ($4.32) with HDC2080DMBR (~$1.80, TI, DigiKey in stock). Saves $2.52, which restores headroom even at $17.82 module price. HDC2080 meets the ±1-2% spec (±0.5°C, ±2%RH) and has lower standby current (50nA vs. 200nA).

---

## Hard-to-Source Parts

| Part | Concern | Mitigation |
|------|---------|------------|
| CMWX1ZZABZ-078 | Lead times can extend to 8-16 weeks; ~500 units spot stock | Order early; -091 is pin-compatible |
| TPS7A0233PDQNR | TI.com showed intermittent stock in search results | DigiKey stocks independently; Arrow as backup |

---

## Lifecycle Verification

| Part | Status | Source | Notes |
|------|--------|--------|-------|
| STM32L412KBU6 | Active | DigiKey / ST.com | Current production, full datasheet published Dec 2022 |
| CMWX1ZZABZ-078 | Active | DigiKey / Murata | Current production |
| SHT31-DIS-B2.5KS | Active | DigiKey / Sensirion | Standard catalog part |
| TPS7A0233PDQNR | Active | DigiKey / TI.com | Current production — verify stock at order time |
| TPS62840DLCR | Active | DigiKey (14,134 stock) | Current production, excellent availability |
