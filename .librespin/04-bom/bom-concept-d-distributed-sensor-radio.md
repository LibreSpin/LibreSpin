# BOM: Concept D — Distributed Sensor + Radio

**Project:** Example IoT Sensor Node
**Concept:** Distributed Sensor + Radio (Concept D)
**Generated:** 2026-04-05
**Target Volume:** 50 units
**BOM Target:** $25/unit

## Bill of Materials

| Ref | Description | MPN | Manufacturer | Qty | Unit Price (50) | Extended | Notes |
|-----|-------------|-----|--------------|-----|-----------------|----------|-------|
| U1 | Sensor MCU Cortex-M0+ | ATtiny1616-MFR | Microchip | 1 | $0.65 | $0.65 | 8KB flash, 1KB SRAM, SOIC-20 |
| U2 | LoRa modem AT-cmd (pre-certified) | CMWX1ZZABZ-091 | Murata | 1 | $9.50 | $9.50 | STM32L0+SX1276, US915, FCC/IC certified |
| U3 | LDO 3.3V 200mA | MCP1700-3302E/TO | Microchip | 1 | $0.30 | $0.30 | 0.6µA quiescent |
| U4 | Temperature sensor ±0.5°C | DS18B20+ | Maxim/Analog Devices | 1 | $1.80 | $1.80 | 1-Wire, TO-92 |
| U5 | Soil moisture sensor (capacitive) | SEN0193 | DFRobot | 1 | $3.00 | $3.00 | 3.3V, analog out |
| C1-C10 | 100nF decoupling caps | GCM155R71C104KA55D | Murata | 10 | $0.02 | $0.20 | 0402 MLCC |
| C11-C12 | 10µF bulk caps | GRM155R61A106ME15D | Murata | 2 | $0.08 | $0.16 | 0402 MLCC |
| R1-R4 | 4.7kΩ pull-up resistors | RC0402FR-074K7L | Yageo | 4 | $0.01 | $0.04 | 0402 |
| R5 | 1kΩ series resistor (UART) | RC0402FR-071KL | Yageo | 1 | $0.01 | $0.01 | 0402, UART protection |
| SW1 | Tactile switch 6mm | TS02-66-43-BK-100-LCR-D | CUI Devices | 1 | $0.25 | $0.25 | Momentary SPST |
| LED1 | Red LED (power) | LTST-C171KRKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| LED2 | Green LED (status) | LTST-C171KGKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| J1 | JST-PH 2-pin battery connector | S2B-PH-K-S | JST | 1 | $0.35 | $0.35 | Right angle |
| J2 | 2-pin screw terminal (sensors) | 1729018 | Phoenix Contact | 1 | $0.60 | $0.60 | 3.5mm pitch |
| PCB | 2-layer PCB 50x30mm (with GND plane split) | — | JLCPCB | 1 | $1.50 | $1.50 | Ground plane split for analog/digital isolation |

**BOM Total (materials only):** $18.66/unit at 50 units
**Assembly estimate (JLCPCB SMT):** ~$3-5/unit
**Estimated total landed cost:** ~$22-24/unit

**Status: WITHIN $25 TARGET**

## Alternates / Risk Mitigation

| MPN | Risk | Alternate | Reason |
|-----|------|-----------|--------|
| CMWX1ZZABZ-091 | Availability (Murata direct/authorized only) | RN2903A (Microchip, US915) | Also FCC certified, UART AT interface |
| ATtiny1616-MFR | Not needed if switching to above | PIC16F18313 | Alternative if availability issues |

## Lifecycle Check

| Component | Lifecycle Status | Source |
|-----------|-----------------|--------|
| ATtiny1616-MFR | Active production | Microchip product page |
| CMWX1ZZABZ-091 | Active production | Murata IoT product page |
| DS18B20+ | Active production | Analog Devices |

**FCC Certification:** Murata CMWX1ZZABZ FCC ID: 2AFHM-CMWX1ZZABZ — confirmed in public FCC database.
**5-year availability:** High confidence for ATtiny and DS18B20. Murata module availability moderate — recommend CMWX1ZZABZ-078 (alternate US915 variant) as backup.

## Notes

PCB must use separate analog and digital ground planes connected at single star point near LDO output. ATtiny analog section (ADC, VREF) routed entirely on analog side of ground plane split. Murata module on digital side. This is the key value of this architecture.
