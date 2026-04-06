# Concept B: Module-Based with OTA

## Summary

Development-speed-optimized design using a pre-certified LoRa+MCU system-on-module (SoM) that integrates the MCU, LoRa radio, and antenna matching in a single certified module. Includes OTA firmware update capability via LoRaWAN FUOTA, traded against slightly higher power and cost.

## Architecture Dimensions
- **Processing:** Cortex-M4 class MCU integrated in LoRa SoM (more headroom for OTA bootloader)
- **Topology:** Single board with SoM as primary component, minimal external parts
- **Communication:** Pre-certified LoRa SoM with integrated MCU and LoRaWAN stack
- **Power:** 18650 LiPo with low-Iq buck-boost converter for stable rail across full discharge curve

## Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Cortex-M4 in LoRa SoM | OTA bootloader + crypto needs headroom; SoM eliminates RF layout |
| Topology | SoM + carrier board | Carrier board is trivial -- power, sensor, connector |
| Communication | LoRa SoM with integrated stack | Entire radio subsystem pre-certified, minimal design effort |
| Power | Buck-boost converter | Maintains stable 3.3V across 2.5-4.2V LiPo range; higher efficiency during TX than LDO |
| Sensing | Digital I2C temp/humidity combo sensor | Same proven approach as Concept A |

## Block Diagram

```
+-------------------------------------------------------+
|                   SINGLE PCB (<30mm)                   |
|                                                        |
|  +-------------+    I2C    +----------------------+    |
|  | Temp/Humid  |<--------->|  LoRa System-on-     |   |
|  | Sensor      |           |  Module (SoM)        |   |
|  | (combo I2C) |           |                      |   |
|  +-------------+           |  - Cortex-M4 MCU     |   |
|                            |  - LoRa transceiver  |   |
|                            |  - Antenna matching   |   |
|                            |  - LoRaWAN stack      |   |
|                            |  - OTA bootloader    |   |
|                            |  - FCC pre-certified |   |
|                            +----------+-----------+   |
|                                       |               |
|                                  ANT  |               |
|                                       v               |
|                            +----------+-----------+   |
|                            | Chip/PCB Antenna or   |   |
|                            | U.FL Connector        |   |
|                            +----------------------+   |
|                                                        |
|  +-------------+           +----------------------+   |
|  |  18650 LiPo |---------->| Buck-Boost Converter  |   |
|  |  Battery    |           | (low-Iq, ~10uA)      |   |
|  +-------------+           +----------------------+   |
|                                                        |
+-------------------------------------------------------+
```

## Assumptions

1. A pre-certified LoRa SoM exists with integrated Cortex-M4 MCU that fits within the 30mm board constraint (module itself under 15x15mm)
2. LoRaWAN FUOTA (Firmware Update Over The Air) is practical at hourly TX intervals -- assume firmware update can be staged across multiple wake cycles
3. Buck-boost converter quiescent current of ~10uA is acceptable given the power budget (higher than LDO but better TX efficiency)
4. SoM sleep current (MCU + radio in deep sleep) is under 5uA with RTC wake enabled
5. OTA bootloader adds ~20-30KB flash overhead, requiring a SoM with at least 256KB flash

## Pros

- Fastest path to working prototype -- minimal RF and MCU design effort
- OTA firmware updates enable field maintenance without physical access
- Pre-certified module eliminates FCC testing risk entirely
- Cortex-M4 provides headroom for future features (additional sensors, edge processing)
- Buck-boost maintains full TX power even at low battery voltage

## Cons

- SoM cost is higher than discrete MCU + LoRa module (potentially $8-15 for SoM alone)
- Higher sleep current than Concept A due to integrated module overhead
- Buck-boost adds ~10uA quiescent vs. nano-power LDO approach
- Less flexibility -- locked into the SoM vendor's MCU and radio choices
- OTA adds firmware complexity and potential security attack surface
- Module size may be challenging for <30mm PCB constraint

## Differentiation

- vs. Concept A: Trades power optimization for development speed and OTA capability
- vs. Concept C: Uses complete SoM instead of SoC -- higher level of integration, less board-level design
- vs. Concept D: Fully integrated vs. distributed -- opposite end of the modularity spectrum
- vs. Concept E: Similar MCU headroom but uses it for OTA rather than edge processing

## Innovation

- **Standard:** Pre-certified LoRa SoM, buck-boost regulation, I2C sensor
- **Novel:** LoRaWAN FUOTA staged across hourly wake cycles; potential for adaptive TX power based on link margin to extend battery life

## Requirements-to-Component Mapping

**Terminology Collision Scan:** No collisions detected.

All connectivity references resolve to LoRaWAN US915 at the SoM protocol layer. No USB protocol, SPI mode configuration ambiguity, or multi-modal IC register-level terms appear in this concept. The term "OTA" refers exclusively to over-the-air firmware update (FUOTA), not to any hardware mode configuration that could be confused with LoRaWAN operational parameters.

| Requirement Term | Component Term | Mapping Status |
|-----------------|---------------|----------------|
| LoRaWAN US915 | LoRa SoM (US915 band plan) | Direct match |
| I2C temp/humidity | Digital I2C combo sensor | Direct match |
| <30mm PCB | SoM + carrier board constraint | Direct match |
| 2+ year battery | SoM deep sleep + buck-boost | Conditional — sleep current must be verified |
| Battery 18650 LiPo | 18650 LiPo input to buck-boost | Direct match |

**Pre-Validation Status:** PASSED (no terminology collisions detected)

## Validation

### Breaking Assumptions

1. Does a pre-certified LoRa SoM with integrated Cortex-M4 MCU exist in a module footprint small enough (under ~15x15mm) that the total carrier board fits within 30mm?
2. Is the SoM sleep current (deep sleep with RTC running) actually achievable at <5uA, or does the integrated MCU+radio architecture push this higher?
3. Does the buck-boost converter Iq (~10uA typical) materially reduce 2+ year battery life compared to the nano-power LDO approach in Concept A?
4. Is LoRaWAN FUOTA practical for a device transmitting only 1 packet per hour — what is the realistic firmware update completion time?
5. Does SoM cost plus buck-boost converter keep the BOM under $25 at 1-10 unit volumes?

### Dimension Scores

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Requirements Coverage | 90 | 20% | 18.0 |
| Technical Feasibility | 70 | 25% | 17.5 |
| Physical Topology | 70 | 20% | 14.0 |
| Part Availability | 70 | 15% | 10.5 |
| Cost | 50 | 12% | 6.0 |
| Complexity | 70 | 8% | 5.6 |

**Confidence Score: 71.6%**
**Status:** auto_failed
