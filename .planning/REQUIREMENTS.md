# Requirements: LibreSpin

**Defined:** 2026-04-04
**Core Value:** A minimal, lightweight harness that makes Claude Code an expert hardware design assistant — the intelligence lives in the prompts, not in code.

## v1 Requirements

Requirements for initial release (Milestone 1). Each maps to roadmap phases.

### Packaging

- [ ] **PKG-01**: User can install LibreSpin skill pack via `npx librespin-install` to ~/.claude/
- [x] **PKG-02**: User can uninstall LibreSpin cleanly (all installed files removed)
- [x] **PKG-03**: Repository includes README with quick-start instructions (install, first run, what to expect)
- [ ] **PKG-04**: package.json has correct metadata (name, version, license, bin entry)
- [x] **PKG-05**: `.claude-plugin/plugin.json` manifest exists with correct name, description, and version
- [x] **PKG-06**: Repository serves as a Claude Code plugin — `/plugin marketplace add LibreSpin/LibreSpin` then `/plugin install librespin` works and installs skills/agents/templates

### Skill Structure

- [x] **SKL-01**: Orchestrator lives at ~/.claude/skills/librespin/concept.md (skills/ format, not deprecated commands/)
- [x] **SKL-02**: Worker agent lives at ~/.claude/agents/librespin/AGENT.md with correct frontmatter (name, description, tools, color)
- [x] **SKL-03**: YAML templates installed to ~/.claude/librespin/templates/ (requirements.yaml, concept-template.md, overview-template.md)
- [x] **SKL-04**: Config schema supports draft_count, iteration_limit, confidence_threshold

### Namespace Port

- [x] **NSP-01**: Zero occurrences of "hw-concept" remain in installed skill files (all 81+ references replaced)
- [x] **NSP-02**: All agent output writes to .librespin/ directory (not .planning/hw-concept/)
- [x] **NSP-03**: State file persists at .librespin/state.md (not .planning/hw-concept-state.md)
- [x] **NSP-04**: All Tool references use "Agent" (not deprecated "Task" alias)
- [x] **NSP-05**: Dead --output DIR parameter either removed or fully wired to work
- [x] **NSP-06**: `/librespin:concept` command is accessible in Claude Code after install

### Concept Workflow

- [x] **CW-01**: User can gather hardware requirements interactively via AskUserQuestion (Phase 1)
- [x] **CW-02**: User can provide requirements via YAML file import (Phase 1 alternate input)
- [x] **CW-03**: Agent generates 5-6 diverse architecture concepts from requirements (Phase 2)
- [x] **CW-04**: Agent validates concepts against confidence threshold with web research (Phase 3)
- [x] **CW-05**: Agent researches specific components with real part numbers and BOMs (Phase 4)
- [x] **CW-06**: Agent generates detailed block diagrams with MPNs and spec analysis (Phase 5)
- [x] **CW-07**: Agent self-critiques and refines concepts iteratively (Phases 6-8)
- [x] **CW-08**: Agent produces comparison matrix with recommended concept (Phase 9)
- [x] **CW-09**: Workflow state persists across invocations — user can resume interrupted runs
- [x] **CW-10**: Completeness scoring works (critical/important/nice-to-have weighted at 50/30/20)

## v0.2 Requirements

Requirements for Milestone 2 (v0.2 — CalcPad & NGSpice). Phases 5–8.

### CalcPad CE Skill

- [x] **CALC-01**: Skill verifies CalcPad CE CLI prerequisites (Calcpad.Cli + .NET 10 runtime) and provides platform-appropriate install instructions if absent (Linux: .deb/.rpm from CE experimental; other: .NET-dependent binary)
- [x] **CALC-08**: Skill falls back to `Calcpad.Server` REST API (via `curl`) when CLI binary is unavailable — server callable as `POST /api/calcpad/convert`
- [x] **CALC-02**: Skill reads concept output from `.librespin/07-final-output/` to extract design targets
- [x] **CALC-03**: Skill generates a `.cpd` worksheet for the selected circuit block
- [x] **CALC-04**: Skill runs `Calcpad.Cli input.cpd output.html -s` headless and extracts calculated values
- [x] **CALC-05**: Skill validates calculated values against design targets and presents pass/fail summary
- [x] **CALC-06**: User reviews and approves calculations before proceeding (human review gate)
- [x] **CALC-07**: Skill saves `.cpd` worksheet and results to `.librespin/08-calculations/`

### NGSpice Simulation Skill

- [x] **SIM-01**: Skill verifies NGSpice prerequisite (ngspice in PATH) and provides install instructions if absent
- [x] **SIM-02**: Skill reads component values from `.librespin/08-calculations/` and generates a syntactically valid `.cir` SPICE netlist
- [x] **SIM-03**: Skill selects appropriate analysis type (`.op` / `.tran` / `.ac` / `.dc`) based on circuit type or user selection
- [x] **SIM-04**: Skill runs `ngspice -b circuit.cir` in batch mode and detects errors by scanning stdout/stderr (not exit code)
- [x] **SIM-05**: Skill diagnoses convergence failures with specific remediation suggestions (Timestep too small, singular matrix, etc.)
- [x] **SIM-06**: Skill parses simulation output via `.control` + `wrdata` and presents scalar results summary
- [x] **SIM-07**: Skill validates simulation results against design spec and suggests specific component change when spec is missed
- [x] **SIM-08**: Skill generates a matplotlib waveform plot and saves PNG to `.librespin/09-simulation/` (optional — requires Python + matplotlib)
- [x] **SIM-09**: User reviews and approves simulation results before marking complete (human review gate)
- [x] **SIM-10**: Skill saves netlist and results to `.librespin/09-simulation/`

### Installer

- [x] **PKG-07**: `bin/install.js` copies calcpad and simulate skill files alongside the concept skill

## v0.3 Requirements

Requirements for Milestone 3 (v0.3 — Distributor API Integration). Phase 999.3.

### Distributor API Integration

- [ ] **DIST-01**: /librespin:setup skill walks user through credential entry for Nexar, DigiKey, Mouser, Arrow, Newark/Farnell, and LCSC — each supplier is optional and can be skipped
- [ ] **DIST-02**: Nexar OAuth 2.0 client credentials implemented via curl; free tier quota (100 parts) tracked in credentials file; user warned at 80 parts and blocked at 100 with clear message
- [ ] **DIST-03**: DigiKey OAuth 2.0 client credentials implemented via curl; token auto-refreshed before each API call (10-minute lifetime); X-DIGIKEY-Client-Id header included on all requests
- [ ] **DIST-04**: Mouser API key auth implemented; part_api_key stored in [mouser] credentials section; POST endpoint used for part search
- [ ] **DIST-05**: Arrow API key auth implemented; both login (email) and api_key stored in [arrow] section; both required as URI params
- [ ] **DIST-06**: Newark/Farnell element14 API key auth implemented; storefront selectable (us.newark.com default); LCSC supports official API key or public wmsc endpoint fallback
- [ ] **DIST-07**: Credentials stored in INI format at ~/.librespin/credentials; OAuth tokens cached with expiry timestamps; setup validates each API with LM358 test call before saving
- [ ] **DIST-08**: Concept skill Phase 4 enrichment fires automatically after MPN selection when credentials file is present; queries all configured suppliers per MPN
- [ ] **DIST-09**: Phase 4 falls back to existing WebFetch behavior when ~/.librespin/credentials is absent or all sections empty — no errors raised (D-13)
- [ ] **DIST-10**: Any supplier API failure logs inline and continues; workflow never blocked by API errors (D-17)
- [ ] **DIST-11**: Enrichment results appended to .librespin/04-bom/ BOM entries; downstream output contracts (07-final-output/, 08-calculations/) unchanged (D-14)
- [x] **DIST-12**: bin/install.js copies skills/setup/ alongside existing skills; npx librespin-install --uninstall removes skills/setup/ cleanly

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Context Optimization (v0.2 backlog — consider for v0.2 if SKILL.md pressure observed)

- **OPT-01**: SKILL.md split into per-phase files to reduce 239 KB context pressure (backlog 999.2)
- **OPT-02**: Auto-chain phases to eliminate re-invoke between phases (backlog 999.1)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Python runtime code | Skill pack is markdown files — no Python application needed |
| Provider abstraction (OpenAI, Gemini) | Prompts are the portable part; abstraction layer is premature |
| GUI / TUI / web interface | KiCad provides GUI; LibreSpin complements via CLI |
| Autonomous BOM without human gate | Research documents hallucination risks (wrong topology, fabricated components) |
| Fully autonomous end-to-end pipeline | Accuracy compounds across phases; human checkpoints are the right architecture |
| KiCad integration (schematic/PCB) | v4-v6 milestones |
| ERC/DRC/DFM checks | v3 milestone |
| Production file export | v4 milestone |
| npm marketplace / plugin format | Moved to v1 — PKG-05, PKG-06 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PKG-01 | Phase 1 | Pending |
| PKG-02 | Phase 4 | Complete |
| PKG-03 | Phase 4 | Complete |
| PKG-04 | Phase 1 | Pending |
| PKG-05 | Phase 4 | Complete |
| PKG-06 | Phase 4 | Complete |
| SKL-01 | Phase 2 | Complete |
| SKL-02 | Phase 2 | Complete |
| SKL-03 | Phase 2 | Complete |
| SKL-04 | Phase 2 | Complete |
| NSP-01 | Phase 2 | Complete |
| NSP-02 | Phase 2 | Complete |
| NSP-03 | Phase 2 | Complete |
| NSP-04 | Phase 2 | Complete |
| NSP-05 | Phase 2 | Complete |
| NSP-06 | Phase 2 | Complete |
| CW-01 | Phase 3 | Complete |
| CW-02 | Phase 3 | Complete |
| CW-03 | Phase 3 | Complete |
| CW-04 | Phase 3 | Complete |
| CW-05 | Phase 3 | Complete |
| CW-06 | Phase 3 | Complete |
| CW-07 | Phase 3 | Complete |
| CW-08 | Phase 3 | Complete |
| CW-09 | Phase 3 | Complete |
| CW-10 | Phase 3 | Complete |
| CALC-01 | Phase 6 | Complete |
| CALC-02 | Phase 6 | Complete |
| CALC-03 | Phase 6 | Complete |
| CALC-04 | Phase 6 | Complete |
| CALC-05 | Phase 6 | Complete |
| CALC-06 | Phase 6 | Complete |
| CALC-07 | Phase 6 | Complete |
| CALC-08 | Phase 6 | Complete |
| SIM-01 | Phase 7 | Complete |
| SIM-02 | Phase 7 | Complete |
| SIM-03 | Phase 7 | Complete |
| SIM-04 | Phase 7 | Complete |
| SIM-05 | Phase 7 | Complete |
| SIM-06 | Phase 7 | Complete |
| SIM-07 | Phase 7 | Complete |
| SIM-08 | Phase 7 | Complete |
| SIM-09 | Phase 7 | Complete |
| SIM-10 | Phase 7 | Complete |
| PKG-07 | Phase 8 | Complete |
| DIST-01 | Phase 999.3 | Pending |
| DIST-02 | Phase 999.3 | Pending |
| DIST-03 | Phase 999.3 | Pending |
| DIST-04 | Phase 999.3 | Pending |
| DIST-05 | Phase 999.3 | Pending |
| DIST-06 | Phase 999.3 | Pending |
| DIST-07 | Phase 999.3 | Pending |
| DIST-08 | Phase 999.3 | Pending |
| DIST-09 | Phase 999.3 | Pending |
| DIST-10 | Phase 999.3 | Pending |
| DIST-11 | Phase 999.3 | Pending |
| DIST-12 | Phase 999.3 | Complete |

**Coverage:**
- v1 requirements: 26 total (Phases 1–4, all complete)
- v0.2 requirements: 19 total (Phases 5–8)
- v0.3 requirements: 12 total (Phase 999.3)
- Mapped to phases: 57
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-08 — v0.2 traceability added*
