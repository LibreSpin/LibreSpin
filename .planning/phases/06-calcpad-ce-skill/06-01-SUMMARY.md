---
phase: 06-calcpad-ce-skill
plan: 01
subsystem: infra
tags: [github-actions, dotnet, calcpadce, binary-release, ci]

# Dependency graph
requires: []
provides:
  - LibreSpin/CalcpadCE fork with AuthSettings patch on branch librespin-patched
  - GitHub Actions workflow building self-contained linux-x64 Cli binary on tag push
  - GitHub Release v0.1.0-librespin with Cli binary asset downloadable via curl
  - Verified download URL: https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli (HTTP 200)
affects:
  - 06-02 (skill SKILL.md hard-codes this release URL for install)
  - 06-03 (upstream PR artifacts reference this fork)

# Tech tracking
tech-stack:
  added:
    - softprops/action-gh-release@v2 (GitHub Actions release action)
    - actions/setup-dotnet@v4 with dotnet-version 10.0.x
  patterns:
    - Fork-and-patch: apply source fix in fork branch, bake into released binary
    - Self-contained binary release: dotnet publish --self-contained true -p:PublishSingleFile=true

key-files:
  created:
    - .planning/phases/06-calcpad-ce-skill/06-01-fork-setup.md
    - .planning/artifacts/calcpadce-authsettings-patch.diff
    - .planning/artifacts/calcpadce-fork-workflow.yml
  modified: []

key-decisions:
  - "fork_owner: LibreSpin — fork lives at LibreSpin/CalcpadCE, matching D-01 exactly"
  - "permissions: contents: write required in workflow for softprops/action-gh-release to create releases (was missing, added as Rule 2 auto-fix)"
  - "Tag re-push strategy: deleted and re-pushed v0.1.0-librespin after permission fix to re-trigger CI"

patterns-established:
  - "Fork binary release: fork → checkout base commit → create branch → patch → push → add CI workflow → tag → verify download"

requirements-completed: [CALC-01]

# Metrics
duration: 25min
completed: 2026-04-08
---

# Phase 6 Plan 01: CalcPad CE Fork Setup Summary

**LibreSpin/CalcpadCE fork created with AuthSettings patch, GitHub Actions CI publishing self-contained linux-x64 Cli binary to GitHub Releases — download URL verified HTTP 200**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-08T17:05:00Z
- **Completed:** 2026-04-08T17:18:06Z
- **Tasks:** 3
- **Files modified:** 3 (created)

## Accomplishments
- Cloned LibreSpin/CalcpadCE fork (already existed), checked out base commit `3bc026b`, created `librespin-patched` branch
- Removed dead MacroParser.AuthSettings block from `Calcpad.Server/Core/Services/CalcpadService.cs` — fixes CS1061 build error on .NET 10
- Added `.github/workflows/build-calcpad-cli.yml` — CI builds self-contained linux-x64 `Cli` binary and creates GitHub Release on tag push
- Tagged `v0.1.0-librespin`, pushed tag, CI run `24148593487` succeeded — GitHub Release created
- Verified `curl -sLI https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli` returns `HTTP/2 200`

## Task Commits

1. **Task 1: Confirm fork owner** - `901ec28` (chore)
2. **Task 2: Apply AuthSettings patch** - `3b4928c` (feat)
3. **Task 3: Add CI workflow, tag, verify release** - `4a3baa2` (feat)

## Files Created/Modified
- `.planning/phases/06-calcpad-ce-skill/06-01-fork-setup.md` - All 10 required keys: fork_owner, fork_url, base_commit, patched_branch, patch_commit_sha, release_tag, release_url, cli_download_url, ci_run_id, verified_at
- `.planning/artifacts/calcpadce-authsettings-patch.diff` - Unified diff of CalcpadService.cs AuthSettings removal
- `.planning/artifacts/calcpadce-fork-workflow.yml` - GitHub Actions YAML for build-and-release

## Decisions Made
- Fork owner confirmed as LibreSpin (org exists, user has write access)
- Added `permissions: contents: write` to workflow — required for softprops/action-gh-release to create releases (Rule 2 auto-fix)
- Deleted and re-pushed tag after permission fix to re-trigger CI (standard tag re-push pattern)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added `permissions: contents: write` to GitHub Actions workflow**
- **Found during:** Task 3 (first CI run failed with HTTP 403 on release creation)
- **Issue:** softprops/action-gh-release@v2 requires explicit `contents: write` permission; GitHub Actions default token does not include it
- **Fix:** Added `permissions: contents: write` block at job level in workflow YAML; deleted tag and re-pushed to re-trigger CI
- **Files modified:** .github/workflows/build-calcpad-cli.yml in fork; .planning/artifacts/calcpadce-fork-workflow.yml
- **Verification:** CI run 24148593487 succeeded; GitHub Release created; curl returns HTTP 200
- **Committed in:** 4a3baa2 (Task 3 commit, updated artifact reflects the fix)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Permission fix essential — without it no release asset is created and Plan 02 install URL would 404. No scope creep.

## Issues Encountered
- First CI run (24148517247) failed — GitHub Actions default token lacks `contents: write`, needed for softprops/action-gh-release to create a release. Added `permissions: contents: write` block and re-triggered via tag delete + re-push. Second run (24148593487) succeeded.

## URL for Plan 02

Plan 02 must hard-code this URL in `skills/calcpad/SKILL.md`:

```
https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli
```

## Next Phase Readiness
- GitHub Release v0.1.0-librespin is live with Cli binary — Plan 02 can reference this URL
- AuthSettings patch is baked into every binary built from librespin-patched branch
- Fork setup log complete at `.planning/phases/06-calcpad-ce-skill/06-01-fork-setup.md`

---
*Phase: 06-calcpad-ce-skill*
*Completed: 2026-04-08*
