# Concept C: Nordic-Centric BLE+LoRa

## Summary

Uses a BLE-capable SoC as the main processor, adding a separate LoRa transceiver for long-range communication. BLE provides a local configuration and provisioning channel (phone app for setup, diagnostics, and firmware update), while LoRa handles the primary data uplink. This dual-radio approach trades power for operational flexibility.

## Architecture Dimensions
- **Processing:** BLE SoC (Cortex-M4F class with floating point, integrated BLE radio)
- **Topology:** Single board with SoC + external LoRa transceiver
- **Communication:** Dual-radio -- BLE for local config/DFU, LoRa for data uplink
- **Power:** 18650 LiPo with DC-DC buck converter (SoC-integrated or external)

## Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | BLE SoC (Cortex-M4F) | Integrated BLE radio eliminates second MCU; FPU aids sensor math |
| Topology | SoC + discrete LoRa transceiver | BLE SoC handles processing; LoRa transceiver is a simple SPI peripheral |
| Communication | BLE + LoRaWAN dual radio | BLE for provisioning/DFU, LoRa for data -- each radio optimized for its role |
| Power | Integrated DC-DC buck in SoC | Many BLE SoCs include efficient DC-DC, reducing external component count |
| Sensing | Digital I2C temp/humidity combo sensor | Consistent with other concepts |

## Block Diagram

```
+-------------------------------------------------------+
|                   SINGLE PCB (<30mm)                   |
|                                                        |
|  +-------------+    I2C    +----------------------+    |
|  | Temp/Humid  |<--------->|   BLE SoC            |   |
|  | Sensor      |           |   (Cortex-M4F)       |   |
|  | (combo I2C) |           |                      |   |
|  +-------------+           |  - Integrated BLE    |   |
|                            |  - Integrated DC-DC  |   |
|                            |  - DFU over BLE      |   |
|                            |  - LoRaWAN stack     |   |
|                            +---+-------------+----+   |
|                                |             |        |
|                           SPI  |             | BLE    |
|                                v             v        |
|                  +-------------+--+  +--------+---+   |
|                  | LoRa Transceiver|  | BLE Antenna|   |
|                  | (SPI slave)     |  | (chip/PCB) |   |
|                  | + Antenna match |  +------------+   |
|                  +------+--------+                    |
|                         |                              |
|                    +----+----+                         |
|                    | LoRa    |                         |
|                    | Antenna |                         |
|                    +---------+                         |
|                                                        |
|  +-------------+                                      |
|  |  18650 LiPo |---> [SoC integrated DC-DC or        |
|  |  Battery    |      external nano-power LDO]        |
|  +-------------+                                      |
|                                                        |
+-------------------------------------------------------+
```

## Assumptions

1. A BLE SoC with sub-2uA system-off current (including RTC wake) exists with enough flash for both BLE stack and LoRaWAN stack simultaneously (~256KB+ flash)
2. BLE radio can remain fully off during normal operation and only activate on-demand (button press, NFC wake, or scheduled window) to avoid continuous BLE advertising power drain
3. The combined footprint of BLE SoC + LoRa transceiver + two antennas fits within <30mm PCB -- this is the tightest constraint for this concept
4. BLE DFU (Device Firmware Update) is practical for field firmware updates when a technician is physically near the device
5. Dual-radio coexistence (BLE 2.4GHz + LoRa sub-GHz) does not require complex filtering on a board this small

## Pros

- BLE provides local commissioning channel -- configure LoRa keys, check sensor readings, run diagnostics from a phone
- BLE DFU enables firmware updates without LoRaWAN FUOTA complexity
- BLE SoCs typically have excellent low-power modes with integrated DC-DC
- Cortex-M4F with FPU enables sensor compensation math and potential future edge processing
- Two independent radios allow flexibility in communication strategy

## Cons

- Two antennas on a <30mm board is extremely challenging -- likely requires careful layout or stacked/shared antenna
- Higher component count than Concept A or B (SoC + transceiver + 2 antennas)
- BLE stack adds firmware complexity even if BLE is rarely used
- Higher peak current draw when both radios are active (unlikely but possible during DFU + LoRa overlap)
- BLE SoC sleep current may be higher than a dedicated ultra-low-power MCU
- BOM cost for dual-radio likely higher than single-radio concepts

## Differentiation

- vs. Concept A: Adds BLE for local access at the cost of higher power and board complexity
- vs. Concept B: Uses discrete SoC + transceiver instead of integrated SoM -- more design effort but more flexibility
- vs. Concept D: Both have multiple radios, but Concept C puts everything on one board
- vs. Concept E: Similar processing capability but uses it for BLE stack rather than edge analytics

## Innovation

- **Standard:** BLE SoC, SPI-connected LoRa transceiver, I2C sensor
- **Novel:** Dual-radio architecture on a <30mm board with BLE used only for provisioning/DFU (not continuous advertising); potential NFC-wake to activate BLE on demand with zero standby current for the BLE path

## Requirements-to-Component Mapping

**Terminology Collision Scan:** No collisions detected.

No USB references exist in this concept. The term "DFU" (Device Firmware Update) refers to BLE-layer firmware update, not to USB DFU protocol — this is unambiguous in context. LoRaWAN US915 references resolve cleanly. The discrete LoRa transceiver uses SPI, but no SPI mode configuration ambiguity exists because the transceiver acts as a simple SPI peripheral with no multi-modal operating modes relevant to requirements.

| Requirement Term | Component Term | Mapping Status |
|-----------------|---------------|----------------|
| LoRaWAN US915 | LoRa transceiver (SX1276/SX1262) + LoRaWAN stack | Direct match |
| I2C temp/humidity | Digital I2C combo sensor | Direct match |
| <30mm PCB | SoC + transceiver + dual antenna constraint | Tight — flagged as physical risk |
| 2+ year battery | BLE SoC sleep + transceiver off current | Conditional — dual-radio sleep budget must be verified |
| Battery 18650 LiPo | 18650 LiPo input to SoC DC-DC | Direct match |

**Pre-Validation Status:** PASSED (no terminology collisions detected)

## Validation

### Breaking Assumptions

1. Can a BLE SoC (e.g., nRF52840) + discrete LoRa transceiver (e.g., SX1262) + two antennas physically fit on a <30mm board — this is the single highest-risk layout constraint?
2. Does the combined sleep current of BLE SoC (system-off) + LoRa transceiver (sleep) stay under 5uA for 2+ year battery life?
3. Can BLE remain truly off (zero advertising current) between provisioning events — what mechanism wakes BLE without a hardware button (requirements specify 0 buttons)?
4. Does fitting both a LoRa antenna (sub-GHz, typically >30mm monopole) and a BLE antenna (2.4GHz, shorter) on a <30mm board result in acceptable antenna efficiency for both radios?
5. Does the BOM cost (BLE SoC + LoRa transceiver + dual antenna hardware + matching networks) remain under $25?

### Dimension Scores

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Requirements Coverage | 70 | 20% | 14.0 |
| Technical Feasibility | 70 | 25% | 17.5 |
| Physical Topology | 50 | 20% | 10.0 |
| Part Availability | 70 | 15% | 10.5 |
| Cost | 50 | 12% | 6.0 |
| Complexity | 50 | 8% | 4.0 |

**Confidence Score: 62.0%**
**Status:** auto_failed
