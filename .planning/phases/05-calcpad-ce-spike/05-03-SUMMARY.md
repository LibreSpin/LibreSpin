---
phase: 05-calcpad-ce-spike
plan: 03
subsystem: infra
tags: [dotnet, calcpad-ce, cli, rest-api, spike, linux, decision]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Calcpad.Cli binary at /tmp/calcpad-cli-out/Cli and Calcpad.Server binary"
  - phase: 05-02
    provides: "CLI and REST API test evidence in /tmp/spike-calcpad/"
provides:
  - .planning/spike-calcpad.md — Phase 5 deliverable, GO verdict, CLI-first recommended path
  - Phase 6 planning input: confirmed binary names, invocation patterns, port behavior, anomalies
affects:
  - 06-calcpad-skill (reads spike-calcpad.md for CALC-01 and CALC-08 implementation path)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spike report pattern: synthesize sub-plan SUMMARYs + raw /tmp evidence into .planning/spike-X.md"

key-files:
  created:
    - .planning/spike-calcpad.md — Phase 5 go/no-go report with GO verdict, CLI-first recommendation, and Phase 6 upstream PR deliverables
    - .planning/seeds/SEED-001-calcpadce-linux-packaging.md — deferred Linux packaging seed
  modified: []

key-decisions:
  - "Phase 5 verdict: GO — both CalcpadCE CLI and REST API working on Linux"
  - "Recommended Phase 6 path: CLI-first (REST as optional CALC-08 fallback)"
  - "Phase 6 binary name: Cli (not Calcpad.Cli) — csproj assembly name on Linux"
  - "Phase 6 server port: must read from startup log or use --urls flag (not hardcode 8080)"
  - "Phase 6 CLI success detection: exit code + output file existence (stdout is empty with -s flag)"
  - "Phase 6 Calcpad.Server build: patch CalcpadService.cs AuthSettings block before building"
  - "Phase 6 required upstream PR #1: fix CalcpadService.cs AuthSettings regression in imartincei/CalcpadCE"
  - "Phase 6 required upstream PR #2: document Linux build path deviations (binary name, port, dotnet-install.sh) in CalcpadCE README"

patterns-established:
  - "Pattern: spike-calcpad.md is the canonical planning artifact — place in .planning/ not .librespin/"

requirements-completed: []

# Metrics
duration: 21min
completed: 2026-04-08
---

# Phase 5 Plan 03: Spike Report Synthesis Summary

**Phase 5 spike concluded GO: both CalcpadCE CLI (exit 0, 29KB HTML, V_out=8 correct) and REST API (HTTP 200, 24KB HTML) confirmed working on Linux; .planning/spike-calcpad.md written with CLI-first recommendation and two required upstream PRs for Phase 6**

## Performance

- **Duration:** 21 min
- **Started:** 2026-04-08T11:17:47Z
- **Completed:** 2026-04-08T11:38:30Z
- **Tasks:** 2 of 2 complete
- **Files modified:** 1 (spike-calcpad.md — created + Phase 6 additions)

## Accomplishments

- Synthesized Phase 05-01 (build) and 05-02 (test) evidence into `.planning/spike-calcpad.md` with all 8 required sections, GO verdict, and CLI-first Phase 6 strategy
- User reviewed and approved spike findings (Task 2 checkpoint resolved)
- Phase 6 upstream contribution deliverables added per user direction: AuthSettings regression fix PR + Linux README documentation PR (both required before Phase 6 ships)
- SEED-001 planted for longer-term CalcpadCE Linux packaging work (.tar.gz, .deb, systemd unit)

## Task Commits

1. **Task 1: Write spike-calcpad.md decision report** — `4e0a329` (docs)
2. **Task 2: User reviews spike report and approves Phase 6 path** — `46d8386` (docs — Phase 6 upstream PR deliverables added per user direction)

## Files Created/Modified

- `.planning/spike-calcpad.md` — Phase 5 complete deliverable (120 lines, GO verdict, Phase 6 upstream PRs documented)
- `.planning/seeds/SEED-001-calcpadce-linux-packaging.md` — Deferred packaging work seed

## Decisions Made

- CLI-first is recommended for Phase 6 (simpler, no server lifecycle management needed)
- REST path is still viable — both paths de-risked by spike
- Binary name `Cli` (not `Calcpad.Cli`) confirmed for Phase 6 skill content
- Server port instability (9420 observed vs 8080 expected) requires dynamic port reading via `--urls` or startup log parsing
- Phase 6 must submit two upstream PRs to imartincei/CalcpadCE before shipping

## Deviations from Plan

### Additions (user-directed)

**1. [User Direction] Phase 6 upstream PR deliverables added to spike report**
- **Found during:** Task 2 (user review checkpoint)
- **Action:** User approved GO verdict and directed addition of two required upstream PRs to imartincei/CalcpadCE: (1) fix CalcpadService.cs AuthSettings build regression, (2) document Linux build path deviations in README
- **Files modified:** `.planning/spike-calcpad.md` (Section 6 restructured as upstream PRs + Section 6b as implementation strategy)
- **Committed in:** `46d8386`

---

**Total deviations:** 1 user-directed addition. No unplanned fixes.
**Impact:** Enriches Phase 6 scope with upstream contribution obligations. No reduction in spike deliverable scope.

## Issues Encountered

None — all evidence files were on disk from Phase 05-01 and 05-02. Human-verify checkpoint resolved with user approval on first pass.

## Next Phase Readiness

Phase 6 (calcpad-skill) is fully unblocked:

- GO verdict confirmed — both CLI and REST paths working
- Binary name confirmed: `Cli` (Linux assembly name, not `Calcpad.Cli`)
- Phase 6 planner should read `.planning/spike-calcpad.md` Sections 6 and 6b for implementation details
- Two upstream PRs to imartincei/CalcpadCE are required Phase 6 deliverables (not optional)
- SEED-001 packaging work deferred until Phase 6 ships and PRs are accepted

---

## Self-Check

- FOUND: .planning/spike-calcpad.md
- FOUND: commit 4e0a329 (Task 1)
- FOUND: commit 46d8386 (Task 2 / Phase 6 additions)
- All 8 sections present in spike-calcpad.md
- Verdict line `**Verdict:** GO` confirmed
- No placeholder markers
- File at .planning/ (not .librespin/)

## Self-Check: PASSED

---
*Phase: 05-calcpad-ce-spike*
*Completed: 2026-04-08*
