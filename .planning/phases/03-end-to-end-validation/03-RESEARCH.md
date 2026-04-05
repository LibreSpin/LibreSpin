# Phase 3: End-to-End Validation - Research

**Researched:** 2026-04-04
**Domain:** Claude Code skill validation — conversational AI workflow testing and bug fixing
**Confidence:** HIGH (primary sources are the skill files themselves, read directly)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use a simple but complete hardware project as the validation test case (e.g., LED driver circuit or battery-powered sensor node). Complex enough to exercise all 9 concept phases, simple enough to complete in a reasonable time.
- **D-02:** Test both input modes: interactive AskUserQuestion flow AND YAML file import with a pre-filled requirements.yaml.
- **D-03:** Manual walkthrough with evidence capture. Run `/librespin:concept` end-to-end, capture output at each of the 9 workflow phases. Automated testing of conversational AI workflows is fragile and premature for v1.
- **D-04:** Evidence = actual `.librespin/` output files produced during each run (state.md, concept docs, comparison matrix, etc.).
- **D-05:** Fix blocking bugs that prevent workflow phases from completing. If a phase fails or produces incorrect/missing output, fix it in this phase.
- **D-06:** Defer improvements (prompt quality, output formatting, context optimization) to v2 OPT-01/OPT-02. The line: "does this prevent the workflow from completing?" Yes = fix now. No = defer.
- **D-07:** Verification checklist mapping each CW-01 through CW-10 requirement to specific evidence: output files generated, state file state, scoring behavior observed.
- **D-08:** The planner should structure the validation plan around this requirements checklist, with each plan task tied to one or more CW requirements.

### Claude's Discretion

- Exact test project specifics (which LED driver topology, which sensor, etc.) — pick what exercises the workflow best
- Order of validation tasks — may validate input modes first, then multi-phase flow, then edge cases (resume, scoring)
- How to structure evidence capture (markdown report, screenshots, file listings)

### Deferred Ideas (OUT OF SCOPE)

- Config file location standardization (.librespin/config.yaml vs inline) — evaluate only if config handling blocks a workflow phase
- OPT-01 (AGENT.md split) — if context pressure is observed, note it but keep deferred
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CW-01 | User can gather hardware requirements interactively via AskUserQuestion (Phase 1) | Phase 1 is the only currently executable phase — interactive mode is the first validation target |
| CW-02 | User can provide requirements via YAML file import (Phase 1 alternate input) | YAML import path exists in SKILL.md lines 276-354; requires a pre-filled requirements.yaml |
| CW-03 | Agent generates 5-6 diverse architecture concepts from requirements (Phase 2) | Phase 2 designed but marked "not yet executable" — requires wiring up before validation |
| CW-04 | Agent validates concepts against confidence threshold with web research (Phase 3) | Phase 3 (Validation Gate) designed in SKILL.md but not yet executable |
| CW-05 | Agent researches specific components with real part numbers and BOMs (Phase 4) | Phase 4 (Component Research) designed but not yet executable |
| CW-06 | Agent generates detailed block diagrams with MPNs and spec analysis (Phase 5) | Phase 5 (Concept Generation) designed but not yet executable |
| CW-07 | Agent self-critiques and refines concepts iteratively (Phases 6-8) | Phase 6 (Self-Critique) designed but not yet executable |
| CW-08 | Agent produces comparison matrix with recommended concept (Phase 9/Phase 7 in SKILL.md) | Phase 7 (Final Output) designed but not yet executable |
| CW-09 | Workflow state persists across invocations — user can resume interrupted runs | State management scaffolding exists; resume logic at orchestrator level works for Phase 1 |
| CW-10 | Completeness scoring works (critical/important/nice-to-have weighted at 50/30/20) | Fully specified in SKILL.md lines 693-932; the algorithm is detailed and testable |
</phase_requirements>

---

## Summary

Phase 3 is labeled "End-to-End Validation" but the most important discovery from reading the source is that SKILL.md line 7023 contains an explicit marker: **"CURRENT PHASE: REQUIREMENTS GATHERING ONLY — Phases 2-7 are designed but not yet executable."** This means the system under test currently only supports Phase 1 (requirements gathering). CW-03 through CW-08 cannot be validated until the remaining phases are made executable. Phase 3 is therefore a combination of implementation (making phases 2-7 executable) and validation (running end-to-end evidence capture).

The agent architecture uses a clean orchestrator/worker split: the SKILL.md orchestrator handles argument parsing and state loading, spawns a `librespin-concept` sub-agent using the `Agent` tool, and the sub-agent executes the multi-phase workflow. The worker agent body (`librespin-concept.md`) is intentionally minimal (~20 lines) with the full workflow logic embedded in SKILL.md — this is the pattern confirmed in Phase 2 decisions.

The validation test design should use an IoT/sensor project as the requirements input. The existing `requirements.yaml` template ships with a complete "IoT Sensor Node" example that already satisfies the completeness threshold, making it an ideal YAML import test case. For the interactive test, a simpler LED driver circuit provides a different application domain with fewer sensor/wireless questions.

**Primary recommendation:** Structure Phase 3 as two sequential activities — first, make each of Phases 2-7 executable (removing the "REQUIREMENTS GATHERING ONLY" guard and wiring the phase logic), then run the manual end-to-end validation with evidence capture.

---

## Standard Stack

### Core

| Component | Version/Location | Purpose | Why Standard |
|-----------|-----------------|---------|--------------|
| SKILL.md | `.claude/skills/librespin-concept/SKILL.md` | Full workflow orchestrator + agent body | The system under test — 7105 lines |
| librespin-concept.md | `.claude/agents/librespin-concept.md` | Sub-agent frontmatter/entrypoint | Spawned by orchestrator via Agent tool |
| requirements.yaml template | `.claude/librespin/templates/requirements.yaml` | YAML import test fixture | Pre-filled example covers all completeness fields |
| concept-template.md | `.claude/librespin/templates/concept-template.md` | Output format for per-concept files | Agent writes to this structure |
| overview-template.md | `.claude/librespin/templates/overview-template.md` | Comparison matrix format | Phase 7 output target |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| `.librespin/state.md` | Inter-phase state persistence | Created by Phase 1, read by all subsequent phases |
| `.librespin/config.yaml` | Config: draft_count, iteration_limit, confidence_threshold | Created by Phase 1 with defaults (5, 5, 80) |
| `.librespin/01-requirements/requirements.yaml` | Phase 1 output | Read by Phase 2 to load validated requirements |

### Output Directories (per phase)

| Directory | Phase | Contents |
|-----------|-------|----------|
| `.librespin/01-requirements/` | Phase 1 | requirements.yaml |
| `.librespin/02-concepts/` | Phase 2 | concept-*.md, overview.md |
| `.librespin/03-validation/` | Phase 3 | validation-summary.md |
| `.librespin/04-bom/` | Phase 4 | bom-*.md |
| `.librespin/05-detailed-designs/` | Phase 5 | analysis-*.md |
| `.librespin/06-refinement/` | Phase 6 | score-*.md, refinement-log.md |
| `.librespin/07-final-output/` | Phase 7 | comparison matrix, recommendation |

---

## Architecture Patterns

### Agent Execution Model

The orchestrator (SKILL.md header section, lines 1-152) handles:
1. Argument parsing (`--input FILE`, `--depth LEVEL`)
2. State file loading (`cat .librespin/state.md`)
3. Sub-agent spawning via `Agent` tool with `subagent_type="librespin-concept"`
4. Post-completion state verification

The worker agent (SKILL.md body, line 154 onward) executes the actual phase logic. The critical design principle is **fresh context per phase** — each invocation of `/librespin:concept` spawns a new agent that reads only: config file, state file, and the previous phase's output files. This prevents context accumulation across phases.

### Phase Sequencing

```
/librespin:concept (invocation 1)
  → Orchestrator: parse args, detect no state → spawn agent
  → Agent: Phase 1 (Requirements Gathering)
  → Writes: .librespin/state.md (phase: "3-requirements-gathering")
             .librespin/config.yaml
             .librespin/01-requirements/requirements.yaml
  → Returns: "Phase 1 complete. Run again for Phase 2."

/librespin:concept (invocation 2)
  → Orchestrator: parse args, detect state at phase "3-requirements-gathering" → spawn agent
  → Agent: Phase 2 (Architecture Drafting)
  → Writes: .librespin/02-concepts/concept-*.md
             .librespin/02-concepts/overview.md
  → Updates: .librespin/state.md (phase: "2-architecture-drafting")

[... continues through Phase 7 ...]
```

### Phase Number Mapping (SKILL.md vs CW Requirements)

The SKILL.md uses a different numbering than the CW requirements in REQUIREMENTS.md. The mapping is:

| CW Requirement | SKILL.md Phase Label | SKILL.md Header Line |
|----------------|---------------------|---------------------|
| CW-01 | PHASE 1: REQUIREMENTS GATHERING | 272 |
| CW-02 | PHASE 1 (YAML import mode) | 276 |
| CW-03 | PHASE 2: ARCHITECTURE DRAFTING | 1114 |
| CW-04 | PHASE 3: VALIDATION GATE | 2014 |
| CW-05 | PHASE 4: COMPONENT RESEARCH | 3041 |
| CW-06 | PHASE 5: CONCEPT GENERATION | 4498 |
| CW-07 | PHASE 6: SELF-CRITIQUE & REFINEMENT | 5122 |
| CW-08 | PHASE 7: FINAL OUTPUT | 6310 |

Note: PHASE 2.5 (REQUIREMENTS-TO-COMPONENT MAPPING, line 1544) is an intermediate step between drafting and validation. It adds mapping sections to Phase 2 concept files. There is no separate CW requirement for it — it runs as part of the Phase 2→3 transition.

The 9 "workflow phases" referenced in the CONTEXT.md map to 7 SKILL.md phases plus the 2.5 intermediate step, plus state management. The CW requirements CW-09 (resume) and CW-10 (scoring) are cross-cutting concerns tested across the workflow, not separate phases.

### Critical Implementation Gap

**Finding (HIGH confidence — read from source):** SKILL.md line 7023 states:

```
## CURRENT PHASE: REQUIREMENTS GATHERING ONLY

For Phase 1 (Foundation), only Requirements Gathering is implemented.
Phases 2-7 are designed but not yet executable.

When invoked, execute Phase 1 logic, write requirements.yaml, report completion.
```

This section acts as a guard/override. Even though Phases 2-7 are fully designed with detailed pseudocode in SKILL.md, the agent is currently instructed to stop after Phase 1. This guard must be removed and the phase dispatch logic must be wired before any CW-03 through CW-08 requirements can be validated.

### State-Based Phase Dispatch

The resume/phase-advance logic works through the state file. The orchestrator reads `.librespin/state.md` and passes the current phase to the sub-agent. The sub-agent must then dispatch to the correct phase handler. The current Phase 1-only guard at line 7023 bypasses this dispatch.

To enable multi-phase execution, the agent needs a phase dispatch block like:

```
if state.phase == "3-requirements-gathering" OR no state:
  → Execute Phase 1
elif state.phase == "2-architecture-drafting":
  → Execute Phase 2.5 + Phase 3 (validation gate)
elif state.phase == "X":
  → Execute Phase Y
...
```

The exact state value names must match what Phase 1 writes. Phase 1 writes `phase: '3-requirements-gathering'` to state frontmatter (line 1067 — note: the "3" prefix is internal naming inherited from hw-concept, not the CW requirement number).

### YAML Import Validation

The YAML import path (CW-02) reads the file using `FAILSAFE_SCHEMA` (no type coercion, security hardened per line 290), validates `schema_version: 1`, calculates completeness, and runs gap-filling if score <70. The template ships with a fully-populated IoT sensor node example that scores close to 100/100. To test the sub-70 path (gap-fill trigger), a stripped-down YAML with only critical fields filled is needed.

### Completeness Scoring (CW-10)

The scoring formula is fully specified and deterministic:

```
criticalScore = (answeredCritical / 11) × 50
importantScore = (answeredImportant / 6) × 30
niceScore = (answeredNice / 5) × 20
totalScore = round(criticalScore + importantScore + niceScore)
```

Critical fields (11): project_name, use_case, environment.location, environment.temperature_min_c, environment.temperature_max_c, connectivity.primary, connectivity.region, connectivity.port_count, connectivity.hub_acceptable, power.source, power.battery_life_target.

Important fields (6): sensors, hmi.buttons, hmi.leds, hmi.display, physical.max_pcb_size_mm, physical.enclosure.

Nice-to-have fields (5): production.volume, production.bom_target_usd, compliance, lifecycle.years, preferences.

Score <70 blocks progression. Score ≥70 allows proceeding to Phase 2. The threshold is enforced after Section 2 (important questions) completes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test requirements data | Custom YAML files from scratch | Fill in the existing `requirements.yaml` template | Template is schema-versioned and covers all completeness fields; building from scratch risks missing fields that affect scoring |
| Phase dispatch logic | Complex state machine | Simple if/elif chain on state.phase value | SKILL.md already specifies all phase outputs and state transitions — just wire the dispatch |
| Evidence capture format | Screenshot tool or custom reporter | Markdown file listing actual `.librespin/` output files with `ls -R` + `cat` | D-04 says evidence = actual output files; markdown is enough |

---

## Common Pitfalls

### Pitfall 1: Confusing the "REQUIREMENTS GATHERING ONLY" Guard with a Bug

**What goes wrong:** Treating line 7023 as a bug to be removed immediately, without understanding that it was intentional scaffolding from Phase 2's "fidelity port" — it preserves the Phase 1 implementation boundary from the port phase.
**Why it happens:** The line reads like a constraint comment but functions as an execution guard.
**How to avoid:** Remove the guard as part of enabling Phase 2 execution, and replace it with proper phase dispatch logic. Do not simply delete the comment without adding dispatch — that would cause the agent to fall through with undefined behavior.
**Warning signs:** Agent completes Phase 1 successfully but on second invocation does nothing or repeats Phase 1.

### Pitfall 2: SKILL.md Phase Numbering vs CW Requirement Numbering Confusion

**What goes wrong:** Equating CW-04 with "SKILL.md Phase 4" when CW-04 actually maps to SKILL.md Phase 3 (Validation Gate).
**Why it happens:** The SKILL.md uses its own internal phase numbering (1-7 plus 2.5) that doesn't map 1:1 to the CW requirement sequence.
**How to avoid:** Use the mapping table in Architecture Patterns above. Always cross-reference to the SKILL.md phase header line numbers.
**Warning signs:** Validating the wrong phase against a CW requirement.

### Pitfall 3: Missing config.yaml Causes Phase 2+ Failures

**What goes wrong:** Phase 2 reads `draft_count` from `.librespin/config.yaml` (line 1135) and throws an error if the file doesn't exist. If Phase 1 didn't create it, Phase 2 will fail immediately.
**Why it happens:** SKILL.md says Phase 1 creates config.yaml, but the actual creation code is not shown in Phase 1 output section — only state.md and requirements.yaml writes are shown. It's possible config.yaml creation is missing from the Phase 1 implementation.
**How to avoid:** Verify config.yaml is created during Phase 1 run before attempting Phase 2. If missing, add config.yaml creation to Phase 1 output with defaults: `draft_count: 5, iteration_limit: 5, confidence_threshold: 80`.
**Warning signs:** Phase 2 errors with "Cannot read config.yaml" or "Invalid draft_count".

### Pitfall 4: State Phase Value Mismatch Breaks Resume

**What goes wrong:** Phase 1 writes `phase: '3-requirements-gathering'` to state.md (line 1067 — the "3" prefix is from the internal naming scheme). If the phase dispatch logic checks for a different string, resume fails.
**Why it happens:** The state phase value uses an internal scheme inherited from hw-concept, not the CW requirement IDs.
**How to avoid:** The phase dispatch in the agent must match exactly the values written to state by each phase. Read the phase state values from Phase 1's write block (lines 1065-1072) before writing any dispatch logic.
**Warning signs:** Second invocation reports "no state found" or starts Phase 1 again instead of Phase 2.

### Pitfall 5: Context Pressure in Late Phases

**What goes wrong:** SKILL.md is ~58,000 tokens (noted in CONTEXT.md specifics and STATE.md). Sub-agent spawned in Phase 6 or 7 may experience context window pressure, causing truncation or loss of late-phase workflow logic.
**Why it happens:** The agent is given the full SKILL.md as context. Even with "fresh context per phase," the SKILL.md itself consumes a large fraction of the context budget.
**How to avoid:** Monitor during Phase 6/7 validation runs. If truncation occurs, note it as evidence supporting OPT-01 priority (deferred to v2, but the observation should be documented).
**Warning signs:** Agent in Phase 6-7 skips steps described in SKILL.md, produces abbreviated output, or references incorrect phase numbers.

### Pitfall 6: Test YAML Scores Too High to Test Gap-Fill Path

**What goes wrong:** Using the template's example requirements.yaml verbatim for the YAML import test. It scores near 100/100, never triggering the sub-70 gap-fill path (CW-10 edge case).
**Why it happens:** The template ships as a complete example by design.
**How to avoid:** Create two YAML test fixtures: one complete (tests the ≥70 happy path) and one stripped (tests the <70 gap-fill path). The stripped version should omit hmi.* and physical.* fields to land in the 50-69 range.
**Warning signs:** CW-10 is marked "validated" without ever seeing gap-fill questions during testing.

---

## Code Examples

### Evidence Capture Pattern (D-04)

After each phase completes, capture evidence with:

```bash
# Confirm state file updated
cat .librespin/state.md | head -10

# List all outputs produced
ls -R .librespin/

# Spot-check key output files
cat .librespin/01-requirements/requirements.yaml
cat .librespin/02-concepts/overview.md
```

### Test YAML (Complete — CW-02 happy path)

Use the existing template as-is from `.claude/librespin/templates/requirements.yaml`. It is a complete IoT sensor node with all fields populated.

### Test YAML (Stripped — CW-10 gap-fill path)

```yaml
schema_version: 1
project_name: "LED Driver Test"
use_case: |
  Constant-current LED driver for a 12V LED strip.
environment:
  location: indoor
  temperature_min_c: 15
  temperature_max_c: 40
connectivity:
  primary: none
power:
  source: wall
  battery_life_target: "N/A"
```

This covers all critical fields (connectivity.region and hub fields may be skipped for non-wireless projects — verify scoring behavior) but omits all important fields (hmi.*, physical.*). Expected score: approximately 50-60/100, triggering gap-fill.

### Interruption Test (CW-09)

To test resume:
1. Run `/librespin:concept` through Phase 1 completion (state.md written)
2. On next invocation (Phase 2), interrupt mid-execution (close Claude Code or kill the agent)
3. Run `/librespin:concept` again — orchestrator should read existing state.md, report "Resuming from Phase 2", and spawn agent with that context
4. Evidence: state.md phase value unchanged from before interrupt; agent picks up Phase 2 without repeating Phase 1

---

## State of the Art

| Aspect | Current State | Notes |
|--------|---------------|-------|
| Phase 1 implementation | Executable | Requirements gathering fully wired, both input modes present |
| Phases 2-7 implementation | Designed, not executable | Full pseudocode in SKILL.md; guard at line 7023 prevents execution |
| Multi-phase dispatch | Missing | No phase dispatch logic exists yet; must be added as part of Phase 3 |
| config.yaml creation | Uncertain | Phase 1 output section shows state.md and requirements.yaml writes but not config.yaml — needs verification |
| Resume logic | Partial | Orchestrator reads state and passes phase to agent; agent-side dispatch needed to act on it |

---

## Open Questions

1. **Does Phase 1 create config.yaml?**
   - What we know: SKILL.md line 148 says "First invocation creates .librespin/state.md and .librespin/config.yaml". Phase 1 output section (lines 1040-1110) shows only state.md and requirements.yaml writes.
   - What's unclear: Whether config.yaml creation code was omitted from Phase 1's output block or is truly missing.
   - Recommendation: Run Phase 1 and check for .librespin/config.yaml. If absent, add creation to Phase 1 with hardcoded defaults as first bug fix.

2. **How should non-wireless projects score for connectivity.region and connectivity.port_count?**
   - What we know: The completeness scoring lists `connectivity.region` and `connectivity.port_count` as critical fields. For a wall-powered non-wireless LED driver, these fields are not applicable.
   - What's unclear: Whether the scoring function treats "N/A" or "none" as answered or unanswered for these fields.
   - Recommendation: Test during Phase 1 validation with a non-wireless test case. If the score is penalized for N/A answers on inapplicable fields, this is a blocking bug (fix per D-05).

3. **What value does Phase 2 write to state.md for the phase field?**
   - What we know: Phase 1 writes `phase: '3-requirements-gathering'`. Phase 7 output section references `recommended_concept` and `output_location` in state.
   - What's unclear: The exact phase string values that Phases 2-6 write to state.md — these are not spelled out in the source.
   - Recommendation: Define phase string values for all 7 phases before implementing dispatch logic, to ensure phase progression works consistently.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Claude Code | All phases (agent execution) | Assumed | Current | — |
| AskUserQuestion tool | CW-01 (interactive mode) | Yes (in SKILL.md allowed-tools) | — | — |
| WebSearch tool | CW-04 (component validation) | Yes (in SKILL.md allowed-tools) | — | — |
| Agent tool | Phase dispatch (orchestrator→worker) | Yes (in SKILL.md allowed-tools) | — | — |
| Write tool | All phases (output file creation) | Yes | — | — |
| `.librespin/` directory | All phases | Does not exist yet (clean state) | — | Created on Phase 1 run |

No blocking environment gaps detected. This is a self-contained skill pack — all dependencies are Claude Code tools already declared in SKILL.md frontmatter.

---

## Sources

### Primary (HIGH confidence)

- `.claude/skills/librespin-concept/SKILL.md` (read directly) — Full 7105-line workflow spec; all phase logic, completeness scoring, state management, YAML import, and the "REQUIREMENTS GATHERING ONLY" guard
- `.claude/agents/librespin-concept.md` (read directly) — Agent frontmatter and capabilities description
- `.claude/librespin/templates/requirements.yaml` (read directly) — YAML import test fixture with complete IoT sensor node example
- `.claude/librespin/templates/concept-template.md` (read directly) — Phase 2 output structure
- `.claude/librespin/templates/overview-template.md` (read directly) — Phase 7 comparison matrix structure
- `.planning/phases/03-end-to-end-validation/03-CONTEXT.md` (read directly) — Locked decisions D-01 through D-08
- `.planning/REQUIREMENTS.md` (read directly) — CW-01 through CW-10 definitions

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all files read directly from repo
- Architecture patterns: HIGH — phase logic read directly from SKILL.md source
- Critical implementation gap (Phase 1-only guard): HIGH — exact line reference (7023) with verbatim text
- Pitfalls: MEDIUM to HIGH — based on reading source code and identifying actual mismatch risks (e.g., config.yaml creation gap is observed from source, not inferred)

**Research date:** 2026-04-04
**Valid until:** Stable — valid until SKILL.md is modified (this is a closed system; no external dependencies to go stale)
