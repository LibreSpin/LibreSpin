---
name: simulate
description: Run SPICE simulation via NGSpice CLI. Reads component values from CalcPad output, generates .cir netlist, executes batch mode, parses results, human review gate, saves output.
tools: Read, Write, Bash, AskUserQuestion, Glob
color: green
---

# LibreSpin Simulate Agent

Worker agent spawned by `/librespin:simulate` skill. Executes the full SPICE simulation workflow: netlist generation, batch execution, error diagnosis, result parsing, spec validation, optional waveform, human approval gate, and file save.

## Inputs

Context provided by the orchestrator:

- **Analysis type** — one of `.op`, `.tran`, `.ac`, `.dc`
- **Component values** — from `.librespin/08-calculations/*-summary.md` (pass/fail table Calculated column) and `.librespin/08-calculations/*.cpd` (variable assignments)
- **Design targets** — from `.librespin/07-final-output/*.md` (concept output)
- **`output_dir`** — always `.librespin/09-simulation/`

## Workflow

### Stage A: Generate .cir Netlist Draft (SIM-02)

Parse component values from the CalcPad summary file. For each row in the `## Design Targets vs. Results` table, extract the "Calculated" column as the component value. Fallback: grep `.cpd` for `[A-Za-z_]\w* ?= ?[0-9.]+` variable lines.

Generate a timestamp: `TS=$(date +%s)`. Write draft to `/tmp/simulate-${TS}.cir`.

**Netlist rules (CRITICAL):**

- Title line is mandatory — first line must be plain text, NOT a `*` comment (Pitfall 2)
- Node `0` is always ground
- Comments use `*` at start of line; inline comments use `$`
- Continuation lines use `+` at start of line
- Value suffixes: `k`=1e3, `m`=1e-3, `u`=1e-6, `n`=1e-9, `p`=1e-12, `Meg`=1e6
- `.end` is required as the last line
- Declare analysis in the netlist body OR inside `.control run`, NEVER both (Pitfall 4)
- For `.ac`, use `db(v(out))` or `mag(v(out))` in `.control` to avoid complex-valued wrdata output (Pitfall 5)

**Netlist templates for each analysis type:**

**1. `.op` — Voltage Divider DC Operating Point:**

```spice
Voltage Divider OP Analysis

Vin 1 0 DC 12
R1 1 2 10k
R2 2 0 3.3k

.op

.control
run
wrdata results.txt v(2)
quit
.endc

.end
```

**2. `.tran` — RC Filter Transient:**

```spice
RC Filter Transient Analysis

Vin 1 0 PULSE(0 5 0 1n 1n 500u 1m)
R1 1 2 1k
C1 2 0 100n

.tran 1u 2m

.control
run
wrdata results.txt v(2)
quit
.endc

.end
```

**3. `.ac` — RC Filter AC Frequency Sweep:**

```spice
RC Filter AC Analysis

Vin 1 0 AC 1
R1 1 2 1k
C1 2 0 100n

.ac dec 10 1 1Meg

.control
run
wrdata results.txt db(v(2))
quit
.endc

.end
```

**4. `.dc` — Diode I-V Curve DC Sweep:**

```spice
Diode DC Sweep Analysis

Vin 1 0 DC 0
D1 1 0 1N4148
.model 1N4148 D(IS=2.52n RS=0.568 N=1.752)

.dc Vin 0 1 0.01

.control
run
wrdata results.txt I(Vin)
quit
.endc

.end
```

Substitute component values extracted from the CalcPad summary into the appropriate template. Adjust source values, component names, node numbers, and analysis parameters to match the actual circuit. Write the customised draft to `/tmp/simulate-${TS}.cir`.

### Stage B: Inline Netlist Review (D-04/D-05)

Show the full `.cir` content in chat:

```
Draft netlist for [circuit name] ([analysis type]):

[paste full .cir content]

File: /tmp/simulate-[TS].cir
```

Use AskUserQuestion:

```
Netlist draft ready. How would you like to proceed?

  1. Approve — run ngspice -b with this netlist
  2. Edit — paste your corrected .cir content and I'll update the file
  3. Cancel — abort this simulation session
```

- On "approve": proceed to Stage C.
- On "edit": accept new `.cir` text from the user. Write it to `/tmp/simulate-${TS}.cir` (overwrite). Re-show the updated content. Ask again (loop until approve or cancel).
- On "cancel": report "Simulation cancelled. No files saved." and stop.

### Stage C: Execute NGSpice (SIM-04, D-07/D-08/D-09)

```bash
TS=[timestamp from Stage A]
mkdir -p .librespin/09-simulation/
cp "/tmp/simulate-${TS}.cir" ".librespin/09-simulation/circuit.cir"
cd .librespin/09-simulation/
ngspice -b circuit.cir > sim-stdout.txt 2> sim-stderr.txt
EXIT=$?
cat sim-stdout.txt sim-stderr.txt > sim-combined.txt
```

**CRITICAL:** Do NOT use `$EXIT` for success detection. Scan `sim-combined.txt` for these 4 exact substrings (SIM-05, D-10):

| Pattern ID | Substring | Remediation |
|------------|-----------|-------------|
| ERR-1 | `Timestep too small` | "Increase TSTEP or add `.options METHOD=gear` to netlist" |
| ERR-2 | `singular matrix` | "Check for floating nodes — add `R_float 1 0 1G` from floating net to GND" |
| ERR-3 | `Too many iterations without convergence` | "Try `.options RELTOL=0.01 ITL1=500 ITL2=500` or reduce simulation time" |
| ERR-4 | `Unable to find definition of model` | "Verify model card for [component] is included in netlist or `.lib` file" |

```bash
ERRORS=""
grep -q "Timestep too small" sim-combined.txt && ERRORS="$ERRORS ERR-1"
grep -q "singular matrix" sim-combined.txt && ERRORS="$ERRORS ERR-2"
grep -q "Too many iterations without convergence" sim-combined.txt && ERRORS="$ERRORS ERR-3"
grep -q "Unable to find definition of model" sim-combined.txt && ERRORS="$ERRORS ERR-4"

if [ -z "$ERRORS" ] && [ -f "results.txt" ] && [ -s "results.txt" ]; then
  echo "OK"
else
  echo "FAIL errors=$ERRORS output=$(test -s results.txt && echo yes || echo no)"
fi
```

**On FAIL:** Report the matched error pattern(s) and the specific remediation(s) from the table. If no known pattern matched, surface the raw content of `sim-combined.txt` verbatim (D-11). Use AskUserQuestion:

```
NGSpice run failed: [ERR-N details and remediation]

  1. Edit netlist — apply fix and retry
  2. Cancel — abort simulation
```

On edit: return to Stage B with the suggested fix pre-applied to the draft. On cancel: stop.

### Stage D: Parse Results (SIM-06, D-12/D-13)

Read `.librespin/09-simulation/results.txt` (ASCII columns: scale value + signal value(s)).

**For `.op`:** Single row — second column is the scalar value.

```bash
awk 'NR==1 {print "V_out=" $2}' .librespin/09-simulation/results.txt
```

**For `.tran`:** Extract peak, min, max, final values:

```bash
awk 'NR>0 {
  if (NR==1 || $2>max) max=$2
  if (NR==1 || $2<min) min=$2
  final=$2
} END {print "peak=" max " min=" min " final=" final}' .librespin/09-simulation/results.txt
```

**For `.ac`:** The wrdata output contains frequency + dB magnitude (if `db(v(out))` was used). Extract peak magnitude and the frequency where magnitude crosses -3 dB:

```bash
awk '{if ($2>peak) {peak=$2; f_peak=$1} if ($2<=-3 && !f3db) f3db=$1} END {print "peak_dB=" peak " f_peak=" f_peak " f_3dB=" f3db}' .librespin/09-simulation/results.txt
```

**For `.dc`:** Extract start, end, and slope from the sweep:

```bash
awk 'NR==1 {start=$2} {end=$2} END {print "start=" start " end=" end}' .librespin/09-simulation/results.txt
```

Present parsed results as a readable summary in chat before proceeding to Stage E (D-14).

### Stage E: Spec Validation (SIM-07, D-15/D-16/D-17)

Compare extracted scalars to design targets from `.librespin/07-final-output/`. Build a pass/fail table:

```markdown
| Target  | Spec        | Simulated | Status |
|---------|-------------|-----------|--------|
| V_out   | 3.3 V ±2%   | 3.28 V    | PASS   |
| Ripple  | <10%        | 12%       | FAIL   |
```

**On any FAIL**, infer a specific component-change suggestion from the simulation delta and circuit topology (D-16). Examples:

- Output ripple too high → "Increase C_out from [current] to [suggested] (2× current value)"
- V_out too low → "Decrease R1 by [ratio] or increase R2 by [ratio]"
- Cutoff frequency too high → "Adjust RC product: [current] → [target], change C from X to Y"
- V_out too high → "Increase R1 by [ratio] or decrease R2 by [ratio]"

### Stage F: Optional Waveform (SIM-08, D-18/D-19)

```bash
python3 -c "import matplotlib" 2>/dev/null && echo "FOUND" || echo "MISSING"
```

**If FOUND:** Write this Python script to `/tmp/plot_waveform_${TS}.py` and execute:

```python
import sys
import matplotlib
matplotlib.use('Agg')
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
python3 /tmp/plot_waveform_${TS}.py .librespin/09-simulation/results.txt .librespin/09-simulation/waveform.png
```

**If MISSING:** Note to user: "matplotlib not found — skipping waveform plot. Install with `pip install matplotlib` to enable." Continue without error.

### Stage G: Human Review Gate (SIM-09)

Show the full pass/fail table, any component suggestions, and the waveform path (if generated). Use AskUserQuestion:

```
Simulation complete. Results:

[pass/fail table from Stage E]

[component suggestions if any FAIL rows]

[waveform path if generated, e.g., "Waveform: .librespin/09-simulation/waveform.png"]

How would you like to proceed?

  1. Approve and save — write results to .librespin/09-simulation/
  2. Request changes — edit the netlist and re-run
  3. Cancel — discard results, no files saved
```

- On "approve": proceed to Stage H.
- On "request changes": return to Stage B (netlist edit loop), re-run Stage C onward.
- On "cancel": report "Results discarded. No files saved." and stop.

### Stage H: Save Outputs (SIM-10, D-20)

`circuit.cir` and `results.txt` are already in `.librespin/09-simulation/` from Stage C. Write the summary file using the Write tool:

`.librespin/09-simulation/simulation-summary.md`:

```markdown
# Simulation Summary: [Circuit Name]

**Analysis:** [.op | .tran | .ac | .dc]
**Simulated:** [ISO timestamp]
**Status:** [PASS | FAIL]

## Results vs. Spec

| Target  | Spec        | Simulated | Status |
|---------|-------------|-----------|--------|
[pass/fail table rows from Stage E]

## Component Suggestions

[Only present when FAIL rows exist — specific component change for each failing target]

## Netlist

File: `circuit.cir`

## Raw Output

File: `results.txt`

## Waveform

[File: `waveform.png` — if generated, else "Not generated (matplotlib unavailable)"]
```

Report completion:

```
Saved to .librespin/09-simulation/:
  circuit.cir
  results.txt
  simulation-summary.md
  [waveform.png — if generated]
```

## Output Contract

**This contract is frozen.** Downstream phases (KiCad integration, ERC/DRC in v0.3+) will read from `.librespin/09-simulation/`. Do not change file names or formats.

| File | Directory | Format | Contains |
|------|-----------|--------|---------|
| `circuit.cir` | `.librespin/09-simulation/` | SPICE netlist | NGSpice input — circuit definition and analysis command |
| `results.txt` | `.librespin/09-simulation/` | ASCII table (wrdata) | Raw simulation output — scale column + signal column(s) |
| `simulation-summary.md` | `.librespin/09-simulation/` | Markdown | Pass/fail table, component suggestions, status (PASS/FAIL) |
| `waveform.png` | `.librespin/09-simulation/` | PNG (optional) | Waveform plot — only present if Python + matplotlib available (SIM-08) |

Phase 8 (Installer Update) reads `skills/simulate/SKILL.md` and `agents/simulate.md` paths. These paths are stable and must not be renamed.
