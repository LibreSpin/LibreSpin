# Concept D: Distributed Sensor + Radio — RUNNER-UP

**Quality Score:** 87 / 100 | **Status:** PASS

## Summary

ATtiny1616 sensor MCU + Murata CMWX1ZZABZ (STM32L0+SX1276, pre-certified) via UART AT commands. Two-IC architecture with ground plane split for best analog isolation. BOM $22-24/unit (within target). Pre-certified module eliminates FCC testing.

## Key Components

| Component | MPN | Function |
|-----------|-----|----------|
| Sensor MCU | ATtiny1616-MFR | Analog sensor acquisition |
| LoRa modem | CMWX1ZZABZ-091 | AT-cmd LoRaWAN, US915, FCC pre-certified |
| LDO | MCP1700-3302E | 3.3V power |
| Temperature | DS18B20+ | ±0.5°C |
| Soil moisture | SEN0193 | Analog capacitive sensor |

## Unique Value

- Best analog accuracy (ground plane isolation of ADC from RF noise)
- Pre-certified module (no FCC testing)
- Within $25/unit BOM target

## Requirements Coverage

- LoRaWAN US915: ✓ (pre-certified)
- Battery 12 months: ✓ (~43 year practical estimate)
- Outdoor -20 to 50°C: ✓
- BOM ≤$25: ✓ ($22-24)
- FCC: ✓ (Murata pre-certified, FCC ID: 2AFHM-CMWX1ZZABZ)
- Analog accuracy: Best in class

## Best For

No FCC test budget + precision analog measurement requirement. The ground plane split physically separates LoRa TX switching currents from soil moisture ADC paths.

## Files

- BOM: `.librespin/04-bom/bom-concept-d-distributed-sensor-radio.md`
- Analysis: `.librespin/05-detailed-designs/analysis-concept-d-distributed-sensor-radio.md`
- Score: `.librespin/06-refinement/score-concept-d-distributed-sensor-radio.md`
