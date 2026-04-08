# Stack Research

**Domain:** Claude Code skill pack wrapping hardware EDA CLI tools
**Researched:** 2026-04-04 (v0.1) | 2026-04-08 (v0.2 addendum)
**Confidence:** HIGH (verified against official Claude Code docs, live hw-concept codebase, GSD codebase)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Claude Code skills (SKILL.md) | Current | User-invocable slash commands | Official first-class primitive; `.claude/commands/*.md` still works but skills add supporting-file directories and frontmatter features. Both produce `/skill-name` commands. |
| Claude Code subagents (AGENT.md) | Current | Long-running phase workers with fresh context | Keeps orchestrator context lean; each phase agent loads only what it needs. hw-concept already uses this pattern — proven for multi-phase workflows. |
| Node.js (ESM) | >=18.0.0 | npx installer only | Zero runtime in the skill pack itself. Node is used solely for the install.js script that copies markdown files to `~/.claude/`. hw-concept proves this pattern. |
| YAML templates | Any | Structured input to agents | Human-editable requirements files (e.g., `requirements.yaml`). Agents read them via the Read tool. No YAML parsing library needed in the pack itself. |
| Markdown | N/A | All skill content | The entire skill pack is markdown. Intelligence lives in prompts, not code. |

### Installer Package

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| npm / npx | >=9.0.0 (ships with Node 18) | `npx librespin-install` entry point | Standard distribution. hw-concept's install.js pattern is 60 lines of Node built-ins (`fs/promises`, `os`, `path`). No dependencies needed. |
| `js-yaml` | ^4.1.0 | Optional: YAML validation in installer | Only add if installer needs to validate template YAML on install. hw-concept lists it as a dependency but the install script does not use it. Omit for v1. |

### Supporting Files per Skill/Agent

| File | Purpose | Notes |
|------|---------|-------|
| `SKILL.md` | Skill entrypoint with frontmatter + instructions | One per skill directory |
| `AGENT.md` | Subagent definition with frontmatter + system prompt | One per agent directory; installed to `~/.claude/agents/` |
| `templates/*.yaml` | Structured input templates for the agent | Installed to `~/.claude/librespin/templates/` |
| `templates/*.md` | Output format templates the agent fills in | Concept output shape, BOM table format, etc. |

---

## File Structure

This is the canonical layout for LibreSpin as a distributable skill pack. It mirrors hw-concept's proven `.claude/` structure.

```
librespin/                          # repo root
├── .claude-plugin/                 # FUTURE: plugin manifest (v2+)
│   └── plugin.json
├── .claude/                        # files copied to ~/.claude/ by installer
│   ├── agents/
│   │   └── librespin-concept/
│   │       └── AGENT.md            # 9-phase concept worker agent
│   ├── commands/
│   │   └── librespin.md            # /librespin orchestrator command
│   └── librespin/
│       └── templates/
│           ├── requirements.yaml   # user fills this in
│           ├── concept-template.md # output shape for concept docs
│           └── overview-template.md
├── bin/
│   └── install.js                  # npx librespin-install entry point
├── package.json
├── LICENSE
└── README.md
```

**Key structural decisions:**

- `~/.claude/agents/librespin-concept/AGENT.md` — user-scoped subagent, available in all projects
- `~/.claude/commands/librespin.md` — orchestrator command, creates `/librespin` slash command
- `~/.claude/librespin/templates/` — namespace avoids collision with GSD's `~/.claude/get-shit-done/`
- Project outputs go to `.librespin/` (not `.planning/`) to avoid collision with GSD

---

## AGENT.md Frontmatter (subagent definition)

```yaml
---
name: librespin-concept
description: >
  Hardware concept design agent for LibreSpin. Executes the 9-phase
  concept workflow (requirements → drafting → validation → component
  research → generation → self-critique → refinement → final generation
  → output). Spawned by /librespin orchestrator.
tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion
color: blue
---
```

**Confidence:** HIGH — verified against official subagent docs and existing hw-concept pattern.

Fields confirmed available: `name`, `description`, `tools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`.

---

## SKILL.md / Command Frontmatter (orchestrator command)

Using `.claude/commands/librespin.md` format (not `skills/`) for v1 because:
1. hw-concept already uses this pattern and it works
2. Skills add a namespace prefix (`/librespin:librespin`) which is awkward; commands give clean `/librespin`
3. No supporting files needed for the orchestrator command in v1

```yaml
---
description: >
  Run the LibreSpin hardware concept workflow. Generates hardware
  concept designs with BOMs and block diagrams from requirements.
argument-hint: "[--input FILE] [--output DIR] [--depth quick|medium|thorough]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Glob
  - Bash
---
```

Note: `Task` tool was renamed to `Agent` in Claude Code 2.1.63. Both work as aliases. Use `Agent` in new code.

**Confidence:** HIGH — verified against official skills docs.

---

## package.json for Installer

```json
{
  "name": "librespin",
  "version": "0.1.0",
  "description": "AI-driven PCB design workflow skill pack for Claude Code",
  "type": "module",
  "bin": {
    "librespin-install": "./bin/install.js"
  },
  "files": [
    "bin/",
    ".claude/"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": [
    "claude-code",
    "hardware",
    "pcb",
    "kicad",
    "electronics",
    "eda",
    "ai-agent"
  ],
  "license": "MIT"
}
```

No runtime `dependencies` required for v1. The install script uses only Node built-ins.

---

## install.js Pattern

The installer follows hw-concept's approach exactly — 60 lines, no third-party deps, pure Node built-ins:

```js
#!/usr/bin/env node
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const targetBase = isLocal ? join(process.cwd(), '.claude') : join(homedir(), '.claude');
const sourceBase = join(__dirname, '..', '.claude');

// Create dirs, copy agents/, commands/, librespin/
// Support --local flag for project-scoped install
// Print confirmation with restart instruction
```

**`--local` flag:** Installs to `./.claude/` instead of `~/.claude/`. Useful for project-scoped testing without affecting other projects.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `.claude/commands/librespin.md` | `.claude/skills/librespin/SKILL.md` | When you need supporting files alongside the orchestrator, or want model-auto-invocation. Use skills path in v2+ if the orchestrator grows complex. |
| User-scoped install (`~/.claude/`) | Project-scoped install (`.claude/`) | `--local` flag supports this already. Project scope isolates to one repo; useful for teams with repo-specific skill versions. |
| npm package + `npx` | Claude Code plugin system (`.claude-plugin/plugin.json`) | Plugins are the correct long-term path for marketplace distribution. Migrate to plugin format in v2/v3 when submitting to the official Anthropic marketplace. |
| Pure Node built-ins in install.js | `fs-extra` or other npm packages | Add `fs-extra` only if the copy logic grows complex (e.g., merge-and-update installs). Not needed for v1 overwrite-install. |
| YAML templates (human-readable) | JSON templates | YAML is more ergonomic for hardware designers filling in requirements. No parsing needed in the pack itself; agents read them as text. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Python runtime in skill pack | Skill pack is markdown + one Node installer. Python adds a second runtime dependency for zero gain. | Markdown files + Node installer. Python is reserved for future utility scripts (per CLAUDE.md) that are not part of the skill pack. |
| Bundlers (webpack, esbuild, rollup) | Installer is 60 lines of Node built-ins. Bundling adds complexity with no benefit. | Vanilla Node ESM. |
| TypeScript for installer | Adds build step for 60 lines of code that never changes. | Plain `.js` with `"type": "module"` in package.json. |
| `js-yaml` dependency (in v1) | Installer does not parse YAML. If added as dead weight, it confuses contributors. | Omit unless a specific YAML validation need arises. |
| Skills namespace for orchestrator (`/librespin:librespin`) | Double-namespace slug is awkward UX. | `.claude/commands/librespin.md` produces clean `/librespin` command. |
| Monorepo with separate packages | Over-engineering for a single skill pack. | Single flat package. |
| Subagents spawning subagents | Claude Code prohibits it — subagents cannot spawn other subagents. | Orchestrator command (running in main context) spawns the concept agent via `Agent` tool. |

---

## Stack Patterns by Variant

**If running /librespin in interactive mode (no --input file):**
- Orchestrator command spawns concept agent with `INPUT_FILE="interactive"`
- Agent uses `AskUserQuestion` tool to collect requirements conversationally
- Same as hw-concept's interactive mode pattern

**If running with a requirements file (--input reqs.yaml):**
- Orchestrator validates file exists (Bash ls check), then passes path to agent
- Agent reads the file directly via Read tool
- No YAML parsing library needed — agent reads as raw text and extracts fields

**If resuming an existing project (state file found):**
- Orchestrator reads `.librespin/state.md` to determine current phase
- Passes phase to agent as context
- Agent resumes from recorded phase

**For v2+ (CalcPad CE / NGSpice wrapping) — see v0.2 addendum below.**

**For v3+ (plugin marketplace distribution):**
- Convert to plugin format: add `.claude-plugin/plugin.json`
- Commands become namespaced: `/librespin:concept`, `/librespin:calcpad`
- Submit to official Anthropic marketplace or host own marketplace on GitHub

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Node.js >=18.0.0 | npm >=9.0.0 | npx ships with npm. Both present on any modern dev machine. |
| Claude Code (any version) | `.claude/commands/*.md` | Commands format predates skills and is stable. Skills are newer but backward-compatible. |
| Claude Code >=2.1.63 | `Agent` tool (was `Task`) | `Task` still works as alias. Use `Agent` in new code per official docs. |
| hw-concept AGENT.md format | Current Claude Code | The existing AGENT.md frontmatter (`name`, `description`, `tools`, `color`) is fully current API. |

---

## Installation Commands

```bash
# End-user install (global, available in all projects)
npx librespin-install

# Project-local install (isolated to this project)
npx librespin-install --local

# Development: install from local checkout
node bin/install.js --local

# Test without installing (load plugin dir directly)
claude --plugin-dir ./librespin-plugin  # v2+ plugin format only
```

---

## Sources (v0.1)

- Official Claude Code skills docs: https://code.claude.com/docs/en/skills — verified SKILL.md frontmatter, `context: fork`, `$ARGUMENTS`, skills vs commands, `disable-model-invocation`. Confidence: HIGH.
- Official Claude Code subagents docs: https://code.claude.com/docs/en/sub-agents — verified AGENT.md frontmatter fields (`name`, `description`, `tools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`), scope table, Task→Agent rename. Confidence: HIGH.
- Official Claude Code plugins docs: https://code.claude.com/docs/en/plugins — verified plugin.json structure, plugin directory layout (`.claude-plugin/`, `skills/`, `agents/`, `commands/`), namespacing behavior. Confidence: HIGH.
- hw-concept codebase: `/home/william/repo/hw-concept/` — direct inspection of working installer (`bin/install.js`), command file (`.claude/commands/hw-concept.md`), agent definition (`.claude/agents/hw-concept/AGENT.md`), YAML templates. Confidence: HIGH (ground truth — this is the source project being ported).
- GSD skill pack: `~/.claude/get-shit-done/` — direct inspection of installed agent files, command structure. Confidence: HIGH.
- Node.js version: `v24.12.0` confirmed on target machine via `node --version`.

---

*Stack research for: Claude Code skill pack (LibreSpin hardware EDA workflow)*
*Researched: 2026-04-04*

---

---

# v0.2 Stack Addendum — CalcPad CE CLI + NGSpice Simulation

**Researched:** 2026-04-08
**Confidence:** MEDIUM — CLI invocation patterns verified via source code inspection; CalcPad CE Linux availability is a gap (see below)

---

## CalcPad CE

**What it is:**
CalcPad CE (Community Edition) is the open-source continuation of Calcpad — a professional engineering calculation tool written in C#. It takes `.cpd` or `.txt` formula files and renders HTML/PDF/DOCX output with formatted equations, plots, and results. The original upstream (Proektsoftbg/Calcpad) discontinued open-source development in March 2026 at v7.6.x when it went closed-source. The community forked the last open-source commit to `imartincei/CalcpadCE`, continuing under MIT license.

**Version:** 7.6.x (CE fork)
**License:** MIT
**GitHub:** https://github.com/imartincei/CalcpadCE

**CLI invocation (`Calcpad.Cli`):**
```bash
# Input → HTML output (same filename, same directory — default)
Calcpad.Cli input.cpd

# Explicit output format
Calcpad.Cli input.cpd output.html
Calcpad.Cli input.cpd output.pdf
Calcpad.Cli input.cpd output.docx

# Silent / headless mode (suppresses interactive prompts — required for automation)
Calcpad.Cli input.cpd output.html -s
```

The CLI exits after conversion (`TryConvertOnStartup()` pattern confirmed in `Program.cs`). No interactive shell loop to manage — clean for skill automation.

**Input formats:** `.cpd` (plain text calculation code, primary), `.txt` (scripts), `.cpdz` (compressed with embedded images), `.cpc` (workspace)
**Output formats:** `.html` (default), `.pdf` (requires wkhtmltopdf), `.docx`

**.cpd file syntax (example):**
```
#Voltage divider
V_in = 12V
R1 = 10kΩ
R2 = 4.7kΩ
V_out = V_in * R2 / (R1 + R2)
I = V_in / (R1 + R2)
P_total = V_in * I
```

**Runtime requirements:**
- .NET Runtime 10.0 (base runtime — NOT the Desktop Runtime; CLI does not need WPF)
- Linux install: `sudo apt-get install -y dotnet-runtime-10.0`
- Windows: .NET Desktop Runtime 10.0 (for GUI); base runtime for CLI-only use

**CRITICAL GAP — Linux pre-built binary:**
The CE fork (`imartincei/CalcpadCE`) does not appear to publish a pre-built Linux binary. The desktop GUI is Windows-only (WPF). The CLI (`Calcpad.Cli`) is pure C#/.NET and can compile cross-platform, but users would need to build from source:
```bash
# One-time build (requires .NET SDK 10.0, not just runtime)
git clone https://github.com/imartincei/CalcpadCE
cd CalcpadCE/Calcpad.Cli
dotnet publish -c Release -r linux-x64 --self-contained false
# Binary at: bin/Release/net10.0/linux-x64/publish/Calcpad.Cli
```

**Skill design implication:** The `/librespin:calcpad` skill must handle the case where `Calcpad.Cli` is not in PATH. Options (decide at phase planning):
1. Document one-time build step in skill prerequisites; skill checks for binary and errors clearly if absent
2. Have Claude perform the calculations inline (no CLI) and skip CLI invocation — degrades gracefully
3. Use the CalcPad CE web version via API if one exists (not confirmed)

**Confidence: MEDIUM** — CLI invocation pattern confirmed from source code; Linux binary availability unconfirmed for CE fork specifically.

---

## NGSpice

**What it is:**
NGSpice is the open-source SPICE3f5-derived circuit simulator. It is the canonical FOSS choice for netlist simulation, embedded in KiCad's built-in simulator, and available on all major platforms. It supports transient (`.tran`), AC (`.ac`), DC sweep (`.dc`), noise (`.noise`), and operating point (`.op`) analyses.

**Current stable version:** 46 (released 2026-03-31)
**License:** BSD (mixed — some files GPL)
**Manual:** https://ngspice.sourceforge.io/docs/ngspice-html-manual/manual.xhtml

**Headless batch mode invocation:**
```bash
# Canonical pattern: batch + rawfile + log
ngspice -b -r simulation.raw -o simulation.log circuit.cir

# Minimal: console text output only (.print / .plot → stdout)
ngspice -b circuit.cir

# Capture console output to file
ngspice -b circuit.cir > results.txt 2>&1
```

**Key CLI flags:**
| Flag | Meaning |
|------|---------|
| `-b` / `--batch` | Headless batch mode — no interactive prompt |
| `-r FILE` | Write simulation data to rawfile (binary or ASCII) |
| `-o FILE` | Write log (warnings, errors, node counts) to FILE |
| `-s` / `--server` | Server mode — temp rawfile, results to stdout |
| `-a` / `--autorun` | Auto-run analyses on startup |
| `-i` / `--interactive` | Force interactive even when stdin is not a terminal |

**Input format (.cir — conventional; .sp and .net also accepted):**
NGSpice accepts `.cir`, `.sp`, `.net` interchangeably. File extension is not significant. Use `.cir` as LibreSpin convention.

Standard netlist structure:
```spice
* Title line (required as first line — treated as comment)
* Component syntax: <name> <node+> <node-> [model] <value>
R1 in out 10k
C1 out 0 100n
V1 in 0 dc 0 ac 1 PULSE(0 5 1u 1u 1u 500u 1m)

.control
  tran 1u 5m
  .print tran v(out) v(in)
.endc

.end
```

Key rules:
- First line is always the title (mandatory, treated as comment)
- `.control` / `.endc` block contains simulation commands
- `.print` / `.plot` produce text output to console in `-b` mode
- `.end` terminates the file

**Output formats:**
- **Console text** (`.print` / `.plot` directives): ASCII columns — time/frequency + voltage/current. Available when using `-b` without `-r`. Redirectable with shell `>`. Best for AI interpretation.
- **Rawfile** (`-r` flag): Binary by default. Set `filetype=ascii` in `.spiceinit` (or `.control` block) for human-readable ASCII rawfile. ASCII rawfile format:
  ```
  Title: ...
  Variables:
      0  frequency  frequency
      1  v(out)     voltage
  Values:
      0  1.0e+00  ...
  ```
- **Log** (`-o` flag): Simulation warnings, errors, node count — plain text.

**Setting ASCII rawfile output (recommended for skill):**
Add to circuit file's `.control` block, or to `~/.spiceinit`:
```spice
.control
  set filetype=ascii
  run
  write sim.raw
.endc
```

**Install methods:**
```bash
# Ubuntu/Debian — apt (behind latest but functional)
sudo apt install ngspice
# Ubuntu 24.04 LTS: v42  |  Ubuntu 25.04: v44

# Latest stable v46 from source
# https://sourceforge.net/projects/ngspice/files/ng-spice-rework/46/
# Or: sudo add-apt-repository ppa:... (if PPA exists for v46)
```

**Version notes:**
- Ubuntu 24.04 LTS ships v42 via apt — functional for all standard analyses; v46 adds improvements but is not required for skill purposes
- v42+ is the minimum acceptable version for the skill
- KiCad bundles NGSpice internally but it is NOT accessible from CLI — always target standalone `ngspice` in PATH

---

## Runtime Prerequisites for v0.2

| Tool | Version | Install method | Notes |
|------|---------|---------------|-------|
| NGSpice | 42+ (46 = latest stable) | `sudo apt install ngspice` | Available Linux/macOS/Windows; easy install |
| .NET Runtime 10.0 | 10.0 | `sudo apt-get install -y dotnet-runtime-10.0` | Required for CalcPad CE CLI only; not needed for NGSpice |
| CalcPad CE CLI | 7.6.x | Build from source (see above) OR document as optional | No pre-built Linux binary confirmed in CE fork — see CRITICAL GAP above |
| wkhtmltopdf | Any recent | `sudo apt install wkhtmltopdf` | Only if PDF output needed from CalcPad; skip if HTML suffices |

**No new Node.js / npm additions for v0.2.** New skills are markdown files distributed via the existing plugin marketplace mechanism — no installer changes required.

---

## What NOT to Add for v0.2

| Avoid | Why |
|-------|-----|
| Python wrapper scripts for CLI calls | Skill pack is pure markdown; Claude calls CLI tools via Bash tool directly — no intermediary needed |
| NGSpice output parser library (PySpice etc.) | Claude reads ASCII text output directly and interprets it — library dependency is premature and violates minimalism |
| wkhtmltopdf as hard requirement | Use HTML output from CalcPad CE; PDF is optional and requires an additional large dependency |
| .NET SDK as requirement | SDK (~500MB) is for building; only the runtime (~65MB) is needed. If Linux binary ships pre-built, SDK not needed at all |
| KiCad-bundled NGSpice | Bundled simulator not accessible from CLI; always target standalone `ngspice` in PATH |
| Gnuplot / graphical waveform viewer | Batch text output is sufficient for AI interpretation; visualization is post-v0.2 |
| SPICE model libraries | Ideal component models (R, C, L, V, I) are sufficient for v0.2; transistor PDKs are out of scope |
| New npm package / installer changes | No installer changes needed; skills distribute as markdown files via existing plugin marketplace |

---

## Skill Architecture for v0.2 (fits pure markdown pattern)

Both new skills follow the same pattern as `/librespin:concept`:

**`/librespin:calcpad`:**
1. Claude generates `.cpd` calculation file based on user's circuit context
2. Claude invokes: `Calcpad.Cli <file>.cpd output.html -s` via Bash tool
3. Claude reads the HTML output (or reports CLI not found with install instructions)
4. Claude presents calculation results and annotates them

**`/librespin:simulate`:**
1. Claude generates `.cir` SPICE netlist from context (component values, topology)
2. Claude invokes: `ngspice -b -r sim.raw -o sim.log circuit.cir` via Bash tool
3. Claude reads `sim.log` (errors/warnings) and `sim.raw` (or stdout text) for results
4. Claude interprets waveform data and presents findings

Both skills are pure markdown instruction files. No Python, no build step, no new Node packages.

---

## Sources (v0.2)

- CalcpadCE GitHub source code (Program.cs): https://github.com/imartincei/CalcpadCE — CLI argument handling, file format support, headless mode confirmed. Confidence: HIGH.
- CalcpadCE file formats (DeepWiki): https://deepwiki.com/Proektsoftbg/Calcpad/2.1-file-formats-and-processing — .cpd/.cpdz/.html formats confirmed. Confidence: MEDIUM.
- CalcpadCE website: https://calcpad-ce.org/ — CE fork confirmed as open-source continuation. Confidence: HIGH.
- NGSpice User Manual v46: https://ngspice.sourceforge.io/docs/ngspice-html-manual/manual.xhtml — v46 current as of 2026-03-31. Confidence: HIGH.
- NGSpice command line options (manual): https://nmg.gitlab.io/ngspice-manual/startingngspice/commandlineoptionsforstartingngspiceandngnutmeg.html — -b, -r, -o flags confirmed. Confidence: HIGH.
- NGSpice batch output docs: https://nmg.gitlab.io/ngspice-manual/analysesandoutputcontrol_batchmode/batchoutput.html — .print/.plot vs rawfile behavior. Confidence: HIGH.
- NGSpice tutorial (batch invocation example): https://ngspice.sourceforge.io/ngspice-tutorial.html — `ngspice -b -r rcrcac.out -o rcrcac.log rcrcac.cir` confirmed. Confidence: HIGH.
- Ubuntu NGSpice packages: https://packages.ubuntu.com/search?keywords=ngspice — v42 on 24.04 LTS, v44 on 25.04. Confidence: HIGH.
- NGSpice SourceForge: https://sourceforge.net/projects/ngspice/ — v46 confirmed as latest stable. Confidence: HIGH.
