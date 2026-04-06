# Concept E: Edge Processing with Aggregated TX

## Summary

Single-board design with a more capable MCU that samples sensors frequently (e.g., every 5 minutes) but transmits aggregated/compressed data less frequently (e.g., every 6 hours). Local edge processing computes min/max/mean/trend and only transmits a compact summary, dramatically reducing LoRa TX events and total RF energy consumption. Trades MCU active time for fewer high-cost TX cycles.

## Architecture Dimensions
- **Processing:** Cortex-M4 class MCU with sufficient RAM for local data buffering and statistics
- **Topology:** Single monolithic PCB, all components co-located
- **Communication:** Pre-certified LoRa module, very infrequent TX (4x/day instead of 24x/day)
- **Power:** 18650 LiPo with hybrid power -- nano-power LDO for sleep, buck converter enabled only during TX

## Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Cortex-M4 MCU (32-64KB RAM) | Needs RAM for sample buffer and statistical computation |
| Topology | Single board, <30mm | Same as Concept A but with more capable MCU |
| Communication | Pre-certified LoRa module, 4x/day TX | Fewer TX events = major power savings on the RF side |
| Power | Hybrid LDO (sleep) + buck (TX) | Optimize each power state independently |
| Sensing | Digital I2C temp/humidity combo sensor, 5-min sample rate | Higher sample rate feeds local processing |

## Block Diagram

```
+-------------------------------------------------------+
|                   SINGLE PCB (<30mm)                   |
|                                                        |
|  +-------------+    I2C    +----------------------+    |
|  | Temp/Humid  |<--------->|   Cortex-M4 MCU      |   |
|  | Sensor      |           |                      |   |
|  | (combo I2C) |           |  - 32-64KB RAM       |   |
|  +-------------+           |  - RTC wake (5 min)  |   |
|                            |  - Sample buffer     |   |
|                            |  - Statistics engine  |   |
|                            |  - Min/Max/Mean/Trend|   |
|                            |  - LoRaWAN stack     |   |
|                            +----------+-----------+   |
|                                       |               |
|                                  SPI  |               |
|                                       v               |
|                            +----------+-----------+   |
|                            | Pre-Certified LoRa   |   |
|                            | Module (US915)        |   |
|                            | - TX 4x per day      |   |
|                            +----------------------+   |
|                                                        |
|  +-------------+    +----------+    +-------------+   |
|  |  18650 LiPo |--->| Nano-Pwr |    | Buck Conv.  |   |
|  |  Battery    |    | LDO      |    | (TX only)   |   |
|  +-------------+    | (sleep)  |    | Enable ctrl |   |
|                     +----------+    +-------------+   |
|                          |               |            |
|                     MCU + Sensor     LoRa Module      |
|                     (always on)      (on demand)      |
|                                                        |
+-------------------------------------------------------+
```

## Assumptions

1. Reducing TX from 24x/day (hourly) to 4x/day (every 6 hours) saves more energy than the additional MCU wake cycles for sampling every 5 minutes -- LoRa TX at +14dBm draws ~40-120mA for 1-2 seconds per event
2. A Cortex-M4 MCU exists with sub-2uA stop mode current and sufficient RAM (32KB+) for buffering 72 samples (6 hours x 12 samples/hour x 2 sensors x 2 bytes)
3. The aggregated data payload (min, max, mean, trend for temp + humidity over 6 hours) fits in a single LoRaWAN uplink frame (<51 bytes for DR0)
4. The application server/cloud side accepts aggregated data instead of individual readings -- hourly granularity is not required at the network level
5. Hybrid power switching between LDO and buck converter can be controlled by a single MCU GPIO with clean transition

## Pros

- Fewest LoRa TX events of any concept -- 4x/day vs. 24x/day -- saving the highest-power operation
- Richer data at the cloud: min/max/mean/trend per period instead of single-point readings
- Potential for anomaly detection at the edge (sudden temperature spike triggers immediate alert TX)
- Hybrid power path optimizes efficiency for both sleep (LDO) and TX (buck) states
- Same single-board simplicity as Concept A but with smarter data handling

## Cons

- More complex firmware: sample scheduling, circular buffer, statistics, data compression
- Cortex-M4 has higher sleep current than Cortex-M0+ (typically 1-3uA vs. 0.5-1uA)
- More frequent MCU wake events (every 5 min vs. every hour) increases cumulative active energy
- Hybrid power path adds component count (LDO + buck + switching logic)
- If the edge processing firmware has bugs, 6 hours of data could be lost before the error is detected
- Application server must be designed to accept aggregated payloads instead of raw readings

## Differentiation

- vs. Concept A: Same board topology but trades MCU simplicity for data intelligence -- fewer TX at cost of more processing
- vs. Concept B: Both use capable MCUs, but Concept E uses the headroom for edge analytics while B uses it for OTA
- vs. Concept C: Single radio (LoRa only) but compensates with smarter data handling -- no BLE needed
- vs. Concept D: Single board but achieves power savings through TX reduction rather than hardware power gating

## Innovation

- **Standard:** Cortex-M4 MCU, pre-certified LoRa module, I2C sensor, data buffering
- **Novel:** Hybrid LDO/buck power architecture with MCU-controlled switching; edge statistical aggregation to minimize the dominant power consumer (LoRa TX); potential for adaptive TX scheduling based on data variance (calm weather = less frequent TX, rapid changes = immediate alert)

## Requirements-to-Component Mapping

**Terminology Collision Scan:** No collisions detected.

No USB references exist in this concept. The hybrid power terminology (LDO/buck switching) is topology-level and does not overlap with any requirements vocabulary. LoRaWAN US915 references are unambiguous. The Cortex-M4's "stop mode" terminology refers to ARM Cortex power state, not to any LoRaWAN or sensor configuration mode. No collisions found.

| Requirement Term | Component Term | Mapping Status |
|-----------------|---------------|----------------|
| LoRaWAN US915 | Pre-certified LoRa module (US915 band plan) | Direct match |
| I2C temp/humidity | Digital I2C combo sensor | Direct match |
| <30mm PCB | Single board with M4 + LoRa module constraint | Direct match |
| 2+ year battery | Hybrid power + reduced TX strategy | Conditional — net power budget must verify benefit vs. M4 sleep penalty |
| Battery 18650 LiPo | 18650 LiPo input to LDO + buck | Direct match |
| hourly data rate | Aggregated 4x/day TX replaces hourly | Deviation — requires application-side acceptance of aggregated payload |

**Pre-Validation Status:** PASSED (no terminology collisions detected; one requirement deviation noted above regarding data rate interpretation)

## Validation

### Breaking Assumptions

1. Does the energy saved by reducing LoRa TX from 24x/day to 4x/day outweigh the increased MCU active energy from 5-minute wake cycles versus 60-minute wake cycles — a quantitative power budget comparison is required?
2. Does a Cortex-M4 MCU (e.g., STM32L4 series) achieve <2uA stop current with RTC running, and is this competitive enough against an M0+ to justify the added RAM and compute?
3. Does the application server / LoRaWAN network infrastructure support receiving aggregated 6-hour summary payloads rather than individual hourly readings — is this a deployment constraint?
4. Does the hybrid LDO + buck power path add sufficient PCB area (two regulators + switching FET + passives) to threaten the <30mm form factor?
5. Can the aggregated payload (min, max, mean, trend for 2 sensors over 6 hours) be encoded in under 51 bytes (LoRaWAN DR0 limit) without lossy compression?

### Dimension Scores

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Requirements Coverage | 70 | 20% | 14.0 |
| Technical Feasibility | 70 | 25% | 17.5 |
| Physical Topology | 70 | 20% | 14.0 |
| Part Availability | 90 | 15% | 13.5 |
| Cost | 70 | 12% | 8.4 |
| Complexity | 70 | 8% | 5.6 |

**Confidence Score: 73.0%**
**Status:** auto_failed — manually promoted to Phase 4 (threshold lowered to 70%)

## Component Selection (Phase 4)

**Selected parts — all verified active lifecycle at DigiKey:**

| Role | MPN | Manufacturer | Unit Price | Key Spec |
|------|-----|--------------|------------|----------|
| MCU | STM32L412KBU6 | STMicroelectronics | $3.53 | 0.95µA stop2+RTC, 128KB flash, 40KB RAM, UFQFPN32 |
| LoRa Module | CMWX1ZZABZ-078 | Murata Electronics | ~$14.00 | FCC-certified US915, 12.5×11.6mm, SX1276+STM32L0 |
| Temp/Humidity | SHT31-DIS-B2.5KS | Sensirion | $4.32 | ±0.3°C, ±2%RH, 0.2µA standby, I2C |
| LDO (sleep) | TPS7A0233PDQNR | Texas Instruments | $0.75 | 25nA Iq, 3.3V, 200mA, always-on |
| Buck (TX) | TPS62840DLCR | Texas Instruments | $2.08 | 60nA Iq, 750mA, 1.8-6.5Vin, enabled only during TX |

**Estimated active BOM cost:** $24.68 — MARGINAL: $0.32 under $25 target at spot prices
**Estimated battery life:** ~3.2 years (conservative, with practical factor)

**Key trade-offs resolved in Phase 4:**
- STM32L412KBU6 chosen over STM32L431KBU6 — same M4 core, lower stop2 current (0.95µA vs. ~1.2µA), lower price ($3.53 vs. $3.76)
- TPS62840DLCR chosen for TX buck — 60nA Iq in shutdown means it adds <0.1µA to sleep budget; 88% efficiency at TX current saves ~33mW vs. LDO-only path
- Cost risk: if CMWX1ZZABZ-078 prices at DigiKey list ($17.82), BOM fails by $2.50; mitigation is substituting SHT31 with HDC2080DMBR ($1.80, TI) for $2.52 savings
- The 5-part active BOM (vs. 4 parts in Concept A) adds component count and PCB area; layout feasibility on <30mm board is the highest remaining risk

**Full BOM:** `.librespin/04-bom/bom-concept-e-edge-processing.md`
