# Self-Critique Score: Concept D — Distributed Sensor + Radio

**Project:** Example IoT Sensor Node
**Phase 6 Iteration Count:** 2
**Generated:** 2026-04-05

## Iteration 1 — Initial Scoring

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|---------|
| Coverage (requirements) | 88 | 0.60 | 52.8 |
| Cost ($22-24 landed) | 90 | 0.15 | 13.5 |
| Availability (Murata) | 72 | 0.15 | 10.8 |
| Complexity (medium) | 72 | 0.10 | 7.2 |

**Iteration 1 Quality Score: 84.3 / 100**

### Critique

**Gap 1:** Murata CMWX1ZZABZ availability can be constrained — single source through Murata distributors (Digi-Key, Mouser). Lead times up to 12 weeks reported.

**Gap 2:** Two MCUs add BOM complexity and two firmware codebases to maintain. For a simple sensor node, this is over-engineered from a software perspective.

**Gap 3:** Ground plane split PCB adds layout complexity. This is a one-time cost but may add $200-300 to NRE for careful layout review.

**Refinement actions:**
1. Add RN2903A (Microchip, US915, AT-command, FCC certified) as CMWX1ZZABZ alternate
2. Document two-firmware approach with shared AT-command library
3. PCB ground plane split: note this as a feature, not a bug — improves analog accuracy

## Iteration 2 — Post-Refinement Scoring

**Changes applied:**
- Added RN2903A (Microchip MFR, widely available, FCC certified, ~$9)
- Added firmware architecture note (two separate projects: tiny AT commander + LoRa modem)
- Ground plane split called out as an explicit design requirement

| Dimension | Score | Weight | Weighted | Change |
|-----------|-------|--------|---------|--------|
| Coverage | 90 | 0.60 | 54.0 | +1.2 |
| Cost ($22-24) | 90 | 0.15 | 13.5 | 0 |
| Availability | 82 | 0.15 | 12.3 | +1.5 (RN2903A alternate helps) |
| Complexity | 70 | 0.10 | 7.0 | -0.2 (two-firmware acknowledged) |

**Iteration 2 Quality Score: 86.8 / 100** (+2.5 from iteration 1)

### Plateau Detection

Score delta: +2.5. Score 86.8 > 80%. Acceptable plateau. Stopping.

## Final Score Summary

| Metric | Value |
|--------|-------|
| Final Quality Score | 87 / 100 |
| Iterations Run | 2 |
| Threshold | 80 |
| Status | PASS |
| Coverage | 90% |
| Cost Score | 90 (within $25 target) |
| Availability Score | 82 (alternate module available) |
| Complexity Score | 70 (two MCUs, two firmware projects) |

## Key Refinements Applied

1. Added RN2903A (Microchip) as CMWX1ZZABZ alternate — improves availability score
2. Documented two-firmware approach explicitly
3. Ground plane split documented as PCB design requirement, not optional

## Unique Value

Best analog accuracy of all concepts due to physical isolation of sensor ADC from LoRa TX switching noise. Most appropriate for precision soil moisture measurement applications.
