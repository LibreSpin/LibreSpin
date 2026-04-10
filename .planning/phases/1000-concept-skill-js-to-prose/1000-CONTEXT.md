# Phase 1000: Concept Skill JS-to-Prose - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all JavaScript pseudo-code in `skills/concept/SKILL.md` with concise prose instructions. This is a format rewrite only — the logic, rules, and behavioral intent encoded in the JS must be preserved as prose. File size target: ~35KB (from 254KB). No new capabilities, no behavior changes. Pre-requisite for v0.1 ship.

</domain>

<decisions>
## Implementation Decisions

### Preservation depth
- **D-01:** Preserve everything — all field names, scoring weights (e.g., 50/30/20 critical/important/nice-to-have split), diversity thresholds, iteration limits, algorithm steps, and data structures are converted to prose tables or bullet lists, not dropped.
- **D-02:** The rewrite is a format change, not a content change. Behavioral fidelity is the success criterion.

### Section structure
- **D-03:** Keep the current 9-phase structure and headers intact as the default.
- **D-04:** Planner may consolidate sub-sections where JS removal leaves a header with trivially thin body (e.g., a header that only existed to introduce a function that is now a one-line prose rule). Restructuring must not add new content or split/merge phase boundaries.
- **D-05:** No full restructure — risk of scope creep and behavioral drift.

### Rewrite approach
- **D-06:** One plan task per SKILL.md phase (9 phases = 9 rewrite tasks). Each task is atomic and independently reviewable.
- **D-07:** Planner may wave-parallelize independent phases (phases that don't reference each other's output in the file). Final assembly / size verification is a separate task.
- **D-08:** Each task must specify the exact line range of its phase section so the executor can surgically replace only that section.

### Validation gate
- **D-09:** After rewrite, run `/librespin:concept` on a real or synthetic IoT sensor node project to confirm the skill still produces 5+ concepts with correct structure (BOM, block diagram, scored concepts).
- **D-10:** Validation task is a separate plan step after all rewrite tasks complete. It is a blocking gate — if regression is detected, the phase is not done.

</decisions>

<specifics>
## Specific Ideas

- Target file size: ~35KB. Current: 254KB / 7,510 lines. The JS accounts for ~3,267 lines of the bloat.
- The JS is wrapped in ` ```javascript ` fences throughout. Every such fence should be gone post-rewrite — any remaining JS fence is a bug.
- The prose replacement for a JS function should typically be 3–10 bullet points or a compact table, not a paragraph essay.
- Prose should be imperative / instructional: "Do X when Y" not "The function does X when Y."

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source file (authoritative)
- `skills/concept/SKILL.md` — The file being rewritten. Executor must read each phase section before rewriting it. This is the source of truth for what JS logic to preserve.

### Project constraints
- `CLAUDE.md` — Minimalism constraint: fewer lines, markdown over pseudo-code, intelligence lives in the prompts
- `.planning/PROJECT.md` — Core value statement and key decisions table

No external specs or ADRs for this phase — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### The file being rewritten
- `skills/concept/SKILL.md`: 7,510 lines / 254KB. 9 major phases plus PHASE DISPATCH section.
- Structure per phase: prose overview → JS function implementations → output file specs / templates
- JS blocks use ` ```javascript ` fences. All must be replaced.
- Non-JS content (markdown templates, YAML examples, prose overviews) must be preserved as-is.

### Phases in the file (line reference approximate)
1. PHASE 1: REQUIREMENTS GATHERING (~line 271–1092)
2. PHASE 2: ARCHITECTURE DRAFTING (~line 1128–1530)
3. PHASE 3: (validation/component verification section)
4. PHASE 4: BOM / component selection
5. PHASE 5: CONCEPT GENERATION
6. PHASE 6: SELF-CRITIQUE & REFINEMENT
7. PHASE 7: FINAL OUTPUT
8. PHASE DISPATCH section
9. Header/orchestrator section (lines 1–150)

Executor should run `grep -n "^## PHASE\|^# .*PHASE\|^## PHASE DISPATCH" skills/concept/SKILL.md` to get exact line ranges before writing.

</code_context>

<deferred>
## Deferred Ideas

- Per-phase file split (999.2 backlog) — splitting SKILL.md into 9 separate files. This is a separate backlog item and is NOT part of this rewrite.
- Content improvements / prompt quality upgrades — out of scope. This phase rewrites format only.

</deferred>

---

*Phase: 1000-concept-skill-js-to-prose*
*Context gathered: 2026-04-09*
