# Validation Summary

**Project:** Environmental Monitoring Sensor Node
**Threshold:** 80% (auto-pass >=85%, borderline 80-84%, auto-fail <80%)
**Concepts evaluated:** 5
**Date:** 2026-04-05

---

## Auto-Passed (>=85%): 1 concept

- Concept A: Ultra-Low-Power MCU (86.0%)

## Borderline (80-84%): 0 concepts

None.

## Auto-Failed (<80%): 4 concepts

- Concept B: Module-Based with OTA (71.6%) — SoM cost likely exceeds $25 BOM target; sleep current and PCB fit unverified
- Concept C: Nordic-Centric BLE+LoRa (62.0%) — Dual antenna on <30mm board is infeasible without significant layout compromise; BLE is a nice-to-have not a requirement
- Concept D: Distributed Sensor + Radio (67.4%) — Two-board stackup in a <30mm IP65 enclosure presents severe physical topology risk
- Concept E: Edge Processing + Aggregated TX (73.0%) — Deviates from hourly data rate requirement; requires application-side changes; M4 sleep penalty vs. M0+ not justified for simple sensing

---

## Score Detail

| Concept | Coverage | Feasibility | Topology | Availability | Cost | Complexity | **Total** |
|---------|----------|-------------|----------|--------------|------|------------|-----------|
| A: Ultra-Low-Power MCU | 90 | 90 | 70 | 90 | 90 | 90 | **86.0%** |
| B: Module-Based OTA | 90 | 70 | 70 | 70 | 50 | 70 | **71.6%** |
| C: Nordic BLE+LoRa | 70 | 70 | 50 | 70 | 50 | 50 | **62.0%** |
| D: Distributed Stackup | 90 | 70 | 30 | 90 | 70 | 50 | **67.4%** |
| E: Edge Processing | 70 | 70 | 70 | 90 | 70 | 70 | **73.0%** |

Weights: Coverage 20% / Feasibility 25% / Topology 20% / Availability 15% / Cost 12% / Complexity 8%

---

## Scoring Rationale

**Concept A (86.0% — auto_passed)**
Strong across all dimensions. Single-board, single-radio, LDO-only power path directly targets the ultra-low-power goal. M0+ sleep current of <1uA is well-established (STM32L0 datasheet verified). Pre-certified LoRa modules for US915 exist in small form factors (e.g., Murata CMWX1ZZABZ, HopeRF RFM95W). Topology score of 70 (not 90) reflects that fitting MCU + module + sensor + LDO on a single <30mm board is tight but feasible — physical verification required. Cost is well within target.

**Concept B (71.6% — auto_failed)**
Coverage is strong but cost and availability pull the score down. LoRa+MCU SoMs (e.g., Murata TypeABZ, RAK3172) cost $8-15 individually; with buck-boost and sensor, the $25 BOM is at risk. SoM sleep current specifications vary and require datasheet verification. Physical fit of SoM on a <30mm carrier board is an open question.

**Concept C (62.0% — auto_failed)**
Dual antenna on a <30mm board is the dominant failure mode. A sub-GHz LoRa antenna (quarter-wave at 915MHz = 82mm monopole, or a compact chip antenna ~10x3mm) competing with a 2.4GHz BLE antenna in 30mm requires careful co-design. BLE is not a stated requirement — it is a nice-to-have adding cost and layout complexity. Requirements specify 0 buttons, making on-demand BLE activation difficult without a dedicated wake mechanism.

**Concept D (67.4% — auto_failed)**
Physical topology is the critical failure. Two PCBs each sized for a <30mm enclosure plus a board-to-board connector adds Z-height. An IP65 enclosure specified for <30mm electronics typically has 10-15mm internal height — a stacked board assembly with connector (5-8mm typical) plus component height on both boards likely exceeds this. The sleep power benefit of load-switch radio isolation is real but does not justify the topology risk.

**Concept E (73.0% — auto_failed)**
The aggregated TX strategy is technically sound but introduces an application-layer assumption: the server must accept 6-hour summaries instead of hourly readings. Requirements state "hourly" data rate, which Concept E deviates from by design. Additionally, the M4 stop current (1-3uA typical) is higher than M0+ (0.5-1uA), and the 5-minute wake cadence (288 wake/day vs. 24 wake/day) partially offsets the TX savings. The firmware complexity penalty is the highest of all single-board concepts.

---

## Phase 2.5 Summary

Terminology collision scan completed for all 5 concepts. No requirements-to-component terminology collisions found. This project uses a simple IoT vocabulary (LoRaWAN US915, I2C sensors, LiPo battery) with no multi-modal ICs, no USB, and no complex protocol mode ambiguities. All concepts cleared pre-validation.

---

## Validated Concepts Proceeding to Phase 4

**Concept A: Ultra-Low-Power MCU (86.0%)**

Concepts B, C, D, and E are auto-failed at the validation gate. They may be reconsidered if requirements change (e.g., OTA is added as a hard requirement, BLE provisioning is mandated, or the form factor constraint is relaxed).
