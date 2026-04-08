---
description: LibreSpin circuit calculation workflow using CalcPad CE
argument-hint: "[--auto] [--block NAME] [--rest]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Bash
  - Glob
---

# /librespin:calcpad

Run AI-assisted circuit calculations for a selected circuit block using CalcPad CE. Extracts design targets from concept output, generates a `.cpd` worksheet, executes the CalcPad CE CLI (or REST fallback), validates results against design targets, and saves approved outputs to `.librespin/08-calculations/`.

## Execution

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:

- `--auto` (bool, default false): Skip interactive block menu — auto-select primary block.
- `--block NAME` (string, optional): Name of the circuit block to calculate. If provided, skip menu.
- `--rest` (bool, default false): Force REST API fallback even if Cli binary is present.

**Argument parsing:**

```
AUTO=false
BLOCK_NAME=""
USE_REST=false

# Parse from $ARGUMENTS string
if $ARGUMENTS contains "--auto":
  Set AUTO=true

if $ARGUMENTS contains "--block":
  Extract NAME after --block
  Set BLOCK_NAME=NAME

if $ARGUMENTS contains "--rest":
  Set USE_REST=true
```

### Step 2: Prereq Check (CALC-01)

Run this exact bash check:

```bash
# Source: spike finding — binary name is 'Cli', NOT 'Calcpad.Cli' (Pitfall 1)
if test -x "$HOME/.librespin/bin/Cli"; then
  echo "FOUND"
else
  echo "MISSING"
fi
```

**If result is FOUND and `--rest` not set:** Continue with CLI path (`USE_REST=false`).

**If result is MISSING and `--rest` not set:** Show the following install instructions verbatim:

```
CalcPad CE CLI not found at ~/.librespin/bin/Cli

Install (Linux x64):
  mkdir -p ~/.librespin/bin
  curl -L https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli -o ~/.librespin/bin/Cli
  chmod +x ~/.librespin/bin/Cli

Or re-run with --rest to use the REST API fallback (requires Calcpad.Server binary).
```

Then use AskUserQuestion with three options:

```
CalcPad CE CLI binary not found. How would you like to proceed?

Options:
  1. Install now — run the curl commands above automatically
  2. Use --rest fallback — continue using Calcpad.Server REST API
  3. Exit — I'll install manually and re-run
```

- On option 1 (install now): Run these three commands via Bash:
  ```bash
  mkdir -p "$HOME/.librespin/bin"
  curl -L https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli -o "$HOME/.librespin/bin/Cli"
  chmod +x "$HOME/.librespin/bin/Cli"
  ```
  Then set `USE_REST=false` and continue.
- On option 2 (REST fallback): Set `USE_REST=true` and continue.
- On option 3 (exit): Report "Exiting. Install the binary and re-run /librespin:calcpad" and stop.

**If result is MISSING and `--rest` is set:** Set `USE_REST=true` and continue.
**If result is FOUND and `--rest` is set:** Set `USE_REST=true` (user explicitly requested REST) and continue.

### Step 3: Read Concept Output (CALC-02)

Glob for concept output files:

```bash
# Read all markdown files in .librespin/07-final-output/
Glob .librespin/07-final-output/*.md
```

**If glob returns empty:** Report error and exit:

```
Error: No concept output found in .librespin/07-final-output/

Run /librespin:concept first to generate circuit design targets, then re-run /librespin:calcpad.
```

**If files found:** Read all matched files with the Read tool. Collect full content for block identification.

### Step 4: Block Selection (CALC-02)

Identify circuit blocks from the concept output. A circuit block is any section with a top-level or second-level heading containing terms like "Block", "Circuit", "Stage", "Divider", "Filter", "Converter", "LDO", "Rail", or a `Type:` field.

**If `--block NAME` provided:** Auto-select the block whose heading or type matches NAME (case-insensitive). If no match found, report available blocks and ask user to re-run with correct name.

**If `--auto` provided:** Auto-select the first block found in the concept output. Report: "Auto-selected block: [block name]".

**If neither flag:** Use AskUserQuestion to show a numbered list of detected blocks:

```
Found [N] circuit block(s) in .librespin/07-final-output/:

  1. [Block Name 1] — [Type if present]
  2. [Block Name 2] — [Type if present]
  ...

Which block do you want to calculate? (enter number or name)
```

Set `SELECTED_BLOCK` to the chosen block's full content (heading + design targets).

### Step 5: Spawn calcpad agent (CALC-03 through CALC-07)

Use the Agent tool with `subagent_type: calcpad`, `run_in_background: false` (CRITICAL — agent uses AskUserQuestion and will stall silently if backgrounded; see Pitfall 4). Pass full context:

```
Run the CalcPad CE calculation workflow for the selected circuit block.

Selected block content:
---
[SELECTED_BLOCK content pasted here]
---

use_rest: [true|false based on USE_REST flag]
output_dir: .librespin/08-calculations/

The agent should:
1. Generate a .cpd worksheet from the design targets
2. Show the worksheet draft inline and await user approval
3. Execute the CLI (or REST fallback) to produce HTML output
4. Parse the HTML and build a pass/fail table vs. design targets
5. Present the table and ask for human approval before saving
6. On approval, save .cpd, .html, and -summary.md to .librespin/08-calculations/
```

### Step 6: Report Completion

After the agent returns, report:

```
Calculation complete.

Outputs saved to .librespin/08-calculations/:
  [block-slug].cpd       — CalcPad worksheet
  [block-slug].html      — HTML results
  [block-slug]-summary.md — Pass/fail summary table

Next step: Run /librespin:simulate to run SPICE simulation using these component values.
```

## Notes

The following facts are hard-coded from Phase 5 spike evidence. Do not change them:

- **Binary name is `Cli`, NOT `Calcpad.Cli`** — The Linux ELF assembly name is the bare project name. The csproj `<AssemblyName>` defaults to the project name without namespace prefix. Pitfall 1: invoking `Calcpad.Cli` will always fail with "No such file". (Spike: `/tmp/calcpad-cli-out/Cli` — confirmed.)

- **CLI success = exit 0 AND file exists; no stdout parsing** — With the `-s` flag the CLI runs completely silently. Zero bytes on stdout is normal on success. Do NOT parse stdout. Success detection must be: `$? -eq 0 && test -f output.html`. Pitfall 3: waiting for stdout content will always timeout.

- **REST server port must be explicit via `--urls http://localhost:9421`** — Default Kestrel port is non-deterministic (spike observed port 9420, not 8080). Always pass `--urls` to pin the port. Pitfall 2: hardcoding 8080 will always fail with connection refused.

- **Agent MUST be spawned foreground (`run_in_background: false`)** — The calcpad agent uses AskUserQuestion for worksheet review and result approval. If backgrounded, these prompts never surface to the user and the agent burns ~100k tokens before timing out. Pitfall 4. (Per MEMORY.md: "Phase 1 must be foreground".)

- **Install URL:** `https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli` — This is the verified download URL from Phase 6 Plan 01 (CI run 24148593487, HTTP 200 verified).
