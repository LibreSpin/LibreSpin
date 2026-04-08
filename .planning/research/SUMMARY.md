# Research Summary — v0.2 CalcPad & NGSpice

**Synthesized:** 2026-04-08
**Sources:** STACK.md (v0.2 addendum), FEATURES.md, ARCHITECTURE.md, PITFALLS.md
**Overall confidence:** MEDIUM-HIGH

---

## Stack Additions

| Tool | Version | Install | Notes |
|------|---------|---------|-------|
| NGSpice | 42+ (46 = current stable) | `sudo apt install ngspice` | Easy; apt on all Ubuntu LTS |
| .NET Runtime 10.0 | 10.0 | `sudo apt install dotnet-runtime-10.0` | Required for CalcPad CE CLI only |
| CalcPad CE CLI | 7.6.x | Build from source (see gap below) | **No pre-built Linux binary confirmed** |

**No new npm packages or installer changes needed.** Both new skills are markdown files distributed via the existing plugin marketplace mechanism.

**CalcPad CE Linux gap (CRITICAL):** The community fork (`imartincei/CalcpadCE`) does not publish a pre-built Linux binary. A one-time `dotnet publish` build from source is required. The skill must either document this build step, or implement graceful degradation (Claude calculates inline when CLI absent). Resolve this as a spike before writing any calcpad skill content.

---

## Feature Table Stakes

### `/librespin:calcpad`
- Read concept output from `.librespin/07-final-output/` to extract design targets
- Generate a `.cpd` worksheet (plain-text CalcPad formula file) for the circuit block
- Run `Calcpad.Cli input.cpd output.html -s` and extract calculated values
- Validate results against design targets (e.g. "Vout = 3.29 V, target 3.3 V ±2%, PASS")
- Human review gate before proceeding
- Save worksheet + results to `.librespin/08-calculations/`

### `/librespin:simulate`
- Read CalcPad CE output from `.librespin/08-calculations/` to get confirmed component values
- Generate a syntactically valid `.cir` SPICE netlist for the sub-circuit block
- Select analysis type (`.op` / `.tran` / `.ac` / `.dc`) based on circuit type or user selection
- Run `ngspice -b circuit.cir`, detect convergence failures from stderr (never rely on exit code)
- Parse ASCII output (via `.control` + `wrdata`) and present scalar results
- Validate against design spec; suggest corrective action on spec miss
- Human review gate before marking complete
- Save netlist + results to `.librespin/09-simulation/`

---

## Architecture

**Pattern:** Both skills follow the exact two-file pattern from `/librespin:concept`:
- `skills/<name>/SKILL.md` — thin orchestrator (≤200 lines)
- `agents/<name>.md` — worker agent declaration

**New files needed:**
```
skills/calcpad/SKILL.md
skills/simulate/SKILL.md
agents/calcpad.md
agents/simulate.md
```

**Data flow:**
```
.librespin/07-final-output/   ← concept output (already exists from v0.1)
         ↓ read by calcpad skill
.librespin/08-calculations/   ← CalcPad worksheets + results
         ↓ read by simulate skill
.librespin/09-simulation/     ← NGSpice netlists + results
         ↓ → ready for schematic capture (v0.5)
```

**Build order:** CalcPad first, then Simulate. Phase 2 (simulate) depends on real CalcPad output to define the component-value contract (BOM update / results schema) that Simulate reads. Do not parallelize.

**Installer (`bin/install.js`):** Single file edit — copy two new skill directories alongside concept. No other installer changes.

---

## Watch Out For

1. **CalcPad CE Linux binary availability (CRITICAL)** — No pre-built binary confirmed. Must resolve before writing any calcpad skill content. Options: document build-from-source step, or implement graceful degradation (Claude calculates inline when CLI absent). This is the highest-priority unknown for v0.2. Spike required.

2. **NGSpice exit codes are unreliable** — `ngspice -b` returns 0 even on simulation failure. Error detection requires scanning stdout for `Error`-prefixed lines and stderr for "run simulation(s) aborted". Never rely on exit code alone — always scan output.

3. **SPICE netlist hallucinations** — LLMs produce plausible-but-wrong netlists. Documented failure modes: wrong analysis type, fabricated model names, missing ground nodes, DC voltage source in transient analysis (`Vcc 1 0 dc 5` causes tran failure). Mitigations: in-context annotated examples embedded in SKILL.md, default to `PULSE` form for voltage sources, mandatory human review before simulation run.

4. **Large simulation output is a context bomb** — Small-timestep transient sims produce 10,000+ output lines. Use `.meas` statements and `wrdata` with targeted results files; never `cat` full waveform output. Skill must read only the results file, not the raw simulation output.

5. **SKILL.md context pressure** — Adding two more SKILL.md files compounds the existing 239 KB concept skill context pressure. Keep new skills ≤200 lines each. The SKILL.md split (backlog 999.2) becomes more urgent with multiple skills — consider promoting to v0.2 scope (add as optional Phase 7).

---

## Open Questions

| Question | Impact | When to Resolve |
|----------|--------|----------------|
| CalcPad CE: does the CE fork have a pre-built Linux binary? | Blocks calcpad skill design | Spike before Phase 5 |
| CalcPad CE: is headless/batch mode confirmed (not just GUI/VS Code extension)? | Blocks calcpad skill design | Spike before Phase 5 |
| CalcPad CE binary name on Linux: `Calcpad.Cli` vs `calcpad-cli` vs other? | Affects skill invocation line | Spike before Phase 5 |
| `results.yaml` / BOM schema: formal typed keys vs free-form update? | Defines calcpad→simulate contract | Start of Phase 5 |
| SKILL.md split (999.2): promote to v0.2 or stay backlog? | Affects phase count | Before roadmap finalized |
| `.control wrdata` in NGSpice: does it suppress `-r rawfile` in v42+? | Affects output parsing approach | Phase 6 implementation |

---

## Recommended Phase Structure

| Phase | Name | Goal | Key Dependency |
|-------|------|------|---------------|
| 5 | calcpad-spike | Verify CalcPad CE CLI on this system — confirm binary name, headless mode, .NET version | Must precede Phase 6 |
| 6 | calcpad-skill | `/librespin:calcpad` — prereq check, worksheet generation, CLI invocation, human gate | Phase 5 spike confirms CLI |
| 7 | simulate-skill | `/librespin:simulate` — netlist generation, batch run, result parsing, convergence diagnosis | Phase 6 output defines component value contract |
| 8 | installer-update | Update `bin/install.js` to copy calcpad + simulate skill files | Phases 6 and 7 stable |

**Note on phase numbering:** v0.1 ended at Phase 4. v0.2 continues from Phase 5.

---

*Research synthesized for: LibreSpin v0.2 milestone planning*
*See individual research files for source citations and confidence levels*
