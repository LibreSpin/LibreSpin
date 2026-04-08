# Roadmap: LibreSpin

## Milestones

- ✅ **v0.1 MVP** — Phases 1–4 (shipped 2026-04-07) → [archive](.planning/milestones/v0.1-ROADMAP.md)
- 📋 **v0.2** — CalcPad CE + NGSpice (phases 5–8)

## Phases

<details>
<summary>✅ v0.1 MVP (Phases 1–4) — SHIPPED 2026-04-07</summary>

- [x] Phase 1: Package Scaffold (1/1 plans) — completed 2026-04-05
- [x] Phase 2: Namespace Port (2/2 plans) — completed 2026-04-05
- [x] Phase 3: End-to-End Validation (4/4 plans) — completed 2026-04-06
- [x] Phase 4: Distribution and Docs (3/3 plans) — completed 2026-04-07

</details>

### 📋 v0.2 CalcPad & NGSpice

- [ ] **Phase 5: CalcPad CE Spike** — Verify CalcPad CE CLI binary, .NET 10, headless mode, and REST API fallback on this system
- [ ] **Phase 6: CalcPad CE Skill** — `/librespin:calcpad` skill — prereq check, worksheet generation, CLI invocation, validation, human gate, output save
- [ ] **Phase 7: NGSpice Simulation Skill** — `/librespin:simulate` skill — netlist generation, batch run, result parsing, convergence diagnosis, human gate, output save
- [ ] **Phase 8: Installer Update** — Update `bin/install.js` to copy calcpad and simulate skill files alongside concept

### 🗂 Backlog

- [ ] 999.1: Auto-chain phases in librespin-concept (eliminate re-invoke between phases)
- [ ] 999.2: Split SKILL.md into per-phase files (reduce 239KB context pressure)

## Phase Details

### Phase 5: CalcPad CE Spike
**Goal**: Confirm whether CalcPad CE CLI can be used headless on the target system before writing any skill content
**Depends on**: Nothing (independent investigation)
**Requirements**: _(none — spike de-risks Phase 6; findings determine CALC-01 and CALC-08 implementation approach)_
**Success Criteria** (what must be TRUE):
  1. Binary name and invocation path confirmed (e.g. `Calcpad.Cli` vs `calcpad-cli`)
  2. Headless batch mode verified — `Calcpad.Cli input.cpd output.html -s` executes without GUI
  3. .NET 10 runtime install path documented for Linux (deb/rpm/manual)
  4. `Calcpad.Server` REST API tested — `POST /api/calcpad/convert` returns computed results via `curl`
  5. Go/no-go decision recorded in `.librespin/spike-calcpad.md` with recommended approach for Phase 6
**Plans**: 3 plans
- [x] 05-01-PLAN.md — Install .NET 10 SDK and build CalcpadCE CLI + Server binaries
- [ ] 05-02-PLAN.md — Run headless CLI test and REST API test, capture evidence
- [ ] 05-03-PLAN.md — Write spike-calcpad.md decision report and human review checkpoint

### Phase 6: CalcPad CE Skill
**Goal**: Users can run AI-assisted circuit calculations via `/librespin:calcpad` with worksheet generation, CLI invocation, and human review
**Depends on**: Phase 5 (spike determines implementation path)
**Requirements**: CALC-01, CALC-02, CALC-03, CALC-04, CALC-05, CALC-06, CALC-07, CALC-08
**Success Criteria** (what must be TRUE):
  1. User can invoke `/librespin:calcpad` and the skill checks for CalcPad CE CLI prerequisites — providing platform-appropriate install instructions when absent
  2. When CLI is unavailable, skill falls back to `Calcpad.Server` REST API via `curl` (CALC-08 path)
  3. Skill reads design targets from `.librespin/07-final-output/` and generates a `.cpd` worksheet for the selected circuit block
  4. Skill runs the CLI (or REST API) headless and presents a pass/fail validation summary against design targets (e.g. "Vout = 3.29 V, target 3.3 V ±2%, PASS")
  5. User can review calculations and approve before proceeding; worksheet and results are saved to `.librespin/08-calculations/`
**Plans**: TBD
**UI hint**: no

### Phase 7: NGSpice Simulation Skill
**Goal**: Users can run SPICE simulation via `/librespin:simulate`, with netlist generation, batch execution, convergence diagnosis, and human review
**Depends on**: Phase 6 (component values contract from `.librespin/08-calculations/` must be stable)
**Requirements**: SIM-01, SIM-02, SIM-03, SIM-04, SIM-05, SIM-06, SIM-07, SIM-08, SIM-09, SIM-10
**Success Criteria** (what must be TRUE):
  1. User can invoke `/librespin:simulate` and the skill verifies NGSpice is in PATH — providing install instructions when absent
  2. Skill reads component values from `.librespin/08-calculations/`, generates a syntactically valid `.cir` SPICE netlist with the appropriate analysis type (`.op` / `.tran` / `.ac` / `.dc`)
  3. Skill runs `ngspice -b circuit.cir`, detects errors by scanning stdout/stderr (not exit code), and presents specific convergence remediation suggestions on failure
  4. Skill parses scalar results and validates them against design spec — suggesting a specific component change when a spec is missed
  5. User can review simulation results and approve before proceeding; netlist and results are saved to `.librespin/09-simulation/`
  6. _(Optional — requires Python + matplotlib)_ Skill generates a waveform PNG saved to `.librespin/09-simulation/` (SIM-08)
**Plans**: TBD

### Phase 8: Installer Update
**Goal**: Both new skills are distributed to users automatically — via plugin marketplace and npx — without manual file copying
**Depends on**: Phase 6 and Phase 7 (skill file paths must be stable before installer is updated)
**Requirements**: PKG-07
**Success Criteria** (what must be TRUE):
  1. Running `npx librespin-install` copies `skills/calcpad/SKILL.md`, `skills/simulate/SKILL.md`, `agents/calcpad.md`, and `agents/simulate.md` alongside the existing concept files
  2. After install, `/librespin:calcpad` and `/librespin:simulate` are accessible in Claude Code
  3. Running `npx librespin-install --uninstall` removes all four new files cleanly
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Package Scaffold | v0.1 | 1/1 | Complete | 2026-04-05 |
| 2. Namespace Port | v0.1 | 2/2 | Complete | 2026-04-05 |
| 3. End-to-End Validation | v0.1 | 4/4 | Complete | 2026-04-06 |
| 4. Distribution and Docs | v0.1 | 3/3 | Complete | 2026-04-07 |
| 5. CalcPad CE Spike | v0.2 | 1/3 | In Progress|  |
| 6. CalcPad CE Skill | v0.2 | 0/? | Not started | - |
| 7. NGSpice Simulation Skill | v0.2 | 0/? | Not started | - |
| 8. Installer Update | v0.2 | 0/? | Not started | - |
