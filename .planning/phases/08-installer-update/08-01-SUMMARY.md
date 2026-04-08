---
phase: 08-installer-update
plan: 01
subsystem: infra
tags: [installer, nodejs, skill-distribution, calcpad, simulate]

requires:
  - phase: 07-ngspice-simulation-skill
    provides: skills/simulate and agents/simulate.md (source files to distribute)
  - phase: 06-calcpad-ce-skill
    provides: skills/calcpad and agents/calcpad.md (source files to distribute)
provides:
  - Updated npx installer that copies all three skills (concept, calcpad, simulate)
  - Clean uninstall for all six distributed items
affects: [users running npx librespin-install, release packaging]

tech-stack:
  added: []
  patterns: [INSTALL_ITEMS array as single source of truth for install/uninstall symmetry]

key-files:
  created: []
  modified: [bin/install.js]

key-decisions:
  - "Templates source path corrected from skills/librespin-concept/templates to skills/concept/templates (pre-existing bug fixed)"

patterns-established:
  - "INSTALL_ITEMS array drives both uninstall loop and documents what the installer owns"

requirements-completed: [PKG-07]

duration: 10min
completed: 2026-04-08
---

# Phase 8 Plan 01: Installer Update Summary

**bin/install.js updated to distribute all three skills (concept, calcpad, simulate) and agents via npx, with matching uninstall — plus a pre-existing broken templates path fixed.**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-08T21:20:00Z
- **Completed:** 2026-04-08T21:30:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Expanded `dirs`, `cp` calls, and `INSTALL_ITEMS` to cover skills/calcpad, skills/simulate, agents/calcpad.md, agents/simulate.md
- `--local` install verified: all four new paths created with SKILL.md inside each skill directory
- `--uninstall --local` verified: all six items removed cleanly, empty skills/ and agents/ directories remain

## Task Commits

1. **Task 1: Update bin/install.js** - `da23460` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified

- `bin/install.js` — Expanded dirs array, added cp calls for calcpad/simulate skills and agents, updated INSTALL_ITEMS to 7 entries, updated console output and restart message

## Decisions Made

- Corrected templates source path from `skills/librespin-concept/templates` to `skills/concept/templates` (that directory never existed; templates live in skills/concept/)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed broken templates source path**
- **Found during:** Task 1 verification (install failed at templates step)
- **Issue:** `skills/librespin-concept/templates` does not exist; templates are at `skills/concept/templates`
- **Fix:** Updated the `cp` call source path to `skills/concept/templates`
- **Files modified:** bin/install.js
- **Verification:** `node bin/install.js --local` exits 0, templates installed; `--uninstall` removes cleanly
- **Committed in:** da23460 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Pre-existing installer bug that would have blocked any fresh install. No scope creep.

## Issues Encountered

None beyond the pre-existing templates path bug (auto-fixed above).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Installer is complete for v0.2 milestone. All three skills distributed by a single `npx librespin-install`.
- No blockers.

---
*Phase: 08-installer-update*
*Completed: 2026-04-08*
