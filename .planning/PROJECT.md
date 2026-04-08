# LibreSpin

## What This Is

An open-source, AI-driven hardware concept design tool — packaged as a Claude Code skill pack. LibreSpin wraps Claude Code with a 9-phase concept workflow that guides hardware designers from natural language requirements through architecture concepts, component BOMs, and a ranked comparison matrix. Install via Claude Code plugin marketplace or npx. Target users: EE professionals, hobbyists, students, and anyone starting a circuit board design.

## Core Value

A minimal, lightweight harness that makes Claude Code an expert hardware design assistant — the intelligence lives in the prompts, not in code.

## Requirements

### Validated

- ✓ npx installer distributes skill pack to ~/.claude/ — v0.1
- ✓ Hardware concept agent ported from hw-concept and packaged as LibreSpin skill — v0.1
- ✓ Concept agent works end-to-end: requirements interview through concept recommendation — v0.1 (IoT sensor node: 5 concepts, 4 validated, STM32L053+LoRaWAN recommended at 92/100)
- ✓ LibreSpin outputs stored in .librespin/ (separate from GSD .planning/) — v0.1
- ✓ Existing hw-concept 9-phase workflow preserved — v0.1
- ✓ Plugin marketplace distribution (`/plugin marketplace add LibreSpin/LibreSpin`) — v0.1
- ✓ Clean uninstall via `npx librespin-install --uninstall` — v0.1

### Active

- [ ] CalcPad CE CLI skill (`/librespin:calcpad`) — v0.2
- [ ] NGSpice simulation skill (`/librespin:simulate`) — v0.2
- [ ] SKILL.md split into per-phase files to reduce 239KB context pressure — v2 (backlog 999.2)
- [ ] Auto-chain phases (eliminate re-invoke between phases) — v2 (backlog 999.1)

### Out of Scope

- Provider abstraction (OpenAI, Gemini) — prompts are the portable part; abstraction is premature
- Python runtime code — skill pack is markdown files, not a Python application
- GUI/TUI/web interface — CLI-first via Claude Code
- Autonomous BOM without human gate — hallucination risk (wrong topology, fabricated components)
- Fully autonomous end-to-end pipeline — accuracy compounds across phases; human checkpoints are the right architecture
- KiCad integration (schematic/PCB) — v5–v6 milestones
- ERC/DRC/DFM automated checks — v0.3 milestone
- Production file export (KiCad CLI) — v0.4 milestone
- npm registry publish — plugin marketplace is the primary v1 distribution; npm is secondary and deferred

## Context

**Shipped v0.1:** Pure Claude Code skill pack — `skills/concept/SKILL.md` (239KB, ~58k tokens), `agents/concept.md`, 3 YAML templates. Installed via plugin marketplace (primary) or npx (secondary). Plugin command: `/librespin:concept`.

**Architecture:** No Python, no build step, no runtime dependencies. Intelligence lives in the 239KB SKILL.md prompt. Worker agent (`librespin:concept`) handles multi-phase state via `.librespin/state.md` in each project.

**Known tech debt:**
- SKILL.md at 239KB is very large — per-phase file split tracked in backlog (999.2)
- Background agent pattern blocks AskUserQuestion — librespin-concept agents must always run foreground
- Templates installed by npx to `~/.claude/librespin/templates/`; plugin marketplace auto-discovers from `skills/concept/templates/` — SKILL.md paths reference the npx target, not plugin target (acceptable for v1)

**hw-concept (source):** Forked from /home/william/repo/hw-concept. Original repo stays alive. LibreSpin does not reference employer IP.

**Target pipeline (full vision across all milestones):**
1. Natural language requirements interview → concept recommendation (v1 ✓)
2. AI-assisted circuit calculations via CalcPad CE CLI (v0.2)
3. SPICE simulation via NGSpice CLI (v0.2)
4. ERC / DRC / DFM checks (v3)
5. Production file export via KiCad CLI (v4)
6. Schematic layout (v5)
7. PCB layout + human review report (v6)

## Constraints

- **License**: MIT — open source from day one
- **EDA stack**: FOSS only — KiCad + NGSpice. No proprietary EDA dependencies
- **Minimalism**: Primary design goal. Fewer lines of code, not more. Markdown over Python. Prompt engineering over software engineering
- **CalcPad CE**: Clean-room skill implementation wrapping the CLI. Can reference CalcPad CE freely. Cannot reference or port employer's CalcPad skill
- **Distribution**: Plugin marketplace (primary) + npx installer (secondary) — copies skill files to ~/.claude/
- **Output directory**: .librespin/ per project (separate from GSD .planning/)
- **Node.js**: >= 18.0.0 (for npx installer)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pure Claude Code skill pack | Maximizes minimalism. Intelligence in prompts, not code. GSD proves pattern scales. | ✓ Validated — shipped as 239KB SKILL.md |
| Fork hw-concept, don't rewrite | It works. Port with minimal changes, refine later. Can't optimize what you haven't measured. | ✓ Validated — port took 2 phases, workflow works |
| One GSD milestone per version | Each version has distinct scope. Prevents speculative planning. | ✓ Validated — clean v0.1 boundary |
| .librespin/ for outputs | Avoids conflict with GSD .planning/. Clean separation of concerns. | ✓ Validated — no conflicts observed |
| npx installer | Proven pattern (hw-concept uses it). Familiar to Node.js ecosystem. | ✓ Validated — install/uninstall round-trip works |
| Plugin marketplace as primary distribution | Integrated into Claude Code UI — no terminal required. `source: "."` was invalid; needed `{"source":"url","url":"..."}` | ✓ Validated — marketplace add + plugin install works |
| skills/concept/ not skills/librespin-concept/ | Avoids plugin namespace collision (`librespin/` dir caused recursive cache install) | ✓ Validated — `/librespin:concept` works cleanly |
| CalcPad CE CLI wrapping | Token-efficient skill. .NET 10 runtime acceptable as prerequisite. | — Pending (v0.2) |

## Milestone Overview

| Milestone | Version | Scope | Status |
|-----------|---------|-------|--------|
| 1 | v0.1 | Concept agent port + skill pack packaging + distribution | ✅ Shipped 2026-04-07 |
| 2 | v0.2 | CalcPad CE CLI skill + NGSpice simulation + SKILL.md optimization | 📋 Planned |
| 3 | v0.3 | Automated ERC/DRC/DFM checks | 📋 Planned |
| 4 | v0.4 | Production file export via KiCad CLI | 📋 Planned |
| 5 | v0.5 | Schematic layout | 📋 Planned |
| 6 | v0.6 | PCB layout + human review report | 📋 Planned |

**Current milestone:** 2 (v0.2)

## Current Milestone: v0.2 CalcPad & NGSpice

**Goal:** Add AI-assisted circuit calculations and SPICE simulation as LibreSpin skills, completing the core post-concept workflow.

**Target features:**
- CalcPad CE CLI skill (`/librespin:calcpad`) — wraps CalcPad CE CLI for component calculations
- NGSpice simulation skill (`/librespin:simulate`) — wraps `ngspice -b` for headless SPICE simulation

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-08 — v0.2 milestone started*
