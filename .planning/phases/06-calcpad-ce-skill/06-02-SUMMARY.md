---
phase: 06-calcpad-ce-skill
plan: 02
subsystem: skill
tags: [calcpadce, markdown-skill, cli-wrapper, circuit-calculation, human-gate]

# Dependency graph
requires:
  - phase: 06-01
    provides: GitHub Release v0.1.0-librespin with verified Cli binary download URL

provides:
  - skills/calcpad/SKILL.md — /librespin:calcpad orchestrator (prereq check, block menu, agent spawn)
  - agents/calcpad.md — calcpad worker agent (worksheet gen, CLI/REST, pass/fail, human gate, save)
  - .librespin/fixtures/07-final-output/concept.md — voltage divider test fixture
  - .librespin/08-calculations/ output contract (frozen for Phase 7)

affects:
  - 07-simulate (reads .librespin/08-calculations/{slug}.cpd and -summary.md for SPICE component values)
  - 06-03 (upstream PR artifacts — no dependency on skill files)

# Tech tracking
tech-stack:
  added:
    - CalcPad CE Cli binary (self-contained linux-x64 ELF, 88MB) at ~/.librespin/bin/Cli
    - doc/template.html + jquery-3.6.3.min.js (required alongside Cli binary)
  patterns:
    - Skill orchestrator spawns worker agent foreground (run_in_background: false) — AskUserQuestion requirement
    - Draft-then-review flow: Claude generates .cpd, shows inline, user approves before CLI execution
    - Success detection: exit code + file existence (not stdout parsing — CLI silent with -s flag)
    - REST fallback with explicit --urls port (never parse/hardcode 8080)

key-files:
  created:
    - skills/calcpad/SKILL.md (190 lines — orchestrator)
    - agents/calcpad.md (249 lines — worker)
    - .librespin/fixtures/07-final-output/concept.md (voltage divider fixture)
    - .planning/phases/06-calcpad-ce-skill/06-02-e2e-evidence.md (CLI test evidence)
  modified:
    - skills/calcpad/SKILL.md (Rule 1 fix: added doc/template.html install step)

key-decisions:
  - "doc/template.html is required alongside Cli binary — not embedded in PublishSingleFile output; install instructions must include it"
  - "calcpad agent must be spawned foreground (run_in_background: false) — AskUserQuestion stalls in background agents"
  - "Output contract frozen: .librespin/08-calculations/{slug}.cpd/.html/-summary.md for Phase 7 consumption"

patterns-established:
  - "CalcPad CE install: binary + doc/template.html + doc/jquery.min.js all required"
  - "CLI invocation: ~/.librespin/bin/Cli input.cpd output.html -s (success = exit 0 AND file exists)"
  - "Pass/fail table pattern: compare extracted HTML values against design targets with tolerance"

requirements-completed: [CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08]

# Metrics
duration: 9min
completed: 2026-04-08
---

# Phase 6 Plan 02: CalcPad CE Skill Summary

**Pure-markdown /librespin:calcpad skill: orchestrator (SKILL.md) + worker agent (calcpad.md) implementing full prereq-check → block-select → worksheet-draft → CLI/REST → pass/fail → human-gate → save flow, with frozen output contract for Phase 7**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-04-08T17:20:22Z
- **Completed:** 2026-04-08T17:29:34Z
- **Tasks:** 2 (Task 2 auto-approved: auto_advance: true)
- **Files modified:** 5 (4 created, 1 updated)

## Accomplishments
- `skills/calcpad/SKILL.md` (190 lines): prereq check with install instructions, block menu, foreground agent spawn — cites all 4 spike pitfalls
- `agents/calcpad.md` (249 lines): voltage divider template verbatim, CLI/REST execution, HTML parsing for pass/fail table, human review gate, save to `.librespin/08-calculations/`
- CLI binary installed at `~/.librespin/bin/Cli` (88MB), tested working: exit 0, 29,462-byte HTML, V_out=2.977V
- Rule 1 auto-fix: `doc/template.html` required alongside binary (not embedded) — install instructions updated

## Task Commits

1. **Task 1: Write SKILL.md and agents/calcpad.md** - `8cd93c6` (feat)
2. **Task 2: Fixture + E2E + doc/template.html fix** - `fda2ec1` (feat)

**Plan metadata:** `[TBD]` (docs: complete plan)

## Requirements-to-Section Map

| Requirement | Section |
|-------------|---------|
| CALC-01 | SKILL.md §Step 2 (prereq check + install instructions) |
| CALC-02 | SKILL.md §Step 3 (read concept output) + §Step 4 (block selection) |
| CALC-03 | agents/calcpad.md §Stage A (generate .cpd worksheet) |
| CALC-04 | agents/calcpad.md §Stage C (execute CLI) |
| CALC-05 | agents/calcpad.md §Stage E (parse HTML + validate) |
| CALC-06 | agents/calcpad.md §Stage F (human review gate) |
| CALC-07 | agents/calcpad.md §Stage G (save outputs) |
| CALC-08 | agents/calcpad.md §Stage D (REST fallback) |

## E2E Evidence Summary

CLI tested manually against voltage divider fixture:
- Input: V_in=12, R1=10000, R2=3300
- Command: `~/.librespin/bin/Cli /tmp/calcpad-e2e-{TS}.cpd /tmp/calcpad-e2e-{TS}.html -s`
- Exit code: 0
- Output: 29,462 bytes
- Calculated V_out: 2.977444 V (correct: 12 * 3300/13300 = 2.9774...)
- Full evidence: `.planning/phases/06-calcpad-ce-skill/06-02-e2e-evidence.md`

## Frozen Output Contract (for Phase 7)

| File | Format | Contains |
|------|--------|---------|
| `.librespin/08-calculations/{slug}.cpd` | CalcPad CE worksheet | Variable definitions and formulas |
| `.librespin/08-calculations/{slug}.html` | HTML (CalcPad CE output) | Evaluated results with computed values |
| `.librespin/08-calculations/{slug}-summary.md` | Markdown | Pass/fail table, block name, timestamp, method |

Phase 7 (NGSpice) reads `{slug}-summary.md` for pass/fail table and `{slug}.cpd` for variable names.

## Files Created/Modified

- `skills/calcpad/SKILL.md` (190 lines) — /librespin:calcpad orchestrator
- `agents/calcpad.md` (249 lines) — calcpad worker agent
- `.librespin/fixtures/07-final-output/concept.md` — voltage divider E2E fixture
- `.planning/phases/06-calcpad-ce-skill/06-02-e2e-evidence.md` — CLI test evidence + pass/fail
- (SKILL.md updated with doc/template.html install instructions — Rule 1 fix)

## Decisions Made
- Output contract frozen: `.librespin/08-calculations/{slug}.cpd/.html/-summary.md` — Phase 7 reads this
- Foreground agent mandatory: calcpad agent uses AskUserQuestion, cannot be backgrounded
- doc/template.html must be installed alongside Cli binary — not embedded in self-contained publish

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cli binary requires doc/template.html — not embedded in PublishSingleFile output**
- **Found during:** Task 2 (E2E automated prep / CLI binary test)
- **Issue:** Running `~/.librespin/bin/Cli input.cpd output.html -s` crashed with "Could not find a part of the path '/home/william/.librespin/bin/doc/template.html'" then "Cannot read keys when either application does not have a console" (exit 134). The self-contained PublishSingleFile build does not embed the HTML template — it expects `./doc/template.html` relative to the binary location.
- **Fix:** Downloaded `template.html` and `jquery-3.6.3.min.js` from fork source to `~/.librespin/bin/doc/`. Updated SKILL.md install instructions to include two additional curl commands for these files.
- **Files modified:** `skills/calcpad/SKILL.md` (install block + Notes section)
- **Verification:** After fix — CLI exits 0, produces 29,462-byte HTML, V_out=2.977444 (correct)
- **Committed in:** `fda2ec1` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix essential — without template.html the skill's install path produces a non-functional binary. No scope creep.

## Issues Encountered

- CalcPad CE `PublishSingleFile` does not embed the HTML rendering template. This is an upstream limitation — the dotnet publish output includes both the binary and `doc/` folder but only the binary is picked up by GitHub Actions as the release asset. Fixed by downloading template separately in install instructions.

## Next Phase Readiness

- `/librespin:calcpad` skill is complete and ready for user invocation
- CLI binary working: `~/.librespin/bin/Cli` (88MB, exit 0 confirmed)
- Output contract frozen at `.librespin/08-calculations/` — Phase 7 can plan against it
- Phase 6 Plan 03 (upstream PR artifacts) can proceed independently

---
*Phase: 06-calcpad-ce-skill*
*Completed: 2026-04-08*
