# Concept D: Distributed Sensor + Radio

## Summary

Two-board stackup design separating the sensor/MCU board from the LoRa radio board, connected via a compact board-to-board connector. This allows independent development, testing, and replacement of each subsystem. The sensor board handles measurement and sleep logic; the radio board handles all RF concerns on a separate ground plane.

## Architecture Dimensions
- **Processing:** Ultra-low-power Cortex-M0+ MCU on sensor board (minimal, dedicated to sensing + sleep)
- **Topology:** Two stacked PCBs connected via board-to-board header (sensor board + radio board)
- **Communication:** Pre-certified LoRa module on dedicated radio board with isolated RF ground
- **Power:** 18650 LiPo with load switch to completely power-gate the radio board between transmissions

## Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Cortex-M0+ on sensor board | Dedicated to sensor acquisition and sleep management |
| Topology | 2-board stackup | Isolates RF from sensor analog, enables independent test/replace |
| Communication | Pre-certified LoRa module on radio board | Dedicated ground plane for RF; clean separation from sensor signals |
| Power | Load switch power gating of radio board | Radio board draws zero current when off -- true hardware isolation |
| Sensing | Digital I2C temp/humidity combo sensor on sensor board | Co-located with MCU for shortest I2C traces |

## Block Diagram

```
+---------------------------+
|     RADIO BOARD (top)     |
|                           |
|  +--------------------+   |
|  | Pre-Certified LoRa |   |
|  | Module (US915)     |   |
|  | + Antenna          |   |
|  +--------+-----------+   |
|           |               |
|      SPI + PWR            |
|           |               |
+-----[B2B Connector]------+
|           |               |
|      SPI + PWR            |
|           |               |
|  +--------+-----------+   |
|  | Cortex-M0+ MCU     |   |
|  | - RTC wake         |   |
|  | - LoRaWAN stack    |   |
|  | - Sensor driver    |   |
|  +--------+-----------+   |
|           |               |
|      I2C  |               |
|           v               |
|  +--------+-----------+   |
|  | Temp/Humid Sensor  |   |
|  | (combo I2C)        |   |
|  +--------------------+   |
|                           |
|  +---------+  +--------+  |
|  | 18650   |->| Load   |--+--> Radio board power
|  | LiPo    |  | Switch |  |
|  |         |->| LDO    |--+--> Sensor board power
|  +---------+  +--------+  |
|                           |
|    SENSOR BOARD (bottom)  |
+---------------------------+
```

## Assumptions

1. A board-to-board connector with SPI + power + ground fits within the <30mm form factor when boards are stacked vertically
2. The load switch can completely disconnect the radio board, achieving true zero-leakage isolation (sub-nA off current)
3. Stacked board total height is acceptable for the IP65 enclosure -- assume enclosure height allows ~8-10mm board stack
4. SPI communication across the board-to-board connector is reliable at LoRa SPI clock speeds (typically 1-10MHz)
5. Manufacturing cost for two small PCBs plus connector is comparable to or only marginally more than a single larger PCB

## Pros

- Complete RF isolation from sensor board eliminates EMI coupling concerns
- Load switch provides true zero-current radio shutdown -- best possible sleep power
- Independent board testing -- sensor board can be validated without radio and vice versa
- Radio board is replaceable -- can swap LoRa module variants or upgrade without redesigning sensor board
- Clean ground plane separation between analog sensor signals and RF switching noise

## Cons

- Board-to-board connector adds cost, height, and a mechanical failure point
- Two PCBs to manufacture, assemble, and test -- higher production complexity
- Connector reliability in outdoor vibration/thermal cycling environment is a risk
- Total footprint may be challenged by <30mm constraint once connector area is included
- Power gating adds wake-up latency for the LoRa module (re-initialization on each TX cycle)
- Higher BOM cost: extra connector, load switch, second PCB

## Differentiation

- vs. Concept A: Trades simplicity for RF isolation and modularity via two-board stackup
- vs. Concept B: Opposite philosophy -- Concept B maximizes integration (SoM), Concept D maximizes separation
- vs. Concept C: Both have RF design considerations, but Concept D physically isolates the RF path
- vs. Concept E: Concept D separates by function (sensor vs. radio), Concept E keeps one board but adds processing

## Innovation

- **Standard:** Board-to-board stacking, pre-certified LoRa module, load switch power gating
- **Novel:** True hardware power isolation of the radio subsystem -- radio board is electrically dead between transmissions, achieving theoretical zero radio sleep current; independent board replacement in the field

## Requirements-to-Component Mapping

**Terminology Collision Scan:** No collisions detected.

No USB references, no SPI mode ambiguity in requirements. SPI is used only in the board-to-board context as a physical interface to the LoRa module — not as a multi-modal protocol that could conflict with requirements terminology. LoRaWAN US915 references are unambiguous. The term "load switch" and "power gating" are topology-level terms with no collision against requirements vocabulary.

| Requirement Term | Component Term | Mapping Status |
|-----------------|---------------|----------------|
| LoRaWAN US915 | Pre-certified LoRa module (US915) on radio board | Direct match |
| I2C temp/humidity | Digital I2C combo sensor on sensor board | Direct match |
| <30mm PCB | Two stacked boards, each <30mm XY footprint | Critical constraint — both boards must share same 30mm XY outline |
| 2+ year battery | Load switch + M0+ sleep — best sleep budget of all concepts | Strong match |
| Battery 18650 LiPo | 18650 input to load switch + LDO | Direct match |

**Pre-Validation Status:** PASSED (no terminology collisions detected)

## Validation

### Breaking Assumptions

1. Can two PCBs each fitting within a 30mm x 30mm footprint (or equivalent area), plus a board-to-board connector, fit inside a single IP65 enclosure intended for a <30mm device — what is the available Z-height?
2. Does a board-to-board connector rated for outdoor thermal cycling (-10 to +40C) and vibration exist in a height profile compatible with the IP65 enclosure stack?
3. Is the manufacturing and assembly cost for two small PCBs plus connector competitive enough to stay within the $25 BOM target versus a single-board design?
4. Does the two-PCB approach introduce mechanical reliability risks (connector fatigue, solder joint stress from thermal cycling) that undermine the outdoor multi-year deployment goal?
5. Does the load switch achieve sufficiently low off-state leakage (sub-100nA) that the radio board's zero-current claim holds over temperature?

### Dimension Scores

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Requirements Coverage | 90 | 20% | 18.0 |
| Technical Feasibility | 70 | 25% | 17.5 |
| Physical Topology | 30 | 20% | 6.0 |
| Part Availability | 90 | 15% | 13.5 |
| Cost | 70 | 12% | 8.4 |
| Complexity | 50 | 8% | 4.0 |

**Confidence Score: 67.4%**
**Status:** auto_failed
