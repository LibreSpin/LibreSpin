---
phase: 07-ngspice-simulation-skill
plan: 01
subsystem: simulate-skill
tags: [ngspice, spice, simulation, skill, agent, markdown]
dependency_graph:
  requires: [06-02-SUMMARY.md]
  provides: [skills/simulate/SKILL.md, agents/simulate.md]
  affects: [07-02-PLAN.md, phase-08-installer]
tech_stack:
  added: []
  patterns: [skill-orchestrator, worker-agent, prereq-check, draft-then-review, human-gate, output-contract]
key_files:
  created:
    - skills/simulate/SKILL.md
    - agents/simulate.md
  modified: []
decisions:
  - "run_in_background: false enforced on simulate agent spawn — same rationale as Phase 6 Pitfall 4"
  - "wrdata ASCII output over binary .raw — plain text parseable by awk/grep without a rawfile library"
  - "Exit code unreliable — success detection by error string scan + output file existence"
  - "matplotlib waveform optional — no hard dependency, skip gracefully"
metrics:
  duration: ~20min
  completed: 2026-04-08
  tasks_completed: 2
  files_created: 2
---

# Phase 07 Plan 01: NGSpice Simulate Skill Summary

Pure-markdown `/librespin:simulate` skill: NGSpice prereq check, draft-then-review .cir netlist, batch execution with stdout/stderr error diagnosis, wrdata ASCII parsing, spec validation with component suggestions, optional matplotlib waveform, human gate, save.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create skills/simulate/SKILL.md | 4bf2e2c | skills/simulate/SKILL.md |
| 2 | Create agents/simulate.md | 11c3495 | agents/simulate.md |

## Requirements Implemented

| ID | Description | Implemented In |
|----|-------------|----------------|
| SIM-01 | NGSpice prereq check + install instructions | SKILL.md Step 2 |
| SIM-02 | Read CalcPad output, generate .cir netlist | SKILL.md Step 3 + agents/simulate.md Stage A |
| SIM-03 | Analysis type menu + --auto + --analysis TYPE | SKILL.md Step 4 |
| SIM-04 | ngspice -b execution, error detection via stdout+stderr | agents/simulate.md Stage C |
| SIM-05 | 4 error patterns (ERR-1..ERR-4) with remediations | agents/simulate.md Stage C |
| SIM-06 | .control + wrdata ASCII output, scalar parsing | agents/simulate.md Stage D |
| SIM-07 | Spec validation, component change suggestions on fail | agents/simulate.md Stage E |
| SIM-08 | Optional matplotlib waveform, graceful skip if absent | agents/simulate.md Stage F |
| SIM-09 | Human review gate before save | agents/simulate.md Stage G |
| SIM-10 | Save circuit.cir, results.txt, simulation-summary.md, waveform.png | agents/simulate.md Stage H |

## Deviations from Plan

None — plan executed exactly as written. Both files match the structural template (SKILL.md mirrors skills/calcpad/SKILL.md; agents/simulate.md mirrors agents/calcpad.md).

## Known Stubs

None. Both files are complete skill/agent definitions. No placeholder content or hardcoded empty values.

## Blockers for 07-02

None. 07-02 (fixture + E2E evidence) requires only these two files to exist. Both are present and complete.

## Self-Check: PASSED

- `skills/simulate/SKILL.md` exists: FOUND
- `agents/simulate.md` exists: FOUND
- Commit 4bf2e2c exists: FOUND
- Commit 11c3495 exists: FOUND
