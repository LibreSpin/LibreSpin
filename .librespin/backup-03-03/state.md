---
phase: '7-final-output'
completed: '2026-04-05T02:00:00Z'
completeness_score: 98
source: yaml
schema_version: 1
---

# Requirements

schema_version: 1
project_name: "Example IoT Sensor Node"
use_case: |
  Remote environmental monitoring for agricultural fields.
  Measures soil moisture and temperature, uploads data hourly.
environment:
  location: outdoor
  temperature_min_c: -20
  temperature_max_c: 50
  moisture: yes
  mounting: pole-mounted
connectivity:
  primary: LoRaWAN
  region: US915
  upload_frequency: hourly
power:
  source: battery
  battery_life_target: 12 months
  battery_type: 2xAA
sensors:
  - type: soil_moisture
    interface: analog
  - type: temperature
    accuracy: "±0.5°C"
hmi:
  buttons: 1
  leds: 2
  display: none
physical:
  max_pcb_size_mm: "50x30"
  enclosure: "IP65 plastic"
  connectors:
    - type: JST-PH
      purpose: battery
    - type: screw-terminal
      purpose: sensor-wires
production:
  volume: 50
  bom_target_usd: 25
compliance:
  - FCC
lifecycle:
  years: 5
preferences:
  preferred_vendors:
    - STMicroelectronics
    - Nordic
  avoid_vendors: []
  notes: "Prefer parts available on JLCPCB assembly"

# Success Criteria

- Device must operate at -20°C to 50°C outdoor temperature range
- LoRaWAN connectivity on US915 band with hourly data uploads
- Battery life of 12 months on 2xAA batteries
- Soil moisture + temperature measurement accuracy within ±0.5°C
- PCB fits in 50x30mm footprint with IP65 enclosure
- Total BOM cost under $25 per unit at 50 unit volume
- FCC compliance
- 5-year component lifecycle
