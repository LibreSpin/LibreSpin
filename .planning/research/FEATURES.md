# Feature Research

**Domain:** AI-driven hardware design assistant / Claude Code skill pack for PCB and embedded circuit design
**Researched:** 2026-04-04
**Confidence:** MEDIUM-HIGH

---

## Context: What LibreSpin v1 Is

LibreSpin v1 ports the existing hw-concept agent (a 9-phase, 6,960-line AGENT.md system) into the LibreSpin skill pack packaging. The v1 feature question is: what does the concept agent already have, what is missing from it, and what distinguishes it from the growing ecosystem of AI hardware design tools?

The competitive landscape has expanded quickly. Flux Copilot, CircuitMind, Celus, kicad-happy, and multiple KiCad MCP servers all entered the space by 2025-2026. Table stakes have shifted accordingly.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume a hardware design AI assistant has. Missing these makes the product feel broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Conversational requirements interview | Every AI design tool from Flux to Celus starts with NL requirements capture. Users assume the AI will ask clarifying questions rather than demand a formal spec up front. | LOW | hw-concept has this: 3-section progressive disclosure with Q1-Q3 rounds, AskUserQuestion tool |
| Completeness scoring / gap detection | Without a signal that requirements are "good enough," users generate bad outputs and don't know why. Threshold gating is table stakes. | LOW | hw-concept has this: weighted 50/30/20 scoring, 70-point gate |
| Multiple concept alternatives | Generating only one design option is a dealbreaker. Users want to compare approaches. Flux, Celus, CircuitMind all show multiple options. | MEDIUM | hw-concept has this: configurable 3-10 concepts with diversity enforcement |
| ASCII/text block diagrams | Without visual structure, concepts are just prose. Users need enough diagram to understand topology without needing a GUI. | LOW | hw-concept has this: ASCII diagrams with arrow conventions |
| BOM output with part numbers | A concept without sourcing data is a sketch, not a design artifact. Every commercial tool (kicad-happy, Celus, CircuitMind) outputs a BOM. | MEDIUM | hw-concept has this: DigiKey/Mouser/LCSC with lead time flags |
| Component research via web | Static training data for component selection goes stale within months. Web-grounded search is expected. | MEDIUM | hw-concept has this: WebSearch for datasheet validation, availability |
| State persistence across sessions | Multi-phase workflows cannot fit in one context window. Users expect to resume where they left off. | LOW | hw-concept has this: .planning/hw-concept-state.md with YAML frontmatter |
| Side-by-side concept comparison | Raw concept files without comparison are harder to evaluate. A matrix or summary is expected. | LOW | hw-concept has this: comparison-matrix.md |
| Interactive + file-based input modes | Power users have YAML templates; new users want conversational onboarding. Both are expected. | LOW | hw-concept has this: --input FILE or "interactive" mode |

### Differentiators (Competitive Advantage)

Features that set LibreSpin apart. Not universally expected, but high value where present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Terminology disambiguation protocol | Component datasheets reuse terms like "Mode", "Speed", "GPIO" with conflicting meanings across contexts. The hw-concept AGENT.md includes an explicit protocol for detecting and resolving these collisions before validation scoring. No other open-source tool addresses this. | LOW (already built) | hw-concept Phase 2.5: requirement-to-component mapping tables, configuration conflict detection |
| Diversity enforcement on concepts | Generating 3 concepts that all use the same MCU family is useless. hw-concept enforces architectural diversity across 4 dimensions: processing, topology, communication, power. | LOW (already built) | Retry loop with configurable maxRetries; reduces count rather than forcing similarity |
| Confidence-gated phase progression | Users cannot skip past incomplete requirements to generation. The 70-point gate enforces workflow quality. Commercial tools (Celus, Flux) use implicit sufficiency checks; explicit scoring is differentiating. | LOW (already built) | Score breakdown visible to user, gap-filling loop |
| Explicit assumptions per concept | Each concept documents its assumptions (BLE range, single-sided PCB, sensor bandwidth) for Phase 1 validation. This makes the AI's reasoning auditable. | LOW (already built) | Stored in concept structure, surfaced in validation phase |
| Success-criteria-driven scoring | Concepts are evaluated against user-defined success criteria (cost, battery life, time-to-prototype), not generic quality metrics. | LOW (already built) | Collected post-requirements, stored in state, used in final comparison |
| FOSS-only stack | Flux, Celus, CircuitMind are proprietary SaaS. kicad-happy depends on paid distributor APIs. LibreSpin's full pipeline targets KiCad + NGSpice only, making it the only fully open-source end-to-end option. | LOW (architectural) | MIT license; no proprietary EDA dependencies |
| Claude Code skill pack packaging | Installs into Claude Code's existing infrastructure (agents/, commands/) via npx. No separate app, no SaaS account, no browser. The design context lives in the repo. | LOW (already built in hw-concept) | Same pattern as GSD, proven distribution model |
| Domain detection for concept strategy | Detects motor-control, IoT-sensor, processing-intensive domains from requirements and adjusts concept generation strategy accordingly (FOC vs. trapezoidal, edge vs. cloud, MCU vs. DSP). | LOW (already built) | identifyDomain() function in Phase 2 |
| Self-critique and iterative refinement | Academic research (2025) confirms iterative refinement cycles are essential for reliable AI hardware design outputs. hw-concept includes configurable iteration_limit passes and a critique phase. | MEDIUM (built but quality-dependent) | Phase 6 in 9-phase workflow; configurable thresholds |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build, with rationale.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Automatic part number selection without human gate | Users want a fully autonomous BOM. AI hallucination rates for specific part numbers are high (JITX research confirms wrong topology choices, fabricated decoupling caps, wrong pin mappings). | LLMs consistently recommend "average" parts over application-specific ones; component context is absent from training data. Fabricated part numbers pass through undetected until prototypes are built. | Web-research-grounded component suggestions with explicit confidence flags; human validation gate before BOM is finalized. hw-concept already does this correctly. |
| GUI or web interface | Users ask for visual editors, real-time schematic viewers, drag-and-drop layout. | Massive implementation complexity with no skill-pack payoff. KiCad already provides the GUI. Building a second GUI creates maintenance burden and competes with KiCad rather than wrapping it. | CLI-first via Claude Code. LibreSpin outputs feed into KiCad; it doesn't replace KiCad. |
| Provider abstraction (OpenAI, Gemini, etc.) | Users want to swap LLM backends for cost or capability reasons. | Prompt engineering for Claude is not portable. Abstractions that try to be provider-agnostic produce worse prompts for every provider. Claude Code is the delivery mechanism and the intelligence layer — both move together. | Ship for Claude. Port prompts for other providers only if user demand emerges post-v1. |
| Real-time distributor API calls | Users want live pricing and stock. | API keys, rate limits, authentication, cost per call. Creates a dependency that breaks when distributor APIs change (and they do). kicad-happy handles this but it's high maintenance. | Web search for distributor pages is sufficient for concept-phase work. Actual BOM sourcing belongs in later pipeline phases (v4+) with proper tooling. |
| Fully autonomous end-to-end pipeline | Users want to describe requirements and receive Gerbers with no intervention. | AI accuracy at each stage compounds. A 90% accuracy rate per phase yields ~40% end-to-end accuracy across 6 phases. Hardware errors cost money (boards spin, components get ordered). | Human review checkpoints between each major phase. The hw-concept model of "phase output + human confirmation before next phase" is the right architecture. |
| Python library / programmatic API | Power users ask for import librespin in scripts. | The intelligence lives in the prompts, not in code. A Python API would be a wrapper around Claude API calls, adding no value while adding maintenance surface. | Keep it skill files. Orchestrate via Claude Code commands. |

---

## Feature Dependencies

```
Requirements Interview (Phase 1)
    └──requires──> Completeness Scoring (Phase 1)
                       └──gates──> Architecture Drafting (Phase 2)
                                       └──requires──> Terminology Disambiguation (Phase 2.5)
                                                          └──gates──> Validation (Phase 3)
                                                                          └──requires──> Component Research (Phase 4)
                                                                                              └──enables──> Concept Generation (Phase 5)
                                                                                                                └──requires──> Self-Critique (Phase 6)
                                                                                                                                   └──enables──> Final Output (Phase 7-9)

Success Criteria Collection (Phase 1 tail)
    └──enhances──> Final Comparison Matrix (Phase 9)

State Persistence
    └──enables──> All phases (fresh context per phase, state file as handoff)

FOSS Stack Constraint
    └──constrains──> All phases (KiCad + NGSpice only, no Altium, no proprietary APIs)
```

### Dependency Notes

- **Completeness scoring gates Architecture Drafting:** Low-quality requirements produce incoherent concepts. The 70-point gate is not optional.
- **Terminology disambiguation must run before validation:** The Phase 2.5 mapping step prevents false validation failures caused by same-word-different-meaning collisions between requirements and datasheets.
- **Component research requires web access:** Training data is too stale for real component availability/pricing. WebSearch is a hard dependency for the research phase.
- **Self-critique enhances concept quality:** The iteration_limit is configurable; too many iterations adds time with diminishing returns. Default 3-5 passes is the sweet spot per academic literature.
- **Success criteria collection enhances comparison but does not block it:** If user skips success criteria, comparison still works with generic quality metrics. But user-defined criteria produce materially better recommendations.

---

## MVP Definition

### Launch With (v1 — Concept Agent Port)

Minimum viable: port hw-concept faithfully, package as LibreSpin skill, distribute via npx.

- [ ] Requirements interview (all 3 sections: critical, important, nice-to-have) — the core value proposition
- [ ] Completeness scoring with 70-point gate — prevents garbage-in-garbage-out
- [ ] Success criteria collection — differentiator over raw concept generators
- [ ] Architecture drafting with diversity enforcement (configurable 3-10 concepts) — multiple meaningful options
- [ ] Terminology disambiguation (Phase 2.5) — prevents validation false-failures
- [ ] Component research (web-grounded, DigiKey/Mouser/LCSC) — grounds BOM in reality
- [ ] Concept generation with BOM, block diagram, assumptions — full concept artifact
- [ ] Self-critique and iterative refinement — improves output quality
- [ ] Final comparison matrix with success-criteria scoring — actionable recommendation
- [ ] State persistence (.librespin/ output dir) — resumable across sessions
- [ ] npx installer (distributes skill files to ~/.claude/) — zero-friction setup

### Add After Validation (v1.x)

Features to add once the core workflow validates with real users.

- [ ] YAML requirements template with schema validation — reduces interview friction for repeat users
- [ ] Configurable phase skipping (power users who have requirements.yaml can skip interview) — already partially in hw-concept via --input mode, but needs polish
- [ ] Improved domain detection coverage (add power-electronics, audio, RF domains) — currently covers motor-control, IoT-sensor, processing-intensive

### Future Consideration (v2+)

Features aligned with the roadmap milestones, not v1 scope.

- [ ] CalcPad CE CLI skill (v2) — circuit calculation verification before simulation
- [ ] NGSpice simulation skill (v2) — SPICE testbench generation and result interpretation
- [ ] ERC/DRC/DFM automated checks (v3) — KiCad scripting for design rule validation
- [ ] Production file export via KiCad CLI (v4) — Gerber, drill, BOM, pick-and-place
- [ ] Schematic layout skill (v5) — open research question, high complexity
- [ ] PCB layout skill (v6) — highest complexity, most innovation needed

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Requirements interview | HIGH | LOW (port existing) | P1 |
| Completeness scoring + gate | HIGH | LOW (port existing) | P1 |
| Multi-concept generation with diversity | HIGH | LOW (port existing) | P1 |
| BOM output with web-grounded research | HIGH | LOW (port existing) | P1 |
| State persistence + resumability | HIGH | LOW (port existing) | P1 |
| npx installer | HIGH | LOW (port existing) | P1 |
| Success criteria collection | MEDIUM | LOW (port existing) | P1 |
| Terminology disambiguation | MEDIUM | LOW (port existing) | P1 |
| Self-critique / refinement | MEDIUM | LOW (port existing) | P1 |
| Comparison matrix | MEDIUM | LOW (port existing) | P1 |
| YAML import mode | MEDIUM | LOW (port existing) | P2 |
| Domain detection expansion | LOW | LOW | P2 |
| CalcPad CE integration | HIGH | MEDIUM | P2 (v2) |
| NGSpice simulation | HIGH | MEDIUM | P2 (v2) |
| ERC/DRC/DFM checks | HIGH | HIGH | P3 (v3) |
| Schematic layout | HIGH | HIGH | P3 (v5+) |

**Priority key:**
- P1: Must have for v1 launch
- P2: Should have, add when possible or in next milestone
- P3: Future milestone, defer

---

## Competitor Feature Analysis

| Feature | Flux Copilot | kicad-happy | CircuitMind | Celus | LibreSpin v1 |
|---------|--------------|-------------|-------------|-------|--------------|
| Requirements interview | Conversational, NL | None (post-design analysis) | NL + sliders | Block diagram input | Full 3-section structured interview |
| Multiple concept alternatives | Yes, iterative | N/A (single design) | Yes, with sliders | Yes | Yes, 3-10 with diversity enforcement |
| BOM output | Yes | Yes (multi-distributor API) | Yes | Yes | Yes (web-grounded, LCSC/DigiKey/Mouser) |
| Component research | Proprietary DB | DigiKey/Mouser/LCSC APIs | Proprietary DB | Proprietary DB | WebSearch (no API keys required) |
| SPICE simulation | No | Yes (ngspice/LTspice) | No | No | v2 roadmap |
| ERC/DRC/DFM | No | Yes (42 EMC rules) | No | No | v3 roadmap |
| State persistence | Project files | Git-based | Cloud | Cloud | .librespin/ local files |
| FOSS | No (SaaS) | Yes (MIT) | No (SaaS) | No (SaaS) | Yes (MIT) |
| Runs in Claude Code | No (browser) | Yes | No | No | Yes (skill pack) |
| Terminology disambiguation | Not documented | Not documented | Not documented | Not documented | Yes (explicit protocol) |
| Self-critique / refinement | Conversational | No | No | No | Yes (configurable iterations) |
| Completeness gate | Implicit | N/A | N/A | N/A | Explicit (70-point weighted scoring) |
| Offline / no SaaS account | No | Mostly yes | No | No | Yes |

**Key insight:** LibreSpin's concept-phase feature set is competitive with or superior to Flux Copilot on the requirements-through-concept workflow. The gap is downstream: kicad-happy wins on schematic analysis, EMC pre-compliance, and post-layout BOM sourcing. LibreSpin's roadmap (v2-v6) closes that gap incrementally.

---

## Sources

- [kicad-happy GitHub — feature list, workflow, BOM sourcing](https://github.com/aklofas/kicad-happy) — HIGH confidence (primary source)
- [JITX: Testing Generative AI for Circuit Board Design](https://blog.jitx.com/jitx-corporate-blog/testing-generative-ai-for-circuit-board-design) — HIGH confidence (specific failure modes documented)
- [Flux AI: Powered Architecture Design blog](https://www.flux.ai/p/blog/ai-powered-architecture-design) — MEDIUM confidence (vendor marketing, some specifics verified)
- [CircuitMind product page](https://www.circuitmind.io/) — MEDIUM confidence (vendor marketing)
- [CELUS Design Assistant announcement](https://www.embedded.com/celus-unveils-next-generation-ai-powered-design-assistant-to-revolutionize-electronics-development/) — MEDIUM confidence
- [EMA Design Automation: Best AI for Generative PCB Design](https://www.ema-eda.com/ema-resources/blog/best-ai-software-for-generative-pcb-design-emd/) — MEDIUM confidence
- [Academic: Agentic AI for Hardware Design 2025 (ACM)](https://dl.acm.org/doi/10.1145/3748382.3748388) — MEDIUM confidence (academic, iteration counts validated)
- [arxiv: Agentic AI Hardware Design with self-critique loops](https://arxiv.org/html/2507.02660v1) — MEDIUM confidence (academic, confirms iteration threshold patterns)
- hw-concept AGENT.md — HIGH confidence (primary source, 6,960 lines analyzed directly)

---

*Feature research for: LibreSpin — AI-driven PCB and embedded circuit design Claude Code skill pack*
*Researched: 2026-04-04*
