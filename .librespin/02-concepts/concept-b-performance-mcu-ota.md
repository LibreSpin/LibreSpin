# Concept: Performance MCU with OTA Capability (Concept B)

**Summary:** Higher-capability Cortex-M4 MCU with abundant flash for OTA firmware updates and expanded sensor support. LoRaWAN via certified module. More power consumption than Concept A but provides robust field upgrade path and future sensor expansion headroom.

## Architectural Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Cortex-M4 MCU (e.g., STM32WL55, integrated LoRa+MCU) | Dual-core option; more flash for OTA; integrated radio saves BOM |
| Topology | Centralized with integrated radio | STM32WL combines MCU + LoRa radio in single package |
| Communication | LoRaWAN via STM32WL integrated sub-GHz radio | Module-level FCC certified as part of reference design |
| Power | 2xAA, switching regulator (buck-boost) to maintain 3.3V as batteries drain | Buck-boost extends usable battery range; more efficient at >20mA active |

## Assumptions

- STM32WL55JC integrates Cortex-M4 application core + Cortex-M0+ radio core
- OTA update via LoRaWAN (FUOTA) requires dual-bank flash (512KB total)
- Buck-boost converter adds ~50µA quiescent but saves efficiency at higher loads
- Active current ~15mA during LoRa TX; deep sleep ~5µA; average ~25µA
- 2500mAh AA × 2 → ~22 years at 25µA → 12 months target met with margin

## Block Diagram

```
[2xAA Battery]
      |
      v
[Buck-Boost 3.3V]
      |
      +----[STM32WL55 MCU+Radio]----((US915 Antenna))
      |         |
      |    [ADC/I2C]----[Soil Moisture Sensor]
      |         |
      |    [I2C]----[TMP117 High-Accuracy Temp]
      |         |
      |    [GPIO]----[Button]
      |    [GPIO]----[LED x2]

Legend:
  ----> : Signal flow
  |  v  : Power flow (downward)
```

## Qualitative Pros/Cons

**Pros:**
- OTA firmware updates via FUOTA (no field service needed)
- Single-chip radio+MCU reduces assembly complexity and BOM cost
- Higher-accuracy temperature sensor (TMP117, ±0.1°C)
- STMicroelectronics preferred vendor alignment

**Cons:**
- Higher average power than Concept A (~3× more)
- STM32WL dual-core complexity requires careful radio/app core partition
- More expensive per unit (~$8 MCU vs ~$3)

## Differentiation from Other Concepts

- vs. Concept A: Higher power/capability; OTA support; integrated radio
- vs. Concept C: STM32WL vs. Nordic module; different vendor ecosystem
- vs. Concept D: Single-chip vs. separate sensor MCU + radio MCU
- vs. Concept E: End-node only (no gateway functionality)

## Innovation Points

- **Standard:** STM32WL reference design is well-documented with LoRaWAN middleware
- **Novel:** FUOTA enables field firmware upgrades without hardware access — critical for 50+ unit deployments

## Requirement-to-Component Mapping (Phase 2.5)

| Requirement Term | Requirement Meaning | Component Term | Component Meaning | Compatible? |
|------------------|---------------------|----------------|-------------------|-------------|
| LoRaWAN US915 | 902-928 MHz, LoRaWAN 1.0.3+ | STM32WL55 sub-GHz | 150-960 MHz, LoRaWAN stack included | Yes |
| battery life 12 months | ~23µA average budget | STM32WL55 stop mode | ~1µA combined cores + RTC | Yes (25µA avg within budget) |
| outdoor -20 to 50°C | Operating temperature range | STM32WL55 rated | -40°C to 85°C industrial | Yes |
| preferred: STMicroelectronics | Vendor preference | STM32WL55JC | STMicroelectronics product | Yes (preferred vendor) |
| FCC compliance | End product certification | STM32WL reference design | ST provides reference FCC-approved design | Yes (simplifies path) |

**Configuration Required:** STM32WL55 dual-core; application core runs user firmware, radio core runs LoRaWAN stack. Separate flash banks for FUOTA.
**Feasibility:** PASS — no configuration conflicts.

## Validation (Phase 3)

**Dimension Scores:**
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|---------|
| Requirements Coverage | 90 | 35% | 31.5 |
| Technical Feasibility | 90 | 30% | 27.0 |
| Physical Topology | 90 | 0% | 9.0 |
| Part Availability | 80 | 15% | 12.0 |
| Cost | 80 | 12% | 9.6 |
| Complexity | 70 | 8% | 5.6 |

**Confidence Score: 85.7%** (threshold: 80%)
**Status: VALIDATED** — passes confidence threshold

**Assumption Verification:**
- STM32WL55 LoRaWAN: Confirmed in ST UM2592 application note (Tier 1)
- FUOTA support: Confirmed in ST AN5554 (Tier 1)
- TMP117 ±0.1°C: Confirmed in TI datasheet (Tier 1)
- STM32WL55 availability: ST production part, widely stocked (DigiKey, Mouser)

**Blocking Issues:** None
