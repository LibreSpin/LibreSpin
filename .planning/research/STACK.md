# Stack Research

**Domain:** Claude Code skill pack wrapping hardware EDA CLI tools
**Researched:** 2026-04-04
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

**For v2+ (CalcPad CE / NGSpice wrapping):**
- Add `librespin-calcpad` agent to `~/.claude/agents/`
- Add `librespin-ngspice` agent
- Orchestrator routes to correct agent based on pipeline stage
- CLI wrapping pattern: agent constructs shell commands, uses Bash tool, reads stdout/stderr
- .NET 10 runtime required for CalcPad CE (document as prerequisite, do not bundle)

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

## Sources

- Official Claude Code skills docs: https://code.claude.com/docs/en/skills — verified SKILL.md frontmatter, `context: fork`, `$ARGUMENTS`, skills vs commands, `disable-model-invocation`. Confidence: HIGH.
- Official Claude Code subagents docs: https://code.claude.com/docs/en/sub-agents — verified AGENT.md frontmatter fields (`name`, `description`, `tools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `effort`, `isolation`, `color`), scope table, Task→Agent rename. Confidence: HIGH.
- Official Claude Code plugins docs: https://code.claude.com/docs/en/plugins — verified plugin.json structure, plugin directory layout (`.claude-plugin/`, `skills/`, `agents/`, `commands/`), namespacing behavior. Confidence: HIGH.
- hw-concept codebase: `/home/william/repo/hw-concept/` — direct inspection of working installer (`bin/install.js`), command file (`.claude/commands/hw-concept.md`), agent definition (`.claude/agents/hw-concept/AGENT.md`), YAML templates. Confidence: HIGH (ground truth — this is the source project being ported).
- GSD skill pack: `~/.claude/get-shit-done/` — direct inspection of installed agent files, command structure. Confidence: HIGH.
- Node.js version: `v24.12.0` confirmed on target machine via `node --version`.

---

*Stack research for: Claude Code skill pack (LibreSpin hardware EDA workflow)*
*Researched: 2026-04-04*
