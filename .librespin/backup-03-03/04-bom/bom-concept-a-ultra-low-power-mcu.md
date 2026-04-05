# BOM: Concept A — Ultra-Low-Power MCU

**Project:** Example IoT Sensor Node
**Concept:** Ultra-Low-Power MCU (Concept A)
**Generated:** 2026-04-05
**Target Volume:** 50 units
**BOM Target:** $25/unit

## Bill of Materials

| Ref | Description | MPN | Manufacturer | Qty | Unit Price (50) | Extended | Notes |
|-----|-------------|-----|--------------|-----|-----------------|----------|-------|
| U1 | MCU Cortex-M0+, LoRaWAN stack | STM32L053C8T6 | STMicroelectronics | 1 | $2.90 | $2.90 | 64KB flash, 8KB RAM, LQFP-48 |
| U2 | LoRa transceiver SX1276 module | RFM95W-915S2 | HopeRF/Semtech | 1 | $4.50 | $4.50 | US915, pre-certified antenna trace |
| U3 | LDO 3.3V 200mA | MCP1700-3302E/TO | Microchip | 1 | $0.30 | $0.30 | 0.6µA quiescent |
| U4 | Temperature sensor ±0.5°C | DS18B20+ | Maxim/Analog Devices | 1 | $1.80 | $1.80 | 1-Wire, TO-92 |
| U5 | Soil moisture sensor (capacitive) | SEN0193 | DFRobot | 1 | $3.00 | $3.00 | 3.3V, analog out, anti-corrosion |
| C1-C10 | 100nF decoupling caps | GCM155R71C104KA55D | Murata | 10 | $0.02 | $0.20 | 0402 MLCC |
| C11-C12 | 10µF bulk caps | GRM155R61A106ME15D | Murata | 2 | $0.08 | $0.16 | 0402 MLCC |
| R1-R4 | 4.7kΩ pull-up resistors | RC0402FR-074K7L | Yageo | 4 | $0.01 | $0.04 | 0402 |
| SW1 | Tactile switch 6mm | TS02-66-43-BK-100-LCR-D | CUI Devices | 1 | $0.25 | $0.25 | Momentary SPST |
| LED1 | Red LED (power) | LTST-C171KRKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| LED2 | Green LED (status) | LTST-C171KGKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| J1 | JST-PH 2-pin battery connector | S2B-PH-K-S | JST | 1 | $0.35 | $0.35 | Right angle |
| J2 | 2-pin screw terminal (sensors) | 1729018 | Phoenix Contact | 1 | $0.60 | $0.60 | 3.5mm pitch |
| ANT1 | LoRa SMA antenna 915MHz | ANT-915-CW-HW | Linx Technologies | 1 | $2.50 | $2.50 | Omni, 2dBi, SMA male |
| PCB | 2-layer PCB 50x30mm | — | JLCPCB | 1 | $1.50 | $1.50 | JLCPCB $2 min order / 50 units |

**BOM Total (materials only):** $17.90/unit at 50 units
**Assembly estimate (JLCPCB SMT):** ~$3-5/unit
**Estimated total landed cost:** ~$21-23/unit

**Status: WITHIN $25 TARGET**

## Alternates / Risk Mitigation

| MPN | Risk | Alternate | Reason |
|-----|------|-----------|--------|
| STM32L053C8T6 | Lead time | STM32L052C8T6 | Pin-compatible, 64KB flash |
| RFM95W-915S2 | Single source (HopeRF) | LLCC68 module (Ebyte E22-900M22S) | SX1262-based, pin-compatible LoRaWAN |
| DS18B20+ | Counterfeits on low-price channels | STS40 (I2C, ±0.2°C) | More reliable from authorized distributor |

## Lifecycle Check

| Component | Lifecycle Status | Source |
|-----------|-----------------|--------|
| STM32L053C8T6 | Active production | ST.com product page |
| RFM95W-915S2 | Active production | HopeRF product page |
| DS18B20+ | Active production | Analog Devices/Maxim |
| SEN0193 | Active | DFRobot catalog |

**Lifecycle risk:** Low. All components are commodity/active production parts.
**5-year availability:** High confidence for all parts.

## FCC Notes

RFM95W is not a pre-certified end-product module. FCC Part 15 certification required for end product at 50-unit volume. Recommend engaging a test lab (~$5,000-8,000 for Part 15 Class B/Intentional Radiator).
