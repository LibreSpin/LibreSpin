# Pitfalls Research — v0.2 CalcPad & NGSpice

**Domain:** CLI-wrapping skills in a pure markdown Claude Code skill pack  
**Researched:** 2026-04-08  
**Overall confidence:** MEDIUM-HIGH (NGSpice behavior HIGH, CalcPad CE status HIGH, SPICE hallucination MEDIUM via SPICEPilot research, skill architecture MEDIUM via reverse-engineered docs)

---

## CLI Wrapping Pitfalls

### P1: NGSpice Exit Codes Cannot Be Trusted (HIGH confidence)

NGSpice `-b` does not reliably return a non-zero exit code on simulation failure. Errors print to stdout while the process exits 0. A skill that checks `$?` or equivalent to determine success will silently pass failed simulations.

**What goes wrong:** Claude runs `ngspice -b circuit.cir`, gets exit 0, reports success. The actual error `Error: unknown subckt` is buried in stdout.

**Correct pattern:** The skill must instruct Claude to scan stdout for lines beginning with `Error` and stderr for the string `run simulation(s) aborted`. These are the two reliable failure signals for NGSpice batch mode, not the exit code.

**Phase:** Must be in the `/librespin:simulate` skill before any QA.

---

### P2: Output Routing Conflict — `-r` Flag vs `.print` to Stdout (HIGH confidence)

When NGSpice is run with `-r rawfile.raw`, it suppresses `.print` and `.plot` output to stdout entirely. When run without `-r`, `.print` output goes to stdout as text. The skill must pick one approach and encode it in the netlist template; mixing them produces empty output with no error.

**What goes wrong:** Skill instructs Claude to read simulation results from stdout, but the netlist includes `.print` and a `-r` flag, so stdout is silent. Or the inverse: skill reads a rawfile that was never written because `-r` was omitted.

**Correct pattern:** Pick no `-r` flag, use `.print` statements, redirect stdout to a file (`ngspice -b circuit.cir > results.txt`). This keeps output human-readable and avoids binary rawfile parsing entirely.

**Phase:** Encode in the simulate skill template from day one; do not leave this as a user choice.

---

### P3: CalcPad CE Is Discontinued — Target Is Now CalcpadCE (HIGH confidence)

**This is the highest-priority research gap for v0.2.**

The original CalcPad CE (Proektsoftbg) was discontinued in March 2026. The official website (calcpad.eu) now shows only "The Calcpad FOSS project was discontinued." A community fork named **CalcpadCE** (calcpad-ce.org) was launched with the original author's blessing and is the live open-source continuation.

**What goes wrong:** Skill documentation, install instructions, or prerequisite checks that reference `calcpad.eu`, the Proektsoftbg GitHub, or the original CLI invocation name will link to dead/missing resources. The community fork may use a different CLI binary name (`calcpad` vs `calcpad-ce`), different .NET version requirement, or different input file format.

**Correct pattern:** All skill docs must reference CalcpadCE (calcpad-ce.org). The actual CLI invocation, .NET runtime minimum, and `.cpd` file format must be verified against a fresh CalcpadCE install before the skill is written — not assumed from training data about the original project.

**Phase:** Phase 1 spike of v0.2 (before any calcpad skill content is written). Block the skill on this verification.

---

### P4: .NET Runtime Version Mismatch Produces Cryptic Error (MEDIUM confidence)

CalcpadCE requires a .NET runtime. The original CalcPad CE required .NET 10. The community fork's requirement is unverified. On Linux, `dotnet` installed via apt may be `.NET 8`; Homebrew on macOS and Microsoft's official installer can shadow each other.

**What goes wrong:** `dotnet --version` returns `8.0.x`; CalcpadCE requires `10.0.x`. The tool fails with `The framework 'Microsoft.NETCore.App', version '10.0.0' was not found` — a message most EE users won't recognize.

**Correct pattern:** Skill opens with: (1) run `dotnet --version`, (2) compare against minimum required version documented in the skill, (3) emit explicit install instructions if below minimum. Do not proceed to file generation if prerequisite fails.

**Phase:** Calcpad skill prerequisite section.

---

### P5: Tool Binary Name Variability (MEDIUM confidence)

`ngspice` may be named `ngspice`, `ngspice-37`, or live at `/usr/local/bin/ngspice` depending on distro and install method. CalcpadCE CLI name is unconfirmed (may be `calcpad`, `calcpad-ce`, or `dotnet calcpad.dll`).

**What goes wrong:** Skill hardcodes `ngspice` or `calcpad`; binary has a different name on user's system. `command not found` with no recovery path.

**Correct pattern:** Each skill opens with `which ngspice` (or `which calcpad`) and gives explicit install instructions per platform if not found. `ngspice --version` confirms the version.

**Phase:** Prerequisite check section of both skills.

---

## SPICE Netlist Generation Risks

### N1: Wrong Analysis Type Selected (HIGH confidence, via SPICEPilot 2024)

LLMs cannot reliably infer the correct SPICE analysis type from natural language. They default to `.tran` (transient) for most circuits because it dominates training data, even when DC sweep or AC analysis is more appropriate.

**What goes wrong:** User asks to "simulate a voltage divider." Claude generates `.tran 1ns 100ns`. Simulation completes without error but the result is misleading — a DC circuit doesn't need transient analysis and the output tells the user nothing useful.

**Correct pattern:** The simulate skill must include an explicit analysis type decision step before netlist generation. Claude must state which analysis type it chose and why before writing any netlist. Include one annotated example for each of `.dc`, `.ac`, and `.tran` in the skill's reference material.

**Phase:** Core simulate skill content.

---

### N2: Fabricated Model Names (HIGH confidence, via SPICEPilot + NGSpice docs)

LLMs invent plausible SPICE model names that are syntactically correct but reference models not present in the netlist file. NGSpice errors: `Error: no model for device Q1`.

**What goes wrong:** Claude writes `Q1 c b e 2N3904` and includes a `.model 2N3904 NPN (BF=200)` — works if the model is inline. More often it writes `.lib 2N3904.lib` referencing a path that does not exist on the user's system, or omits the model definition entirely.

**Correct pattern:** Enforce a hard constraint in the skill prompt: all component models must be either (a) inline `.model` definitions within the same netlist file, or (b) system-installed NGSpice standard models confirmed to exist. No `.lib` references to manufacturer files unless the user explicitly provides a path. This eliminates the most common class of NGSpice errors on LLM-generated netlists.

**Phase:** Core simulate skill content. Document this constraint prominently.

---

### N3: DC Voltage Source Fails Transient Analysis (HIGH confidence, from NGSpice FAQ)

A voltage source defined as `Vcc 1 0 dc 5` is applied as an instantaneous step at t=0 in transient simulation. This causes convergence failures and "timestep too small" errors on capacitive-heavy circuits. LLMs generate this form by default because it's the most common in SPICE examples.

**What goes wrong:** Simulation fails on first timestep with `singular matrix` or `TRAN: timestep too small`. The error message does not indicate the source definition as the cause. Users assume the netlist is structurally wrong.

**Correct pattern:** Skill template must default to `PULSE(0 5 0 1ns 1ns)` form for transient voltage sources. Include a note about adding a small series resistance (e.g., `1m` ohm) on voltage sources driving capacitive loads. Document the `dc 5` trap explicitly.

**Phase:** Netlist template in simulate skill.

---

### N4: Floating Nodes and Missing Ground (HIGH confidence, from NGSpice docs)

LLMs occasionally produce netlists with floating nodes (connected to only one element) or missing a `0` ground node. NGSpice errors: `Error: no dc path to ground from node X`.

**What goes wrong:** Claude generates a resistor divider with a voltage source but forgets to connect the bottom of the divider to ground. The error message names the node but doesn't explain the topology problem.

**Correct pattern:** The skill must include an explicit self-review step after netlist generation and before invoking NGSpice: (1) confirm at least one `0` node exists, (2) every node has at least two connections, (3) pin ordering is correct for each device type. This review is a prompt instruction, not code — it asks Claude to re-read the netlist and verify these properties.

**Phase:** Core simulate skill content, as a mandatory pre-execution checklist.

---

### N5: MOSFET Sizing Errors in CMOS Circuits (MEDIUM confidence, via SPICEPilot)

LLMs miss the standard 2:1 PMOS-to-NMOS gate width ratio required for balanced drive strength, and generate physically implausible W/L ratios. CMOS circuits simulate without errors but produce incorrect timing or output swing.

**What goes wrong:** LLM generates equal-width PMOS and NMOS transistors. Circuit simulates but propagation delay is asymmetric. User accepts the result, proceeds to layout, and discovers the issue in silicon.

**Correct pattern:** Skill prompt should flag any MOSFET-containing netlist for human review before results are accepted. Include a note about the 2:1 PMOS/NMOS sizing convention in the CMOS example.

**Phase:** Simulate skill, as a human-in-the-loop warning on MOSFET netlists.

---

### N6: `wrdata` Output Silently Truncated (MEDIUM confidence, from NGSpice community)

NGSpice's `.control wrdata` command has a line length limit of approximately 1000 characters. Circuits with many output nodes produce truncated CSV files with no warning.

**What goes wrong:** Claude reads a `results.csv`, reports node voltages confidently, but the file is truncated at column 8 of a 12-column circuit. LLM does not notice the truncation.

**Correct pattern:** Prefer `.print V(node1) V(node2)` statements over `wrdata`. Limit each `.print` statement to 4–6 nodes. For circuits with many outputs, use multiple `.print` statements or use `.meas` to pre-compute key measurements inside NGSpice rather than reading raw tabular output.

**Phase:** Simulate skill template, netlist examples.

---

## Prerequisite Handling

### Q1: Missing Prerequisite Causes Claude to Attempt Autonomous Install (HIGH confidence)

If NGSpice or CalcpadCE is not found and the skill does not have an explicit prerequisite gate, Claude may attempt to install the tool autonomously via `sudo apt`, `brew`, or `dotnet tool install`. This is outside the skill's intended scope and can fail or require elevated permissions.

**Correct pattern:** Every skill must open with a prerequisite check section that (a) tests for the tool, (b) emits clear platform-specific install instructions if missing, (c) stops and returns control to the user rather than attempting install. Do not continue to netlist/calculation file generation if prerequisites are unmet.

**Phase:** First section of both skills.

---

### Q2: Old NGSpice Version on Default Package Repos (MEDIUM confidence)

Ubuntu 20.04 LTS ships ngspice-31 in its default repos. Significant `.meas` syntax and control language features changed between ngspice-31 and current (ngspice-45). A skill using modern syntax will fail silently or produce wrong results on an old version.

**Correct pattern:** State a minimum supported NGSpice version in the skill (recommended: ngspice-38, widely available as of 2024). The prerequisite check runs `ngspice --version`, parses the version number, and warns if below minimum. Include the PPA or alternative install method for Ubuntu users on old LTS.

**Phase:** Simulate skill prerequisite section.

---

### Q3: `dotnet` Not on PATH in Non-Login Shell (MEDIUM confidence)

On Linux, `dotnet` installed via snap or flatpak may not appear on PATH in the non-login shell that Claude's Bash tool uses. `which dotnet` returns empty even though `dotnet` works in a terminal.

**Correct pattern:** Skill checks both `which dotnet` and, on failure, common install paths (`/usr/bin/dotnet`, `$HOME/.dotnet/dotnet`, `/snap/bin/dotnet`). Emit the correct PATH export instruction for the user's detected shell.

**Phase:** Calcpad skill prerequisite section.

---

## Integration Pitfalls

### I1: Skill Directory Naming Must Follow Established Pattern (HIGH confidence)

The v0.1 concept skill lives at `skills/concept/SKILL.md`. The v0.1 post-mortem confirmed that naming a skill directory `skills/librespin-concept/` (with the namespace prefix in the dir name) caused a recursive cache install bug. New skills must follow `skills/<shortname>/SKILL.md`.

**Correct pattern:** New skills at `skills/calcpad/SKILL.md` and `skills/simulate/SKILL.md`. Invoked as `/librespin:calcpad` and `/librespin:simulate` via the repository namespace prefix. Never use `skills/librespin-calcpad/`.

**Phase:** Skill scaffolding in phase 1 of v0.2.

---

### I2: Unqualified Cross-Skill References Are Non-Deterministic (MEDIUM confidence, from obra/superpowers#1002)

If the calcpad skill refers to "run the simulate skill" or the simulate skill says "invoke calcpad," Claude's resolution of unqualified names varies between invocations, especially when legacy command files exist alongside new skills.

**Correct pattern:** All cross-skill references in SKILL.md content use fully qualified names: `/librespin:concept`, `/librespin:calcpad`, `/librespin:simulate`. Never use short names for cross-skill invocations.

**Phase:** Both skill files, content review before ship.

---

### I3: Multi-Skill Session Compounds Context Pressure (HIGH confidence)

The existing concept skill (`skills/concept/SKILL.md`) is 239KB (~58k tokens). If a user runs `/librespin:calcpad` in a session that already invoked the concept skill, both skill bodies are in context simultaneously. For long design sessions, this approaches context limits.

**What goes wrong:** Mid-session compaction silently drops skill instructions. Claude loses the calcpad formula conventions while trying to generate a SPICE netlist. Outputs degrade without error.

**Correct pattern:** New v0.2 skills must be lean by design — target under 500 lines each. Offload reference material (example netlists, formula libraries) to separate files read via the Read tool only when needed. This also makes the backlog item 999.2 (SKILL.md split) more urgent; it should be included in v0.2 scope.

**Phase:** Both skill files. Architecture decision before writing any skill content.

---

### I4: State File Conflicts Between Skills (MEDIUM confidence)

The concept skill writes to `.librespin/state.md`. If calcpad or simulate skills also write to `.librespin/state.md`, concurrent or sequential skill invocations will clobber each other's state.

**Correct pattern:** Each skill owns a distinct state file: `.librespin/calcpad-state.md`, `.librespin/simulate-state.md`. The concept skill's `state.md` is its exclusive territory. Establish this pattern in the skill scaffolding phase and document it in CLAUDE.md.

**Phase:** Skill scaffolding and template design.

---

### I5: Simulation Output File Size Is a Context Bomb (HIGH confidence)

A `.tran` simulation with 0.1ns timestep over 1µs generates 10,000 output lines. If the simulate skill instructs Claude to read the full `.print` output, it will consume several thousand tokens and crowd out the skill's interpretation instructions.

**What goes wrong:** Claude `cat`s a 5000-line result file, context fills, then Claude can no longer follow the post-processing instructions from the skill. It reports raw numbers instead of a meaningful design summary.

**Correct pattern:** The skill must instruct Claude to extract only key values — use `.meas` directives inside the netlist to pre-compute measurements (rise time, overshoot, steady-state voltage) before any file reading. Use `grep` for specific node values rather than reading the full file. Never read raw `.print` output in full.

**Phase:** Core simulate skill content, output handling section.

---

## Prevention Strategies

| Pitfall | Phase | Mitigation |
|---------|-------|-----------|
| CalcpadCE CLI unverified (P3) | First spike of v0.2 | Install CalcpadCE, confirm binary name, .NET version, invocation syntax before writing any skill content |
| NGSpice exit code unreliable (P1) | Simulate skill, error handling | Scan stdout for `Error` prefix; check stderr for `run simulation(s) aborted` |
| Output routing conflict (P2) | Simulate skill template | Standardize on no `-r`, `.print` to stdout, shell redirect to file |
| Wrong analysis type (N1) | Simulate skill, analysis decision step | Explicit decision tree; Claude states analysis type and justification before writing netlist |
| Fabricated model names (N2) | Simulate skill, constraints section | Hard rule: inline `.model` only; no `.lib` to external paths |
| DC source in transient (N3) | Netlist template | Default to `PULSE` form; document `dc` source trap with example |
| Floating nodes / no ground (N4) | Simulate skill, pre-execution checklist | Mandatory self-review checklist before invoking NGSpice |
| wrdata truncation (N6) | Simulate skill, output section | Prefer `.print` over `wrdata`; use `.meas` for key measurements |
| Missing prerequisite (Q1) | Both skills, prerequisite section | `which` check + version check + platform install instructions; halt on failure |
| Old NGSpice version (Q2) | Simulate skill, prerequisite | State minimum version (ngspice-38); parse `--version` output |
| dotnet not on PATH (Q3) | Calcpad skill, prerequisite | Check multiple known install paths; emit PATH fix instruction |
| Skill dir naming (I1) | Scaffolding | `skills/calcpad/` and `skills/simulate/`; never namespace-prefix the dir name |
| Unqualified cross-skill refs (I2) | Both skills, content | Use `/librespin:name` for all cross-skill references |
| Context pressure from large skills (I3) | Architecture decision | Target ≤500 lines; reference material in separate files; promote backlog 999.2 to v0.2 |
| State file conflicts (I4) | Scaffolding | Each skill owns `.librespin/<skill>-state.md` |
| Large simulation output (I5) | Simulate skill, output section | `.meas` for pre-computation; targeted `grep`; never `cat` raw output |

---

## Key Findings

- **CalcPad CE is discontinued as of March 2026.** The community fork CalcpadCE (calcpad-ce.org) is the live project. v0.2 must be built against CalcpadCE. The CLI invocation name, .NET runtime requirement, and input file format are unverified and must be confirmed as a spike before skill content is written. This is the single highest-priority unknown for v0.2.

- **NGSpice exit codes are unreliable for error detection.** The correct pattern is stdout scanning for `Error`-prefixed lines and stderr for `run simulation(s) aborted`. Any simulate skill that relies on exit code alone will silently pass failed simulations.

- **LLMs generate structurally valid but functionally wrong SPICE netlists at a significant rate.** SPICEPilot (2024) found in-context examples (ICL) improved Pass@1 by 52.9%. The simulate skill should include annotated working examples for each analysis type. The most common failure modes — wrong analysis type, fabricated models, missing ground — are addressable through explicit prompt constraints, not code.

- **The DC voltage source trap is the most common NGSpice beginner error and LLMs reproduce it reliably.** Default to `PULSE` form in the skill template and document the failure mode explicitly.

- **The existing 239KB concept skill already creates context pressure.** Adding two more skills increases the risk of mid-session context compaction. New skills must be lean (≤500 lines). The SKILL.md split (backlog 999.2) should be promoted into v0.2 scope — it is more urgent now than at v0.1.

- **Simulation output file size is a latent context bomb.** Use `.meas` directives for pre-computed measurements and targeted `grep` for value extraction. Never read raw `.print` output files in full.

- **Established v0.1 patterns for skill directory naming and state file isolation must be followed exactly.** Deviating from `skills/<shortname>/SKILL.md` caused a real bug in v0.1. Each skill needs its own `.librespin/<skill>-state.md` to avoid clobbering concept skill state.

---

## Sources

- [SPICEPilot: Navigating SPICE Code Generation and Simulation with AI Guidance (2024)](https://arxiv.org/html/2410.20553v1) — HIGH confidence, peer-reviewed. Documents LLM failure modes on SPICE generation and ICL mitigation.
- [NGSpice problems and learnings FAQ](https://gist.github.com/is-already-taken/2cf7722df5455c99842aa3eb680846c9) — MEDIUM confidence, community-maintained. Documents singular matrix, DC source, and subcircuit errors.
- [NGSpice User's Manual v45](https://ngspice.sourceforge.io/docs/ngspice-html-manual/manual.xhtml) — HIGH confidence, official documentation.
- [NGSpice batch mode output reference](https://nmg.gitlab.io/ngspice-manual/analysesandoutputcontrol_batchmode/batchoutput.html) — HIGH confidence, official manual mirror.
- [CalcpadCE community fork](https://calcpad-ce.org/) — HIGH confidence, current project home as of 2026-04-08.
- [calcpad.eu discontinuation notice](https://calcpad.eu/) — HIGH confidence, primary source confirming project end.
- [Claude Code Skills structure (reverse-engineered)](https://mikhail.io/2025/10/claude-code-skills/) — MEDIUM confidence. Documents skill injection mechanics and size guidance.
- [Skill namespace collision bug (obra/superpowers#1002)](https://github.com/obra/superpowers/issues/1002) — MEDIUM confidence, real-world case study of unqualified name resolution failure.
- [NGSpice batch mode command line options](https://nmg.gitlab.io/ngspice-manual/startingngspice/commandlineoptionsforstartingngspiceandngnutmeg.html) — HIGH confidence, official.

---

*Researched: 2026-04-08 for LibreSpin v0.2 milestone (CalcPad CE + NGSpice skills)*
