# Concept A: Ultra-Low-Power MCU

## Summary

Minimalist single-board design built around a Cortex-M0+ MCU with hardware RTC wake, paired with a pre-certified LoRa module and a combined temp/humidity sensor. Every design decision optimizes for minimum quiescent current and maximum sleep duration.

## Architecture Dimensions
- **Processing:** Ultra-low-power Cortex-M0+ MCU (sub-1uA stop mode)
- **Topology:** Single monolithic PCB, all components co-located
- **Communication:** Pre-certified LoRa module with integrated antenna matching
- **Power:** Single 18650 LiPo, no regulator in sleep (LDO bypass or always-on nano-power LDO)

## Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Cortex-M0+ MCU, sub-1uA stop | Lowest available sleep current in general-purpose MCU class |
| Topology | Single board, <30mm | Minimum interconnects, minimum leakage paths |
| Communication | Pre-certified LoRa module | FCC path solved, reduces RF design risk |
| Power | Nano-power LDO + hardware RTC wake | No switching regulator losses; RTC wake avoids software timer current |
| Sensing | Digital I2C temp/humidity combo sensor | Single chip, factory calibrated, low idle current |

## Block Diagram

```
+-------------------------------------------------------+
|                   SINGLE PCB (<30mm)                   |
|                                                        |
|  +-------------+    I2C    +----------------------+    |
|  | Temp/Humid  |<--------->|   Cortex-M0+ MCU     |   |
|  | Sensor      |           |                      |   |
|  | (combo I2C) |           |  - Hardware RTC wake |   |
|  +-------------+           |  - Sub-1uA stop mode |   |
|                            |  - LoRaWAN stack     |   |
|                            +----------+-----------+   |
|                                       |               |
|                                  SPI  |               |
|                                       v               |
|                            +----------+-----------+   |
|                            | Pre-Certified LoRa   |   |
|                            | Module (US915)        |   |
|                            | - Integrated matching |   |
|                            | - Antenna connector   |   |
|                            +----------------------+   |
|                                                        |
|  +-------------+           +----------------------+   |
|  |  18650 LiPo |---------->| Nano-Power LDO       |   |
|  |  Battery    |           | (<1uA Iq)            |   |
|  +-------------+           +----------------------+   |
|                                                        |
+-------------------------------------------------------+
```

## Assumptions

1. A Cortex-M0+ MCU exists with sub-1uA stop mode current that includes RTC wake capability and sufficient flash for LoRaWAN stack (assume 64KB minimum)
2. A nano-power LDO with <1uA quiescent current can regulate 3.0-4.2V LiPo range down to a stable 3.3V or 1.8V rail
3. The LoRaWAN stack plus sensor read plus TX cycle completes in under 5 seconds per hourly wake
4. A pre-certified LoRa module exists in a footprint compatible with <30mm total PCB size
5. Total sleep current budget (MCU + sensor + LDO + leakage) stays under 5uA to achieve 2+ year life on a 3000mAh 18650

## Pros

- Absolute minimum component count (MCU, sensor, LoRa module, LDO, passives)
- Lowest possible sleep current -- maximizes battery life
- Single board simplifies manufacturing and reduces interconnect failure modes
- No switching regulator eliminates EMI concerns near the LoRa radio
- Smallest possible PCB footprint

## Cons

- Cortex-M0+ has limited processing headroom for future feature expansion
- No OTA firmware update path without careful bootloader design
- LDO wastes power during active TX (linear dropout across full LiPo range)
- Single-point-of-failure: any component issue requires full board replacement
- Limited debug capability in ultra-low-power stop modes

## Differentiation

- vs. Concept B: Trades development speed and OTA capability for absolute minimum power consumption
- vs. Concept C: Uses discrete MCU + LoRa module instead of integrated SoC, allowing independent optimization of each
- vs. Concept D: Single board vs. distributed topology -- simpler but less flexible for sensor placement
- vs. Concept E: No local data processing or aggregation -- every reading is transmitted immediately

## Innovation

- **Standard:** Cortex-M0+ MCU, I2C sensor, pre-certified LoRa module, LDO regulation
- **Novel:** Hardware RTC wake with complete power-path shutdown of all peripherals between readings; potential for LDO bypass during sleep using MCU internal regulator only

## Requirements-to-Component Mapping

**Terminology Collision Scan:** No collisions detected.

This concept maps cleanly to the requirements vocabulary. All connectivity references are LoRaWAN US915 at the protocol level; no USB, SPI mode ambiguity, or multi-modal IC configuration terms appear. The term "mode" is used only in the MCU power context (stop mode, sleep mode) and is unambiguous relative to LoRaWAN data rates or regional parameters.

| Requirement Term | Component Term | Mapping Status |
|-----------------|---------------|----------------|
| LoRaWAN US915 | Pre-certified LoRa module (US915 band plan) | Direct match |
| I2C temp/humidity | Digital I2C combo sensor | Direct match |
| <30mm PCB | Single board constraint | Direct match |
| 2+ year battery | Sub-1uA sleep budget | Direct match |
| Battery 18650 LiPo | 18650 LiPo input to LDO | Direct match |

**Pre-Validation Status:** PASSED (no terminology collisions detected)

## Validation

### Breaking Assumptions

1. Can a Cortex-M0+ MCU (e.g., STM32L0 series) achieve <1uA total stop current with RTC running and still fit within 30mm PCB alongside the LoRa module?
2. Does a nano-power LDO (e.g., TPS7A02, MIC5365) maintain <1uA Iq across the full 2.5-4.2V LiPo discharge range without dropout issues near end-of-life?
3. Is total sleep current (MCU + sensor standby + LDO Iq + PCB leakage) achievable at <5uA, giving 2+ years on a 3000mAh 18650 cell?
4. Does a pre-certified LoRa module for US915 exist in a footprint small enough that MCU + module + sensor + LDO + passives fit on a <30mm board?
5. Does the LoRaWAN stack (e.g., LMIC or LoRaMac-node) fit in 64KB flash with room for application code on a Cortex-M0+ target?

### Dimension Scores

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Requirements Coverage | 90 | 20% | 18.0 |
| Technical Feasibility | 90 | 25% | 22.5 |
| Physical Topology | 70 | 20% | 14.0 |
| Part Availability | 90 | 15% | 13.5 |
| Cost | 90 | 12% | 10.8 |
| Complexity | 90 | 8% | 7.2 |

**Confidence Score: 86.0%**
**Status:** auto_passed

## Component Selection (Phase 4)

**Selected parts — all verified active lifecycle at DigiKey:**

| Role | MPN | Manufacturer | Unit Price | Key Spec |
|------|-----|--------------|------------|----------|
| MCU | STM32L072KBU6 | STMicroelectronics | $2.22 | 0.43µA stop+RTC, 128KB flash, UFQFPN32 |
| LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | ~$14.00 | FCC-certified US915, 12.5×11.6mm, SX1276+STM32L0 |
| Temp/Humidity | SHT31-DIS-B2.5KS | Sensirion | $4.32 | ±0.3°C, ±2%RH, 0.2µA standby, I2C |
| LDO | TPS7A0233PDQNR | Texas Instruments | $0.75 | 25nA Iq, 3.3V, 200mA, X2SON-4 |

**Estimated active BOM cost:** $21.29
**Estimated battery life:** ~4.9 years (conservative, with 0.35 practical factor on theoretical 13.9yr)

**Key trade-offs resolved in Phase 4:**
- STM32L072KBU6 chosen over STM32L071KBU6 (same sleep current, but L072 includes USB for DFU bootloader, adds debug flexibility with no power penalty)
- SHT31 chosen over HDC2080 (TI) — meets higher accuracy, cost delta is $2.52; acceptable given $3.71 BOM headroom
- Murata CMWX1ZZABZ-078 is the only FCC-certified LoRa module in a footprint compatible with <30mm PCB; no practical substitute

**Full BOM:** `.librespin/04-bom/bom-concept-a-ultra-low-power-mcu.md`
