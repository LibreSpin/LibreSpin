---
phase: 07-ngspice-simulation-skill
verified: 2026-04-08T17:00:00Z
status: passed
score: 13/13 must-haves verified
---

# Phase 7: NGSpice Simulation Skill Verification Report

**Phase Goal:** Deliver the /librespin:simulate skill pack — orchestrator (skills/simulate/SKILL.md) and worker agent (agents/simulate.md) — covering NGSpice batch simulation from prereq check through result save.
**Verified:** 2026-04-08
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | skills/simulate/SKILL.md exists and follows orchestrator structure of skills/calcpad/SKILL.md | VERIFIED | File exists, 201 lines, exact 6-step structure with frontmatter matching plan spec |
| 2 | agents/simulate.md exists with correct frontmatter (name, description, tools, color) | VERIFIED | name: simulate, color: green, tools: Read Write Bash AskUserQuestion Glob present |
| 3 | Skill verifies ngspice in PATH with install instructions on absent (SIM-01) | VERIFIED | Step 2 bash check present; Ubuntu/Debian/Fedora/Arch install block verbatim |
| 4 | Skill reads component values from .librespin/08-calculations/ per frozen output contract (SIM-02) | VERIFIED | Step 3 Glob .librespin/08-calculations/*.md + error handling for empty result |
| 5 | Skill supports menu-driven analysis type selection with auto-detect hint and --auto flag (SIM-03) | VERIFIED | Step 4: --auto, --analysis TYPE, and 4-option AskUserQuestion with auto-detect logic all present |
| 6 | Agent spawned with run_in_background: false (Pitfall 6 avoided) | VERIFIED | SKILL.md line 140 and Notes section (line 199) both explicitly enforce run_in_background: false |
| 7 | Skill invokes ngspice -b circuit.cir and detects errors via stdout+stderr scan, not exit code (SIM-04) | VERIFIED | agents/simulate.md Stage C: stdout+stderr captured to sim-combined.txt; grep-based detection; exit code explicitly not used |
| 8 | Agent maps 4 known failure patterns to specific remediations (SIM-05) | VERIFIED | Stage C table: ERR-1 Timestep too small, ERR-2 singular matrix, ERR-3 Too many iterations without convergence, ERR-4 Unable to find definition of model — all 4 present with remediations |
| 9 | Agent uses .control + wrdata for ASCII output and extracts scalar results (SIM-06) | VERIFIED | Stage D reads results.txt (ASCII wrdata output); awk parse commands for .op, .tran, .ac, .dc all present |
| 10 | Agent validates results against spec from .librespin/07-final-output/ and suggests component changes on fail (SIM-07) | VERIFIED | Stage E builds pass/fail table vs design targets; specific component-change inference examples included |
| 11 | matplotlib waveform is optional, skipped gracefully if Python/matplotlib absent (SIM-08) | VERIFIED | Stage F: python3 -c "import matplotlib" check; FOUND path generates PNG; MISSING path prints one-line note and continues |
| 12 | Human review gate before save (SIM-09) | VERIFIED | Stage G: AskUserQuestion with approve/request changes/cancel before Stage H save |
| 13 | Outputs (circuit.cir, results.txt, simulation-summary.md, waveform.png optional) saved to .librespin/09-simulation/ (SIM-10) | VERIFIED | Stage H writes simulation-summary.md; circuit.cir and results.txt already placed in Stage C; Output Contract section frozen |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `skills/simulate/SKILL.md` | Orchestrator with 6-step flow | VERIFIED | 201 lines; Steps 1-6 all present; frontmatter matches plan spec exactly |
| `agents/simulate.md` | Worker with Stages A-H | VERIFIED | 374 lines; Stages A through H all present; Output Contract section marked FROZEN |
| `fixtures/voltage-divider/08-calculations/voltage-divider-summary.md` | CalcPad-compatible summary fixture | VERIFIED | Exists; Phase 6 output contract table format with Calculated column |
| `fixtures/voltage-divider/08-calculations/voltage-divider.cpd` | CalcPad worksheet fixture | VERIFIED | Exists; variable definitions matching fixture scenario |
| `fixtures/voltage-divider/07-final-output/concept.md` | Concept fixture with design targets | VERIFIED | Exists; .op analysis type hint; design targets for spec validation |
| `.planning/phases/07-ngspice-simulation-skill/07-02-e2e-evidence.md` | Captured E2E evidence | VERIFIED | 10917 bytes; NGSpice version, happy path output, error path, findings, dry-run all present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| skills/simulate/SKILL.md Step 5 | agents/simulate.md | Agent tool, subagent_type: simulate, run_in_background: false | WIRED | Pattern present at line 140; run_in_background: false enforced |
| agents/simulate.md Stage C | ngspice CLI | bash ngspice -b circuit.cir with stdout+stderr capture | WIRED | Stage C bash block: `ngspice -b circuit.cir > sim-stdout.txt 2> sim-stderr.txt` |
| agents/simulate.md Stage A | .librespin/08-calculations/ | Read {block-slug}-summary.md + .cpd for component values | WIRED | Stage A: reads summary.md Calculated column; .cpd fallback grep pattern present |

### Data-Flow Trace (Level 4)

This phase produces pure-markdown skill and agent files, not runnable components rendering dynamic data. Level 4 data-flow trace is not applicable — the artifacts are prompt documents, not UI components or data pipelines.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| ngspice -b runs and produces results.txt | E2E evidence: `ngspice -b circuit.cir` | V(2) = 2.97744361 V, results.txt 33 bytes, exit 0 | PASS |
| Error pattern ERR-2 (singular matrix) matched on real broken netlist | E2E evidence: broken-combined.txt grep | `singular matrix` found in NGSpice 42 stderr | PASS |
| Error pattern ERR-1 (Timestep too small) also matched on broken run | E2E evidence: broken-combined.txt grep | `Timestep too small` found as secondary signal | PASS |
| wrdata two-column ASCII format confirmed | E2E evidence: results.txt content | `1.20000000e+01  2.97744361e+00` — column 2 is signal | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SIM-01 | 07-01-PLAN.md | NGSpice prereq check + install instructions | SATISFIED | SKILL.md Step 2; E2E evidence Step 2 dry-run confirmed |
| SIM-02 | 07-01-PLAN.md | Read .librespin/08-calculations/ and generate valid .cir | SATISFIED | SKILL.md Step 3; agents/simulate.md Stage A; fixture proves parse chain |
| SIM-03 | 07-01-PLAN.md | Analysis type selection: menu, --auto, --analysis TYPE | SATISFIED | SKILL.md Step 4 with auto-detect logic for all 5 circuit type hints |
| SIM-04 | 07-01-PLAN.md, 07-02-PLAN.md | ngspice -b batch mode, error detection via stdout+stderr | SATISFIED | agents/simulate.md Stage C; E2E evidence run confirmed detection logic |
| SIM-05 | 07-01-PLAN.md | Convergence diagnosis: 4 patterns + remediations | SATISFIED | agents/simulate.md Stage C table: ERR-1 through ERR-4 with remediations |
| SIM-06 | 07-01-PLAN.md, 07-02-PLAN.md | .control + wrdata ASCII output, scalar result extraction | SATISFIED | agents/simulate.md Stage D awk commands; E2E confirmed wrdata format |
| SIM-07 | 07-01-PLAN.md | Spec validation vs design targets + component-change suggestions | SATISFIED | agents/simulate.md Stage E pass/fail table with per-miss suggestions |
| SIM-08 | 07-01-PLAN.md | Optional matplotlib waveform PNG, graceful skip if absent | SATISFIED | agents/simulate.md Stage F: runtime check + MISSING path skips cleanly |
| SIM-09 | 07-01-PLAN.md, 07-02-PLAN.md | Human review gate before save | SATISFIED | agents/simulate.md Stage G AskUserQuestion with approve/changes/cancel |
| SIM-10 | 07-01-PLAN.md, 07-02-PLAN.md | Save circuit.cir, results.txt, simulation-summary.md, waveform.png to .librespin/09-simulation/ | SATISFIED | agents/simulate.md Stage H; Output Contract section; D-20 fully implemented |

All 10 SIM requirements are covered across the two plans. No orphaned requirements.

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| agents/simulate.md Stage F | .op waveform is degenerate (single point) | Info | Not a code defect — E2E evidence notes this at line 284: "cosmetic note, no bug." Waveform generation runs but produces a one-row plot. Acceptable per SIM-08 optional status. |

No blocker or warning-level anti-patterns found. No TODO/FIXME/placeholder comments. No empty implementations. No hardcoded empty state feeding rendered output.

### Human Verification Required

The 07-02-PLAN.md included a blocking human-verify checkpoint (Task 2). The 07-02-SUMMARY.md records this as passed. The E2E evidence dry-run at lines 232-294 documents the full stage-by-stage walk-through conclusion: "No ambiguities found. Skill is ready for Phase 8."

No additional human verification items identified by automated checks.

### Gaps Summary

No gaps. All 13 must-have truths verified. All 6 required artifacts exist and are substantive. All 3 key links are wired. All 10 SIM requirement IDs are satisfied. E2E evidence confirms real NGSpice execution on the dev machine (ngspice-42, Ubuntu noble). Error patterns ERR-1 and ERR-2 verified against real NGSpice output. Human dry-run completed with no ambiguities found. Phase 7 goal is fully achieved.

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_
