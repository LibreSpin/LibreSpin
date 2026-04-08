# Phase 5: CalcPad CE Spike - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 05-calcpad-ce-spike
**Areas discussed:** Installation scope, REST API test depth, Artifact location, go/no-go criteria, Test depth

---

## Installation scope

| Option | Description | Selected |
|--------|-------------|----------|
| Install & test | Install .NET 10 + CalcPad CE on this Linux system as part of the spike. Run real tests. | ✓ |
| Feasibility only, no install | Research the Linux path without installing — produce risk assessment only. | |
| Pivot — skip CalcPad CE | Descope CalcPad CE from v0.2 entirely; explore alternatives. | |

**User's choice:** Install & test — spike produces real ground-truth results.
**Notes:** User initially considered punting the Windows version of CalcPad CE; clarified that .NET is cross-platform and Linux builds exist (experimental). Spike will validate whether these actually work.

---

## REST API test depth

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, test REST too | Spin up Calcpad.Server, fire curl POST — validate CALC-08 fallback before Phase 6 implements it. | ✓ |
| No, skip REST for now | If CLI works, test REST during Phase 6 implementation only. | |

**User's choice:** Test REST too — validates CALC-08 fallback path in the same spike.
**Notes:** User was unfamiliar with Calcpad.Server; clarified it's a locally-started HTTP server (not a hosted API) that accepts .cpd content via POST and returns computed results.

---

## Artifact location

| Option | Description | Selected |
|--------|-------------|----------|
| .planning/spike-calcpad.md | Planning artifact, not project output. Consistent with GSD pattern. | ✓ |
| .librespin/spike-calcpad.md | Follow roadmap as written. Create .librespin/ manually. | |

**User's choice:** `.planning/spike-calcpad.md`
**Notes:** Overrides the roadmap's `.librespin/spike-calcpad.md` — `.librespin/` is reserved for per-project design output from concept runs.

---

## go/no-go criteria

| Option | Description | Selected |
|--------|-------------|----------|
| CLI works headless | Calcpad.Cli runs a .cpd file without GUI = go. REST is additional, not gating. | ✓ |
| Either CLI or REST works | Either path = go; Phase 6 picks the available one. | |
| Both must work | Both CLI and REST required before proceeding to Phase 6. | |

**User's choice:** CLI works headless — primary gate. REST is additional validation for CALC-08.

---

## Test depth

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal .cpd file | Write a trivial worksheet (voltage divider / Ohm's law) and verify headless execution end-to-end. | ✓ |
| Binary runs only | Confirm --version or --help executes. Quick sanity check only. | |
| Realistic engineering calc | Full circuit block test for output quality confidence. | |

**User's choice:** Minimal .cpd file — enough to confirm execution path; output quality deferred to Phase 6.

---

## VSCode Extension

| Option | Description | Selected |
|--------|-------------|----------|
| Author .cpd worksheets | Use extension to write/preview worksheets; LibreSpin skill runs them headless. | ✓ |
| User-facing calc tool | Skill generates worksheet; user opens in extension to see interactive results. | |
| Not sure yet | Exploring role. | |

**User's choice:** Authoring tool — user-side workflow, not LibreSpin skill scope.

---

## Claude's Discretion

- Specific `.cpd` test worksheet content (simple engineering calc)
- Linux distro-specific install method for .NET 10 and CalcPad CE
- `Calcpad.Server` startup flags and port

## Deferred Ideas

- Windows CalcPad CE testing — not available on this system; deferred
- Realistic engineering calc test for output quality — deferred to Phase 6
- VSCode CalcPad extension as user workflow — out of LibreSpin skill scope for v0.2
