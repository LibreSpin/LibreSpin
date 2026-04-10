---
gsd_state_version: 1.0
milestone: v0.2
milestone_name: CalcPad & NGSpice
status: executing
stopped_at: Completed 1000-03-PLAN.md (Phase 5, 6, 7 JS-to-prose rewrite)
last_updated: "2026-04-10T02:47:05.679Z"
last_activity: 2026-04-10
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 17
  completed_plans: 16
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-08)

**Core value:** A minimal, lightweight harness that makes Claude Code an expert hardware design assistant — the intelligence lives in the prompts, not in code.
**Current focus:** Phase 1000 — concept-skill-js-to-prose

## Current Position

Phase: 1000 (concept-skill-js-to-prose) — EXECUTING
Plan: 4 of 4
Status: Ready to execute
Last activity: 2026-04-10

Progress: [----------] 0% (0/4 phases)

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.MD Key Decisions table.
Carried forward from v0.1:

- Pure Claude Code skill pack chosen (not Python runtime)
- Fork hw-concept, port with minimal changes — no rewrite
- .librespin/ for all agent output (separate from GSD .planning/)
- skills/ install target from day one (not deprecated commands/)
- Zero npm dependencies — pure Node.js stdlib for installer
- Flat agent file pattern (agents/name.md not agents/name/AGENT.md)
- CalcPad CE CLI wrapping — token-efficient skill, .NET 10 runtime acceptable as prereq
- SKILL.md split (OPT-01) deferred — context pressure not observed through v0.1 Phase 7

v0.2 roadmap decisions:

- Phase 5 is a spike (no requirements assigned) — it de-risks Phase 6 by confirming CalcPad CE CLI works headless on Linux before any skill content is written
- CALC-01 (prereq check) and CALC-08 (REST API fallback) both live in Phase 6 — spike findings determine which path the skill implements
- SIM-08 (matplotlib plot) is explicitly optional within Phase 7 — requires Python + matplotlib, which is not guaranteed in all environments
- Phase 8 (installer) is deferred until Phases 6 and 7 are stable — copy paths must be final before install.js is updated
- [Phase 05]: CalcpadCE CLI binary named 'Cli' on Linux (not 'Calcpad.Cli') — Phase 6 skill must use correct name
- [Phase 05]: Calcpad.Server targets net10.0 confirmed; AuthSettings API removed from MacroParser in active dev — workaround: delete optional block from CalcpadService.cs
- [Phase 05]: dotnet-install.sh to /tmp/dotnet10 avoids sudo requirement in agent env; binaries are self-contained so no dotnet needed at runtime
- [Phase 05]: Server port is not always 8080 — read from startup log at runtime; Phase 6 skill must parse 'Now listening on:' line
- [Phase 05]: CLI success detection: exit code + output file existence, not stdout parsing (silent with -s flag)
- [Phase 05]: Both CLI and REST paths confirmed working — Phase 6 go/no-go: GO on both integration strategies
- [Phase 05-calcpad-ce-spike]: Phase 5 verdict GO: both CalcpadCE CLI and REST API working on Linux; CLI-first recommended for Phase 6
- [Phase 05-calcpad-ce-spike]: Phase 6 binary name: Cli (not Calcpad.Cli) — must use correct Linux assembly name
- [Phase 05-calcpad-ce-spike]: Phase 6 server port: read dynamically from startup log or use --urls flag (port 9420 observed, not 8080)
- [Phase 05-calcpad-ce-spike]: Phase 6 required upstream PR #1: fix CalcpadService.cs AuthSettings regression in imartincei/CalcpadCE
- [Phase 05-calcpad-ce-spike]: Phase 6 required upstream PR #2: document Linux build path deviations in CalcpadCE README
- [Phase 06]: PR artifacts are documentation-only — user submits manually to imartincei/CalcpadCE when ready
- [Phase 06-calcpad-ce-skill]: fork_owner: LibreSpin — fork lives at LibreSpin/CalcpadCE, matching D-01 exactly
- [Phase 06-calcpad-ce-skill]: GitHub Actions workflow requires permissions: contents: write for softprops/action-gh-release to create releases
- [Phase 06-calcpad-ce-skill]: doc/template.html required alongside Cli binary — not embedded in PublishSingleFile; install instructions updated
- [Phase 06-calcpad-ce-skill]: Output contract frozen: .librespin/08-calculations/{slug}.cpd/.html/-summary.md for Phase 7 NGSpice consumption
- [Phase 07]: run_in_background: false enforced on simulate agent — AskUserQuestion stalls silently if backgrounded
- [Phase 07]: wrdata ASCII output chosen over binary .raw — plain text parseable by awk/grep
- [Phase 07-ngspice-simulation-skill]: agents/simulate.md requires no changes: all documented error substrings and wrdata parse logic confirmed accurate against NGSpice 42 on Ubuntu noble
- [Phase 07-ngspice-simulation-skill]: Floating-node circuit does NOT trigger singular matrix in NGSpice 42; only true topological singularity (parallel voltage sources) triggers ERR-2
- [Phase 08]: Templates source path corrected from skills/librespin-concept/templates to skills/concept/templates
- [Phase 999.3]: Mouser uses simple API key (not OAuth) — D-04 assumption corrected by research before implementation
- [Phase 999.3]: LCSC dual-mode: official OpenAPI (api_key) or public wmsc.lcsc.com endpoint as first-class choices
- [Phase 999.3]: DigiKey X-DIGIKEY-Client-Id header required on all API requests — critical auth requirement
- [Phase 999.3-02]: Distributor enrichment block injected as markdown prose section in Phase 4 (not inside JS pseudocode); exit 0 on missing credentials; DigiKey X-DIGIKEY-Client-Id header mandatory; Nexar parts_used persisted in credentials file
- [Phase 999.3]: DIST requirements numbered DIST-01 through DIST-12 covering all 6 suppliers plus credential storage, enrichment integration, fallback, error resilience, output contract, and installer
- [Phase 1000-concept-skill-js-to-prose]: Replace JS pseudo-code blocks with prose bullet lists and tables (3-10 items each) — format change only, behavioral fidelity preserved
- [Phase 1000-02]: Bash distributor enrichment block in Phase 4 preserved as bash fence — functional bash code, not pseudo-code, correctly excluded from JS removal
- [Phase 1000]: 37 JS fences in Phases 5-7 replaced with prose; quality scoring weights (60/15/15/10), iteration limits (1-10 default 5), plateau threshold (5%), and 80% quality pass threshold all preserved verbatim

### Roadmap Evolution

2026-04-08 — v0.2 roadmap created. 4 phases (5–8), 19 requirements mapped (CALC-01 through CALC-08, SIM-01 through SIM-10, PKG-07). Phase 5 spike precedes Phase 6 calcpad skill; Phase 7 simulate reads calcpad output; Phase 8 installer follows both skills.

- Phase 1000 added (2026-04-09): Concept Skill JS-to-Prose — replace 3,267 lines of never-executed JavaScript with concise prose, targeting 254KB → ~35KB reduction. Pre-ship blocker for v0.1.

### Pending Todos

None.

### Blockers/Concerns

None. Phase 5 spike resolved: CalcPad CE CLI and REST API both working on Linux (GO verdict). Phase 6 unblocked.

## Session Continuity

Last session: 2026-04-10T02:47:05.674Z
Stopped at: Completed 1000-03-PLAN.md (Phase 5, 6, 7 JS-to-prose rewrite)
Resume file: None
