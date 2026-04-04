# Architecture Research

**Domain:** Claude Code skill pack — hardware design workflow
**Researched:** 2026-04-04
**Confidence:** HIGH (GSD and hw-concept are live, inspectable reference implementations)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     User / Claude Code Session                    │
│   /librespin [args]  ←  slash command entry point                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     Orchestrator Command                          │
│   ~/.claude/commands/librespin/concept.md                        │
│                                                                   │
│   Responsibilities:                                               │
│   • Parse arguments ($ARGUMENTS)                                  │
│   • Load / initialize state from .librespin/state.md             │
│   • Spawn worker agent via Task tool                              │
│   • Handle agent return (completion, checkpoint, error)          │
│   • Verify state file updated after agent run                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │  Task(subagent_type="librespin-concept")
┌────────────────────────────▼─────────────────────────────────────┐
│                     Worker Agent (sub-agent)                      │
│   ~/.claude/agents/librespin-concept.md                          │
│                                                                   │
│   Responsibilities:                                               │
│   • Execute one phase of the workflow                            │
│   • Read state and config on entry                               │
│   • Write outputs to .librespin/                                 │
│   • Update state.md on exit                                      │
│   • Return completion/checkpoint/error to orchestrator           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     Shared Support Files                          │
│   ~/.claude/librespin/templates/     — output scaffolds           │
│   ~/.claude/librespin/references/    — domain knowledge docs      │
└──────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     Project State (per repo)                      │
│   .librespin/state.md                — phase tracking             │
│   .librespin/config.yaml             — configurable thresholds    │
│   .librespin/requirements.yaml       — captured requirements      │
│   .librespin/concepts/               — generated output files     │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Orchestrator command | Entry point, arg parsing, state load, agent spawn, return handling | Markdown file in `~/.claude/commands/librespin/` |
| Worker agent | Phase execution, domain logic, state write, output production | Markdown file in `~/.claude/agents/` |
| Templates | Output file scaffolds (concept, BOM, overview) | Markdown/YAML in `~/.claude/librespin/templates/` |
| References | Domain knowledge Claude reads mid-execution | Markdown in `~/.claude/librespin/references/` |
| State file | Cross-invocation phase tracking | `.librespin/state.md` (per-project) |
| Config file | User-tunable thresholds (completeness %, depth) | `.librespin/config.yaml` (per-project) |
| npx installer | Copies all above files to `~/.claude/` | `bin/install.js` (Node.js) |

## Recommended Project Structure

### npm Package (source repo)

```
librespin/                          # npm package root
├── package.json                    # name: librespin, bin: librespin-install
├── bin/
│   └── install.js                  # npx installer — copies .claude/ tree to ~/
├── .claude/                        # everything that lands in ~/.claude/
│   ├── commands/
│   │   └── librespin/
│   │       └── concept.md          # /librespin:concept orchestrator
│   ├── agents/
│   │   └── librespin-concept.md    # hw-concept worker agent (ported)
│   └── librespin/
│       ├── templates/
│       │   ├── requirements.yaml   # user-facing requirements schema
│       │   ├── concept.md          # per-concept output scaffold
│       │   ├── overview.md         # comparison matrix scaffold
│       │   └── state.md            # initial state file template
│       └── references/
│           └── (future: component-selection.md, power-budgets.md, etc.)
├── docs/
│   └── usage.md
└── README.md
```

### Installed Layout in `~/.claude/`

```
~/.claude/
├── commands/
│   └── librespin/
│       └── concept.md              # /librespin:concept slash command
├── agents/
│   └── librespin-concept.md        # spawned by orchestrator
└── librespin/
    ├── templates/                  # read by agent when writing outputs
    └── references/                 # domain knowledge (future)
```

### Per-Project Outputs in `.librespin/`

```
.librespin/                         # created on first /librespin:concept run
├── state.md                        # current phase, accumulated decisions
├── config.yaml                     # thresholds, depth setting
├── requirements.yaml               # Phase 1 output
└── concepts/
    ├── concept-1.md
    ├── concept-2.md
    ├── concept-3.md
    ├── comparison-matrix.md
    └── status.md
```

### Structure Rationale

- **`commands/librespin/`:** Namespaced under `librespin/` so multiple commands don't collide with other skill packs. GSD uses `commands/gsd/`. hw-concept used a flat `commands/hw-concept.md` — LibreSpin should match GSD's namespace convention.
- **`agents/librespin-concept.md`:** Flat file — agents are singletons per skill pack in Claude Code. Named `librespin-concept` (not `hw-concept`) to live in LibreSpin's namespace.
- **`librespin/templates/`:** Separate from `commands/` and `agents/` because templates are data, not executable instructions. Agent reads them when writing output files.
- **`.librespin/` per-project:** Parallel to `.planning/` (GSD) and `.claude/` (session). Avoids any namespace collision.

## Architectural Patterns

### Pattern 1: Thin Orchestrator / Fat Agent

**What:** The slash command does only coordination — argument parsing, state loading, spawning, and return handling. All domain logic lives in the agent.

**When to use:** Always for Claude Code skill packs. Keeps orchestrator context budget low (15-20%) so the agent gets a fresh, large context window.

**Trade-offs:** Orchestrator is simple to read and modify; agent is the complexity surface. Correct split for this domain.

**Example from hw-concept:**
```
/hw-concept command:
  Step 1: Parse --input, --output, --depth
  Step 2: Check .planning/hw-concept-state.md
  Step 3: Spawn agent with parameters
  Step 4: Report agent return
  Step 5: Verify state updated
```
The agent (AGENT.md, 6,960 lines) does everything else.

### Pattern 2: Phase-Gated State Machine

**What:** The workflow advances through named phases. State is written to disk after each phase. Subsequent invocations resume from current phase — not from the beginning.

**When to use:** Any multi-step workflow where steps take more than one context window, or where the user needs to review and re-invoke.

**Trade-offs:** Resilient to interruption; enables re-run from failure point. Requires careful state schema design upfront.

**State file pattern (from hw-concept):**
```markdown
---
phase: drafting
completed: [requirements]
---
# hw-concept state
...
```

### Pattern 3: Fresh Context Per Phase

**What:** Each agent spawn starts with a clean context window. The orchestrator does NOT accumulate conversation history across phases. State is passed explicitly via files, not via chat history.

**When to use:** Multi-phase workflows where total token cost would exceed a single context window, or where early phases contain irrelevant detail for later phases.

**Trade-offs:** Prevents context rot and hallucination from stale early content. Requires state schema to carry enough forward context.

### Pattern 4: Template-Driven Output

**What:** Agent reads output scaffold templates before writing. Templates define structure; agent fills content. Keeps output format consistent across runs.

**When to use:** Whenever the output has a repeating structure (concept files, BOM tables, comparison matrices).

**Trade-offs:** Agent must read template before writing output — one extra file read per output. Worth it for consistency.

### Pattern 5: Config YAML for Tunables

**What:** User-facing thresholds (completeness %, depth mode, iteration limits) live in `.librespin/config.yaml` rather than hardcoded in the agent. Created with defaults on first run; user can edit.

**When to use:** Any threshold that a user might reasonably want to adjust without editing the agent markdown.

**Trade-offs:** One extra file the agent must load. Enables per-project customization without modifying installed files.

## Data Flow

### First Invocation (Phase 1: Requirements)

```
User runs: /librespin:concept
    |
    v
Orchestrator (concept.md)
    | parse $ARGUMENTS → INPUT_FILE, OUTPUT_DIR, DEPTH
    | check .librespin/state.md → not found
    | report "Initializing new LibreSpin project..."
    |
    v
Task(subagent_type="librespin-concept")
    | [fresh context window]
    | load config defaults (no config.yaml yet → use hardcoded defaults)
    | enter Phase 1: Requirements
    | if INPUT_FILE = "interactive" → AskUserQuestion loop
    | if INPUT_FILE = path → parse YAML, score completeness, gap-fill
    | write .librespin/requirements.yaml
    | write .librespin/config.yaml (with chosen depth/defaults)
    | write .librespin/state.md (phase: requirements, completed: [])
    | return: "Phase 1 complete. Run /librespin:concept to proceed."
    |
    v
Orchestrator verifies .librespin/state.md updated
User re-invokes to proceed to Phase 2
```

### Subsequent Invocations (Phase 2-9)

```
User runs: /librespin:concept
    |
    v
Orchestrator
    | load .librespin/state.md → current phase = "drafting"
    | report "Resuming from Phase 2: Drafting..."
    |
    v
Task(subagent_type="librespin-concept")
    | [fresh context window]
    | read .librespin/state.md → current phase
    | read .librespin/config.yaml → depth, thresholds
    | read .librespin/requirements.yaml → input for this phase
    | read prior phase outputs if needed
    | execute current phase
    | write phase output files to .librespin/concepts/
    | update .librespin/state.md → advance phase
    | return completion or checkpoint
```

### Checkpoint Flow (human-in-the-loop)

```
Agent reaches checkpoint (e.g., end of requirements gathering)
    |
    v
Agent returns checkpoint object to orchestrator
    |
    v
Orchestrator presents checkpoint to user
    |
    v
User responds / approves / edits
    |
    v
Orchestrator spawns continuation agent with user input in prompt
```

### State Schema (forward reference)

State file carries minimum viable context for next phase:
- Current phase name
- Completed phases list
- Key accumulated decisions (not full conversation history)
- Paths to prior phase output files

## Component Boundaries

| Boundary | What crosses it | Direction | Notes |
|----------|-----------------|-----------|-------|
| Orchestrator → Agent | Parameters (INPUT_FILE, OUTPUT_DIR, DEPTH, PHASE), file paths | One-way at spawn | Via Task tool prompt string |
| Agent → Disk | State file, config, requirements, concept outputs | Write | Agent owns all .librespin/ writes |
| Disk → Agent | State, config, requirements, templates | Read | Agent reads on entry to each phase |
| Agent → Orchestrator | Completion status, files created, checkpoint data | One-way on return | Via Task tool return value |
| Installer → ~/.claude/ | Commands, agents, templates, references | One-way copy | npx install.js, recursive cp |
| Templates → Agent | Output scaffolds | Read at output-write time | Agent reads, fills, writes to .librespin/ |

## npx Installer Architecture

The installer is a thin Node.js script that copies the `.claude/` subtree from the npm package to the user's `~/.claude/`. It must:

1. Accept `--local` flag (install to `./.claude/` for workspace-scoped installs)
2. Accept `--help`
3. Create target directories if missing (`mkdir -p`)
4. Copy with `force: true` so re-install updates existing files
5. Report each installed component with a checkmark
6. Print "Restart Claude Code to activate" on success

**What gets copied:**
```
Package source (.claude/)     →   Install target (~/.claude/)
─────────────────────────────     ──────────────────────────────
commands/librespin/           →   commands/librespin/
agents/librespin-concept.md   →   agents/librespin-concept.md
librespin/templates/          →   librespin/templates/
librespin/references/         →   librespin/references/
```

**package.json shape:**
```json
{
  "name": "librespin",
  "version": "0.1.0",
  "bin": { "librespin-install": "./bin/install.js" },
  "files": ["bin/", ".claude/"],
  "engines": { "node": ">=18.0.0" }
}
```

**Install invocation:**
```bash
npx librespin-install           # global: ~/.claude/
npx librespin-install --local   # workspace: ./.claude/
```

## Scaling Considerations

This is a developer tool with a single-user execution model. Traditional scaling concerns (load, concurrency, throughput) do not apply. The relevant growth axes are:

| Growth axis | Concern | Approach |
|-------------|---------|---------|
| More skills (v2, v3...) | `~/.claude/agents/` gets crowded | Prefix all files with `librespin-` to namespace |
| Larger AGENT.md | Context window pressure | Split into agent + references; agent @-includes references |
| More templates | Template discovery | Keep flat under `librespin/templates/`; name by output type |
| Multiple Claude Code users | No shared state | Per-user `~/.claude/` and per-repo `.librespin/` isolate naturally |

## Anti-Patterns

### Anti-Pattern 1: State in Chat History

**What people do:** Rely on the conversation context to carry workflow state across invocations.

**Why it's wrong:** Each Claude Code session starts fresh. Context history is not persisted between separate `/librespin:concept` invocations. State must be written to disk.

**Do this instead:** Write `.librespin/state.md` at the end of every phase. Read it at the start of every agent spawn.

### Anti-Pattern 2: Fat Orchestrator

**What people do:** Put domain logic (phase questions, scoring, component research) in the orchestrator command.

**Why it's wrong:** Orchestrator accumulates context across the conversation. Heavy logic burns the orchestrator's context budget and introduces context rot into coordination code.

**Do this instead:** Orchestrator does only: parse, load state, spawn, handle return, verify. Agent does all domain work in a fresh context.

### Anti-Pattern 3: Hardcoding Output Paths

**What people do:** Write output paths like `./concepts/` in the agent instructions.

**Why it's wrong:** The orchestrator receives the output directory as a parameter and passes it to the agent. If paths are hardcoded in the agent, the `--output` flag has no effect.

**Do this instead:** Agent always writes to the OUTPUT_DIR parameter value. Default is `.librespin/concepts/`.

### Anti-Pattern 4: Modifying Installed Files to Configure

**What people do:** Edit `~/.claude/agents/librespin-concept.md` to change thresholds.

**Why it's wrong:** Edits are lost on next `npx librespin-install`. User-tunable values belong in `.librespin/config.yaml`.

**Do this instead:** All tunables (completeness threshold, depth, iteration limits) live in the per-project config YAML. Agent reads them on startup.

### Anti-Pattern 5: One Giant Command File

**What people do:** Put both orchestrator logic and agent logic in the slash command file.

**Why it's wrong:** Claude Code slash commands run in the main session context. For a 9-phase workflow, a single command file would accumulate enormous context. hw-concept already has AGENT.md at 6,960 lines — that must stay in the agent, not the command.

**Do this instead:** Command file ≤ 200 lines. Agent file can be arbitrarily large (it runs in a fresh context per spawn).

## Integration Points

### External Tools (via Bash in Agent)

| Tool | Integration | Notes |
|------|-------------|-------|
| WebSearch | Agent uses `WebSearch` tool for component research | Phase 4 (component research) |
| CalcPad CE CLI | Future v2 — agent runs `.NET` CLI via `Bash` tool | Requires .NET 10 on host |
| NGSpice CLI | Future v2 — agent runs `ngspice` via `Bash` tool | FOSS, apt-installable |
| KiCad CLI | Future v4 — production export | FOSS, apt-installable |

### Claude Code Agent System

| Interface | How | Notes |
|-----------|-----|-------|
| Slash command → Agent | `Task(subagent_type="librespin-concept", prompt=...)` | subagent_type must match agent filename without `.md` |
| Agent tools allowlist | Declared in AGENT.md frontmatter: `tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion, Bash` | `Bash` needed for future CLI integrations |
| State file location | `.librespin/state.md` in working directory | Working directory = the user's project repo |

## Suggested Build Order

Build phases should respect the dependency chain from foundation to behavior:

1. **npm package scaffold** — `package.json`, `bin/install.js`, directory structure. Installer must work before anything else can be validated.

2. **State and config schemas** — Define `.librespin/state.md` and `.librespin/config.yaml` formats. Everything else depends on these contracts.

3. **Templates** — Port `requirements.yaml`, `concept.md`, `overview.md` from hw-concept. Agent references these; they must exist before agent testing.

4. **Orchestrator command** — Port `hw-concept.md` to `commands/librespin/concept.md`. Thin file; port is primarily a namespace rename and output-dir update (.librespin/).

5. **Worker agent** — Port `AGENT.md` to `agents/librespin-concept.md`. Largest file; do last so command and templates are stable. Update all `.planning/` references to `.librespin/`.

6. **End-to-end smoke test** — Install locally, run `/librespin:concept` in a test repo, verify all 9 phases complete and outputs land in `.librespin/`.

## Sources

- GSD skill pack source: `/home/william/.claude/get-shit-done/` (live, inspected 2026-04-04)
- hw-concept source: `/home/william/repo/hw-concept/` (live, inspected 2026-04-04)
- hw-concept orchestrator: `.claude/commands/hw-concept.md` (full read)
- hw-concept agent frontmatter + Phases 1-2: `.claude/agents/hw-concept/AGENT.md` (partial read)
- hw-concept installer: `bin/install.js` (full read)
- Claude Code agent system: observed from GSD agent files in `~/.claude/agents/`
- LibreSpin PROJECT.md: `.planning/PROJECT.md` (full read)

---
*Architecture research for: LibreSpin — Claude Code hardware design skill pack*
*Researched: 2026-04-04*
