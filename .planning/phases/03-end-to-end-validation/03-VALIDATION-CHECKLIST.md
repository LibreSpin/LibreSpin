# Phase 3: Validation Checklist

Evidence capture for CW-01 through CW-10.

## CW-01: Interactive Requirements Gathering
- [ ] Ran `/librespin:concept` without --input flag
- [ ] Agent used AskUserQuestion to ask requirements questions
- [ ] Progressive disclosure: critical -> important -> nice-to-have sections visible
- [ ] Phase 1 completed successfully
- Evidence: `.librespin/state.md` shows `phase: '3-requirements-gathering'`
- Evidence: `.librespin/01-requirements/requirements.yaml` exists with gathered data
- Evidence: `.librespin/config.yaml` exists with defaults
- Blocking bugs found: (none / list)

## CW-02: YAML File Import
- [ ] Ran `/librespin:concept --input .librespin/test-fixtures/requirements-complete.yaml`
- [ ] Agent loaded YAML without error
- [ ] Completeness score displayed (expected: near 100/100)
- [ ] Agent offered review option
- [ ] Phase 1 completed successfully
- Evidence: `.librespin/state.md` shows `source: 'yaml'`
- Evidence: `.librespin/01-requirements/requirements.yaml` matches input
- Blocking bugs found: (none / list)

## CW-03: Architecture Concept Generation (Phase 2)
- [ ] Ran `/librespin:concept` after Phase 1 complete
- [ ] Agent generated 5-6 diverse concepts
- [ ] Concepts written to `.librespin/02-concepts/`
- [ ] Overview file exists at `.librespin/02-concepts/overview.md`
- Evidence: `ls .librespin/02-concepts/` shows concept-*.md files
- Blocking bugs found: (none / list)

## CW-04: Validation Gate (Phase 3)
- [ ] Agent validated concepts against confidence threshold
- [ ] Web research used for validation
- [ ] Concepts scored and filtered
- Evidence: Validation sections added to concept files in `.librespin/02-concepts/`
- Evidence: `.librespin/state.md` updated to `phase: '3-validation-gate'`
- Blocking bugs found: (none / list)

## CW-05: Component Research (Phase 4)
- [ ] Agent researched specific components with real part numbers
- [ ] BOM files generated with pricing and availability
- Evidence: `ls .librespin/04-bom/` shows bom-*.md files
- Evidence: BOM files contain MPN (manufacturer part numbers)
- Blocking bugs found: (none / list)

## CW-06: Block Diagrams (Phase 5)
- [ ] Agent generated detailed block diagrams with MPNs
- [ ] Spec analysis performed against requirements
- Evidence: `ls .librespin/05-detailed-designs/` shows analysis-*.md files
- Evidence: Files contain ASCII block diagrams
- Blocking bugs found: (none / list)

## CW-07: Self-Critique & Refinement (Phases 6-8)
- [ ] Agent performed self-critique iteration(s)
- [ ] Concepts refined based on critique
- [ ] Quality scores tracked across iterations
- Evidence: `ls .librespin/06-refinement/` shows score-*.md and refinement-log.md
- Blocking bugs found: (none / list)

## CW-08: Comparison Matrix (Phase 9/7)
- [ ] Agent produced final comparison matrix
- [ ] Recommended concept identified
- Evidence: `.librespin/07-final-output/` contains comparison matrix
- Evidence: State.md shows `phase: '7-final-output'`
- Blocking bugs found: (none / list)

## CW-09: Resume Across Invocations
- [ ] Completed Phase 1, then ran `/librespin:concept` again
- [ ] Agent detected existing state.md and resumed from Phase 2
- [ ] Did NOT repeat Phase 1 questions
- [ ] (Optional) Interrupted mid-Phase-2 and resumed — agent picked up correctly
- Evidence: State.md phase value progressed without regression
- Blocking bugs found: (none / list)

## CW-10: Completeness Scoring
- [ ] Ran with complete YAML (requirements-complete.yaml): score >= 70, no gap-fill triggered
- [ ] Ran with stripped YAML (requirements-stripped.yaml): score < 70, gap-fill questions asked
- [ ] Scoring breakdown shows critical/important/nice-to-have components
- [ ] After gap-fill, recalculated score met threshold
- Evidence: Score output captured for both test cases
- Blocking bugs found: (none / list)

## Bug Fixes Applied
| Bug | CW Affected | Fix Description | File Changed |
|-----|-------------|-----------------|--------------|
| (list each blocking bug fixed during validation) | | | |

## Context Pressure Observations
- SKILL.md token count: ~58,000 tokens
- Phase where context pressure first observed: (phase number or "none")
- Symptoms: (truncation, skipped steps, abbreviated output, or "none")
- Recommendation for OPT-01 priority: (low / medium / high)
