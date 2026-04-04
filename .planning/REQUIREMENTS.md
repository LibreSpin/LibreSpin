# Requirements: LibreSpin

**Defined:** 2026-04-04
**Core Value:** A minimal, lightweight harness that makes Claude Code an expert hardware design assistant — the intelligence lives in the prompts, not in code.

## v1 Requirements

Requirements for initial release (Milestone 1). Each maps to roadmap phases.

### Packaging

- [ ] **PKG-01**: User can install LibreSpin skill pack via `npx librespin-install` to ~/.claude/
- [ ] **PKG-02**: User can uninstall LibreSpin cleanly (all installed files removed)
- [ ] **PKG-03**: Repository includes README with quick-start instructions (install, first run, what to expect)
- [ ] **PKG-04**: package.json has correct metadata (name, version, license, bin entry)
- [ ] **PKG-05**: `.claude-plugin/plugin.json` manifest exists with correct name, description, and version
- [ ] **PKG-06**: Repository serves as a Claude Code plugin — `/plugin marketplace add LibreSpin/LibreSpin` then `/plugin install librespin` works and installs skills/agents/templates

### Skill Structure

- [ ] **SKL-01**: Orchestrator lives at ~/.claude/skills/librespin/concept.md (skills/ format, not deprecated commands/)
- [ ] **SKL-02**: Worker agent lives at ~/.claude/agents/librespin/AGENT.md with correct frontmatter (name, description, tools, color)
- [ ] **SKL-03**: YAML templates installed to ~/.claude/librespin/templates/ (requirements.yaml, concept-template.md, overview-template.md)
- [ ] **SKL-04**: Config schema supports draft_count, iteration_limit, confidence_threshold

### Namespace Port

- [ ] **NSP-01**: Zero occurrences of "hw-concept" remain in installed skill files (all 81+ references replaced)
- [ ] **NSP-02**: All agent output writes to .librespin/ directory (not .planning/hw-concept/)
- [ ] **NSP-03**: State file persists at .librespin/state.md (not .planning/hw-concept-state.md)
- [ ] **NSP-04**: All Tool references use "Agent" (not deprecated "Task" alias)
- [ ] **NSP-05**: Dead --output DIR parameter either removed or fully wired to work
- [ ] **NSP-06**: `/librespin:concept` command is accessible in Claude Code after install

### Concept Workflow

- [ ] **CW-01**: User can gather hardware requirements interactively via AskUserQuestion (Phase 1)
- [ ] **CW-02**: User can provide requirements via YAML file import (Phase 1 alternate input)
- [ ] **CW-03**: Agent generates 5-6 diverse architecture concepts from requirements (Phase 2)
- [ ] **CW-04**: Agent validates concepts against confidence threshold with web research (Phase 3)
- [ ] **CW-05**: Agent researches specific components with real part numbers and BOMs (Phase 4)
- [ ] **CW-06**: Agent generates detailed block diagrams with MPNs and spec analysis (Phase 5)
- [ ] **CW-07**: Agent self-critiques and refines concepts iteratively (Phases 6-8)
- [ ] **CW-08**: Agent produces comparison matrix with recommended concept (Phase 9)
- [ ] **CW-09**: Workflow state persists across invocations — user can resume interrupted runs
- [ ] **CW-10**: Completeness scoring works (critical/important/nice-to-have weighted at 50/30/20)

## v2 Requirements

Deferred to Milestone 2. Tracked but not in current roadmap.

### Context Optimization

- **OPT-01**: AGENT.md split into agent + reference files to reduce context pressure
- **OPT-02**: Streamline bloated sections identified through v1 usage

### CalcPad CE Skill

- **CALC-01**: User can run circuit calculations via /librespin:calcpad command
- **CALC-02**: Skill wraps CalcPad CE CLI with token-efficient prompts
- **CALC-03**: AI iterates calculations 3-5 times for accuracy verification

### NGSpice Skill

- **SIM-01**: User can run SPICE simulations via /librespin:simulate command
- **SIM-02**: Skill generates NGSpice netlists from concept agent outputs
- **SIM-03**: AI interprets simulation results and suggests corrections

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
| PKG-02 | Phase 4 | Pending |
| PKG-03 | Phase 4 | Pending |
| PKG-04 | Phase 1 | Pending |
| PKG-05 | Phase 4 | Pending |
| PKG-06 | Phase 4 | Pending |
| SKL-01 | Phase 2 | Pending |
| SKL-02 | Phase 2 | Pending |
| SKL-03 | Phase 2 | Pending |
| SKL-04 | Phase 2 | Pending |
| NSP-01 | Phase 2 | Pending |
| NSP-02 | Phase 2 | Pending |
| NSP-03 | Phase 2 | Pending |
| NSP-04 | Phase 2 | Pending |
| NSP-05 | Phase 2 | Pending |
| NSP-06 | Phase 2 | Pending |
| CW-01 | Phase 3 | Pending |
| CW-02 | Phase 3 | Pending |
| CW-03 | Phase 3 | Pending |
| CW-04 | Phase 3 | Pending |
| CW-05 | Phase 3 | Pending |
| CW-06 | Phase 3 | Pending |
| CW-07 | Phase 3 | Pending |
| CW-08 | Phase 3 | Pending |
| CW-09 | Phase 3 | Pending |
| CW-10 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after roadmap creation*
