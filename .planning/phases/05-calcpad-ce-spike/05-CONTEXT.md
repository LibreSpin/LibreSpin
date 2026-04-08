# Phase 5: CalcPad CE Spike - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Install CalcPad CE CLI and .NET 10 on this Linux system, run real headless tests, and record a go/no-go decision for Phase 6. This phase delivers verified ground-truth results — not a theoretical feasibility assessment. Deliverable is `.planning/spike-calcpad.md`.

No skill content is written in this phase. Phase 5 exists solely to de-risk Phase 6 before any implementation begins.

</domain>

<decisions>
## Implementation Decisions

### Installation scope
- **D-01:** Phase 5 includes installing .NET 10 runtime and CalcPad CE on this Linux system as part of the spike. Spike produces real test results — binary invocation confirmed, headless run executed, REST API called.

### Test depth
- **D-02:** Run a minimal `.cpd` worksheet headless via `Calcpad.Cli` — a simple engineering calculation (e.g., voltage divider, Ohm's law) is sufficient. Goal is to confirm the execution path works end-to-end, not to validate output quality.
- **D-03:** Also spin up `Calcpad.Server` and fire a `curl POST /api/calcpad/convert` test even if CLI works. This validates the CALC-08 fallback path before Phase 6 implements it. Both paths tested in the same spike.

### go/no-go criteria
- **D-04:** CLI working headless = go. `Calcpad.Cli input.cpd output.html -s` executes without GUI and produces output.
- **D-05:** REST API result is additional validation for CALC-08 — not the primary go/no-go gate. If CLI works but REST is broken, that's still a go (Phase 6 implements REST separately).
- **D-06:** If CLI is broken but REST works, document both paths and note that Phase 6 must use REST-only path — this is still a go.
- **D-07:** If neither CLI nor REST works, the spike records a no-go and Phase 6 must be replanned.

### Artifact location
- **D-08:** Spike output goes to `.planning/spike-calcpad.md` — not `.librespin/`. Spike is a planning artifact. `.librespin/` is reserved for project-level design output from concept runs. (Roadmap originally said `.librespin/spike-calcpad.md` — this overrides that.)

### VSCode extension (user workflow context)
- **D-09:** User may author `.cpd` worksheets in the VSCode CalcPad CE extension for preview/editing. LibreSpin skill runs them headless via CLI. This is user workflow, not LibreSpin skill scope — the spike does not need to test or validate the extension.

### Claude's Discretion
- Which specific `.cpd` test worksheet to write (simple voltage divider or equivalent is fine)
- `.deb` vs `.rpm` vs manual binary download for CalcPad CE on this specific Linux distro
- Exact `Calcpad.Server` startup flags and port choice for REST test

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CALC-01 and CALC-08 are the Phase 6 requirements this spike de-risks; spike findings determine which path Phase 6 uses
- `.planning/ROADMAP.md` §Phase 5 — Success criteria: binary name confirmed, headless batch verified, .NET 10 install path documented, REST API tested, go/no-go recorded

### External resources (to research during spike)
- CalcPad CE GitHub releases — source for Linux experimental builds (CLI + Server)
- .NET 10 Linux install docs — official Microsoft guide for Debian/Ubuntu/RHEL

### Prior phase context
- None required — Phase 5 is independent (ROADMAP.md: "Depends on: Nothing")

No external specs internal to this repo — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — no CalcPad-related code exists yet. `skills/concept/` and `agents/concept.md` are the only installed skill files.

### Established Patterns
- Skill files live in `skills/<name>/SKILL.md` — Phase 6 will create `skills/calcpad/SKILL.md`
- Agent files live in `agents/<name>.md` — Phase 6 will create `agents/calcpad.md`
- Output to `.librespin/<phase-dir>/` per the concept skill pattern

### Integration Points
- Spike output (`.planning/spike-calcpad.md`) is consumed by Phase 6 planner to determine CALC-01 and CALC-08 implementation path
- CalcPad CE CLI binary name and invocation syntax goes directly into Phase 6 skill content

</code_context>

<specifics>
## Specific Ideas

- User can install the CalcPad CE VSCode extension for worksheet authoring — this is separate from the LibreSpin skill and does not affect the spike scope
- If .NET 10 is the blocker (e.g., older distro), .NET 8 LTS may also be worth testing as a fallback runtime

</specifics>

<deferred>
## Deferred Ideas

- Output quality validation of CalcPad CE (realistic engineering calc test) — deferred to Phase 6 implementation
- CalcPad CE Windows path — user noted Windows is not available on this system; deferred to a future phase or CI environment
- `.cpd` worksheet authoring workflow via VSCode extension — user workflow, not LibreSpin skill scope for v0.2

</deferred>

---

*Phase: 05-calcpad-ce-spike*
*Context gathered: 2026-04-08*
