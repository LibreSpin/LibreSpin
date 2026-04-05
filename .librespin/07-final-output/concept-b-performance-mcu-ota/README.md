# Concept B: Performance MCU with OTA

**Quality Score:** 87 / 100 | **Status:** PASS

## Summary

STM32WL55JCIx — integrated Cortex-M4 + LoRa radio in single package. Only concept with FUOTA (over-the-air firmware updates via LoRaWAN). Medium complexity. BOM $20-22/unit after refinement (TMP117→MCP9808, TPS63031→MCP1700 LDO).

## Key Components

| Component | MPN | Function |
|-----------|-----|----------|
| MCU+LoRa SoC | STM32WL55JCIx | Integrated dual-core + sub-GHz radio |
| LDO | MCP1700-3302E | 3.3V power (after refinement from TPS63031) |
| Temperature | MCP9808 | ±0.25°C, I2C (after refinement from TMP117) |
| Soil moisture | SEN0193 | Analog capacitive sensor |

## Unique Value

- Only concept supporting FUOTA (field firmware updates via LoRaWAN)
- STMicroelectronics preferred vendor alignment

## Requirements Coverage

- LoRaWAN US915: ✓ (integrated)
- Battery 12 months: ✓
- Outdoor -20 to 50°C: ✓
- BOM ≤$25: ✓ (after refinement)
- FCC: ST reference design available (reduces test risk)

## Files

- BOM: `.librespin/04-bom/bom-concept-b-performance-mcu-ota.md`
- Analysis: `.librespin/05-detailed-designs/analysis-concept-b-performance-mcu-ota.md`
- Score: `.librespin/06-refinement/score-concept-b-performance-mcu-ota.md`
