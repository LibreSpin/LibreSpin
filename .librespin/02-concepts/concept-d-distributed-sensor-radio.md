# Concept: Distributed Sensor + Radio Architecture (Concept D)

**Summary:** Two-MCU architecture splitting sensor acquisition (low-power Cortex-M0+) from LoRa radio management (dedicated LoRa modem MCU). The sensor MCU wakes periodically, takes measurements, transfers data to radio MCU via UART/I2C, then returns to deep sleep. Provides hardware isolation between sensor-side noise and RF front-end.

## Architectural Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Distributed: sensor MCU (ATtiny/STM32L0) + LoRa module with own MCU (Murata CMWX1ZZABZ) | Separate concerns: sensor ADC noise isolated from RF switching noise |
| Topology | Distributed (two-processor) | Analog sensor accuracy improved by physically separating from noisy RF |
| Communication | LoRaWAN via Murata CMWX1ZZABZ (STM32L0 + SX1276 certified module) | FCC-certified module; UART AT command interface simplifies firmware |
| Power | 2xAA, both MCUs in deep sleep between measurements | Each MCU independently sleep-managed; combined quiescent ~5µA |

## Assumptions

- ATtiny1616 handles analog soil moisture and digital temperature sensing (lower noise floor)
- Murata CMWX1ZZABZ provides AT command LoRaWAN stack; sensor MCU sends "AT+SEND" commands
- UART bus between sensor MCU and LoRa module (9600 baud, brief bursts)
- Total deep sleep ~5µA; active during measurement/TX ~20mA for <5 seconds/hour
- Two PCB areas separated by ground plane for analog/digital isolation

## Block Diagram

```
[2xAA Battery]
      |
      v
  [LDO 3.3V]
      |
      +--[ATtiny1616]--[UART]--[Murata CMWX1ZZABZ]--((US915 Antenna))
      |      |                     [STM32L0+SX1276]
      |   [ADC]----[Soil Moisture Sensor]
      |      |
      |   [1-Wire]----[DS18B20 Temperature]
      |      |
      |   [GPIO]----[Button]
      |   [GPIO]----[LED x2]

     ANALOG DOMAIN          |          DIGITAL/RF DOMAIN
     (separated by GND plane boundary)

Legend:
  ----> : Signal flow
  |  v  : Power flow (downward)
```

## Qualitative Pros/Cons

**Pros:**
- Better analog measurement accuracy (RF noise isolation)
- AT command interface simplifies firmware (no LoRaWAN stack on sensor MCU)
- Murata module is FCC-certified
- Independent upgrade path for sensor MCU vs radio module

**Cons:**
- Two MCUs = more components, higher BOM cost, more PCB space
- UART communication adds power and complexity overhead
- More firmware to maintain across two MCUs
- PCB layout more complex (analog/digital domain separation)

## Differentiation from Other Concepts

- vs. Concept A: Two-MCU vs. single-MCU; better analog isolation, higher cost
- vs. Concept B: Murata certified module vs. STM32WL; AT command interface vs. direct radio control
- vs. Concept C: Custom carrier vs. WisBlock platform; more design work, better analog isolation
- vs. Concept E: End-node sensor vs. gateway-capable architecture

## Innovation Points

- **Standard:** AT command LoRa modems (Murata, SARA) are widely deployed in industrial IoT
- **Novel:** Using ATtiny for sensor MCU specifically to avoid RF digital noise contaminating analog ADC readings

## Requirement-to-Component Mapping (Phase 2.5)

| Requirement Term | Requirement Meaning | Component Term | Component Meaning | Compatible? |
|------------------|---------------------|----------------|-------------------|-------------|
| LoRaWAN US915 | 902-928 MHz | Murata CMWX1ZZABZ | 868/915 MHz variants; specify US915 part number | Yes (order CMWX1ZZABZ-078 for US915) |
| FCC compliance | End product certification | Murata CMWX1ZZABZ | FCC/IC certified module | Yes (module-level certification) |
| temperature ±0.5°C | Accuracy spec | DS18B20 1-Wire | ±0.5°C | Yes |
| soil moisture analog | ADC input | ATtiny1616 ADC | 10-bit ADC, 12 channels | Yes |
| outdoor -20 to 50°C | Operating temperature range | ATtiny1616 rated | -40°C to 85°C | Yes |

**Configuration Required:** ATtiny UART to Murata UART — standard AT command interface. Baud rate 9600, 8N1.
**Feasibility:** PASS — clean separation of concerns; AT commands simplify firmware.

## Validation (Phase 3)

**Dimension Scores:**
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|---------|
| Requirements Coverage | 90 | 35% | 31.5 |
| Technical Feasibility | 80 | 30% | 24.0 |
| Physical Topology | 70 | 0% | 7.0 |
| Part Availability | 70 | 15% | 10.5 |
| Cost | 80 | 12% | 9.6 |
| Complexity | 70 | 8% | 5.6 |

**Confidence Score: 81.2%** (threshold: 80%)
**Status: VALIDATED** — passes confidence threshold

**Assumption Verification:**
- Murata CMWX1ZZABZ FCC: Confirmed — FCC ID 2AFHM-CMWX1ZZABZ (public FCC database)
- ATtiny1616 ADC: Confirmed in Microchip datasheet DS40002311A (Tier 1)
- UART AT command interface: Confirmed in Murata application note (Tier 1)

**Blocking Issues:** None — note Murata module has limited stock at some distributors; verify availability before committing
