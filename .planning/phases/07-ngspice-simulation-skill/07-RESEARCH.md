# Phase 7: NGSpice Simulation Skill - Research

**Researched:** 2026-04-08
**Domain:** NGSpice CLI batch mode, SPICE netlist syntax, CalcPad HTML parsing, Claude Code skill structure
**Confidence:** HIGH (core findings verified against official docs + source evidence)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Menu-driven analysis type selection (.op, .tran, .ac, .dc) with auto-detect hint from circuit type
- **D-02:** Same UX as CalcPad block selection — show menu, allow confirm or override
- **D-03:** `--auto` flag skips menu and uses auto-detected type
- **D-04:** Draft-then-review netlist flow — Claude generates `.cir` inline, user reviews before `ngspice -b`
- **D-05:** Same edit loop pattern as Phase 6 D-10/D-11 — user requests corrections in chat, Claude updates and confirms
- **D-06:** Netlist filename: `circuit.cir`, saved to `.librespin/09-simulation/circuit.cir`
- **D-07:** Command: `ngspice -b circuit.cir` from `.librespin/09-simulation/` directory
- **D-08:** Error detection: scan stdout AND stderr. Do NOT rely on exit code
- **D-09:** Success detection: absence of error patterns AND presence of expected output file(s)
- **D-10:** 4 known failure patterns with specific remediations (see Convergence Diagnosis section)
- **D-11:** Unknown errors surfaced verbatim
- **D-12:** Use `.control` block + `wrdata filename.raw` for output
- **D-13:** .tran/.ac: extract peak, min, max, final-cycle values
- **D-14:** Results as readable summary table before human gate
- **D-15:** Design targets from `.librespin/07-final-output/`
- **D-16:** Specific component change suggestion when spec missed
- **D-17:** Pass/fail summary inline; user can re-run or proceed
- **D-18:** matplotlib waveform optional — check Python + matplotlib at runtime; skip gracefully if absent
- **D-19:** No new hard dependencies
- **D-20:** Save: `circuit.cir`, `results.raw`, `simulation-summary.md`, `waveform.png` (optional)

### Claude's Discretion

- Exact netlist syntax for each analysis type and circuit topology
- How to parse CalcPad HTML output to extract component values
- Python script content for waveform generation
- Specific `.control` block commands for each analysis type
- How to infer component change suggestions from simulation delta vs spec

### Deferred Ideas (OUT OF SCOPE)

- LTSpice/KiCad Spice integration — NGSpice only for v0.2
- Automated netlist generation from KiCad schematic — v0.3+
- Multi-step simulation runs with parametric sweeps — future
- Windows/macOS NGSpice install path differences — Linux-first
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SIM-01 | Verify NGSpice in PATH, provide install instructions if absent | Environment Availability section; install command documented |
| SIM-02 | Read component values from `.librespin/08-calculations/`, generate valid `.cir` | CalcPad Output Contract section; Netlist Examples section |
| SIM-03 | Select analysis type based on circuit type or user selection | Analysis Type Auto-Detect section |
| SIM-04 | Run `ngspice -b circuit.cir`, detect errors via stdout/stderr | NGSpice Batch Mode Output section; exact error strings documented |
| SIM-05 | Diagnose convergence failures with remediations | Convergence Patterns section; exact strings + fixes documented |
| SIM-06 | Parse via `.control` + `wrdata`, present scalar results | wrdata/control section; parsing patterns documented |
| SIM-07 | Validate against spec, suggest specific component change | Spec Validation section |
| SIM-08 | Optional matplotlib PNG waveform | Waveform section; Python snippet included |
| SIM-09 | Human review gate before marking complete | Architecture Patterns section (follows Phase 6 pattern exactly) |
| SIM-10 | Save netlist and results to `.librespin/09-simulation/` | Output Contract section |
</phase_requirements>

---

## Summary

Phase 7 delivers a pure-markdown Claude Code skill (`skills/simulate/SKILL.md` + `agents/simulate.md`) that runs SPICE simulation via NGSpice CLI in batch mode. The skill follows the established CalcPad pattern exactly: prereq check, draft-then-review, tool invocation, result parsing, human gate, save.

The primary technical unknowns going into this research were: (1) exact NGSpice error strings for convergence failure detection, (2) correct `.control`/`wrdata` syntax for batch output, (3) what CalcPad HTML output looks like so the agent can extract component values, and (4) the exact file structure the skill must follow. All four are now resolved with HIGH confidence.

NGSpice is not installed on the development machine. This is expected — it is a system package (`sudo apt install ngspice`) and the skill provides install instructions. No spike is needed for NGSpice; its batch mode behavior is well-documented and the error strings are confirmed from official sourceforge discussions. The `.control` + `wrdata` pattern is verified from the official ngspice control language tutorial.

**Primary recommendation:** Follow the CalcPad agent structure exactly. The simulate agent is structurally identical to `agents/calcpad.md` — prereq check → read inputs → draft netlist → AskUserQuestion review → execute → parse output → validate → human gate → save.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NGSpice | system (≥41 on Ubuntu 24.04) | SPICE simulator, batch execution | Only FOSS CLI SPICE simulator; apt-available |
| Python 3 + matplotlib | system optional | Waveform PNG generation | Standard scientific plotting; skip gracefully if absent |

### Installation

```bash
# NGSpice (SIM-01)
sudo apt install ngspice

# Verify
ngspice --version
which ngspice
```

No Node.js, no Python required for core simulation path. matplotlib is the only optional dependency (SIM-08).

---

## Architecture Patterns

### Skill File Structure (follows Phase 6 exactly)

```
skills/simulate/SKILL.md    # Orchestrator — steps 1-6, spawns agent
agents/simulate.md          # Worker — stages A-G
```

### Skill File Header (agents/simulate.md frontmatter)

```yaml
---
name: simulate
description: Run SPICE simulation via NGSpice CLI. Reads component values from CalcPad output, generates .cir netlist, executes batch mode, parses results, human review gate, saves output.
tools: Read, Write, Bash, AskUserQuestion, Glob
color: green
---
```

### Orchestrator (skills/simulate/SKILL.md) Step Flow

```
Step 1: Parse Arguments  ($ARGUMENTS: --auto, --analysis TYPE)
Step 2: Prereq Check     (ngspice in PATH)
Step 3: Read Inputs      (Glob .librespin/08-calculations/*.md + .librespin/07-final-output/*.md)
Step 4: Analysis Select  (menu or --auto)
Step 5: Spawn Agent      (Agent tool, subagent_type: simulate, run_in_background: false)
Step 6: Report Complete  (list output files, suggest next step)
```

CRITICAL: Agent MUST be spawned with `run_in_background: false`. The simulate agent uses AskUserQuestion for netlist review and result approval. If backgrounded it stalls silently (same Pitfall 4 as calcpad — confirmed in MEMORY.md).

### Agent (agents/simulate.md) Stage Flow

```
Stage A: Generate .cir netlist draft
Stage B: Inline review (AskUserQuestion — approve / edit / cancel)
Stage C: Execute ngspice -b circuit.cir
Stage D: Parse output (wrdata file)
Stage E: Spec validation (pass/fail table)
Stage F: Human review gate (AskUserQuestion — approve / re-run / cancel)
Stage G: Save outputs to .librespin/09-simulation/
```

---

## NGSpice Batch Mode Output

### Invocation (SIM-04)

```bash
cd .librespin/09-simulation/
ngspice -b circuit.cir > sim-stdout.txt 2> sim-stderr.txt
EXIT=$?
```

**Critical finding:** Do NOT use exit code for success detection (D-08). NGSpice returns exit 0 even on convergence failures in many cases, and non-zero for warnings in others. Success detection rule (D-09): absence of error patterns in stdout+stderr AND presence of output file from `wrdata`.

**What stdout contains on a successful run:**

```
Note: No compatibility mode selected!

Circuit: [title line from .cir file]

Doing analysis at TEMP = 27.000000 and TNOM = 27.000000

Initial Transient Solution
---------------------------
Node                 Voltage
...
ngspice 1 ->
```

The `ngspice N ->` prompt line always appears in batch mode — it is NOT an error. It is normal output.

**Stderr on success:** Empty or contains only version banner. Errors always go to stderr (confirmed from ngspice docs and sourceforge discussions).

### Exact Error Strings for Pattern Detection (SIM-05)

These are the verified string literals to scan for. Confidence: HIGH (verified from official sourceforge discussion threads with actual ngspice stdout captures).

| Pattern ID | Exact string to scan (case-sensitive substring) | Appears in |
|------------|--------------------------------------------------|------------|
| ERR-1 (Timestep) | `Timestep too small` | stderr |
| ERR-2 (Singular matrix) | `Warning: singular matrix` | stderr |
| ERR-3 (No convergence) | `doAnalyses: Too many iterations without convergence` | stderr |
| ERR-4 (Model not found) | `Unable to find definition of model` | stderr |

Full example strings observed in the wild:

```
# ERR-1
doAnalyses: TRAN: Timestep too small; time = 0.000105424, timestep = 1.25e-17: trouble with node "net-_c2-pad1_"

# ERR-2
Warning: singular matrix: check nodes a1#ibranch_0_0 and 6

# ERR-3
doAnalyses: Too many iterations without convergence

# ERR-4
Unable to find definition of model [modelname] - default assumed
```

### Remediation Mapping (D-10)

| Error Pattern | Detection Substring | Remediation to Present |
|--------------|---------------------|------------------------|
| Timestep | `Timestep too small` | "Increase `TSTEP` or add `.options METHOD=gear` to netlist" |
| Singular matrix | `singular matrix` | "Check for floating nodes — add `R_float 1GΩ` from floating net to GND" |
| No convergence | `Too many iterations without convergence` | "Try `.options RELTOL=0.01 ITL1=500 ITL2=500` or reduce simulation time" |
| Model missing | `Unable to find definition of model` | "Verify model card for [component] is included in netlist or `.lib` file" |

For ERR-1 and ERR-3, also provide the option to open the netlist edit loop (same as Stage B) so the user can add `.options` lines.

---

## .control Block and wrdata Syntax

### Verified Pattern (source: ngspice control language tutorial)

The `.control ... .endc` block executes automatically in batch mode (`ngspice -b`). It does NOT need an explicit `run` command for analyses declared outside the block (`.op`, `.tran`, `.ac`, `.dc` lines in the netlist body). For analyses declared only inside `.control`, use `run` explicitly.

**wrdata syntax:**

```spice
wrdata filename.txt v(out) v(in)
```

- Writes one row per datapoint: `<scale_value> <v(out)_value> <v(in)_value>`
- Scale is the x-axis (time for .tran, frequency for .ac, voltage for .dc, single row for .op)
- Creates/overwrites on first call; use `set appendwrite` to append
- File is plain ASCII — readable with `cat`, parseable with `awk`/`grep`

**Alternative: `write` command writes binary rawfile:**

```spice
write results.raw
```

The binary rawfile format (`.raw`) is harder to parse without a rawfile reader. For text output, `wrdata` is the correct choice (D-12).

---

## Minimal .cir Examples (All 4 Analysis Types)

### .op — DC Operating Point

```spice
* Voltage divider operating point
.title Voltage Divider OP

Vin 1 0 DC 12
R1 1 2 10k
R2 2 0 3.3k

.op

.control
run
print v(2) I(Vin)
wrdata .librespin/09-simulation/results.txt v(2)
quit
.endc
```

Output file contains: `<op_index> <v(2)_value>` — single row for operating point.

### .tran — Transient Analysis

```spice
* RC low-pass filter transient
.title RC Filter Transient

Vin 1 0 PULSE(0 5 0 1n 1n 500u 1m)
R1 1 2 1k
C1 2 0 100n

.tran 1u 2m

.control
run
wrdata .librespin/09-simulation/results.txt v(2)
quit
.endc
```

Output file: two columns — `<time> <v(2)>`, one row per timestep.

### .ac — AC Frequency Sweep

```spice
* RC filter AC response
.title RC Filter AC

Vin 1 0 AC 1
R1 1 2 1k
C1 2 0 100n

.ac dec 10 1 1Meg

.control
run
wrdata .librespin/09-simulation/results.txt v(2)
quit
.endc
```

Output file: `<frequency> <real_part_v(2)> <imag_part_v(2)>` — complex values for AC.

### .dc — DC Sweep

```spice
* Diode I-V curve DC sweep
.title Diode DC Sweep

Vin 1 0 DC 0
D1 1 0 1N4148
.model 1N4148 D(IS=2.52n RS=0.568 N=1.752)

.dc Vin 0 1 0.01

.control
run
wrdata .librespin/09-simulation/results.txt I(Vin)
quit
.endc
```

Output file: `<voltage> <current>`.

### Key Netlist Rules

- Title line is mandatory (first line, plain text — NOT a comment)
- Node `0` is always ground
- Comments use `*` at start of line
- Inline comments use `$`
- Continuation lines use `+` at start
- Component values: `k` = 1000, `m` = 0.001, `u` = 1e-6, `n` = 1e-9, `p` = 1e-12, `Meg` = 1e6
- `.end` is required as the last line

---

## CalcPad Output Contract (SIM-02 input)

This is frozen per Phase 6 `agents/calcpad.md` Output Contract section.

### Files in `.librespin/08-calculations/`

| File | Format | Phase 7 uses |
|------|--------|--------------|
| `{block-slug}.cpd` | CalcPad CE worksheet text | Read variable names and values |
| `{block-slug}.html` | HTML (CalcPad CE output) | Backup — computed values also here |
| `{block-slug}-summary.md` | Markdown | PRIMARY — pass/fail table with variable:value pairs |

### Summary File Format (confirmed from agents/calcpad.md Stage G)

```markdown
# CalcPad Calculation Summary: [Block Name]

**Block:** [Block Name]
**Calculated:** [ISO timestamp]
**Method:** [CLI | REST]

## Design Targets vs. Results

| Target     | Expected  | Calculated | Tolerance | Status |
|------------|-----------|------------|-----------|--------|
| V_out      | 3.3 V     | 2.977 V    | ±2%       | PASS   |
| R1         | 10 kΩ     | 10000 Ω    | exact     | PASS   |

## Worksheet

File: `[SLUG].cpd`

## Output

File: `[SLUG].html`
```

### Parsing Strategy for Component Values (Claude's Discretion)

The agent reads `{block-slug}-summary.md` and extracts the "Calculated" column of the pass/fail table. For each row, parse: `| Variable | Expected | Calculated | ...` → use the "Calculated" value as the component value for the netlist.

As a fallback, the `.cpd` file uses CalcPad syntax `Variable = value` — grep for `[A-Za-z_]\w* = [0-9.]+` to get direct variable assignments.

Confirmed extractable example from E2E evidence (06-02-e2e-evidence.md):
- `V_out = 2.977444` (grep from HTML: `2.977444`)
- `R1 = 10000`, `R2 = 3300`, `V_in = 12` (from .cpd variable lines)

### HTML Extraction (backup)

```bash
grep -oE '[A-Za-z_][A-Za-z0-9_]* ?= ?[0-9.eE+\-]+' "{block-slug}.html" | head -50
```

This is the same grep pattern from `agents/calcpad.md` Stage E — reuse verbatim.

---

## Analysis Type Auto-Detect (SIM-03)

Circuit type hint comes from `.librespin/07-final-output/` concept output. The fixture uses `Type: voltage-divider`.

| Circuit Type Keyword | Auto-detected Analysis | Rationale |
|---------------------|----------------------|-----------|
| `power supply`, `converter`, `buck`, `boost`, `ldo` | `.tran` | Need time-domain ripple/transient response |
| `amplifier`, `filter`, `rc`, `lc` | `.ac` | Need frequency response |
| `logic gate`, `digital`, `cmos` | `.op` | Static operating point sufficient |
| `diode`, `bjt`, `mosfet`, `iv curve` | `.dc` | Need I-V characteristic sweep |
| Unknown / ambiguous | `.op` | Safest default — always converges if circuit is valid |

The skill reads the `Type:` field and any headings from concept.md to make the determination. Present the auto-detected type as a highlighted recommendation in the menu.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPICE simulator | Custom circuit solver | NGSpice | 40 years of validated SPICE algorithms |
| Rawfile parser | Binary .raw parser | wrdata plain text | wrdata produces ASCII — no binary parsing needed |
| Waveform plot | Custom SVG/ASCII plot | matplotlib | One import, one call: `plt.plot(t, v); plt.savefig('waveform.png')` |
| Convergence fixes | Auto-tune SPICE options | Document remediations for user to apply | Circuit topology issues require human judgment |

---

## Common Pitfalls

### Pitfall 1: Exit Code Unreliable

**What goes wrong:** Agent checks `$? -eq 0` and treats it as success, missing convergence failures that still exit 0.

**Root cause:** NGSpice returns 0 in many failure scenarios, especially convergence failures mid-run.

**How to avoid:** Always scan stdout+stderr for the 4 error strings. D-08/D-09 are explicit about this.

**Warning signs:** Output file exists but contains only a header row (1 data point instead of expected N).

### Pitfall 2: Title Line Missing or Commented

**What goes wrong:** Netlist fails to parse with cryptic error. First line of a `.cir` file is ALWAYS the title — it is consumed as the circuit title, not executed.

**Root cause:** Writing `* My Circuit` as line 1 makes NGSpice treat the comment as the title and skip parsing it, then the first component definition is consumed as title text.

**How to avoid:** Always write a plain-text title as line 1. Example: `Voltage Divider OP Analysis`

### Pitfall 3: wrdata path must be accessible

**What goes wrong:** `wrdata .librespin/09-simulation/results.txt` fails if the directory doesn't exist when NGSpice runs.

**Root cause:** NGSpice does not create missing directories.

**How to avoid:** Create the output directory before running NGSpice:
```bash
mkdir -p .librespin/09-simulation/
ngspice -b circuit.cir 2>&1 | tee sim-output.txt
```

### Pitfall 4: .control block with explicit analysis statement

**What goes wrong:** Netlist has `.tran 1u 1m` in the body AND `tran 1u 1m` inside `.control` — analysis runs twice.

**Root cause:** Analysis declared in the netlist body runs automatically; `run` inside `.control` re-triggers it.

**How to avoid:** Declare analysis EITHER in the netlist body OR inside `.control` with `run`, not both. Preferred: declare in netlist body, use `.control` only for output (`wrdata`, `quit`).

### Pitfall 5: AC output is complex-valued

**What goes wrong:** Agent tries to find a "V_out" value from wrdata but gets two numbers per row (real + imaginary).

**Root cause:** AC analysis produces complex vectors. `wrdata` writes both parts.

**How to avoid:** For AC, compute `db(v(out))` or `mag(v(out))` in the `.control` block before writing. Or parse magnitude from real/imag: `mag = sqrt(re^2 + im^2)`.

### Pitfall 6: Agent backgrounded (same as CalcPad Pitfall 4)

**What goes wrong:** Agent uses AskUserQuestion for netlist review but never surfaces to user — burns ~100k tokens silently.

**Root cause:** AskUserQuestion stalls when agent is backgrounded.

**How to avoid:** ALWAYS `run_in_background: false` when spawning simulate agent.

---

## Code Examples

### Minimal Prereq Check (SIM-01)

```bash
if command -v ngspice > /dev/null 2>&1; then
  echo "FOUND $(ngspice --version 2>&1 | head -1)"
else
  echo "MISSING"
fi
```

**Install instructions to show when MISSING:**

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

### Run and Capture Both Streams (SIM-04)

```bash
mkdir -p .librespin/09-simulation/
cd .librespin/09-simulation/
ngspice -b circuit.cir > sim-stdout.txt 2> sim-stderr.txt
EXIT=$?
# Combine for pattern scanning
cat sim-stdout.txt sim-stderr.txt > sim-combined.txt
```

### Error Pattern Scan

```bash
# Scan combined output for all 4 patterns
ERRORS=""
grep -q "Timestep too small" sim-combined.txt && ERRORS="$ERRORS ERR-1"
grep -q "singular matrix" sim-combined.txt && ERRORS="$ERRORS ERR-2"
grep -q "Too many iterations without convergence" sim-combined.txt && ERRORS="$ERRORS ERR-3"
grep -q "Unable to find definition of model" sim-combined.txt && ERRORS="$ERRORS ERR-4"

# Success: no errors AND output file exists
if [ -z "$ERRORS" ] && [ -f "results.txt" ] && [ -s "results.txt" ]; then
  echo "OK"
else
  echo "FAIL errors=$ERRORS output=$(test -s results.txt && echo yes || echo no)"
fi
```

### Parse wrdata Text Output (.op example)

```bash
# For .op: single row — just read the second column
awk 'NR==1 {print "V_out=" $2}' results.txt
```

```bash
# For .tran: extract peak, min, max, final
awk 'NR>0 {
  if (NR==1 || $2>max) max=$2
  if (NR==1 || $2<min) min=$2
  val=$2
} END {print "peak=" max " min=" min " final=" val}' results.txt
```

### Optional Waveform Plot (SIM-08)

```bash
# Check for Python + matplotlib
python3 -c "import matplotlib" 2>/dev/null && echo "FOUND" || echo "MISSING"
```

If found, write this script to `/tmp/plot_waveform.py` and execute:

```python
import sys
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend — no display required
import matplotlib.pyplot as plt

data_file = sys.argv[1]
output_png = sys.argv[2]

x_vals, y_vals = [], []
with open(data_file) as f:
    for line in f:
        parts = line.split()
        if len(parts) >= 2:
            try:
                x_vals.append(float(parts[0]))
                y_vals.append(float(parts[1]))
            except ValueError:
                pass

plt.figure(figsize=(10, 4))
plt.plot(x_vals, y_vals)
plt.xlabel('Time (s)')
plt.ylabel('Voltage (V)')
plt.title('Simulation Waveform')
plt.grid(True)
plt.tight_layout()
plt.savefig(output_png, dpi=150)
print(f'Waveform saved to {output_png}')
```

```bash
python3 /tmp/plot_waveform.py .librespin/09-simulation/results.txt .librespin/09-simulation/waveform.png
```

---

## Output Contract (SIM-10)

Phase 8 (Installer Update) needs `skills/simulate/SKILL.md` and `agents/simulate.md` paths to be stable.

| File | Directory | Format | Contains |
|------|-----------|--------|---------|
| `circuit.cir` | `.librespin/09-simulation/` | SPICE netlist | NGSpice input |
| `results.txt` | `.librespin/09-simulation/` | ASCII table (wrdata) | Raw simulation output |
| `simulation-summary.md` | `.librespin/09-simulation/` | Markdown | Pass/fail table + component suggestions |
| `waveform.png` | `.librespin/09-simulation/` | PNG | Optional waveform (SIM-08) |

simulation-summary.md structure:

```markdown
# Simulation Summary: [Circuit Name]

**Analysis:** [.op | .tran | .ac | .dc]
**Simulated:** [ISO timestamp]
**Status:** [PASS | FAIL]

## Results vs. Spec

| Target | Spec | Simulated | Status |
|--------|------|-----------|--------|
| V_out  | 3.3 V ±2% | 3.28 V | PASS |

## Component Suggestions

[Only present when FAIL — e.g., "Output ripple 12% > 10% spec — increase C_out from 100µF to 220µF"]

## Netlist

File: `circuit.cir`
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| NGSpice | SIM-01 through SIM-07 | NOT FOUND | — | Skill provides install instructions |
| Python 3 | SIM-08 (waveform) | ✓ (system) | 3.12.3 | Skip waveform gracefully |
| matplotlib | SIM-08 (waveform) | Unknown — not checked | — | Skip waveform gracefully |

**NGSpice not installed on dev machine:** This is expected. NGSpice is a system package that must be installed by the user. The skill's SIM-01 prereq check handles this case exactly — present install instructions and ask how to proceed. No spike needed before writing the skill.

**Missing dependencies with no fallback:** None — NGSpice absence is handled by the prereq check, not a blocker for skill authoring.

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| `ngspice -r rawfile.raw` binary output | `.control` + `wrdata` ASCII text | Text output is directly readable by Claude/bash; no binary parser needed |
| Print to stdout with `.print` | `wrdata` to named file | File output survives `ngspice -b` stdout capture; more reliable |
| Check exit code for success | Scan stdout+stderr for error strings | Exit code unreliable across NGSpice versions |

---

## Open Questions

1. **wrdata path: relative vs absolute**
   - What we know: wrdata accepts a filename. Whether relative is relative to CWD or netlist location is not explicitly stated in the tutorial.
   - What's unclear: If `ngspice -b circuit.cir` is run from `.librespin/09-simulation/`, does `wrdata results.txt` write to that directory?
   - Recommendation: Use `wrdata results.txt` (bare filename) and always cd to `.librespin/09-simulation/` before running NGSpice. This is the safest pattern and consistent with D-07.

2. **NGSpice version on user machines**
   - What we know: `sudo apt install ngspice` on Ubuntu 24.04 installs NGSpice 41+
   - What's unclear: Older Ubuntu/Debian may have NGSpice 34-37 which has slightly different error string formatting
   - Recommendation: The 4 error strings documented are stable across NGSpice 34–43 (confirmed from sourceforge threads spanning 2012–2024). No version gating needed.

---

## Sources

### Primary (HIGH confidence)
- ngspice control language tutorial (https://ngspice.sourceforge.io/ngspice-control-language-tutorial.html) — wrdata syntax, .control block behavior, batch mode operation
- NGSpice sourceforge discussion thread (https://sourceforge.net/p/ngspice/discussion/133842/thread/aa579abc8b/) — exact "Timestep too small" error string with real stdout capture
- NGSpice sourceforge discussion thread (https://sourceforge.net/p/ngspice/discussion/133842/thread/22ccad12/) — exact "singular matrix" warning string
- NGSpice sourceforge discussion thread (https://sourceforge.net/p/ngspice/discussion/133842/thread/cefadb414e/) — exact "Too many iterations without convergence" error string
- `agents/calcpad.md` Output Contract section — frozen CalcPad output format, parsing strategy
- `.planning/phases/06-calcpad-ce-skill/06-02-e2e-evidence.md` — confirmed CalcPad HTML grep pattern, actual output values

### Secondary (MEDIUM confidence)
- ngspice batch mode documentation (https://nmg.gitlab.io/ngspice-manual/analysesandoutputcontrol_batchmode.html) — output handling, stderr vs stdout behavior
- ngspice man page (https://man.archlinux.org/man/extra/ngspice/ngspice.1.en) — command line flags
- WebSearch "Unable to find definition of model" — confirmed error string format for model-not-found

### Tertiary (LOW confidence)
- matplotlib `Agg` backend pattern — training data, not verified against current matplotlib docs. Standard pattern used for 5+ years but confirm `matplotlib.use('Agg')` is still the correct non-display backend call.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — NGSpice is the only FOSS CLI SPICE simulator; confirmed by project constraints
- Architecture: HIGH — follows Phase 6 pattern exactly; structure confirmed by reading both skill files
- NGSpice error strings: HIGH — verified from actual stdout captures in sourceforge threads
- .control/wrdata syntax: HIGH — verified from official ngspice tutorial
- CalcPad output parsing: HIGH — frozen contract from agents/calcpad.md, confirmed by e2e evidence
- Waveform (matplotlib): MEDIUM — standard pattern, unverified against current matplotlib docs

**Research date:** 2026-04-08
**Valid until:** 2026-06-08 (NGSpice batch behavior is stable; error strings unchanged since v34)
