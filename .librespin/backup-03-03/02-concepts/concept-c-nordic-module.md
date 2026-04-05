# Concept: Nordic Module-Based (Concept C)

**Summary:** Pre-certified Nordic nRF9160 cellular-capable module or nRF52840+LoRa module approach where a certified module handles wireless compliance. Prioritizes certification risk reduction and rapid prototyping. Higher per-unit cost but avoids FCC certification effort.

## Architectural Characteristics

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Nordic nRF52840 + separate LoRa module (LPWAN-friendly combo) | nRF52840 has BLE + 802.15.4; pair with RAK4631 for LoRaWAN |
| Topology | Modular (plug-in radio module on carrier board) | Module handles RF certification; carrier handles sensors/power |
| Communication | LoRaWAN via RAK4631 WisBlock module (pre-certified, US915) | FCC/CE certified module eliminates in-house certification |
| Power | 2xAA + LDO; nRF52840 deep sleep <2µA | Nordic power management excellent; similar to Concept A |

## Assumptions

- RAK4631 WisBlock Core = nRF52840 + SX1262 LoRa, FCC/CE/ISED certified
- Carrier board designed around WisBlock IO connector standard (40-pin)
- Simplifies PCB design: RF routing handled by module
- Module cost ~$15 vs discrete ~$5 but saves FCC pre-certification testing cost
- Average current ~12µA; 12-month battery target easily met

## Block Diagram

```
[2xAA Battery]
      |
      v
  [LDO 3.3V]
      |
      +----[RAK4631 Module]----((US915 Antenna, module antenna))
      |     [nRF52840+SX1262]
      |         |
      |    [WisBlock IO]----[Soil Moisture Sensor]
      |         |
      |    [I2C via WisBlock]----[Temperature Sensor]
      |         |
      |    [GPIO]----[Button]
      |    [GPIO]----[LED x2]

Legend:
  ----> : Signal flow / WisBlock IO connector
  |  v  : Power flow (downward)
```

## Qualitative Pros/Cons

**Pros:**
- Pre-certified module eliminates FCC testing (~$5,000-15,000 savings)
- Nordic ecosystem has excellent power management and SDK support
- WisBlock form factor allows sensor expansion without PCB redesign
- Faster time to market for 50-unit production run

**Cons:**
- Highest per-unit cost (~$15 module vs $3-8 discrete)
- WisBlock connector adds board thickness/height constraints
- Module availability dependent on RAKwireless supply chain
- Over-featured for simple sensor application (BLE not needed)

## Differentiation from Other Concepts

- vs. Concept A: Pre-certified module vs. discrete radio; higher cost, lower certification risk
- vs. Concept B: Nordic vs. STM ecosystem; modular form factor vs. integrated SoC
- vs. Concept D: Single-module vs. distributed MCU+radio; simpler firmware
- vs. Concept E: End-node only vs. gateway-capable architecture

## Innovation Points

- **Standard:** WisBlock is an established rapid-prototyping platform widely used in LoRaWAN deployments
- **Novel:** Using WisBlock for a production run (not just prototyping) minimizes certification risk for 50-unit volume

## Requirement-to-Component Mapping (Phase 2.5)

| Requirement Term | Requirement Meaning | Component Term | Component Meaning | Compatible? |
|------------------|---------------------|----------------|-------------------|-------------|
| LoRaWAN US915 | 902-928 MHz US band | RAK4631 SX1262 | US915 band pre-configured | Yes (model-specific) |
| FCC compliance | End product certification | RAK4631 | FCC/CE/ISED pre-certified | Yes (eliminates certification) |
| battery life 12 months | ~23µA average budget | nRF52840 system-off | ~2.5µA; RAK module slightly higher | Yes (12µA avg within budget) |
| preferred: Nordic | Nordic preferred vendor | nRF52840 in RAK4631 | Nordic Semiconductor | Yes (preferred vendor) |
| 50x30mm PCB | Size constraint | WisBlock base board | Base board is 60×30mm (standard) | Partial — oversized by 10mm |

**Configuration Note:** WisBlock Base Board RAK5005-O is 60×30mm — 10mm over the 50×30mm constraint. Alternatives: RAK19001 (smaller) or custom carrier board.
**Feasibility:** PASS with note — PCB size requires custom carrier board to meet 50×30mm constraint.

## Validation (Phase 3)

**Dimension Scores:**
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|---------|
| Requirements Coverage | 80 | 35% | 28.0 |
| Technical Feasibility | 90 | 30% | 27.0 |
| Physical Topology | 70 | 0% | 7.0 |
| Part Availability | 70 | 15% | 10.5 |
| Cost | 70 | 12% | 8.4 |
| Complexity | 80 | 8% | 6.4 |

**Confidence Score: 80.3%** (threshold: 80%)
**Status: VALIDATED** — marginally passes confidence threshold

**Assumption Verification:**
- RAK4631 FCC certification: Confirmed on RAKwireless product page (Tier 1 — certificate downloadable)
- PCB size: WisBlock base board 60×30mm confirmed (exceeds 50×30mm constraint — noted)
- RAK4631 availability: Available via RAKwireless direct; also Digi, Seeed Studio

**Blocking Issues:** PCB size constraint borderline — recommend custom carrier board for production
