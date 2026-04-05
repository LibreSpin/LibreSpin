# BOM: Concept B — Performance MCU with OTA

**Project:** Example IoT Sensor Node
**Concept:** Performance MCU OTA (Concept B)
**Generated:** 2026-04-05
**Target Volume:** 50 units
**BOM Target:** $25/unit

## Bill of Materials

| Ref | Description | MPN | Manufacturer | Qty | Unit Price (50) | Extended | Notes |
|-----|-------------|-----|--------------|-----|-----------------|----------|-------|
| U1 | MCU+LoRa SoC dual-core | STM32WL55JCIx | STMicroelectronics | 1 | $7.50 | $7.50 | M4+M0+, 256KB flash, integrated sub-GHz |
| U2 | Buck-boost DC-DC 3.3V | TPS63031DSKR | Texas Instruments | 1 | $2.20 | $2.20 | 96% efficiency, 2.7V → 3.3V |
| U3 | Temperature sensor ±0.1°C | TMP117NAIDRVR | Texas Instruments | 1 | $2.80 | $2.80 | I2C, SON-8, industrial grade |
| U4 | Soil moisture sensor (capacitive) | SEN0193 | DFRobot | 1 | $3.00 | $3.00 | 3.3V, analog out |
| C1-C10 | 100nF decoupling caps | GCM155R71C104KA55D | Murata | 10 | $0.02 | $0.20 | 0402 MLCC |
| C11-C14 | 10µF bulk caps | GRM155R61A106ME15D | Murata | 4 | $0.08 | $0.32 | 0402 MLCC |
| R1-R4 | 4.7kΩ pull-up resistors | RC0402FR-074K7L | Yageo | 4 | $0.01 | $0.04 | 0402 |
| L1 | 2.2µH inductor (DC-DC) | LQH32CN2R2M53L | Murata | 1 | $0.25 | $0.25 | 1210, 2.2µH, 0.8A |
| SW1 | Tactile switch 6mm | TS02-66-43-BK-100-LCR-D | CUI Devices | 1 | $0.25 | $0.25 | Momentary SPST |
| LED1 | Red LED (power) | LTST-C171KRKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| LED2 | Green LED (status) | LTST-C171KGKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| J1 | JST-PH 2-pin battery connector | S2B-PH-K-S | JST | 1 | $0.35 | $0.35 | Right angle |
| J2 | 2-pin screw terminal (sensors) | 1729018 | Phoenix Contact | 1 | $0.60 | $0.60 | 3.5mm pitch |
| ANT1 | LoRa antenna 915MHz SMA | ANT-915-CW-HW | Linx Technologies | 1 | $2.50 | $2.50 | Omni, 2dBi |
| PCB | 2-layer PCB 50x30mm | — | JLCPCB | 1 | $1.50 | $1.50 | |

**BOM Total (materials only):** $22.81/unit at 50 units
**Assembly estimate (JLCPCB SMT):** ~$3-5/unit
**Estimated total landed cost:** ~$26-28/unit

**Status: SLIGHTLY OVER $25 TARGET** — reduce BOM by selecting lower-cost temperature sensor if ±0.1°C not required

## Alternates / Risk Mitigation

| MPN | Risk | Alternate | Reason |
|-----|------|-----------|--------|
| STM32WL55JCIx | Premium pricing, lead time | STM32WL55CCUx (smaller package) | UFQFPN-48, same die |
| TMP117NAIDRVR | Higher cost | DS18B20 or MCP9808 | Relaxes to ±0.5°C (meets spec) |
| TPS63031DSKR | Higher cost | TPS61022 (boost only) | Acceptable if min AA voltage > 2.7V |

## Lifecycle Check

| Component | Lifecycle Status | Source |
|-----------|-----------------|--------|
| STM32WL55JCIx | Active production | ST product page |
| TMP117NAIDRVR | Active production | TI.com |
| TPS63031DSKR | Active production | TI.com |

**5-year availability:** High confidence. STM32WL is ST's strategic product for LoRaWAN nodes.

## FCC Notes

STM32WL55 reference design provides FCC-tested board layout. Following ST reference design (AN5406) allows leveraging ST's pre-tested PCB geometry. End product still requires FCC testing but reference design substantially de-risks RF layout.
