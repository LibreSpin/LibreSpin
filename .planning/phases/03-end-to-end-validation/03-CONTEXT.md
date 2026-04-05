# Phase 3: End-to-End Validation - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that the ported concept agent completes all 9 workflow phases correctly for both interactive (AskUserQuestion) and file-based (YAML import) input modes. This phase delivers validation evidence and bug fixes — no new capabilities, no prompt improvements, no restructuring.

</domain>

<decisions>
## Implementation Decisions

### Test Scenario
- **D-01:** Use a simple but complete hardware project as the validation test case — e.g., a simple LED driver circuit or battery-powered sensor node. Complex enough to exercise all 9 concept phases (requirements gathering, concept drafting, validation, component research, concept generation, self-critique, refinement, final generation, comparison output) but simple enough to complete in a reasonable time.
- **D-02:** Test both input modes: interactive AskUserQuestion flow AND YAML file import with a pre-filled requirements.yaml.

### Validation Method
- **D-03:** Manual walkthrough with evidence capture. Run `/librespin:concept` end-to-end, capture output at each of the 9 workflow phases. Automated testing of conversational AI workflows is fragile and premature for v1.
- **D-04:** Evidence = actual `.librespin/` output files produced during each run (state.md, concept docs, comparison matrix, etc.).

### Bug Fix Scope
- **D-05:** Fix blocking bugs that prevent workflow phases from completing. If a phase fails or produces incorrect/missing output, fix it in this phase.
- **D-06:** Defer improvements (prompt quality, output formatting, context optimization) to v2 OPT-01/OPT-02. The line: "does this prevent the workflow from completing?" Yes = fix now. No = defer.

### Success Evidence
- **D-07:** Verification checklist mapping each CW-01 through CW-10 requirement to specific evidence: output files generated, state file state, scoring behavior observed.
- **D-08:** The planner should structure the validation plan around this requirements checklist, with each plan task tied to one or more CW requirements.

### Claude's Discretion
- Exact test project specifics (which LED driver topology, which sensor, etc.) — pick what exercises the workflow best
- Order of validation tasks — may validate input modes first, then multi-phase flow, then edge cases (resume, scoring)
- How to structure evidence capture (markdown report, screenshots, file listings)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Ported Skill Files (validation targets)
- `.claude/skills/librespin-concept/SKILL.md` — 7105-line orchestrator + agent body (primary validation target)
- `.claude/agents/librespin-concept.md` — 20-line flat agent reference with frontmatter
- `.claude/librespin/templates/requirements.yaml` — 121-line requirements template (YAML import test input)
- `.claude/librespin/templates/concept-template.md` — 52-line concept output template
- `.claude/librespin/templates/overview-template.md` — 42-line overview output template

### Requirements
- `.planning/REQUIREMENTS.md` — CW-01 through CW-10 define Phase 3 requirements
- `.planning/ROADMAP.md` §Phase 3 — Success criteria: interactive input, YAML import, 5-6 concepts, resume, scoring

### Prior Phase Context
- `.planning/phases/02-namespace-port/02-CONTEXT.md` — Namespace replacement decisions, output paths, config schema

### Source Reference (hw-concept)
- `/home/william/repo/hw-concept/.claude/agents/hw-concept/AGENT.md` — Original 6960-line agent for comparison if behavioral divergence found during validation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- SKILL.md contains the full 9-phase workflow logic — this IS the system under test
- requirements.yaml template can serve as the basis for the YAML import test case (fill in values for test project)
- bin/install.js copies all files — no separate install step needed if testing from repo .claude/ directly

### Established Patterns
- Agent uses AskUserQuestion for interactive requirements gathering (Phase 1 of workflow)
- State persists at .librespin/state.md — agent checks for existing state on invocation
- Config thresholds: draft_count, iteration_limit, confidence_threshold control agent behavior
- Completeness scoring uses 50/30/20 weighting (critical/important/nice-to-have)

### Integration Points
- `/librespin:concept` command triggers SKILL.md orchestrator
- Agent writes to .librespin/ directory (concepts, state, comparison matrix)
- Agent spawns sub-agents via `Agent` tool (not deprecated `Task`)

</code_context>

<specifics>
## Specific Ideas

- AGENT.md is ~58,000 tokens per STATE.md concern — late-phase context pressure possible. Monitor during validation runs and note if agent truncates or loses context in later workflow phases.
- The 9 workflow phases to validate: (1) requirements interview, (2) concept drafting, (3) validation against confidence threshold, (4) component research with real part numbers, (5) block diagram generation with MPNs, (6) self-critique, (7) refinement, (8) final generation, (9) comparison matrix output.
- Resume testing (CW-09) requires deliberately interrupting a run and restarting — plan this as a separate test scenario.

</specifics>

<deferred>
## Deferred Ideas

- Config file location standardization (.librespin/config.yaml vs inline) — from Phase 2 deferred list, evaluate during validation if config handling needs improvement
- OPT-01 (AGENT.md split) — if context pressure is observed during validation, this becomes higher priority for v2 but stays deferred

</deferred>

---

*Phase: 03-end-to-end-validation*
*Context gathered: 2026-04-04*
