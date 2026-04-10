# Phase 7: NGSpice Simulation Skill - Context

**Gathered:** 2026-04-08
**Mode:** auto
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver `/librespin:simulate` — a Claude Code skill that guides SPICE simulation using NGSpice CLI, from netlist generation through human-approved results saved to `.librespin/09-simulation/`.

Skill structure follows the established pattern: `skills/simulate/SKILL.md` + `agents/simulate.md`. Pure markdown — no Python runtime required for core path (matplotlib path is optional).

Reads from: `.librespin/08-calculations/` (CalcPad output — component values and design targets)
Writes to: `.librespin/09-simulation/`

</domain>

<decisions>
## Implementation Decisions

### Analysis Type Selection (SIM-03)
- **D-01:** Menu-driven selection — skill presents the 4 analysis types (`.op`, `.tran`, `.ac`, `.dc`) with a brief description of each. Auto-detects a hint from circuit type in `.librespin/07-final-output/` and highlights the recommended option in the menu.
- **D-02:** Same UX pattern as CalcPad circuit block selection (Phase 6 D-08): show menu, allow user to confirm or override the auto-detected recommendation.
- **D-03:** `--auto` flag support: skips menu and uses the auto-detected analysis type directly.

### Netlist Generation (SIM-02)
- **D-04:** Draft-then-review flow: Claude reads component values from `.librespin/08-calculations/` (HTML output parsed for component values) and design targets from `.librespin/07-final-output/`, generates the `.cir` netlist inline in chat, user reviews before execution.
- **D-05:** Same pattern as Phase 6 D-10/D-11: user can request corrections in chat, Claude updates the netlist and confirms before running. Human review of the netlist occurs before `ngspice -b` is invoked.
- **D-06:** Netlist filename: `circuit.cir`, saved to `.librespin/09-simulation/circuit.cir`.

### NGSpice Invocation (SIM-04)
- **D-07:** Command: `ngspice -b circuit.cir` from the `.librespin/09-simulation/` directory (or with explicit path).
- **D-08:** Error detection: scan stdout AND stderr for known error/warning patterns. Do NOT rely on exit code — NGSpice is unreliable with non-zero exits for convergence failures.
- **D-09:** Success detection: absence of error patterns AND presence of expected output file(s) from `.control`/`wrdata` directives.

### Convergence Diagnosis (SIM-05)
- **D-10:** Scan stdout/stderr for 4 known failure patterns and map each to a specific remediation suggestion:
  1. `Timestep too small` → "Increase `TSTEP` or add `.options METHOD=gear`"
  2. `Singular matrix` → "Check for floating nodes — add a 1GΩ resistor from floating net to GND"
  3. `no convergence` / `doiter` → "Try `.options RELTOL=0.01 ITL1=500 ITL2=500` or reduce simulation time"
  4. `.model not found` / `unknown device` → "Verify model card for [component type] is included in netlist or `.lib` file"
- **D-11:** If pattern doesn't match known list, surface the raw NGSpice error verbatim and suggest checking NGSpice docs.

### Result Parsing (SIM-06)
- **D-12:** Use `.control` block + `wrdata filename.raw` in the netlist to write simulation output. Claude reads the `.raw` or text output file and extracts scalar values.
- **D-13:** For `.tran`/`.ac` analyses: extract peak, min, max, and final-cycle values from time-domain or frequency-domain output.
- **D-14:** Results presented as a readable summary table in chat before human review gate.

### Spec Validation (SIM-07)
- **D-15:** Read design targets from `.librespin/07-final-output/` (same source as CalcPad). Compare extracted simulation scalars against spec values.
- **D-16:** When a spec is missed, suggest a specific, actionable component change (e.g., "Output ripple 12% > 10% spec — increase C_out from 100µF to 220µF"). Claude infers the correction from the simulation result and circuit topology.
- **D-17:** Pass/fail summary shown inline. User can re-run with suggested changes or proceed to human review.

### Waveform Plot (SIM-08 — optional)
- **D-18:** Include as an optional path: skill checks for Python + matplotlib at runtime.
  - If present: generate PNG waveform saved to `.librespin/09-simulation/waveform.png`, display path to user.
  - If absent: skip gracefully with a note "Install Python + matplotlib to enable waveform plots."
- **D-19:** No new hard dependencies. Core simulation path works without Python.

### Output (SIM-10)
- **D-20:** Save to `.librespin/09-simulation/`:
  - `circuit.cir` — SPICE netlist
  - `results.raw` (or `.txt`) — raw NGSpice output
  - `simulation-summary.md` — human-readable results + pass/fail + component suggestions
  - `waveform.png` — if matplotlib available (SIM-08)

### Claude's Discretion
- Exact netlist syntax for each analysis type and circuit topology
- How to parse CalcPad HTML output to extract component values
- Python script content for waveform generation
- Specific `.control` block commands to use for each analysis type
- How to infer component change suggestions from simulation delta vs spec

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — SIM-01 through SIM-10 are the Phase 7 requirements
- `.planning/ROADMAP.md` §Phase 7 — success criteria and phase boundary

### Prior Phase Context (critical — read before planning)
- `.planning/phases/06-calcpad-ce-skill/06-CONTEXT.md` — Phase 6 decisions (output contract at `.librespin/08-calculations/`, draft-then-review UX pattern)
- `.planning/phases/05-calcpad-ce-spike/05-CONTEXT.md` — Spike findings

### Skill File References
- `skills/calcpad/SKILL.md` — reference for Phase 6 skill structure (established pattern to follow)
- `agents/calcpad.md` — reference for agent frontmatter pattern
- `skills/concept/SKILL.md` — original skill reference for `.librespin/` output conventions

### Project Context
- `.planning/PROJECT.md` — key decisions table, constraints (MIT, FOSS-only, minimalism-first, pure markdown skill)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `skills/calcpad/SKILL.md` — Phase 6 skill file: follow same structure, UX patterns (prereq check, draft-then-review, human gate), output conventions
- `agents/calcpad.md` — follow same frontmatter pattern (name, description, tools, color)

### Established Patterns
- Skill files: `skills/<name>/SKILL.md`
- Agent files: `agents/<name>.md`
- Output directory per skill: `.librespin/<NN>-<name>/`
- Phase 7 reads from: `.librespin/08-calculations/` (CalcPad output) and `.librespin/07-final-output/` (concept output)
- Phase 7 writes to: `.librespin/09-simulation/`
- Draft-then-review flow before tool execution (established in Phase 6)
- Human review gate before marking complete

### Integration Points
- Phase 8 (Installer Update) needs `skills/simulate/SKILL.md` and `agents/simulate.md` paths to be stable before updating `bin/install.js`
- NGSpice must be in PATH — no bundled binary (unlike CalcPad where we host pre-built binary)

</code_context>

<specifics>
## Specific Notes

- NGSpice is a system package (`sudo apt install ngspice`) — no binary hosting needed, unlike CalcPad
- Analysis type auto-detect hint: use circuit type from `.librespin/07-final-output/` (e.g., "power supply" → `.tran`, "amplifier" → `.ac`, "logic gate" → `.op`)
- SIM-08 waveform is explicitly "optional — requires Python + matplotlib" per REQUIREMENTS.md — skip gracefully, not an error
- The `.control`/`wrdata` pattern is the correct NGSpice batch output method — not `print` to stdout

</specifics>

<deferred>
## Deferred Ideas

- LTSpice/KiCad Spice integration — NGSpice only for v0.2
- Automated netlist generation from KiCad schematic — future milestone (v0.3+)
- Multi-step simulation runs with parametric sweeps — future capability
- Windows/macOS NGSpice install path differences — Linux-first, same as CalcPad spike scope

</deferred>

---

*Phase: 07-ngspice-simulation-skill*
*Context gathered: 2026-04-08*
