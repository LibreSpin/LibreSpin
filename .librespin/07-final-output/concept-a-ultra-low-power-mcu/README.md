# Concept A: Ultra-Low-Power MCU — RECOMMENDED

**Quality Score:** 92 / 100 | **Status:** PASS

## Summary

STM32L053C8T6 (Cortex-M0+) + RFM95W-915S2 (SX1276 LoRa). Single-board centralized architecture. Lowest cost ($21-23/unit), lowest complexity, proven LoRaWAN deployment combination. Battery life >70 years practical limit.

## Key Components

| Component | MPN | Function |
|-----------|-----|----------|
| MCU | STM32L053C8T6 | Main processor, ADC for sensors |
| LoRa radio | RFM95W-915S2 | LoRaWAN US915 transceiver |
| LDO | MCP1700-3302E | 3.3V power regulation |
| Temperature | DS18B20+ | ±0.5°C (0-70°C) |
| Soil moisture | SEN0193 | Analog capacitive sensor |

## Block Diagram

```
[2xAA] → [MCP1700 3.3V] → [STM32L053] → [SPI] → [RFM95W] → ((915MHz))
                                ↑
                          [DS18B20] [SEN0193]
```

## Requirements Coverage

- LoRaWAN US915: ✓
- Battery 12 months: ✓ (>70× margin)
- Outdoor -20 to 50°C: ✓
- Soil moisture + temp: ✓
- PCB 50×30mm: ✓
- BOM ≤$25: ✓ ($21-23)
- FCC: Requires product certification (~$6K test lab)

## Files

- BOM: `.librespin/04-bom/bom-concept-a-ultra-low-power-mcu.md`
- Analysis: `.librespin/05-detailed-designs/analysis-concept-a-ultra-low-power-mcu.md`
- Score: `.librespin/06-refinement/score-concept-a-ultra-low-power-mcu.md`
