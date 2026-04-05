# Phase 2: Namespace Port - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Port all hw-concept agent content to the librespin namespace. The 6960-line AGENT.md, 157-line command orchestrator, and YAML/markdown templates get renamed, restructured into the skill pack directory layout established in Phase 1, and scrubbed of all hw-concept references. This is a mechanical port — no new capabilities, no creative work. The content exists; this phase moves it into the right shape.

</domain>

<decisions>
## Implementation Decisions

### AGENT.md Restructuring
- **D-01:** Move hw-concept AGENT.md content into `skills/librespin-concept/SKILL.md` as the skill orchestrator. The flat agent file (`agents/librespin-concept.md`) stays as a lightweight worker reference with frontmatter only. SKILL.md becomes the primary skill content file (~6960 lines after port).
- **D-02:** The hw-concept command file (`commands/hw-concept.md`, 157 lines) merges into SKILL.md as the orchestrator preamble/frontmatter. The commands/ directory pattern is deprecated in Claude Code — skills/ replaces it.

### Namespace Replacement
- **D-03:** Mechanical find/replace of all 99+ "hw-concept" references with "librespin-concept" (for identifiers) or "librespin" (for namespace paths), followed by semantic review to catch edge cases (URLs, embedded strings, path references).
- **D-04:** All Tool references changed from "Task" to "Agent" per NSP-04.

### Output Directory
- **D-05:** All output paths replaced: `.planning/hw-concept/` → `.librespin/`. State file at `.librespin/state.md` per NSP-03.
- **D-06:** Direct path replacement — no configurable output directory for v1. Hardcoded `.librespin/` keeps it simple.

### Dead Parameter Cleanup
- **D-07:** Remove `--output DIR` parameter entirely (NSP-05). Dead code removal — add back only if real need emerges. Aligns with project minimalism constraint.

### Config Schema
- **D-08:** Config schema must support `draft_count`, `iteration_limit`, `confidence_threshold` per SKL-04. Port these from hw-concept's existing config structure.

### Claude's Discretion
- Exact frontmatter field values for SKILL.md (tools list, argument-hint) — align with what the ported content requires
- How to handle any hw-concept-specific comments or documentation references within AGENT.md — remove or adapt
- Minor formatting/style adjustments during the port

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material (hw-concept)
- `/home/william/repo/hw-concept/.claude/agents/hw-concept/AGENT.md` — 6960-line worker agent to port (primary content source)
- `/home/william/repo/hw-concept/.claude/commands/hw-concept.md` — 157-line command orchestrator to merge into SKILL.md
- `/home/william/repo/hw-concept/.claude/hw-concept/templates/requirements.yaml` — 121-line YAML template to port
- `/home/william/repo/hw-concept/.claude/hw-concept/templates/concept-template.md` — 52-line concept template to port
- `/home/william/repo/hw-concept/.claude/hw-concept/templates/overview-template.md` — 42-line overview template to port

### Target Files (LibreSpin)
- `.claude/skills/librespin-concept/SKILL.md` — Orchestrator + full agent content destination
- `.claude/agents/librespin-concept.md` — Flat worker agent reference (frontmatter only)
- `.claude/librespin/templates/requirements.yaml` — Ported requirements template
- `.claude/librespin/templates/concept-template.md` — Ported concept template
- `.claude/librespin/templates/overview-template.md` — Ported overview template

### Project Specs
- `.planning/REQUIREMENTS.md` — SKL-01 through SKL-04, NSP-01 through NSP-06 define Phase 2 requirements
- `.planning/ROADMAP.md` §Phase 2 — Success criteria: zero hw-concept strings, correct paths, Agent not Task, .librespin/ output

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 1 created valid placeholder files at all target paths — Phase 2 replaces placeholder content with ported content
- `bin/install.js` already copies all target directories — no installer changes needed
- `package.json` already includes `.claude/` in files array

### Established Patterns
- ESM modules, Node.js built-in APIs only
- Flat agent file pattern (agents/name.md, not agents/name/AGENT.md)
- Skill orchestrator pattern (skills/name/SKILL.md)
- Templates at librespin/templates/

### Integration Points
- SKILL.md must declare correct `allowed-tools` for the full 9-phase workflow
- Agent frontmatter must match what Claude Code expects (name, description, tools, color)
- Template paths hardcoded in AGENT.md content must update to .librespin/templates/

</code_context>

<specifics>
## Specific Ideas

- Port is mechanical — minimize creative decisions, maximize fidelity to hw-concept behavior
- The 6960-line AGENT.md is the critical file — all 9 workflow phases live there
- hw-concept uses commands/ (deprecated) — LibreSpin uses skills/ (current Claude Code pattern)

</specifics>

<deferred>
## Deferred Ideas

- OPT-01 (AGENT.md split into agent + reference files) — v2 milestone, after v1 usage reveals actual context pressure points
- Config file location standardization (.librespin/config.yaml vs inline) — decide during Phase 3 validation

</deferred>

---

*Phase: 02-namespace-port*
*Context gathered: 2026-04-05*
