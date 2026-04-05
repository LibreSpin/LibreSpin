# Architecture Concepts Overview

**Generated:** 2026-04-05
**Count:** 5 concepts
**Project:** Example IoT Sensor Node (LoRaWAN agricultural sensor)
**Diversity:** All concepts meet ≥1 dimension threshold

## Comparison Matrix

| Concept | Processing | Topology | Communication | Power | Complexity | Est. Cost |
|---------|------------|----------|---------------|-------|------------|-----------|
| A: Ultra-Low-Power MCU | Cortex-M0+ (STM32L0) | Centralized | SPI LoRa (RFM95W) | 2xAA + LDO | Low | $ |
| B: Performance MCU OTA | Cortex-M4 (STM32WL55) | Centralized integrated | Integrated sub-GHz | 2xAA + Buck-Boost | Medium | $$ |
| C: Nordic Module | nRF52840 + RAK4631 | Modular (WisBlock) | Pre-certified LoRa module | 2xAA + LDO | Low | $$$ |
| D: Distributed Sensor+Radio | ATtiny (sensor) + Murata (radio) | Distributed | UART AT-command LoRa | 2xAA + LDO | Medium | $$ |
| E: Edge Processing | ESP32-S3 (dual-core) | Centralized + storage | SPI LoRa + WiFi | 2xAA + Boost + Solar opt | High | $$$ |

## Key Trade-offs

- **Cost vs Capability:** Concept A (lowest BOM ~$15) vs Concept E (highest capability, ~$35)
- **Power vs Performance:** Concept A (<10µA avg) vs Concept E (30-40µA avg, borderline battery)
- **Simplicity vs Flexibility:** Concept A (minimal firmware) vs Concept E (edge analytics, local storage)
- **Certification Risk:** Concepts C & D (pre-certified modules) vs Concepts A, B, E (require FCC testing)

## Visual Comparison

### Concept A: Ultra-Low-Power MCU
```
[2xAA] → [LDO] → [STM32L0] → [RFM95W] → ((Antenna))
                      ↑
              [Sensors (ADC/I2C)]
```

### Concept B: Performance MCU with OTA
```
[2xAA] → [Buck-Boost] → [STM32WL55 MCU+Radio] → ((Antenna))
                               ↑
                       [Sensors (ADC/I2C)]
```

### Concept C: Nordic Module-Based
```
[2xAA] → [LDO] → [RAK4631 WisBlock] → ((Antenna))
                        ↑ WisBlock IO
                  [Carrier Board + Sensors]
```

### Concept D: Distributed Sensor + Radio
```
[2xAA] → [LDO] → [ATtiny1616] → UART → [Murata CMWX1ZZABZ] → ((Antenna))
                       ↑
               [Sensors (ADC/1-Wire)]
```

### Concept E: Edge Processing
```
[2xAA+Solar] → [Boost] → [ESP32-S3] → [SX1262] → ((Antenna))
                              ↑          ↑
                        [Sensors]  [4MB Flash]
                        [WiFi (config)]
```

## Diversity Verification

| Concept Pair | Processing Diff? | Topology Diff? | Comm Diff? | Power Diff? | Diverse? |
|--------------|------------------|----------------|------------|-------------|----------|
| A vs B | Yes (M0+ vs M4) | No | Yes (SPI vs integrated) | Yes (LDO vs BB) | ✓ (3 dims) |
| A vs C | Yes (STM vs Nordic) | Yes (centralized vs modular) | Yes (discrete vs certified module) | No | ✓ (3 dims) |
| A vs D | Yes (STM32L0 vs ATtiny) | Yes (centralized vs distributed) | Yes (SPI vs UART AT) | No | ✓ (3 dims) |
| A vs E | Yes (M0+ vs Xtensa LX7) | Yes (no storage vs edge compute) | Yes (LoRa only vs LoRa+WiFi) | Yes (LDO vs Boost) | ✓ (4 dims) |
| B vs C | Yes (STM vs Nordic) | Yes (integrated vs WisBlock) | Yes (integrated vs module) | No | ✓ (3 dims) |
| B vs D | Yes (M4 vs ATtiny+Murata) | Yes (single vs distributed) | Yes (integrated vs AT-cmd) | Yes (BB vs LDO) | ✓ (4 dims) |
| B vs E | Yes (STM vs ESP) | No | Yes (single radio vs LoRa+WiFi) | Yes (BB vs Boost) | ✓ (3 dims) |
| C vs D | Yes (nRF vs ATtiny) | Yes (WisBlock vs custom) | No (both certified LoRa module) | No | ✓ (2 dims) |
| C vs E | Yes (nRF vs ESP32) | Yes (WisBlock vs custom+storage) | Yes (module vs SPI+WiFi) | Yes (LDO vs Boost) | ✓ (4 dims) |
| D vs E | Yes (ATtiny vs ESP32) | Yes (distributed vs centralized) | Yes (AT-cmd vs SPI+WiFi) | No | ✓ (3 dims) |

**Result:** All 10 concept pairs meet diversity threshold (≥1 dimension different). All 5 concepts are architecturally distinct.
