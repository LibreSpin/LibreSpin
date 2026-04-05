# Phase 2: Namespace Port - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 02-namespace-port
**Areas discussed:** AGENT.md restructuring, Namespace replacement approach, Output directory wiring, Dead parameter handling
**Mode:** auto (all areas auto-selected, recommended defaults chosen)

---

## AGENT.md Restructuring

| Option | Description | Selected |
|--------|-------------|----------|
| Move content into SKILL.md | Orchestrator gets full 6960 lines. Agent flat file stays lightweight. Matches Claude Code skill pattern. | ✓ |
| Split into SKILL.md + reference files | Break monolith into multiple files. Reduces context pressure but adds complexity. | |
| Keep as single flat agent file | Put everything in agents/librespin-concept.md. Simple but doesn't use skill structure. | |

**User's choice:** [auto] Move AGENT.md content into SKILL.md (recommended default)
**Notes:** This aligns with D-09/D-10 from Phase 1 and the Claude Code skill pattern.

---

## Namespace Replacement Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Mechanical find/replace + semantic review | Replace all occurrences, then review for edge cases in URLs, paths, user-facing strings. | ✓ |
| Pure mechanical find/replace | Fast but may miss contextual differences. | |

**User's choice:** [auto] Mechanical find/replace with semantic review (recommended default)
**Notes:** 99 references across 2 files. Semantic review catches path-specific vs identifier-specific replacements.

---

## Output Directory Wiring

| Option | Description | Selected |
|--------|-------------|----------|
| Direct path replacement | Replace .planning/hw-concept/ with .librespin/ throughout. State at .librespin/state.md. | ✓ |
| Configurable output directory | Allow user-configurable output path. Over-engineered for v1. | |

**User's choice:** [auto] Direct path replacement (recommended default)
**Notes:** Simplest approach. Aligns with project minimalism constraint.

---

## Dead Parameter Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Remove --output DIR | Dead code removal. Add back if needed. Minimalism principle. | ✓ |
| Wire it to work | More feature, more code. | |

**User's choice:** [auto] Remove it (recommended default)
**Notes:** NSP-05 says "removed or fully wired" — removal is simpler and aligns with project constraints.

---

## Claude's Discretion

- Exact frontmatter field values for SKILL.md
- Handling hw-concept-specific comments within AGENT.md
- Minor formatting/style adjustments during port

## Deferred Ideas

- OPT-01 (AGENT.md split) — v2 milestone
- Config file location standardization — Phase 3
