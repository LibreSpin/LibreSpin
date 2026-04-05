# BOM: Concept C — Nordic Module-Based

**Project:** Example IoT Sensor Node
**Concept:** Nordic Module (Concept C)
**Generated:** 2026-04-05
**Target Volume:** 50 units
**BOM Target:** $25/unit

## Bill of Materials

| Ref | Description | MPN | Manufacturer | Qty | Unit Price (50) | Extended | Notes |
|-----|-------------|-----|--------------|-----|-----------------|----------|-------|
| U1 | nRF52840 + SX1262 LoRa module (pre-certified) | RAK4631 | RAKwireless | 1 | $15.00 | $15.00 | FCC/CE/ISED certified, US915 variant |
| U2 | LDO 3.3V 200mA | MCP1700-3302E/TO | Microchip | 1 | $0.30 | $0.30 | 0.6µA quiescent |
| U3 | Temperature sensor ±0.5°C | DS18B20+ | Maxim/Analog Devices | 1 | $1.80 | $1.80 | 1-Wire, TO-92 |
| U4 | Soil moisture sensor (capacitive) | SEN0193 | DFRobot | 1 | $3.00 | $3.00 | 3.3V, analog out |
| C1-C8 | 100nF decoupling caps | GCM155R71C104KA55D | Murata | 8 | $0.02 | $0.16 | 0402 MLCC |
| C9-C10 | 10µF bulk caps | GRM155R61A106ME15D | Murata | 2 | $0.08 | $0.16 | 0402 MLCC |
| R1-R3 | 4.7kΩ pull-up resistors | RC0402FR-074K7L | Yageo | 3 | $0.01 | $0.03 | 0402 |
| SW1 | Tactile switch 6mm | TS02-66-43-BK-100-LCR-D | CUI Devices | 1 | $0.25 | $0.25 | Momentary SPST |
| LED1 | Red LED (power) | LTST-C171KRKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| LED2 | Green LED (status) | LTST-C171KGKT | Lite-On | 1 | $0.15 | $0.15 | 0402 |
| J1 | JST-PH 2-pin battery connector | S2B-PH-K-S | JST | 1 | $0.35 | $0.35 | Right angle |
| J2 | 2-pin screw terminal (sensors) | 1729018 | Phoenix Contact | 1 | $0.60 | $0.60 | 3.5mm pitch |
| PCB | Custom carrier board 50x30mm | — | JLCPCB | 1 | $1.50 | $1.50 | Custom carrier (not WisBlock base) |

**BOM Total (materials only):** $23.45/unit at 50 units
**Assembly estimate (JLCPCB SMT):** ~$3-5/unit
**Estimated total landed cost:** ~$26-28/unit

**Status: SLIGHTLY OVER $25 TARGET** — RAK4631 module cost drives BOM

## Alternates / Risk Mitigation

| MPN | Risk | Alternate | Reason |
|-----|------|-----------|--------|
| RAK4631 (US915) | Single source (RAKwireless) | Ebyte E22-900M22S (SX1262) | No FCC cert; saves $8 but loses cert |
| RAK4631 | Price | SEEED LoRa-E5 module | STM32WL-based, also pre-certified |

## Lifecycle Check

| Component | Lifecycle Status | Source |
|-----------|-----------------|--------|
| RAK4631 | Active production | RAKwireless store |
| DS18B20+ | Active production | Analog Devices |

**Certification:** FCC ID confirmed via FCC database for RAK4631 (US915 variant).
**5-year availability:** Moderate confidence — RAKwireless is smaller vendor vs ST/Nordic direct. Recommend stocking spares.

## Notes

Custom carrier board required to fit 50×30mm PCB constraint. RAK4631 uses castellated pads (solders directly to carrier). This is standard production approach — not a prototype limitation.
