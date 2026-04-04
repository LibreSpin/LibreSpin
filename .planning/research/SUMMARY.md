# Project Research Summary

**Project:** LibreSpin
**Domain:** Claude Code skill pack — AI-driven PCB and embedded circuit design workflow
**Researched:** 2026-04-04
**Confidence:** HIGH

## Executive Summary

LibreSpin is a Claude Code skill pack that wraps a 9-phase hardware concept design workflow into a distributable `npx` package. The recommended approach is a faithful namespace port of the existing `hw-concept` agent system: take the 6,960-line AGENT.md, rename all internal strings from `hw-concept` to `librespin`, redirect output paths from `.planning/hw-concept/` to `.librespin/`, and package the whole thing as an npm-installable skill using the current `skills/` install target (not the deprecated `commands/` path). The full feature set for v1 — requirements interview, completeness scoring, multi-concept generation with diversity enforcement, web-grounded BOM research, self-critique, comparison matrix, and state persistence — already exists in hw-concept and needs no new development, only careful porting.

The key risk is not technical complexity but porting discipline. The source AGENT.md contains 67 hardcoded `.planning/hw-concept` path strings, 81 total `hw-concept` occurrences, and uses the deprecated `commands/` install target and legacy `Task` tool nomenclature. Missing any of these during the port will produce a skill that silently misbehaves: writing state to the wrong directory, failing to resume, or spawning the wrong agent. The recommended mitigation is an exhaustive grep-based inventory before any editing and a structured verification checklist before QA begins.

The architecture is proven: thin orchestrator command spawns a fat subagent per phase. This pattern is in production in both hw-concept and GSD. The agent's 6,960-line size is technically acceptable for v1 — hardware designers accept slower startup — but represents growing context pressure that should be refactored in v2 by splitting into core routing logic plus per-phase reference files. v1 should ship the faithful port; v2 cleans up the debt.

## Key Findings

### Recommended Stack

LibreSpin is a pure-markdown skill pack with a minimal Node.js installer. No application runtime is needed. The intelligence lives entirely in Claude's interpretation of the AGENT.md prompt; the installer is 60 lines of Node built-ins that copy markdown files into `~/.claude/`. This is the same pattern used by hw-concept and GSD — both are live references that can be inspected directly.

The correct v1 install target is `~/.claude/skills/librespin-concept/SKILL.md`, not `~/.claude/commands/librespin.md`. The `commands/` path still works as a compatibility alias but is deprecated. Building on `skills/` from day one avoids a future migration and enables skill-specific frontmatter features (`context: fork`, supporting files directory, `disable-model-invocation`).

**Core technologies:**
- Claude Code skills (`SKILL.md`): orchestrator entry point — current canonical path for v1, produces `/librespin:concept` command
- Claude Code subagents (`AGENT.md`): phase execution worker with fresh context per spawn — verified pattern from hw-concept
- Node.js >=18 (ESM): npx installer only, 60 lines, zero runtime dependencies — mirrors hw-concept install.js exactly
- YAML templates: human-editable requirements input; no YAML parsing library needed in the pack itself
- Markdown: all skill content; all intelligence lives in prompts

**What NOT to use:** Python runtime in the skill pack, bundlers, TypeScript for the installer, `js-yaml` dependency (in v1), skills namespace for the orchestrator if it produces an awkward double-slug.

### Expected Features

v1 is a port, not a greenfield build. Every P1 feature already exists in hw-concept and needs only porting and namespace correction. No new feature development is required to ship v1.

**Must have (table stakes) — all already built in hw-concept:**
- Conversational requirements interview (3-section progressive disclosure, Q1-Q3 rounds)
- Completeness scoring with 70-point gate — prevents garbage-in-garbage-out
- Multi-concept generation with diversity enforcement (3-10 concepts, 4-dimension diversity check)
- BOM output with web-grounded component research (DigiKey/Mouser/LCSC via WebSearch)
- State persistence across sessions (`.librespin/state.md` with YAML frontmatter)
- Side-by-side comparison matrix with success-criteria scoring
- Interactive and file-based input modes (`--input FILE` or conversational)
- npx installer for zero-friction user setup

**Should have (differentiators) — all already built:**
- Terminology disambiguation protocol (Phase 2.5 — unique to hw-concept, no competitor documents this)
- Confidence-gated phase progression (explicit 70-point scoring, gap-fill loop)
- Self-critique and iterative refinement (configurable iteration_limit, default 3-5 passes)
- Domain detection for concept strategy (motor-control, IoT-sensor, processing-intensive)
- Explicit assumptions per concept for auditability

**Defer (v2+):**
- CalcPad CE CLI skill (circuit calculation verification before simulation)
- NGSpice simulation skill (SPICE testbench generation and result interpretation)
- ERC/DRC/DFM automated checks (KiCad scripting)
- Production file export via KiCad CLI (Gerber, drill, BOM, pick-and-place)
- Schematic and PCB layout skills (v5/v6 — highest complexity, most open research)

**Anti-features (do not build):**
- Autonomous BOM finalization without human gate (LLM hallucination rates on part numbers are documented)
- GUI or web interface (KiCad already provides the GUI; LibreSpin wraps CLI)
- Provider abstraction (Claude-specific prompts are not portably abstracted)
- Real-time distributor API calls (maintenance burden; WebSearch is sufficient for concept phase)
- Python library / programmatic API (intelligence is in prompts, not code)

### Architecture Approach

The canonical pattern is thin orchestrator + fat subagent. The `SKILL.md` orchestrator does exactly five things: parse `$ARGUMENTS`, load `.librespin/state.md`, spawn the `librespin-concept` subagent via the `Agent` tool, handle the agent's return (completion/checkpoint/error), and verify state updated. All domain logic — phase routing, scoring, component research, concept generation, critique, output writing — lives in the subagent, which runs in a fresh context window each invocation. This keeps the orchestrator's context budget low (~15-20%) and prevents context rot from accumulating phase data.

State is passed across invocations via disk files only (never chat history). The `.librespin/` per-project directory holds `state.md`, `config.yaml`, `requirements.yaml`, and `concepts/`. Shared templates and future reference files live in `~/.claude/librespin/templates/` and `~/.claude/librespin/references/`.

**Major components:**
1. `~/.claude/skills/librespin-concept/SKILL.md` — orchestrator command; argument parsing, state load, agent spawn, return handling; target ≤200 lines
2. `~/.claude/agents/librespin-concept.md` — worker subagent; all 9-phase domain logic; ported from hw-concept AGENT.md (6,960 lines)
3. `~/.claude/librespin/templates/` — output scaffolds read by agent when writing concept files, BOM tables, comparison matrix
4. `.librespin/state.md` (per-project) — phase tracking, accumulated decisions, paths to prior outputs
5. `.librespin/config.yaml` (per-project) — user-tunable thresholds (completeness %, depth, iteration limits)
6. `bin/install.js` — npx installer; copies `.claude/` subtree to `~/.claude/` with `--local` flag support

**Key patterns to follow:**
- Thin orchestrator / fat agent (established in hw-concept and GSD)
- Phase-gated state machine (write state after each phase; resume on re-invocation)
- Fresh context per phase (no conversation history across spawns)
- Template-driven output (agent reads scaffold before writing)
- Config YAML for tunables (per-project, not hardcoded in agent)

### Critical Pitfalls

1. **Namespace string sprawl (67 hardcoded paths)** — Before any editing, run `grep -n "hw-concept" AGENT.md` (81 matches) and `grep -n "\.planning/hw-concept" AGENT.md` (67 matches). Categorize every occurrence into: path literals, namespace identifiers, command references, package/installer references. Make a substitution plan, then execute. Verify count drops to zero before QA.

2. **Wrong install target (`commands/` instead of `skills/`)** — Port to `~/.claude/skills/librespin-concept/SKILL.md` from day one. hw-concept used `commands/` because it predates the skills system (Oct 2025). The `commands/` path is a deprecated alias. Using `skills/` enables modern frontmatter features and avoids a future migration.

3. **Agent name / `subagent_type` mismatch** — The YAML frontmatter `name:` field is the canonical agent identity. The `Agent` tool resolves by name, not filename. Set `name: librespin-concept` in the frontmatter AND `subagent_type="librespin-concept"` in the orchestrator. Verify with `claude agents` after first install.

4. **Dead `OUTPUT_DIR` parameter** — hw-concept declares `--output DIR` but the agent ignores it and writes to ~30 hardcoded paths. Either wire it up to all write calls or remove it from `argument-hint`. Never ship a documented parameter that has no effect.

5. **AGENT.md context window pressure at 6,960 lines** — At ~58,000 tokens, the agent's system prompt occupies significant context before any user message. Late phases (5-9) may produce truncated or degraded outputs on thorough-depth runs. Accept this for v1; plan a refactor in v2 to split into core routing logic + per-phase reference files loaded via the Read tool.

6. **State file conflict with GSD** — LibreSpin must write exclusively to `.librespin/`, never to `.planning/`. After namespace substitution, run `grep -rn "\.planning/" .claude/` on the installed skill pack. Any hit outside documentation prose is a bug.

## Implications for Roadmap

Based on the combined research, v1 is a 4-phase project: scaffold the package, port the content, test, and publish. All features exist. The work is structural and verification-heavy, not creative.

### Phase 1: Package Scaffold and Installer

**Rationale:** Nothing can be tested until the installer works and the directory structure exists. This is the foundation all other phases depend on.
**Delivers:** Working `npx librespin-install` that copies files to `~/.claude/`; correct directory layout (`skills/librespin-concept/`, `agents/`, `librespin/templates/`); `--local` flag; restart instruction on success.
**Addresses:** Table stakes — zero-friction setup (npx installer)
**Avoids:** Wrong install target pitfall (use `skills/` from day one); installer namespace strings mentioning `hw-concept`
**Research flag:** Standard patterns — installer is 60 lines of Node built-ins, hw-concept is the reference implementation. No additional research needed.

### Phase 2: Namespace Port (Content Migration)

**Rationale:** The entire value of v1 is in AGENT.md. The port must be systematic, not opportunistic. A disciplined grep-inventory-before-edit approach prevents the silent misbehaviors documented in PITFALLS.md.
**Delivers:** Fully ported AGENT.md (renamed, all 81 `hw-concept` occurrences replaced), orchestrator SKILL.md (≤200 lines, `Agent` tool nomenclature, `.librespin/` state paths), templates ported to new path, `OUTPUT_DIR` dead parameter resolved.
**Addresses:** All P1 features (they exist in hw-concept; porting transfers them)
**Avoids:** Namespace string sprawl; dead OUTPUT_DIR parameter; Task vs Agent tool terminology; .planning/ state conflict; agent name / subagent_type mismatch
**Research flag:** No additional research needed. Verification checklist from PITFALLS.md drives QA. Run all 8 items in the "Looks Done But Isn't" checklist before declaring complete.

### Phase 3: End-to-End Validation

**Rationale:** The port introduces no new features, so correctness verification is the entire deliverable of phase 3. Must validate all 9 workflow phases, interactive and file-based input modes, and resume logic.
**Delivers:** Passing smoke test across all 9 phases with both `interactive` and `--input requirements.yaml` modes; state resume verified on second invocation; all concept outputs landing in `.librespin/concepts/`; no `hw-concept` strings in any output or generated file.
**Avoids:** JavaScript pseudocode ambiguity (verify agent doesn't attempt to run Node.js via Bash); context pressure symptoms in phases 5-9 (check output completeness on thorough-depth run)
**Research flag:** No research needed. Acceptance criteria are enumerated in PITFALLS.md verification checklist.

### Phase 4: npm Publish and Documentation

**Rationale:** A skill pack that can't be installed by strangers hasn't shipped. Public distribution requires clean `package.json`, a useful README, and an npm publish.
**Delivers:** Published npm package (`librespin` or `librespin-install`); README with install instructions, prerequisites, and usage examples; `package.json` with correct `files` array (only `bin/` and `.claude/`).
**Addresses:** Feature — npx installer / zero-friction setup (public-facing)
**Avoids:** Publishing Python runtime or bundler artifacts; including dev files in the npm package
**Research flag:** Standard patterns — npm publish workflow is well-documented. No additional research needed.

### Phase 5 (v2): Context Optimization and CalcPad CE Integration

**Rationale:** v1 ships the faithful port. v2 addresses the two largest architectural debts: AGENT.md context pressure and the CalcPad CE CLI integration (the next pipeline stage).
**Delivers:** Refactored AGENT.md split into core routing + per-phase reference files (~1,000-line core); `librespin-calcpad` agent wrapping CalcPad CE CLI via Bash tool; updated orchestrator routing.
**Avoids:** AGENT.md context pressure pitfall (late-phase degradation); requires .NET 10 on host (document as prerequisite, don't bundle)
**Research flag:** CalcPad CE CLI integration needs research — API surface, .NET 10 runtime availability on target machines, error handling for CLI failures. Recommend `/gsd:research-phase` before v2 planning.

### Phase 6 (v3): NGSpice Simulation Skill

**Rationale:** SPICE simulation closes the gap with kicad-happy, the strongest open-source competitor. Requires NGSpice CLI wrapping and testbench generation from concept outputs.
**Delivers:** `librespin-ngspice` agent generating SPICE netlists and testbenches from concept BOMs, invoking NGSpice CLI via Bash, parsing and interpreting simulation results.
**Research flag:** NGSpice CLI interface, netlist generation from concept-phase artifacts, result interpretation — recommend `/gsd:research-phase` before v3 planning. This is less-documented territory.

### Phase 7 (v4+): ERC/DRC/DFM and Production Export

**Rationale:** KiCad scripting, ERC/DRC automation, and Gerber export are the highest-value downstream phases but also highest complexity. kicad-happy has 42 EMC rules — worth studying before building.
**Research flag:** KiCad Python scripting API, CLI-driven ERC/DRC, DFM rule coverage — recommend `/gsd:research-phase`. This phase has the most open questions.

### Phase Ordering Rationale

- Scaffold before content: installer must work before agent files can be tested
- Namespace port as a single phase: interleaving port work with feature work creates verification confusion; complete the port cleanly before adding anything
- Validation as a dedicated phase: the port's correctness cannot be assumed; it requires explicit end-to-end testing of all 9 workflow phases
- Publish after validation: public users should not encounter namespace bugs
- v2+ phases follow the pipeline order (requirements → calculation → simulation → layout → production) because each phase's output feeds the next as input

### Research Flags

Phases needing `/gsd:research-phase` during planning:
- **Phase 5 (v2 — CalcPad CE):** CalcPad CE CLI is a .NET tool with undocumented (from this research) API surface. Integration patterns for .NET CLI tools in Claude Code agents need verification.
- **Phase 6 (v3 — NGSpice):** SPICE netlist generation from concept-phase artifacts is a non-trivial translation. NGSpice CLI error handling and result parsing need research.
- **Phase 7 (v4 — KiCad EDA):** KiCad Python scripting API, headless ERC/DRC, and DFM rule systems are complex and version-sensitive. kicad-happy is the best available reference but its patterns need study before adopting.

Phases with standard patterns (skip `/gsd:research-phase`):
- **Phase 1 (Scaffold):** Node.js installer pattern is fully documented in hw-concept. hw-concept `bin/install.js` is a direct reference.
- **Phase 2 (Port):** Mechanical work guided by grep inventory. No unknown unknowns.
- **Phase 3 (Validation):** Acceptance criteria fully enumerated in PITFALLS.md.
- **Phase 4 (Publish):** Standard npm publish workflow.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against official Claude Code docs (skills, subagents, plugins). hw-concept and GSD are live reference implementations, directly inspected. Node version confirmed on target machine. |
| Features | HIGH | P1 features verified line-by-line in hw-concept AGENT.md (6,960 lines). Competitor analysis covers 5 tools with primary sources for 2 (kicad-happy GitHub, JITX blog). v2+ features are roadmap items, not researched in depth. |
| Architecture | HIGH | GSD and hw-concept are live, inspectable implementations. Component boundaries, state schema, and installer pattern are all verified against running code. |
| Pitfalls | HIGH | Pitfalls derived from direct source inspection (grep counts are exact: 81 `hw-concept`, 67 `.planning/hw-concept` occurrences) and verified Claude Code docs (Task→Agent rename, `commands/` deprecation). |

**Overall confidence:** HIGH

### Gaps to Address

- **CalcPad CE CLI API surface:** Research identified CalcPad CE as the v2 target but did not inspect its CLI interface, .NET version requirements, or error handling patterns. Needs dedicated research before v2 planning.
- **NGSpice testbench generation:** The research confirms NGSpice is FOSS and apt-installable but does not cover how to generate SPICE netlists from concept-phase BOM/block-diagram artifacts. Open question for v3 planning.
- **KiCad Python API version stability:** kicad-happy uses KiCad scripting heavily but its patterns have not been audited for the KiCad version available on target machines. Needs research before v4 planning.
- **AGENT.md context utilization metrics:** The 6,960-line / ~58,000-token estimate is approximate. Actual token count and per-phase context utilization on thorough-depth runs should be measured during Phase 3 validation to quantify the v2 refactor priority.
- **npm package name availability:** `librespin` as an npm package name has not been verified as available. Check before Phase 4.

## Sources

### Primary (HIGH confidence)
- `/home/william/repo/hw-concept/` — live reference implementation; installer, command, AGENT.md directly inspected (2026-04-04)
- `~/.claude/get-shit-done/` — GSD skill pack; live reference for agent structure and naming conventions
- https://code.claude.com/docs/en/skills — official skills docs; SKILL.md frontmatter, commands vs skills, `context: fork`, `disable-model-invocation` verified
- https://code.claude.com/docs/en/sub-agents — official subagents docs; AGENT.md frontmatter fields, Task→Agent rename (v2.1.63), scope table verified
- https://code.claude.com/docs/en/plugins — official plugins docs; plugin.json structure, namespace behavior verified
- https://github.com/aklofas/kicad-happy — feature list, BOM sourcing workflow (primary source for competitor analysis)
- https://blog.jitx.com/jitx-corporate-blog/testing-generative-ai-for-circuit-board-design — documented failure modes for LLM hardware design (hallucinated part numbers, wrong topologies)

### Secondary (MEDIUM confidence)
- https://www.flux.ai/p/blog/ai-powered-architecture-design — Flux Copilot feature description (vendor marketing)
- https://www.circuitmind.io/ — CircuitMind product page (vendor marketing)
- https://www.embedded.com/celus-unveils-next-generation-ai-powered-design-assistant-to-revolutionize-electronics-development/ — CELUS announcement
- https://www.ema-eda.com/ema-resources/blog/best-ai-software-for-generative-pcb-design-emd/ — PCB AI tool survey
- https://dl.acm.org/doi/10.1145/3748382.3748388 — academic paper on agentic AI for hardware design (2025); validates iteration_limit patterns
- https://arxiv.org/html/2507.02660v1 — academic paper on self-critique loops in AI hardware design; confirms 3-5 iteration sweet spot

---
*Research completed: 2026-04-04*
*Ready for roadmap: yes*
