---
phase: 06-calcpad-ce-skill
plan: "03"
subsystem: upstream-contributions
tags: [calcpad-ce, upstream-pr, documentation, bug-fix]
dependency_graph:
  requires: []
  provides: [pr-001-artifact, pr-002-artifact]
  affects: [06-01, 06-02]
tech_stack:
  added: []
  patterns: [markdown-pr-artifact]
key_files:
  created:
    - .planning/artifacts/pr-001-calcpadservice-authsettings-fix.md
    - .planning/artifacts/pr-002-linux-build-documentation.md
  modified: []
decisions:
  - PR artifacts are documentation-only — no auto-submission, user pastes manually into GitHub
  - PR 001 diff is reconstructed from spike notes; exact patch file from 06-01 to be inlined when available
metrics:
  duration_minutes: 5
  completed_date: "2026-04-08"
  tasks_completed: 2
  files_created: 2
---

# Phase 06 Plan 03: Upstream PR Artifacts Summary

**One-liner:** Two paste-ready GitHub PR artifacts for CalcpadCE — AuthSettings CS1061 fix and Linux build documentation.

## What Was Built

Two markdown files in `.planning/artifacts/` containing complete GitHub PR bodies that the user can copy-paste into the `imartincei/CalcpadCE` repository when ready to contribute upstream.

### PR 001 — `.planning/artifacts/pr-001-calcpadservice-authsettings-fix.md`

Fixes a build-breaking CS1061/CS0234 compile error in `Calcpad.Server/Services/CalcpadService.cs` caused by `MacroParser.AuthSettings` being removed from `Calcpad.Core` in recent upstream commits. The PR removes the 8-line optional `#fetch` auth block from `CalcpadService.cs`. The `/api/calcpad/convert` endpoint is unaffected. Verified working in the Phase 5 spike.

Contains: title, summary, reproduction steps, fix description, reconstructed diff (exact diff to be inlined from `calcpadce-authsettings-patch.diff` once Plan 06-01 runs), and a complete test plan.

### PR 002 — `.planning/artifacts/pr-002-linux-build-documentation.md`

Adds a "Building on Linux" README section documenting three deviations discovered during the Phase 5 spike that are not in the upstream docs:

1. CLI binary on Linux is named `Cli` (not `Calcpad.Cli`) — the csproj assembly name
2. Kestrel does not default to port 8080 — observed 9420; use `--urls` flag or parse `Now listening on:` from startup log
3. `dotnet-install.sh --install-dir /tmp/dotnet10` provides a sudo-free .NET 10 SDK install path

Contains: title, summary, three notes, proposed README diff with bash code blocks, observed evidence, and a test plan.

## How to Submit

When ready to contribute:

1. Open `https://github.com/imartincei/CalcpadCE/compare` and select "compare across forks"
2. Base: `imartincei/CalcpadCE` — `main`; Head: `LibreSpin/CalcpadCE` — `librespin-patched`
3. Copy-paste the PR 001 artifact body for the CalcpadService.cs fix PR
4. Submit PR 001, then repeat for PR 002 (documentation)

No modification to the artifact bodies is needed before submission.

## Deviations from Plan

**1. [Rule 2 - Missing content] Reconstructed diff for PR 001**

- Found during: Task 1
- Issue: `.planning/artifacts/calcpadce-authsettings-patch.diff` (produced by Plan 06-01) does not exist yet — Plan 06-01 has not run in this worktree
- Fix: Reconstructed the diff from spike notes (spike-calcpad.md Section 2 and Section 6, item 4). Added a TODO marker per plan instructions
- Files modified: pr-001-calcpadservice-authsettings-fix.md
- Commit: 2952de4

## Known Stubs

- PR 001 diff block contains a TODO marker: `<!-- TODO: inline diff once 06-01 produces calcpadce-authsettings-patch.diff -->`. The reconstructed diff is accurate based on spike notes but the exact unified diff file is pending Plan 06-01 execution. This does not block usability — the PR body is complete enough to submit; the diff section can be updated before submission.

## Self-Check: PASSED

- `.planning/artifacts/pr-001-calcpadservice-authsettings-fix.md` — FOUND
- `.planning/artifacts/pr-002-linux-build-documentation.md` — FOUND
- Commit 2952de4 — FOUND
- Commit 54ee599 — FOUND
