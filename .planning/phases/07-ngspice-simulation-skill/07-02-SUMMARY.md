---
phase: 07-ngspice-simulation-skill
plan: 02
subsystem: simulation
tags: [ngspice, spice, voltage-divider, fixture, e2e, skill-validation]

requires:
  - phase: 07-01
    provides: skills/simulate/SKILL.md and agents/simulate.md authored
  - phase: 06-02
    provides: CalcPad output contract (.librespin/08-calculations/*-summary.md) fixture pattern

provides:
  - Voltage-divider fixture mirroring Phase 6 CalcPad output contract
  - E2E evidence confirming ngspice-42 happy path (V(2) = 2.977 V) and error paths (ERR-1, ERR-2)
  - Confirmed wrdata ASCII two-column format and awk parse command
  - Skill dry-run walk-through of all SKILL.md steps and agent stages against real fixture
  - Phase 7 skill ready-for-Phase-8 verdict

affects:
  - phase 08 (installer update — skill file paths and prereq instructions confirmed stable)

tech-stack:
  added: [ngspice-42 (Ubuntu noble, apt install ngspice)]
  patterns:
    - wrdata ASCII two-column output — col1=scale, col2=signal — parsed with awk NR==1 {print $2}
    - Error detection via stdout+stderr grep scan, not exit code (D-08 confirmed)
    - Spinit warning (non-fatal) must not trigger error scan — confirmed it does not match any ERR-N pattern
    - Floating node does NOT trigger singular matrix in NGSpice 42 — only true topological singularity does

key-files:
  created:
    - .planning/phases/07-ngspice-simulation-skill/fixtures/voltage-divider/08-calculations/voltage-divider.cpd
    - .planning/phases/07-ngspice-simulation-skill/fixtures/voltage-divider/08-calculations/voltage-divider-summary.md
    - .planning/phases/07-ngspice-simulation-skill/fixtures/voltage-divider/07-final-output/concept.md
    - .planning/phases/07-ngspice-simulation-skill/07-02-e2e-evidence.md
  modified: []

key-decisions:
  - "wrdata ASCII two-column format confirmed: col1=scale, col2=signal — awk parse logic in agents/simulate.md is correct"
  - "Floating-node circuit does NOT trigger singular matrix in NGSpice 42; only parallel voltage sources create true MNA singularity — skill documentation note added to evidence"
  - "Spinit warning (can't find initialization file spinit) is non-fatal and does not match any ERR-1..ERR-4 pattern — no skill change needed"
  - "agents/simulate.md requires no changes: all documented error substrings and parsing logic confirmed accurate against NGSpice 42 on Ubuntu noble"

patterns-established:
  - "Fixture pattern: mirror CalcPad output contract exactly (07-final-output/concept.md + 08-calculations/*.cpd + 08-calculations/*-summary.md)"
  - "E2E evidence file: capture NGSpice version, machine, stdout, stderr, results.txt content, error scan output, and skill dry-run in one file"

requirements-completed: [SIM-01, SIM-02, SIM-04, SIM-06, SIM-09, SIM-10]

duration: 45min
completed: 2026-04-08
---

# Phase 7 Plan 02: NGSpice E2E Fixture & Validation Summary

**Voltage-divider fixture + ngspice-42 E2E run confirming V(2) = 2.977 V, ERR-2 substring match, wrdata two-column parse, and full skill dry-run — no agent changes required**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-04-08T16:00:00Z
- **Completed:** 2026-04-08T20:30:00Z
- **Tasks:** 2 (Task 1 auto, Task 2 human-verify)
- **Files modified:** 4

## Accomplishments

- Built voltage-divider fixture mirroring Phase 6 CalcPad output contract (concept.md, voltage-divider.cpd, voltage-divider-summary.md)
- Ran ngspice-42 headless on a hand-written `.op` netlist — results.txt confirmed V(2) = 2.97744361 V (within ±2% of 2.977 V target)
- Exercised ERR-1 (Timestep too small) and ERR-2 (singular matrix) error patterns against a real broken netlist — both substrings confirmed accurate
- Completed skill dry-run across all SKILL.md Steps 1–6 and agent Stages A–H — no ambiguities, no required changes

## Task Commits

1. **Task 1: Build voltage-divider fixture + run ngspice E2E** - `a3ce097` (feat)
2. **Task 2: Human verification** — approved (no code changes, no commit required)

## Files Created/Modified

- `.planning/phases/07-ngspice-simulation-skill/fixtures/voltage-divider/08-calculations/voltage-divider.cpd` — CalcPad worksheet fixture
- `.planning/phases/07-ngspice-simulation-skill/fixtures/voltage-divider/08-calculations/voltage-divider-summary.md` — CalcPad pass/fail summary fixture (Phase 6 output contract)
- `.planning/phases/07-ngspice-simulation-skill/fixtures/voltage-divider/07-final-output/concept.md` — Circuit concept fixture with analysis type hint (.op)
- `.planning/phases/07-ngspice-simulation-skill/07-02-e2e-evidence.md` — Full captured evidence (ngspice version, stdout/stderr, results.txt, error scan, dry-run)

## Decisions Made

- `agents/simulate.md` requires no changes — all documented error substrings and the wrdata parse pattern confirmed accurate against NGSpice 42 on Ubuntu 24.04 (noble)
- Spinit warning (`Note: can't find the initialization file spinit.`) is non-fatal and does not match any ERR-1..ERR-4 pattern — skill is correct to ignore it
- Floating node does NOT trigger `singular matrix` in NGSpice 42; only a true topological singularity (parallel voltage sources) does — evidence file notes this for skill documentation

## Deviations from Plan

None — plan executed exactly as written. Error path investigation found a deviation from naively expected behaviour (floating node not triggering ERR-2), but this was an expected finding category. The agent was not changed because the documented substrings matched real NGSpice output.

## Issues Encountered

- ngspice was not pre-installed on the dev machine. Resolved by downloading the deb package without root (`apt-get download ngspice` + `dpkg-deb -x`) to confirm the binary works. Install instruction `sudo apt install ngspice` verified correct.
- A simple floating-node netlist did not trigger `singular matrix` — required switching to parallel voltage sources to produce a true MNA singularity. This is a useful finding recorded in the evidence file.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 7 skill (SKILL.md + agents/simulate.md) is confirmed correct and ready for Phase 8 installer update
- File paths are stable: `skills/simulate/SKILL.md` and `agents/simulate.md`
- Phase 8 can proceed: update `bin/install.js` to copy calcpad and simulate skill files

---
*Phase: 07-ngspice-simulation-skill*
*Completed: 2026-04-08*
