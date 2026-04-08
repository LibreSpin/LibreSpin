# Architecture Research — v0.2 CalcPad & NGSpice

**Domain:** Claude Code skill pack — hardware design workflow
**Researched:** 2026-04-08
**Confidence:** HIGH (existing concept skill inspected directly; CalcPad CE CLI help confirmed from live repo and trash-cached CLI help file; NGSpice batch mode from official docs)

---

## Skill Pattern (from concept skill)

The concept skill establishes the standard LibreSpin pattern. Both new skills must follow it exactly.

**Two files per skill:**

1. `skills/<name>/SKILL.md` — slash command orchestrator (thin, ≤200 lines). Handles: frontmatter tool allowlist, argument parsing, state load/init, agent spawn, return verification. All domain logic stays out.
2. `agents/<name>.md` — worker agent frontmatter + brief capability statement. The agent's full logic lives in SKILL.md (the agent is told to load SKILL.md as its logic source). No logic duplication.

**Key observed constraints from `agents/concept.md`:**
- `run_in_background=false` is mandatory when AskUserQuestion is needed. Both calcpad and simulate will likely need interactive confirmation gates — so foreground-only.
- The agent frontmatter declares `tools:` allowlist. CalcPad and NGSpice agents need `Bash` (to invoke CLI), `Read`, `Write`, `AskUserQuestion`, `Glob`.
- State is stored in `.librespin/state.md` (YAML frontmatter + markdown body), read on every agent spawn.

**State file pattern (from concept skill SKILL.md):**
```markdown
---
phase: <phase-name>
skill: <skill-name>
completed: [phase1, phase2]
---
```

**Naming convention confirmed:**
- Skill directory: `skills/<shortname>/` (e.g., `skills/concept/`, `skills/calcpad/`, `skills/simulate/`)
- Agent file: `agents/<shortname>.md` (e.g., `agents/concept.md`, `agents/calcpad.md`, `agents/simulate.md`)
- Slash command: `/librespin:<shortname>` — automatically derived from plugin path under `skills/<shortname>/SKILL.md`

---

## New Files Required

### Phase 1 — CalcPad CE skill

| File | Type | Purpose |
|------|------|---------|
| `skills/calcpad/SKILL.md` | New | Slash command orchestrator for `/librespin:calcpad`. Parses args, loads state, spawns agent, verifies `.librespin/calcpad/` outputs. |
| `agents/calcpad.md` | New | Worker agent declaration. Frontmatter with `tools: Read, Write, Bash, AskUserQuestion, Glob`. Brief capability statement pointing to SKILL.md for logic. |
| `skills/calcpad/templates/calcpad-sheet.cpd` | New | Starter `.cpd` template for EE calculations (voltage divider, RC filter, power budget). Agent fills parameters and invokes `calcpad input.cpd html -s`. |

### Phase 2 — NGSpice simulation skill

| File | Type | Purpose |
|------|------|---------|
| `skills/simulate/SKILL.md` | New | Slash command orchestrator for `/librespin:simulate`. Parses args, loads state, spawns agent, verifies `.librespin/simulate/` outputs. |
| `agents/simulate.md` | New | Worker agent declaration. Frontmatter with `tools: Read, Write, Bash, AskUserQuestion, Glob`. |
| `skills/simulate/templates/spice-netlist.cir` | New | Starter `.cir` netlist template. Contains `.tran`, `.ac`, or `.op` analysis stubs for agent to fill. Agent invokes `ngspice -b -r output.raw input.cir`. |

### No modifications needed to existing files

The concept skill, its agent, its templates, and `bin/install.js` are untouched. The plugin marketplace auto-discovers new `skills/` subdirectories, so no manifest changes are needed for distribution.

The npx installer (`bin/install.js`) does need a **small update**: it must copy `skills/calcpad/` and `skills/simulate/` alongside `skills/concept/` during install. This is a modification to an existing file, not a new file.

---

## Data Flow

```
/librespin:concept
  Outputs: .librespin/requirements.yaml
           .librespin/concepts/concept-1.md ... concept-N.md
           .librespin/state.md (phase: complete, skill: concept)

         ↓  User decides to move forward with a concept

/librespin:calcpad [--concept concept-1.md]
  Reads:   .librespin/concepts/concept-1.md  (optional --concept arg)
           .librespin/requirements.yaml      (power budget, supply voltage, key params)
           .librespin/state.md               (checks skill: concept, phase: complete)
  Generates: .librespin/calcpad/sheet.cpd    (CalcPad source, edited by agent)
  Executes:  calcpad .librespin/calcpad/sheet.cpd html -s
  Outputs:  .librespin/calcpad/sheet.html    (calculation report)
            .librespin/calcpad/results.yaml  (key values extracted for simulate)
            .librespin/state.md              (phase: complete, skill: calcpad)

         ↓  User reviews calculation sheet, approves

/librespin:simulate [--netlist path] [--type tran|ac|op]
  Reads:   .librespin/calcpad/results.yaml   (component values from calcpad)
           .librespin/state.md               (checks skill: calcpad, phase: complete)
  Generates: .librespin/simulate/circuit.cir (SPICE netlist with values from results.yaml)
  Executes:  ngspice -b -r .librespin/simulate/output.raw .librespin/simulate/circuit.cir
  Outputs:  .librespin/simulate/output.raw   (raw simulation data)
            .librespin/simulate/summary.md   (human-readable result narrative)
            .librespin/state.md              (phase: complete, skill: simulate)
```

**Coupling rule for v0.2:** The calcpad → simulate handoff via `results.yaml` is **optional, not enforced**. `/librespin:simulate` checks for `results.yaml` and uses values if found, but can also run standalone with a `--netlist` arg or interactive input. This prevents tight coupling that would block either skill from running independently. Full auto-chain (calcpad feeds simulate automatically) is deferred to a future milestone per PROJECT.md.

---

## State & Output Files

### .librespin/ layout after v0.2

```
.librespin/
├── state.md                        # phase/skill tracking (shared, updated by each skill)
├── config.yaml                     # thresholds and depth (created by concept skill)
├── requirements.yaml               # Phase 1 concept output
├── concepts/
│   ├── concept-1.md
│   └── comparison-matrix.md
├── calcpad/
│   ├── sheet.cpd                   # CalcPad source file (agent writes, user may edit)
│   ├── sheet.html                  # CalcPad output — rendered calculation report
│   └── results.yaml                # Extracted key values (Vcc, R1, C1...) for simulate
└── simulate/
    ├── circuit.cir                 # SPICE netlist (agent writes from template + results.yaml)
    ├── output.raw                  # NGSpice raw data file (-r flag)
    └── summary.md                  # Human-readable: DC operating point, key node voltages, pass/fail
```

**State file schema extension for v0.2:**
```yaml
---
phase: complete
skill: calcpad          # most recently completed skill
completed: [concept, calcpad]
calcpad_sheet: .librespin/calcpad/sheet.cpd
calcpad_results: .librespin/calcpad/results.yaml
simulate_netlist: .librespin/simulate/circuit.cir
---
```

The state file is append-only per run: each skill adds its key output paths. The next skill reads paths from state rather than hardcoding them.

### CalcPad CE CLI invocation (confirmed from CLI help)

```bash
calcpad .librespin/calcpad/sheet.cpd html -s
# -s = silent mode (do not open output file in browser)
# "html" shorthand = output to sheet.html in same directory
```

Binary name: `calcpad` (installed to `/usr/local/bin/calcpad` per csproj). Runtime: .NET 10. Agent must check `which calcpad` and report a clear error with install instructions if not found.

### NGSpice headless invocation (MEDIUM confidence — official docs)

```bash
ngspice -b -r .librespin/simulate/output.raw .librespin/simulate/circuit.cir
# -b = batch mode (no interactive prompt)
# -r = write rawfile
```

Netlist file extension: `.cir` (conventional; `.sp` and `.net` also accepted by ngspice). Agent must check `which ngspice` and report install instructions if not found (`sudo apt install ngspice` on Debian/Ubuntu).

---

## Build Order

Build calcpad first, then simulate. Rationale: simulate depends on `results.yaml` produced by calcpad for its happy path. The agent prompt for simulate references the calcpad output format. Building simulate first requires specifying that format in the abstract, which is less reliable than building calcpad, observing its output, and then wiring simulate to it.

**Recommended phase sequence:**

**Phase 1: CalcPad CE skill**
1. `skills/calcpad/templates/calcpad-sheet.cpd` — define the starter EE calculation template first. The agent writes to this shape; locking the template before writing the agent avoids iteration.
2. `agents/calcpad.md` — thin file, write after template.
3. `skills/calcpad/SKILL.md` — orchestrator. Write last so arg schema matches what templates produce.
4. Smoke test: install locally, run `/librespin:calcpad`, verify `.librespin/calcpad/sheet.html` is produced.

**Phase 2: NGSpice simulation skill**
1. Define `results.yaml` schema from Phase 1 output (look at actual calcpad output, extract what SPICE needs: component values with units).
2. `skills/simulate/templates/spice-netlist.cir` — write starter netlist with correct SPICE syntax stubs.
3. `agents/simulate.md` — thin file.
4. `skills/simulate/SKILL.md` — orchestrator with `--type tran|ac|op` arg support.
5. Smoke test: run `/librespin:simulate` against Phase 1 output, verify `output.raw` and `summary.md` produced.

**Phase 3: Installer update**
Update `bin/install.js` to copy `skills/calcpad/` and `skills/simulate/` to install target. This is a single-file edit touching the copy manifest. Do last so paths are confirmed stable.

**Do not parallelize Phase 1 and Phase 2.** The results.yaml contract between them must be defined from real Phase 1 output, not speculatively. If parallelized, the simulate agent would need revision after seeing the actual calcpad output format.

---

## Key Findings

- Both new skills follow the exact same two-file pattern as concept: `skills/<name>/SKILL.md` (orchestrator) + `agents/<name>.md` (worker declaration). No exceptions, no new patterns needed.
- CalcPad CE CLI binary is `calcpad` (installed to `/usr/local/bin/calcpad`). Invocation: `calcpad input.cpd html -s`. Input format is `.cpd` (plain text with CalcPad syntax). Output is HTML (or DOCX/PDF). .NET 10 runtime required — agent must check for CLI presence and fail gracefully.
- NGSpice headless: `ngspice -b -r output.raw input.cir`. Standard SPICE netlist format (`.cir`). The `-b` flag suppresses interactive mode. Available via `apt install ngspice` on Ubuntu/Debian.
- The calcpad → simulate handoff should be loose-coupled via an optional `results.yaml` in v0.2. Hard-chaining is deferred per PROJECT.md backlog item 999.1.
- Output namespacing: `.librespin/calcpad/` and `.librespin/simulate/` as subdirectories, not flat files in `.librespin/`. Prevents filename collisions if the user runs multiple sessions.
- State file is shared across all skills (single `.librespin/state.md`), extended with new keys per skill run. Each skill appends its output paths to state; next skill reads paths from state.
- `bin/install.js` needs a one-time update to copy two new skill directories. This is the only modification to an existing v0.1 file.
- Build calcpad before simulate. The `results.yaml` format must be observed from a real calcpad run before the simulate agent can be precisely specified.
- No templates are strictly required for calcpad/simulate (unlike concept's requirements.yaml and comparison-matrix templates), but a starter `.cpd` and a starter `.cir` template reduce the agent's generation burden and improve consistency across runs.

---

## Sources

- `skills/concept/SKILL.md` lines 1-100 — confirmed orchestrator pattern, argument parsing, state load/init, agent spawn (HIGH confidence, live file)
- `agents/concept.md` — confirmed agent frontmatter pattern and tools allowlist (HIGH confidence, live file)
- `.planning/PROJECT.md` — confirmed v0.2 scope, constraints, CalcPad CE CLI wrapping decision (HIGH confidence, live file)
- `/home/william/.local/share/Trash/files/reference/calcpad-cli-help.TXT` — CalcPad CE CLI interface: `calcpad input.cpd html -s`, output formats, `-s` silent flag (HIGH confidence, official CLI help)
- `/home/william/repo/CalcpadCE/Calcpad.Cli/Calcpad.Cli.csproj` — binary name `Cli`/`calcpad`, install path `/usr/local/bin/calcpad`, .NET 10 runtime (HIGH confidence, source csproj)
- NGSpice batch mode: `ngspice -b -r rawfile netlist.cir` — from official NGSpice docs via WebSearch (MEDIUM confidence, multiple sources agree)
- [NGSpice User's Manual](https://ngspice.sourceforge.io/docs/ngspice-html-manual/manual.xhtml) — batch mode reference
- [NGSpice batch mode plotting discussion](https://sourceforge.net/p/ngspice/discussion/133842/thread/bc6b8cf4/) — confirmed `-b -r` pattern in practice

---
*Architecture research for: LibreSpin v0.2 — CalcPad CE + NGSpice skill integration*
*Researched: 2026-04-08*
