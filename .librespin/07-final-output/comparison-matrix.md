# Final Comparison Matrix: Example IoT Sensor Node

**Generated:** 2026-04-05
**Project:** Agricultural LoRaWAN Soil Moisture + Temperature Sensor
**Concepts evaluated:** 4 (Concept E eliminated in validation gate)

## Comparison Matrix

| Criteria | Weight | A: Ultra-Low-Power MCU | B: Performance MCU OTA | C: Nordic Module | D: Distributed Sensor+Radio |
|----------|--------|------------------------|------------------------|------------------|-----------------------------|
| **Requirements Coverage** | 60% | 93% | 88% | 88% | 90% |
| **BOM Cost (landed/unit)** | 15% | $21-23 ✓ | $20-22 ✓ | $26-28 ✗ | $22-24 ✓ |
| **Part Availability** | 15% | High (commodity) | High (ST flagship) | Medium (module) | Medium (Murata) |
| **Design Complexity** | 10% | Low ✓ | Medium | Low-Medium | Medium |
| **Quality Score** | — | **92** | **87** | **83** | **87** |
| **FCC Path** | — | Full certification (~$6K) | Ref design available | Pre-certified ✓✓ | Pre-certified ✓✓ |
| **Battery Life** | — | >70 years practical | >25 years | >35 years | >43 years |
| **OTA Updates** | — | No | Yes (FUOTA) | Optional | No |
| **Analog Accuracy** | — | Standard | Standard | Standard | Best (isolated) |

## Trade-off Summary

| Trade-off | Winner |
|-----------|--------|
| Lowest BOM cost | A ($21-23) |
| Best quality score | A (92) |
| Lowest design complexity | A |
| Pre-certified (no FCC cost) | C, D |
| OTA firmware updates | B only |
| Best analog isolation | D |
| Fastest time to market | C (WisBlock ecosystem) |

## Recommendation

**RECOMMENDED: Concept A — Ultra-Low-Power MCU**

**Rationale:**
1. **Highest quality score (92/100)** after refinement — best overall balance
2. **Lowest BOM cost ($21-23/unit)** — only concept firmly within the $25 target
3. **Lowest complexity** — STM32L053 + RFM95W is a proven, widely-deployed combination with abundant reference designs
4. **Extreme battery life** — >10× the 12-month target; field maintenance cost essentially zero
5. **Simple firmware** — no RTOS, no dual-core partitioning, no AT command parsing

**Key tradeoff acknowledged:** Concept A requires FCC product-level certification (~$6,000 test lab). This is a one-time cost that, amortized over 50 units, adds $120/unit equivalent. If FCC test cost is prohibitive, **Concept D is the runner-up** — it uses the pre-certified Murata CMWX1ZZABZ module, eliminating FCC testing while staying within the $25/unit BOM target.

**Decision matrix by production scenario:**

| Scenario | Recommended Concept | Reason |
|----------|--------------------|----|
| 50 units, FCC budget available | **A** | Best cost, best quality |
| 50 units, no FCC budget | **D** | Pre-certified, within $25, good analog |
| 50+ units with field OTA needed | **B** | Only concept with FUOTA |
| Rapid prototyping first | **C** | WisBlock ecosystem, fastest to first PCB |

## All Concepts: Final Scores

| Concept | Quality Score | Status |
|---------|--------------|--------|
| A: Ultra-Low-Power MCU | 92 / 100 | ✓ PASS — RECOMMENDED |
| B: Performance MCU OTA | 87 / 100 | ✓ PASS |
| C: Nordic Module | 83 / 100 | ✓ PASS |
| D: Distributed Sensor+Radio | 87 / 100 | ✓ PASS — RUNNER-UP |
| E: Edge Processing | N/A | ✗ ELIMINATED (validation gate — battery life) |
