# Concept: Edge Processing with Local Storage (Concept E)

**Summary:** Higher-capability MCU (ESP32-S3 or similar) with local flash storage for data buffering, capable of operating autonomously for extended periods and uploading data in bursts when LoRa is available. Adds edge analytics (trend detection, anomaly alerts) locally, reducing required upload frequency. Optimized for reliability in poor RF coverage areas.

## Architectural Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | ESP32-S3 (Xtensa LX7, dual-core) with 4MB external flash | Higher processing capability enables edge analytics; dual-core aids power management |
| Topology | Centralized with edge compute and local persistent storage | Local storage handles RF blackout periods; edge analytics reduce upload volume |
| Communication | LoRaWAN via SX1262 (SPI-attached) + WiFi (optional config portal only) | LoRaWAN primary; WiFi for initial config only (disabled in field) |
| Power | 2xAA + LiPo top-up via optional small solar panel; boost converter | Solar optional; boost converter maintains 3.3V across wide battery range |

## Assumptions

- ESP32-S3 in ULP co-processor mode for sensor acquisition; main core wakes for LoRa TX
- Local flash stores up to 10,000 hourly readings (~40 days buffer) in case of LoRa blackout
- Edge analytics detect anomalies (e.g., sudden moisture drop) and send immediate alerts
- WiFi used only for initial provisioning via web portal; disabled afterward
- Active power higher (~50mA peak) but duty cycle maintained; average ~30-40µA
- 12-month battery target borderline; solar panel option extends to indefinite operation

## Block Diagram

```
[2xAA Battery]----[Optional Solar]
      |
      v
  [Boost 3.3V]
      |
      +----[ESP32-S3 MCU]----[SPI]----[SX1262 LoRa]----((US915 Antenna))
      |         |
      |    [SPI]----[4MB Flash (local buffer)]
      |         |
      |    [ADC]----[Soil Moisture Sensor]
      |         |
      |    [I2C]----[Temperature Sensor]
      |         |
      |    [WiFi]----(Config Portal, disabled in field)
      |         |
      |    [GPIO]----[Button]
      |    [GPIO]----[LED x2]

Legend:
  ----> : Signal flow
  |  v  : Power flow (downward)
```

## Qualitative Pros/Cons

**Pros:**
- Resilient to LoRa blackout (local buffer up to 40 days)
- Edge analytics enable immediate anomaly detection without cloud round-trip
- WiFi provisioning simplifies field setup
- Expandable to additional sensors without firmware rewrite

**Cons:**
- Higher power consumption (may not meet 12-month battery target without solar)
- ESP32 less power-optimized than STM32L/nRF in deep sleep
- FCC testing required for ESP32+LoRa combo (no certified module)
- More complex firmware (dual-core, local storage management)

## Differentiation from Other Concepts

- vs. Concept A: Much more capable; local storage; higher power
- vs. Concept B: Different processor family (Espressif vs ST); local storage vs OTA focus
- vs. Concept C: Custom design vs WisBlock module; higher capability, more work
- vs. Concept D: Single powerful MCU vs distributed; edge analytics capability

## Innovation Points

- **Standard:** ESP32-S3 with SX1262 is increasingly common in IoT designs
- **Novel:** Local 40-day data buffer enables reliable agricultural monitoring in areas with intermittent LoRa coverage (e.g., remote fields, RF shadowed by terrain)

## Requirement-to-Component Mapping (Phase 2.5)

| Requirement Term | Requirement Meaning | Component Term | Component Meaning | Compatible? |
|------------------|---------------------|----------------|-------------------|-------------|
| LoRaWAN US915 | 902-928 MHz | Semtech SX1262 | 150-960 MHz configurable | Yes (configure for US915) |
| battery life 12 months | ~23µA average budget | ESP32-S3 deep sleep | ~10µA in deep sleep | Borderline (30-40µA avg expected) |
| outdoor -20 to 50°C | Operating temperature range | ESP32-S3 rated | -40°C to 85°C | Yes |
| FCC compliance | End product certification | ESP32-S3 + SX1262 | Requires system-level FCC testing | Requires certification (no module-level) |
| 50x30mm PCB | Size constraint | ESP32-S3 + SX1262 + 4MB flash | Compact but tight; RF isolation needed | Challenging — may need 4-layer PCB |

**Configuration Note:** ESP32-S3 WiFi disabled in field deployment (only enabled for initial config). SPI channel assignment: SX1262 on FSPI, flash on HSPI.
**Feasibility:** CONDITIONAL PASS — battery life is borderline; solar option required for guaranteed 12-month target.

## Validation (Phase 3)

**Dimension Scores:**
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|---------|
| Requirements Coverage | 70 | 35% | 24.5 |
| Technical Feasibility | 70 | 30% | 21.0 |
| Physical Topology | 80 | 0% | 8.0 |
| Part Availability | 90 | 15% | 13.5 |
| Cost | 70 | 12% | 8.4 |
| Complexity | 50 | 8% | 4.0 |

**Confidence Score: 71.4%** (threshold: 80%)
**Status: BELOW THRESHOLD** — does not pass confidence threshold (71.4% < 80%)

**Assumption Verification:**
- ESP32-S3 deep sleep 10µA: Confirmed in Espressif datasheet (Tier 1) — but average with duty cycle likely 30-40µA
- Battery life: ~2500mAh / 35µA avg = ~8 months — does NOT meet 12-month requirement without solar
- FCC certification: Requires full system-level testing; no pre-certified module option

**Blocking Issues:** Battery life doesn't meet 12-month requirement without optional solar panel — fails requirements coverage.
**Recommendation:** Defer Concept E or treat as solar-required variant. The other 4 concepts (A, B, C, D) all pass threshold and cover the use case without this limitation.
