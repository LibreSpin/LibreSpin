# LibreSpin

## What This Is

An open-source, AI-driven end-to-end PCB and embedded circuit design workflow tool — packaged as a Claude Code skill pack (like GSD). LibreSpin wraps Claude Code with domain-specific skills that guide hardware designers from natural language requirements through to production-ready Gerber files. Target users: EE professionals, hobbyists, students, and anyone designing circuit boards.

## Core Value

A minimal, lightweight harness that makes Claude Code an expert hardware design assistant — the intelligence lives in the prompts, not in code.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Hardware concept agent ported from hw-concept repo and packaged as LibreSpin skill
- [ ] npx installer distributes skill pack to ~/.claude/
- [ ] Concept agent works end-to-end: requirements interview through concept recommendation
- [ ] LibreSpin outputs stored in .librespin/ (separate from GSD .planning/)
- [ ] Existing hw-concept 9-phase workflow preserved (requirements, drafting, validation, component research, concept generation, self-critique, refinement, final generation, output)

### Out of Scope

- CalcPad CE skill — v2 milestone
- NGSpice simulation skill — v2 milestone
- ERC/DRC/DFM automated checks — v3 milestone
- Production file export (KiCad CLI) — v4 milestone
- Schematic layout — v5 milestone
- PCB layout + human review report — v6 milestone
- Provider abstraction (OpenAI, Gemini, etc.) — premature; prompts are the portable part
- Python runtime code — skill pack is markdown files, not a Python application
- GUI/TUI/web interface — CLI-first via Claude Code

## Context

**Architecture:** Pure Claude Code skill pack — markdown files for agents, commands, and templates. Same pattern as GSD. No Python runtime code needed. The pyproject.toml in the repo is vestigial from early planning; the actual deliverable is a skill pack installed via npx.

**hw-concept (source):** Existing 9-phase hardware concept agent at /home/william/repo/hw-concept. Node.js/npm package with Claude Code agent system. AGENT.md (6,960 lines), orchestrator command, YAML templates, configurable thresholds. Forked into LibreSpin — original repo stays alive separately.

**Target pipeline (full vision across all milestones):**
1. Natural language requirements interview (v1 — concept agent)
2. AI-assisted circuit calculations via CalcPad CE CLI (v2)
3. SPICE simulation via NGSpice CLI (v2)
4. ERC / DRC / DFM checks (v3)
5. Production file export via KiCad CLI (v4)
6. Schematic layout (v5)
7. PCB layout + human review report (v6)

**AI autonomy varies by pipeline stage:**
- Requirements interview: AI fully drives (conversational, like GSD questioning)
- CalcPad + NGSpice: AI autonomous — iterates calculations 3-5 times for accuracy
- Schematic/PCB layout: Open question — complex workflow, figure out in v5/v6
- ERC/DRC/DFM: Nearly autonomous with manual checks at the end
- Production export: Fully autonomous via KiCad CLI/Bash
- Human review: Human-driven (by definition)

**CalcPad CE:** Open-source community edition (MIT, github.com/imartincei/CalcpadCE). Unrelated to any employer IP — freely referenceable. CLI requires .NET 10 runtime (acceptable prerequisite). Integration via CLI wrapping, not Python bridge.

**Naming:** Display as `LibreSpin` (CamelCase); slugs/packages use `librespin` (lowercase). Follows LibrePCB convention: `Libre` = open source, `Spin` = EE slang for board design cycle.

**Inspiration:** GSD skill pack architecture. Claude Code on its own is a good model, but the harness (Claude Code) gives it real power. LibreSpin aims to be that harness for hardware design.

## Constraints

- **License**: MIT — open source from day one
- **EDA stack**: FOSS only — KiCad + NGSpice. No proprietary EDA dependencies
- **Minimalism**: Primary design goal. Fewer lines of code, not more. Markdown over Python. Prompt engineering over software engineering
- **CalcPad CE**: Clean-room skill implementation wrapping the CLI. Can reference CalcPad CE freely. Cannot reference or port employer's CalcPad skill
- **Distribution**: npx installer (like hw-concept) — copies skill files to ~/.claude/
- **Output directory**: .librespin/ per project (separate from GSD .planning/)
- **Python**: >= 3.10 (for any future utility scripts; not needed for v1 skill pack)
- **Node.js**: >= 18.0.0 (for npx installer)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pure Claude Code skill pack (Option A) | Maximizes minimalism. Intelligence in prompts, not code. GSD proves pattern scales. | -- Pending |
| Fork hw-concept, don't rewrite | It works. Port with minimal changes, refine in a later phase. Can't optimize what you haven't measured. | -- Pending |
| One GSD milestone per version | Each version has distinct scope. Planning v4 before v2 exists would be speculative. | -- Pending |
| .librespin/ for outputs | Avoids conflict with GSD .planning/. Clean separation of concerns. | -- Pending |
| npx installer | Proven pattern (hw-concept uses it). Familiar to Node.js ecosystem. | -- Pending |
| CalcPad CE CLI wrapping | Token-efficient skill that knows exact commands. .NET 10 runtime acceptable as prerequisite. | -- Pending |

## Milestone Overview

| Milestone | Version | Scope |
|-----------|---------|-------|
| 1 | v1 | Concept agent port + skill pack packaging + npx installer |
| 2 | v2 | CalcPad CE CLI skill + NGSpice simulation skill |
| 3 | v3 | Automated ERC/DRC/DFM checks |
| 4 | v4 | Production file export via KiCad CLI |
| 5 | v5 | Schematic layout |
| 6 | v6 | PCB layout + human review report |

**Current milestone:** 1 (v1)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-04 after initialization*
