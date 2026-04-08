# Features Research — v0.2 CalcPad & NGSpice

**Domain:** EE hardware design workflow — post-concept calculation and simulation
**Researched:** 2026-04-08
**Context:** Pure markdown skill pack, no Python runtime. Wraps external CLI tools (CalcPad CE and NGSpice). Consumes `/librespin:concept` output (comparison matrix, BOM, recommended concept README). Precedes KiCad schematic capture (v0.5+).

---

## CalcPad CE Skill — Table Stakes

These features must exist for `/librespin:calcpad` to be worth invoking.

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| Read concept output to extract design targets | Without this, user re-enters data already in `.librespin/`. Skill must parse the recommended concept's BOM and analysis for known component values and design goals. | Low | Reads `.librespin/07-final-output/<concept>/README.md` and BOM file. |
| Generate a `.cpd` worksheet from design targets | The skill's primary artifact. Claude composes a CalcPad CE worksheet (plain text `.cpd` format) with correct formulas for the chosen circuit block (LDO feedback divider, RC filter corner, decoupling cap value). | Medium | CalcPad `.cpd` is plain text with Calcpad formula syntax — Claude can generate it directly without a template engine. |
| Run the worksheet via CalcPad CE CLI | Invoke `Calcpad.Cli input.cpd output.html -s` and capture result. Without this step the skill is a text generator, not a verification tool. | Low | CLI syntax confirmed: `cli input.cpd [output.format] [-s]`. Requires CalcPad CE + .NET 10 runtime as prerequisites. |
| Surface human-readable results | Extract key calculated values from HTML or stdout and present them plainly: "Vout = 3.29V, R1 = 27kΩ, R2 = 10kΩ." Numbers must be explicitly stated. | Low | Parse HTML output or route stdout. Core of the user-visible value. |
| Validate results against design targets | Compare calculated values to targets from concept phase. Flag out-of-tolerance results: "Vout = 3.29V, target 3.3V ±2%, PASS". | Low-Medium | Tolerance check done by Claude reading the output — no extra tooling required. |
| Save worksheet and results to `.librespin/08-calculations/` | Persist `.cpd` worksheet and rendered output for traceability and as input to the simulation skill. | Low | Consistent with existing numbered phase directory pattern in `.librespin/`. |
| Human review gate before proceeding | Show summary, ask user to approve or adjust before marking calculations done. Same human-in-the-loop pattern as concept skill. | Low | Prevents downstream simulation with incorrect values. Non-negotiable given hardware stakes. |

---

## CalcPad CE Skill — Differentiators

Nice-to-have features that add distinct value without scope creep.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Circuit-block templates | Pre-written `.cpd` skeletons for common EE primitives: voltage divider, RC low-pass filter, LDO feedback, decoupling network, LED current limit, battery life estimation. User selects a block; Claude fills in values from concept output. | Medium | Templates are `.cpd` text snippets embedded in SKILL.md — no separate files needed. |
| Unit consistency warnings | If CalcPad HTML output shows a unit anomaly (pF vs nF confusion, mA vs A), flag it before simulation. Common source of SPICE divergence. | Low | Read CalcPad HTML; check unit annotations in results. |
| Multi-block worksheet | Chain calculations in one `.cpd` file: power budget → decoupling → filter corner. CalcPad supports sequential variable definitions across sections. | Medium | Useful for power supply design paths. Keep opt-in, not default behaviour. |
| Write confirmed values back to BOM | After calculations validate specific component values (e.g. R1 = 27kΩ confirmed), update the BOM markdown so the simulation skill has exact values without re-reading the worksheet. | Low-Medium | Keeps `.librespin/` state coherent for the next skill invocation. |

---

## NGSpice Simulation Skill — Table Stakes

These features must exist for `/librespin:simulate` to be worth invoking.

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| Read CalcPad CE output to build netlist | Simulation component values must come from CalcPad CE results, not re-entered manually. Skill reads `.librespin/08-calculations/` and updated BOM before generating netlist. | Medium | The critical integration point. Without it, the two skills are disconnected. |
| Generate a syntactically valid SPICE netlist | Claude generates a `.cir` file describing the sub-circuit being simulated (power supply stage, RC filter, bias network). Must run under NGSpice without modification. | Medium-High | Claude's SPICE syntax knowledge is the value. Skill template guides structure to reduce syntax errors. |
| Select appropriate analysis type | Skill asks (or infers from circuit type) which analysis is needed: `.op` (DC operating point), `.tran` (transient response), `.ac` (frequency sweep), `.dc` (sweep). Wrong analysis produces useless results. | Low-Medium | Menu-driven selection or inference: AC for filters, tran for power-on, op for bias point. |
| Run simulation via `ngspice -b` | Invoke `ngspice -b circuit.cir` and capture exit status and stdout/stderr. Headless, non-interactive. | Low | NGSpice batch mode is stable and well-documented. Prerequisite: ngspice installed (`sudo apt install ngspice` or equivalent). |
| Parse and summarize simulation results | Extract key scalar values from NGSpice ASCII output (`wrdata`, `print`): peak voltage, settling time, -3dB frequency, quiescent current. Present as human-readable summary. | Medium | Use `.control` block with `wrdata result.txt` in the netlist — ASCII output is far easier to parse than the binary `.raw` format. |
| Validate against design spec | Compare simulation output to requirements from concept phase: "Filter -3dB = 1.02 kHz, spec 1 kHz ±10%, PASS". Flag failures with suggested corrective action. | Low-Medium | Same validation gate pattern as CalcPad CE skill. |
| Save netlist and results to `.librespin/09-simulation/` | Persist `.cir` netlist and text results for traceability. Write state marker: "simulation complete, ready for schematic capture." | Low | Consistent with phase directory pattern. |
| Human review gate before marking complete | Show results summary, ask user to approve or request re-run with modified values. | Low | Simulation with wrong topology creates false confidence. Gate is non-negotiable. |

---

## NGSpice Simulation Skill — Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Circuit-type netlist templates | Pre-written `.cir` skeletons for common blocks: RC low-pass, voltage divider with load, LDO with bypass caps, common-emitter BJT bias, MOSFET gate driver. Claude fills in calculated values. | Medium | Significantly reduces netlist syntax errors for users unfamiliar with SPICE. Embedded in SKILL.md. |
| Convergence failure diagnosis | NGSpice exits silently on convergence failure. Skill detects non-convergence from stderr ("doAnalyses: TRAN: Timestep too small", "singular matrix") and suggests specific remedies: tighter timestep, `.options RELTOL`, initial conditions. | Medium | Extremely high value for new NGSpice users. Implementation is pattern-matching stderr strings — low actual complexity. |
| `.measure` statement generation | Emit `.meas` directives in the netlist (`meas tran t_settle trig v(out)=1.65 rise=1 targ v(out)=3.29 rise=1`) so NGSpice writes scalar measurement results to stdout. Cleaner and more reliable than parsing raw waveform data. | Medium | Prefer this over manual waveform parsing wherever possible. |
| AC sweep for filter verification | For filter circuits, automatically include `.ac dec 100 1 1MEG` and report -3dB frequency and passband flatness. Standard EE verification step that every filter design needs. | Low-Medium | Common enough to make a standard analysis path, not an optional extra. |
| Suggest topology fix on spec fail | If simulation shows a spec miss (filter corner frequency off, voltage out of range), suggest the corrective component change: "To shift -3dB from 1.2 kHz to 1.0 kHz, increase C1 from 100 nF to 120 nF." | Medium | Claude-native capability requiring no additional tooling. Strong differentiator for the skill. |

---

## Anti-Features (Explicitly Out of Scope)

Things that sound useful but would bloat the skill pack, violate architecture constraints, or belong to later milestones.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Python parsing scripts for raw files | Violates "no Python runtime" architecture. Requires install, version management, dependencies. | Use `wrdata` ASCII output in NGSpice `.control` block. No parser needed. |
| Automated netlist → schematic conversion | KiCad schematic capture is v0.5 milestone. Doing it here creates scope confusion and duplicates future work. | Gate at simulation output. Note "ready for schematic capture" in result summary. |
| SPICE model library management | Downloading, validating, and maintaining manufacturer SPICE models (.lib files) is a substantial project in itself. Version management alone is ongoing work. | Provide a stub `.model` section with placeholder and instruction to add manufacturer model. Flag when an external model is needed. |
| Monte Carlo and worst-case analysis | Valuable for production designs, far beyond MVP scope. Requires parameterised netlists and result aggregation across many runs. | Document as a future enhancement. Not v0.2. |
| Waveform plotting and visualisation | NGSpice batch mode produces binary `.raw` files. Rendering plots requires gnuplot, matplotlib, or similar — additional runtime dependencies. | Report scalar results instead. "Peak ripple = 12 mV" is more actionable than a plot at this stage. |
| Full-design simulation in one run | Simulating the entire design (MCU + power + RF + sensors) in a single SPICE run is convergence-prone, slow, and usually wrong at pre-schematic stage. | Simulate one sub-circuit block per invocation. User invokes `/librespin:simulate` multiple times for different blocks. |
| IBIS / signal integrity simulation | SI analysis requires IBIS models, transmission-line setup, and layout parasitics — none of which exist before schematic capture and PCB layout. | Out of scope until post-layout (v0.6+). |
| Auto-import netlist into KiCad | KiCad netlist import is lossy and component placement is manual. Automating this prematurely creates a fragile integration. | Leave for schematic skill (v0.5). |
| Full BOM regeneration from calculations | CalcPad CE confirms and refines specific component values; it should not replace the concept BOM wholesale. Wholesale replacement risks losing validated topology decisions. | Skill writes back specific refined values only (R1 = 10 kΩ ±1% confirmed). |

---

## Typical User Workflow

Step-by-step: what a user does in a v0.2 session from concept output to verified simulation result.

**Precondition:** `/librespin:concept` completed. `.librespin/07-final-output/` contains the recommended concept README with block diagram, BOM, and analysis. User has confirmed Concept A (or the recommended concept).

**Step 1 — Start calculations**
User runs `/librespin:calcpad`. Skill reads `07-final-output/concept-a-ultra-low-power-mcu/README.md` and `04-bom/bom-concept-a.md`. Identifies sub-circuits requiring component value calculations: LDO feedback divider, decoupling network, crystal load capacitors.

**Step 2 — Select circuit block**
Skill presents the blocks that need calculation. User picks one (e.g. "LDO feedback voltage divider"). Skill generates a `.cpd` worksheet with the correct formula, pre-filled with design target (Vout = 3.3 V, Vref = 1.25 V, R2 = 10 kΩ → solve for R1).

**Step 3 — Run CalcPad CE CLI**
Skill invokes `Calcpad.Cli calcpad-ldo-divider.cpd results.html -s`. CalcPad CE renders the worksheet. Skill reads the HTML output and extracts R1 = 27.4 kΩ, rounds to nearest E24 standard value: 27 kΩ.

**Step 4 — Human review gate (calculations)**
Skill presents: "R1 = 27 kΩ (calculated 27.4 kΩ, nearest E24), R2 = 10 kΩ. Vout actual = 3.29 V, target 3.3 V ±2%, PASS. Proceed or adjust?" User approves.

**Step 5 — Save and update state**
Skill saves worksheet to `.librespin/08-calculations/`, updates BOM with confirmed component values.

**Step 6 — Start simulation**
User runs `/librespin:simulate`. Skill reads `08-calculations/` for component values and the concept README for topology. Asks: "Which analysis type? (1) DC operating point, (2) Transient step response, (3) AC frequency sweep." User picks DC operating point to verify LDO bias.

**Step 7 — Generate netlist**
Skill generates `ldo-divider.cir` using resistor values from CalcPad CE output. Adds `.op` analysis directive and `.control` block with `print all` and `wrdata ldo-results.txt`.

**Step 8 — Run NGSpice**
Skill invokes `ngspice -b ldo-divider.cir`. Captures stdout. Parses `ldo-results.txt` for `v(out)`. Reports: "v(out) = 3.291 V, spec 3.3 V ±2%, PASS. Quiescent current through divider = 125 µA."

**Step 9 — Human review gate (simulation)**
Skill presents simulation summary. User approves or requests re-run with modified values.

**Step 10 — Save results and advance state**
Skill saves netlist and results to `.librespin/09-simulation/`. Writes state marker: "simulation complete for LDO feedback block, ready for schematic capture."

**Total session:** Two skill invocations (`/librespin:calcpad` + `/librespin:simulate`), two human gates, one component value calculated and confirmed, one simulation result validated against spec. No schematic yet — that is v0.5.

---

## Key Findings

- **CalcPad CE status is ACTIVE.** Community-maintained fork continues after original author went closed-source. Current release v7.6.2 (Desktop), v0.1.4 (VS Code extension). One AI-generated search summary incorrectly stated "discontinued March 2026" — this was contradicted by direct site fetch showing active development. Confidence: MEDIUM (direct site fetch, no official changelog read).

- **CalcPad CE CLI is confirmed and documented.** Syntax: `Calcpad.Cli input.cpd [output.format] [-s]`. Input is plain text `.cpd` format. Claude can generate valid `.cpd` worksheets directly — no template engine or code generation needed. Prerequisite: .NET 10 runtime (already accepted in CLAUDE.md key decisions). Confidence: MEDIUM (DeepWiki source, CLI behaviour verified against documentation pattern).

- **NGSpice batch mode is stable and well-suited to skill wrapping.** `ngspice -b circuit.cir` is the canonical headless invocation. `.control` blocks with `wrdata filename.txt` produce ASCII output that Claude can read directly — prefer this over binary `.raw` format. Confidence: HIGH (official manpages, tutorial, confirmed batch/interactive mode docs).

- **The critical integration point is CalcPad output → NGSpice input.** Component values calculated in `.cpd` must flow into the SPICE netlist without re-entry. Skill design must explicitly read CalcPad CE output before generating netlist. If this handoff fails, users will lose trust in both skills.

- **Convergence failure diagnosis is low-code, high-value.** New NGSpice users are frequently blocked by silent convergence failures. Pattern-matching stderr for known strings ("Timestep too small", "singular matrix", "doAnalyses") and suggesting specific fixes is trivial to implement in a skill prompt and extremely useful in practice.

- **Simulate per block, not per design.** Full-design SPICE simulation at pre-schematic stage is convergence-prone and usually wrong. The right pattern is one sub-circuit block per invocation. This is also how CalcPad CE worksheets work best — one formula sheet per block.

- **Human gates are non-negotiable.** Wrong component values fed into simulation produce false confidence, which is worse than no simulation. The concept skill's human-gate pattern must be inherited by both v0.2 skills.

- **State directories:** `.librespin/08-calculations/` for CalcPad CE worksheets and results; `.librespin/09-simulation/` for NGSpice netlists and output. Extends the existing numbered-phase pattern cleanly.

- **No Python, no plotting.** All data extraction uses NGSpice built-in ASCII output (`wrdata`, `print`) and CalcPad HTML output. Scalar results (peak voltage, -3dB frequency, settling time) are more actionable than waveform plots at this stage and require zero additional runtime dependencies.

---

## Source Confidence Summary

| Claim | Source | Confidence |
|-------|--------|------------|
| CalcPad CE actively maintained, v7.6.2 | Direct site fetch calcpad-ce.org | MEDIUM |
| CalcPad CLI syntax | DeepWiki (Proektsoftbg/Calcpad) | MEDIUM |
| `.cpd` is plain text format | DeepWiki file formats page | MEDIUM |
| NGSpice batch mode `ngspice -b` | Official manpage, SourceForge tutorial | HIGH |
| `wrdata` produces ASCII output | ngspice control language tutorial | HIGH |
| `.control` block suppresses `-r` rawfile | SourceForge discussion thread | MEDIUM |
| `.meas` writes results to stdout in batch | Official ngspice manual | HIGH |
| NGSpice analysis types (op, tran, ac, dc) | Official tutorial + manpage | HIGH |

---

*Feature research for: LibreSpin v0.2 — CalcPad CE CLI skill + NGSpice simulation skill*
*Researched: 2026-04-08*
