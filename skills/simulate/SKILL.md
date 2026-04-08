---
description: LibreSpin SPICE simulation workflow using NGSpice CLI
argument-hint: "[--auto] [--analysis TYPE]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Bash
  - Glob
---

# /librespin:simulate

Run SPICE simulation for a selected circuit using NGSpice in batch mode. Reads component values from CalcPad output, generates a `.cir` netlist, executes `ngspice -b` headless, parses scalar results, validates against design targets, and saves approved outputs to `.librespin/09-simulation/`.

## Execution

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:

- `--auto` (bool, default false): Skip interactive analysis-type menu, use auto-detected type.
- `--analysis TYPE` (string, optional): One of `op`, `tran`, `ac`, `dc`. If provided, skip menu.

**Argument parsing:**

```
AUTO=false
ANALYSIS_TYPE=""

# Parse from $ARGUMENTS string
if $ARGUMENTS contains "--auto":
  Set AUTO=true

if $ARGUMENTS contains "--analysis":
  Extract TYPE after --analysis
  Set ANALYSIS_TYPE=TYPE
```

### Step 2: Prereq Check (SIM-01)

Run this exact bash check:

```bash
if command -v ngspice > /dev/null 2>&1; then
  echo "FOUND $(ngspice --version 2>&1 | head -1)"
else
  echo "MISSING"
fi
```

**If result is FOUND:** Continue with simulation.

**If result is MISSING:** Show the following install instructions verbatim:

```
NGSpice not found in PATH.

Install (Linux):
  sudo apt install ngspice          # Ubuntu/Debian
  sudo dnf install ngspice          # Fedora/RHEL
  sudo pacman -S ngspice            # Arch

Verify:
  ngspice --version
  which ngspice
```

Then use AskUserQuestion:

```
NGSpice not found. How would you like to proceed?

  1. I've installed it — re-check PATH
  2. Exit — I'll install manually and re-run /librespin:simulate
```

- On option 1 (re-check): Re-run the bash prereq check. If still MISSING, show instructions again and ask again. If FOUND, continue.
- On option 2 (exit): Report "Exiting. Install NGSpice and re-run /librespin:simulate." and stop.

### Step 3: Read Inputs (SIM-02)

Glob both input directories:

```
Glob .librespin/08-calculations/*.md
Glob .librespin/07-final-output/*.md
```

**If `.librespin/08-calculations/` glob returns empty:** Report error and stop:

```
Error: No calculation output found in .librespin/08-calculations/

Run /librespin:calcpad first to compute component values, then re-run /librespin:simulate.
```

**If `.librespin/07-final-output/` glob returns empty:** Report error and stop:

```
Error: No concept output found in .librespin/07-final-output/

Run /librespin:concept first to generate circuit design targets, then re-run /librespin:simulate.
```

**If both globs return files:** Read all matched files with the Read tool. Pay special attention to `*-summary.md` files in `.librespin/08-calculations/` — these contain the pass/fail table with computed component values per the frozen Phase 6 output contract. Collect full content for analysis type detection and agent context.

### Step 4: Analysis Type Selection (SIM-03, D-01/D-02/D-03)

**Auto-detect hint logic** — Search the concept output content (case-insensitive) for circuit type keywords:

- Contains `power supply`, `converter`, `buck`, `boost`, `ldo` → suggest `.tran`
- Contains `amplifier`, `filter`, `rc`, `lc` → suggest `.ac`
- Contains `logic gate`, `digital`, `cmos` → suggest `.op`
- Contains `diode`, `bjt`, `mosfet`, `iv curve` → suggest `.dc`
- Otherwise → suggest `.op` (safe default — always converges if circuit is valid)

**If `--analysis TYPE` provided:** Set `ANALYSIS_TYPE=TYPE` directly, skip menu.

**If `--auto` provided:** Set `ANALYSIS_TYPE` to the auto-detected type. Report: "Auto-selected analysis: [ANALYSIS_TYPE]".

**If neither flag:** Use AskUserQuestion with all 4 analysis types, highlighting the auto-detected recommendation:

```
Detected circuit type suggests [ANALYSIS_TYPE] analysis. Which analysis do you want to run?

  1. .op  — DC operating point (static voltages/currents)       [recommended if op]
  2. .tran — Transient time-domain simulation                   [recommended if tran]
  3. .ac  — AC frequency sweep (Bode plot)                      [recommended if ac]
  4. .dc  — DC sweep (I-V curves)                               [recommended if dc]

Recommended: option [N] based on circuit type detection.
```

Set `ANALYSIS_TYPE` to the chosen value.

### Step 5: Spawn simulate agent (SIM-02 through SIM-10)

Use the Agent tool with `subagent_type: simulate` and **`run_in_background: false`** (CRITICAL — the agent uses AskUserQuestion for netlist review and result approval; if backgrounded these prompts never surface and the agent burns ~100k tokens before timing out; see Pitfall 6 in 07-RESEARCH.md and Phase 6 Pitfall 4). Pass full context:

```
Run the NGSpice simulation workflow.

Selected analysis type: [ANALYSIS_TYPE]

Component values from .librespin/08-calculations/:
---
[paste contents of *-summary.md and relevant .cpd files]
---

Design targets from .librespin/07-final-output/:
---
[paste relevant concept content]
---

output_dir: .librespin/09-simulation/

The agent should:
1. Draft a .cir netlist using the analysis type and component values
2. Show the netlist inline and await user approval (edit loop)
3. Execute `ngspice -b circuit.cir` from .librespin/09-simulation/
4. Scan stdout+stderr for 4 known error patterns; map to remediations
5. Parse wrdata output for scalar values
6. Build pass/fail table vs design targets, suggest component changes on fail
7. Optionally generate matplotlib waveform PNG if Python + matplotlib present
8. Present results and ask for human approval before saving
9. On approval, save circuit.cir, results.txt, simulation-summary.md (+ waveform.png) to .librespin/09-simulation/
```

### Step 6: Report Completion

After the agent returns, report:

```
Simulation complete.

Outputs saved to .librespin/09-simulation/:
  circuit.cir              — SPICE netlist
  results.txt              — NGSpice wrdata output
  simulation-summary.md    — Pass/fail summary + component suggestions
  waveform.png             — (if matplotlib was available)

Next step: Review the simulation summary and iterate on component values via /librespin:calcpad if any targets failed.
```

## Notes

The following facts are hard-coded from Phase 7 research. Do not change them:

- **Exit code is unreliable** — NGSpice returns 0 on many failure modes. Success detection must scan stdout+stderr for error strings AND verify that the wrdata output file exists and is non-empty. Do NOT use `$?` alone. (07-RESEARCH.md Pitfall 1)

- **Title line is mandatory** — The first line of a `.cir` file is the circuit title (plain text, NOT a comment). Writing `* My Circuit` as line 1 makes NGSpice consume the comment as the title and misparse the next line. Always write a plain-text title as the first line. (07-RESEARCH.md Pitfall 2)

- **wrdata writes ASCII** — Use `wrdata results.txt v(out)` inside a `.control ... .endc` block. The file is plain text, parseable with `awk`/`grep`. Do NOT use the binary `write` / `.raw` format. (D-12)

- **cd before running** — `wrdata` paths are relative to CWD. Always `cd .librespin/09-simulation/` before running `ngspice -b circuit.cir`. (07-RESEARCH.md Pitfall 3; D-07)

- **Agent MUST be spawned foreground (`run_in_background: false`)** — The simulate agent uses AskUserQuestion for netlist review and result approval. If backgrounded, prompts never surface and the agent burns ~100k tokens before timing out. (07-RESEARCH.md Pitfall 6; same as Phase 6 Pitfall 4.)

- **matplotlib waveform is optional** — Check for Python + matplotlib at runtime with `python3 -c "import matplotlib"`. On absent, skip gracefully with a one-line note. No hard dependency. (SIM-08, D-18/D-19)
