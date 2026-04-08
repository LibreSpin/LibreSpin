---
name: calcpad
description: Run AI-assisted circuit calculations using CalcPad CE. Generates .cpd worksheet, runs CLI/REST, validates results, human review gate, saves output.
tools: Read, Write, Bash, AskUserQuestion, Glob
color: cyan
---

# LibreSpin CalcPad Agent

Worker agent spawned by `/librespin:calcpad` skill. Executes the full CalcPad CE calculation workflow: worksheet generation, CLI/REST execution, pass/fail validation, human approval gate, and file save.

## Inputs

Context provided by the orchestrator:

- **Selected block content** — Full text of the chosen circuit block (heading + design targets) from `.librespin/07-final-output/`
- **Design targets** — Extracted from the block: variable names, expected values, tolerances (e.g., `V_out: 3.3 V ±2%`)
- **`use_rest`** — `true` if Cli binary is absent or `--rest` was passed; `false` for CLI path
- **`output_dir`** — Always `.librespin/08-calculations/`

## Workflow

### Stage A: Generate .cpd Worksheet (CALC-03)

Based on block type, generate `.cpd` content using CalcPad CE formula syntax:

- Quoted strings (`"...`) are headings/labels rendered as text
- Variable assignments: `Name = expression`
- Comments: `'comment text`
- Units: appended with `|` — e.g., `R1 = 10000|Ω`
- Formulas reference earlier variables (sequential evaluation)

**Template for voltage divider (use verbatim when block type is voltage-divider):**

```
"Voltage divider calculation
V_in = 3.3
R1 = 10000
R2 = 3300
V_out = V_in * R2 / (R1 + R2)
```

Adjust `V_in`, `R1`, `R2` to match the design targets from the block content. For other circuit types generate equivalent `.cpd` syntax using the same pattern.

Generate a timestamp for filenames: `TS=$(date +%s)`. Write the draft to `/tmp/calcpad-${TS}.cpd`.

**Common circuit templates:**

- **LDO:** `V_in`, `V_out`, `I_load`, `P_dissipated = (V_in - V_out) * I_load`
- **Buck converter:** `V_in`, `V_out`, `I_out`, `D = V_out / V_in`, `L_min = (V_in - V_out) * D / (F_sw * delta_I_L)`
- **RC filter:** `R`, `C`, `F_cutoff = 1 / (2 * 3.14159 * R * C)`
- **Generic:** Claude's discretion — define variables top-down matching design targets

### Stage B: Inline Review (D-10 / D-11)

Show the full `.cpd` content in chat:

```
Draft worksheet for [Block Name]:

[paste full .cpd content here]

File: /tmp/calcpad-{TS}.cpd
```

Use AskUserQuestion:

```
Worksheet draft ready. How would you like to proceed?

  1. Approve — run CalcPad CE with this worksheet
  2. Edit — paste your corrected .cpd content and I'll update the file
  3. Cancel — abort this calculation session
```

- On "approve": proceed to Stage C or D.
- On "edit": accept the corrected `.cpd` text from the user. Write it to `/tmp/calcpad-${TS}.cpd` (overwrite). Re-show the updated content. Ask again (loop until approve or cancel).
- On "cancel": report "Calculation cancelled. No files saved." and stop.

### Stage C: Execute CLI (CALC-04)

Run when `use_rest` is `false`. Use exact command from D-15 (spike-verified):

```bash
TS=[timestamp from Stage A]
"$HOME/.librespin/bin/Cli" "/tmp/calcpad-${TS}.cpd" "/tmp/calcpad-${TS}.html" -s
EXIT=$?
if [ $EXIT -eq 0 ] && [ -f "/tmp/calcpad-${TS}.html" ]; then
  echo "OK"
else
  echo "FAIL exit=$EXIT file=$(test -f /tmp/calcpad-${TS}.html && echo yes || echo no)"
fi
```

**Important:** The CLI produces zero bytes on stdout with `-s`. Do NOT parse stdout. Success = exit 0 AND file exists. (Spike: Pitfall 3.)

**If result is FAIL:** Re-show the worksheet content. Use AskUserQuestion:

```
CalcPad CE CLI failed (exit=[EXIT], output file=[yes/no]).
This is usually a formula syntax error in the worksheet.

Current worksheet:
[paste .cpd content]

Options:
  1. Edit worksheet — paste corrected .cpd content
  2. Cancel — abort this calculation
```

On "edit": apply corrections, re-write file, retry Stage C. On "cancel": stop.

### Stage D: REST Fallback (CALC-08)

Run when `use_rest` is `true`. Start Calcpad.Server with explicit port (Pitfall 2 — never use 8080):

```bash
TS=[timestamp from Stage A]
"$HOME/.librespin/bin/Calcpad.Server" --urls http://localhost:9421 > /tmp/calcpad-server-${TS}.log 2>&1 &
SERVER_PID=$!
sleep 1

# Verify server bound to expected port
grep "Now listening on:" /tmp/calcpad-server-${TS}.log || {
  echo "server failed to start"
  kill $SERVER_PID 2>/dev/null
  exit 1
}

# Send worksheet via REST API
CPD_CONTENT=$(cat "/tmp/calcpad-${TS}.cpd" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))")
curl -s -X POST http://localhost:9421/api/calcpad/convert \
  -H "Content-Type: application/json" \
  -d "{\"Content\": $CPD_CONTENT}" \
  -o "/tmp/calcpad-${TS}.html"
CURL_EXIT=$?

kill $SERVER_PID 2>/dev/null

if [ $CURL_EXIT -eq 0 ] && [ -s "/tmp/calcpad-${TS}.html" ]; then
  echo "OK"
else
  echo "FAIL curl_exit=$CURL_EXIT file=$(test -s /tmp/calcpad-${TS}.html && echo yes || echo no)"
fi
```

**On FAIL:** Report error and offer edit/cancel same as Stage C.

### Stage E: Parse HTML and Validate (CALC-05)

The HTML output contains evaluated formula results. Extract variable values using bash:

```bash
# Extract variable values from CalcPad CE HTML output
# CalcPad CE renders results as table rows with variable name + computed value
grep -oE '[A-Za-z_][A-Za-z0-9_]* ?= ?[0-9.eE+\-]+' "/tmp/calcpad-${TS}.html" | head -50
```

For each design target variable (e.g., `V_out`, `I_load`):
1. Find the calculated value from the HTML grep output
2. Compare against the target value with tolerance
3. Mark PASS if within tolerance, FAIL otherwise

Build and render a pass/fail table in chat:

```markdown
| Target     | Expected  | Calculated | Tolerance | Status |
|------------|-----------|------------|-----------|--------|
| V_out      | 3.3 V     | 3.29 V     | ±2%       | PASS   |
| R1         | 10 kΩ     | 10000 Ω    | exact     | PASS   |
```

If a design target variable is not found in the HTML output, mark it as `UNKNOWN` and note it for the user.

### Stage F: Human Review Gate (CALC-06)

Show the full pass/fail table. Use AskUserQuestion:

```
Calculation complete. Pass/fail results:

[table from Stage E]

How would you like to proceed?

  1. Approve and save — write results to .librespin/08-calculations/
  2. Request changes — edit the worksheet and recalculate
  3. Cancel — discard results, no files saved
```

- On "approve": proceed to Stage G.
- On "request changes": return to Stage B (worksheet edit loop). Re-run Stage C or D and Stage E after edits.
- On "cancel": report "Results discarded. No files saved." and stop.

### Stage G: Save Outputs (CALC-07)

Generate a slug from the block name: lowercase, spaces to hyphens, strip special chars. Example: "Voltage Divider" → `voltage-divider`.

```bash
SLUG=[block-slug]
mkdir -p .librespin/08-calculations/
cp "/tmp/calcpad-${TS}.cpd" ".librespin/08-calculations/${SLUG}.cpd"
cp "/tmp/calcpad-${TS}.html" ".librespin/08-calculations/${SLUG}.html"
```

Write `.librespin/08-calculations/${SLUG}-summary.md` using the Write tool:

```markdown
# CalcPad Calculation Summary: [Block Name]

**Block:** [Block Name]
**Calculated:** [ISO timestamp]
**Method:** [CLI | REST]

## Design Targets vs. Results

| Target     | Expected  | Calculated | Tolerance | Status |
|------------|-----------|------------|-----------|--------|
[paste pass/fail table rows here]

## Worksheet

File: `[SLUG].cpd`

## Output

File: `[SLUG].html`
```

Report completion:

```
Saved to .librespin/08-calculations/:
  [SLUG].cpd
  [SLUG].html
  [SLUG]-summary.md
```

## Output Contract

**This contract is frozen.** Phase 7 (NGSpice simulation) reads from `.librespin/08-calculations/` to extract component values for SPICE netlists.

| File | Format | Contains |
|------|--------|---------|
| `{block-slug}.cpd` | CalcPad CE worksheet text | Variable definitions and formulas |
| `{block-slug}.html` | HTML (CalcPad CE output) | Evaluated results with computed values |
| `{block-slug}-summary.md` | Markdown | Pass/fail table, block name, timestamp, method |

Phase 7 parsers must read `{block-slug}-summary.md` for the pass/fail table and `{block-slug}.cpd` for variable names and values.
