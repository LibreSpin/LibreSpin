# Concept C: Nordic Module-Based

**Quality Score:** 83 / 100 | **Status:** PASS

## Summary

RAK4631 WisBlock module (nRF52840 + SX1262). Pre-certified FCC/CE/ISED. Custom 50×30mm carrier board. Highest module cost ($15) but eliminates ~$6,000 FCC test expense at 50-unit volume. Fastest path to first prototype via WisBlock ecosystem.

## Key Components

| Component | MPN | Function |
|-----------|-----|----------|
| Module | RAK4631 | nRF52840 + SX1262, pre-certified |
| LDO | MCP1700-3302E | 3.3V power |
| Temperature | DS18B20+ | ±0.5°C |
| Soil moisture | SEN0193 | Analog capacitive sensor |

## Unique Value

- Pre-certified module eliminates FCC certification cost (~$6K savings at 50 units)
- Fastest time to prototype (WisBlock ecosystem)

## Requirements Coverage

- LoRaWAN US915: ✓ (pre-certified)
- Battery 12 months: ✓
- FCC: ✓✓ (module pre-certified — no product testing needed)
- BOM ≤$25: Slightly over ($26-28) — offset by FCC savings

## Files

- BOM: `.librespin/04-bom/bom-concept-c-nordic-module.md`
- Analysis: `.librespin/05-detailed-designs/analysis-concept-c-nordic-module.md`
- Score: `.librespin/06-refinement/score-concept-c-nordic-module.md`
