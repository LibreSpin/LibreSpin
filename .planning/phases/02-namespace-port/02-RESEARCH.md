# Phase 02: Namespace Port - Research

**Researched:** 2026-04-04
**Domain:** Claude Code skill pack content migration — namespace rename, file restructure, API modernization
**Confidence:** HIGH

## Summary

Phase 2 is a mechanical port of the hw-concept skill pack into the LibreSpin namespace. The primary content source is a 6960-line AGENT.md that implements a 9-phase hardware concept design workflow. All hw-concept references (81 occurrences in AGENT.md, plus 99+ across command and template files) must be replaced with librespin-equivalent paths, and the Claude Code API must be modernized (Task → Agent, deprecated commands/ → skills/).

Phase 1 already created placeholder files at all target paths, so this phase is purely content replacement — no new directory structure, no installer changes. The work divides cleanly into five distinct file operations: SKILL.md (merge command preamble + AGENT.md body), librespin-concept.md (body only, frontmatter already correct), and three template files (direct copy + path substitution).

**Primary recommendation:** Treat this as a structured find/replace pass with a semantic review layer, not a rewrite. Maximize fidelity to hw-concept behavior; the only intentional behavioral changes are namespace paths, deprecated API modernization, and --output DIR removal.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Move hw-concept AGENT.md content into `skills/librespin-concept/SKILL.md` as the skill orchestrator. The flat agent file (`agents/librespin-concept.md`) stays as a lightweight worker reference with frontmatter only. SKILL.md becomes the primary skill content file (~6960 lines after port).
- **D-02:** The hw-concept command file (`commands/hw-concept.md`, 157 lines) merges into SKILL.md as the orchestrator preamble/frontmatter. The commands/ directory pattern is deprecated in Claude Code — skills/ replaces it.
- **D-03:** Mechanical find/replace of all 99+ "hw-concept" references with "librespin-concept" (for identifiers) or "librespin" (for namespace paths), followed by semantic review to catch edge cases (URLs, embedded strings, path references).
- **D-04:** All Tool references changed from "Task" to "Agent" per NSP-04.
- **D-05:** All output paths replaced: `.planning/hw-concept/` → `.librespin/`. State file at `.librespin/state.md` per NSP-03.
- **D-06:** Direct path replacement — no configurable output directory for v1. Hardcoded `.librespin/` keeps it simple.
- **D-07:** Remove `--output DIR` parameter entirely (NSP-05). Dead code removal — add back only if real need emerges. Aligns with project minimalism constraint.
- **D-08:** Config schema must support `draft_count`, `iteration_limit`, `confidence_threshold` per SKL-04. Port these from hw-concept's existing config structure.

### Claude's Discretion

- Exact frontmatter field values for SKILL.md (tools list, argument-hint) — align with what the ported content requires
- How to handle any hw-concept-specific comments or documentation references within AGENT.md — remove or adapt
- Minor formatting/style adjustments during the port

### Deferred Ideas (OUT OF SCOPE)

- OPT-01 (AGENT.md split into agent + reference files) — v2 milestone, after v1 usage reveals actual context pressure points
- Config file location standardization (.librespin/config.yaml vs inline) — decide during Phase 3 validation
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SKL-01 | Orchestrator lives at ~/.claude/skills/librespin/concept.md (skills/ format, not deprecated commands/) | SKILL.md placeholder exists at `.claude/skills/librespin-concept/SKILL.md` — merging command preamble + AGENT.md body achieves this |
| SKL-02 | Worker agent lives at ~/.claude/agents/librespin/AGENT.md with correct frontmatter (name, description, tools, color) | Flat agent at `.claude/agents/librespin-concept.md` — frontmatter already set in Phase 1 placeholder; body needs porting |
| SKL-03 | YAML templates installed to ~/.claude/librespin/templates/ (requirements.yaml, concept-template.md, overview-template.md) | All three placeholder files exist at `.claude/librespin/templates/` — replace with ported content |
| SKL-04 | Config schema supports draft_count, iteration_limit, confidence_threshold | All three config fields confirmed in AGENT.md (lines 6906-6909): draft_count default 5, iteration_limit default 5, confidence_threshold default 80 |
| NSP-01 | Zero occurrences of "hw-concept" remain in installed skill files | 81 occurrences in AGENT.md alone; plus 99+ across command and template files — systematic replacement required |
| NSP-02 | All agent output writes to .librespin/ directory (not .planning/hw-concept/) | 67 path references in AGENT.md to `.planning/hw-concept/` — all become `.librespin/` |
| NSP-03 | State file persists at .librespin/state.md | Two state file references: `.planning/hw-concept-state.md` → `.librespin/state.md` |
| NSP-04 | All Tool references use "Agent" (not deprecated "Task" alias) | Two Task usages: frontmatter `allowed-tools: Task` in command file, and one `await Task({...})` call on line 3482 of AGENT.md |
| NSP-05 | Dead --output DIR parameter either removed or fully wired | --output DIR appears in commands/hw-concept.md frontmatter and Step 1 argument parsing; it is parsed but OUTPUT_DIR is never meaningfully used (agent ignores it, hardcodes paths) — remove entirely per D-07 |
| NSP-06 | /librespin:concept command is accessible in Claude Code after install | Achieved by correct SKILL.md at `.claude/skills/librespin-concept/SKILL.md` with `# /librespin:concept` heading |
</phase_requirements>

---

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| Node.js built-in fs | v24.12.0 | File read/write during execution | Zero dependencies; established Phase 1 pattern |
| Markdown files | — | All skill content | Project architecture: intelligence in prompts, not code |
| YAML frontmatter | — | Skill/agent metadata | Claude Code skill pack convention |

### Supporting
| Library/Tool | Version | Purpose | When to Use |
|--------------|---------|---------|-------------|
| Claude Code skills/ convention | current | Skill orchestrator pattern | Skills replace deprecated commands/ |
| Claude Code agents/ convention | current | Worker agent flat file | agents/name.md flat layout (Phase 1 decision) |
| Agent tool | current | Spawn subagents | Replaces deprecated Task tool |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hardcoded `.librespin/` paths | Configurable --output DIR | --output was dead code in hw-concept (parsed but ignored) — removing it is cleaner |
| SKILL.md as merged file (orchestrator + agent body) | Separate files | D-01 locks this choice; split deferred to OPT-01 in v2 |

**Installation:** No new packages — this phase writes only markdown/YAML files.

---

## Architecture Patterns

### Target File Structure (post-Phase 2)
```
.claude/
├── skills/
│   └── librespin-concept/
│       └── SKILL.md          # Merged: command preamble + full AGENT.md body (~6960 lines)
├── agents/
│   └── librespin-concept.md  # Flat worker reference: frontmatter only + brief body
└── librespin/
    └── templates/
        ├── requirements.yaml         # Ported from hw-concept, path refs updated
        ├── concept-template.md       # Ported from hw-concept (no path refs)
        └── overview-template.md      # Ported from hw-concept (no path refs)
```

### Pattern 1: SKILL.md Structure (merged orchestrator)
**What:** skills/name/SKILL.md begins with YAML frontmatter, then the skill command heading matching `/namespace:command`, then orchestrator logic (argument parsing, state load, agent spawn, result handling), followed by the full agent body content.
**When to use:** All LibreSpin skill orchestrators; replaces hw-concept commands/ directory pattern.
**Example:**
```markdown
---
description: [skill description]
argument-hint: "[args]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Glob
  - Bash
  - WebSearch
---

# /librespin:concept

[orchestrator prose and steps]
```

### Pattern 2: Flat Agent File
**What:** `agents/librespin-concept.md` carries only YAML frontmatter (name, description, tools, color) and a brief purpose statement. The full agent logic lives in SKILL.md, not in the agent file.
**When to use:** Worker agents in LibreSpin skill pack.
**Example (current Phase 1 placeholder — already correct):**
```markdown
---
name: librespin-concept
description: Generate hardware concept designs with BOMs and block diagrams. Supports multi-phase workflow with state persistence.
tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion
color: blue
---

# LibreSpin Concept Generator Agent

[brief purpose — full logic in SKILL.md]
```

### Pattern 3: Path Replacement Map
The complete substitution table for all occurrences:

| Old string | New string | Context |
|------------|------------|---------|
| `hw-concept` (agent name/identifier) | `librespin-concept` | frontmatter name fields, agent references |
| `/hw-concept` (command) | `/librespin:concept` | command heading, user-facing references |
| `hw-concept` (skill/namespace) | `librespin` | namespace references |
| `.planning/hw-concept/` | `.librespin/` | output directory paths |
| `.planning/hw-concept-state.md` | `.librespin/state.md` | state file path |
| `.planning/hw-concept-config.yaml` | `.librespin/config.yaml` | config file path |
| `.claude/hw-concept/templates/` | `.claude/librespin/templates/` | template references |
| `Task` (tool name) | `Agent` | tool references in allowed-tools and await calls |
| `--output DIR` parameter | _(remove entirely)_ | dead parameter |

### Anti-Patterns to Avoid
- **Partial replacement:** Running find/replace on one file type but missing another. All five target files must be processed in one sweep then verified together.
- **Over-editing:** Changing behavior, restructuring workflow phases, or improving content during the port. This is a fidelity port — creative changes go in Phase 3+.
- **Leaving placeholder content:** Phase 1 placeholders (`TODO: Implement in Phase 2`) must all be replaced; no partial TODO stubs remain.
- **Inconsistent path depth:** `.librespin/` vs `.librespin` — pick one. The hw-concept pattern uses the trailing slash consistently in prose and omits it in code string literals.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Namespace rename | Custom scripted automation | Direct manual port with Read/Write tools | Files are markdown, not code — a scripted sed pass misses semantic edge cases and cannot verify intent |
| Claude Code skill registration | Custom manifest | Correct SKILL.md filename and heading | Claude Code auto-discovers skills by path convention; no manifest needed |
| Agent spawning | Custom IPC | Agent tool (replacing Task) | Built-in Claude Code primitive |

**Key insight:** This phase has no algorithmic complexity. The skill content is markdown prose. The port is human-readable transformation work, not a software engineering task.

---

## Runtime State Inventory

This is a rename/refactor phase. The following categories were explicitly checked:

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | None — hw-concept is not yet installed on this machine in production use; this is a fresh port | None |
| Live service config | None — hw-concept is a Claude Code skill pack, no external service config | None |
| OS-registered state | None — no task scheduler, pm2, systemd, or launchd entries for hw-concept | None |
| Secrets/env vars | None — hw-concept uses no secrets or env vars | None |
| Build artifacts | `.venv/` and `dist/` (LibreSpin Python package) — unaffected by skill file rename | None |

**Nothing found in any category** — verified by filesystem and process inspection. The rename is entirely within markdown/YAML source files with no runtime state to migrate.

---

## Common Pitfalls

### Pitfall 1: Incomplete path replacement
**What goes wrong:** `.planning/hw-concept-config.yaml` becomes `.librespin/config.yaml` in most places but one deep reference (e.g., in an error message string or comment) keeps the old path. The workflow runs but config loading fails silently at a specific phase.
**Why it happens:** 81 occurrences across 6960 lines. Grep-level verification is needed, not just editor find/replace.
**How to avoid:** After writing all files, run `grep -r "hw-concept" .claude/` and assert zero results. The Phase 2 success criterion 1 encodes exactly this check.
**Warning signs:** Any remaining `hw-concept` string in post-port grep output.

### Pitfall 2: Task vs Agent inconsistency
**What goes wrong:** The `allowed-tools` frontmatter lists `Agent` but the body still contains `await Task({...})`, or vice versa. Claude Code rejects the spawn.
**Why it happens:** Two separate locations need the same change: the YAML frontmatter tools list, and the JavaScript pseudocode body in AGENT.md line 3482.
**How to avoid:** Grep for `\bTask\b` after port and verify zero matches (excluding the word "Task" in prose contexts like "task" descriptions — check case-sensitively).
**Warning signs:** `grep -n "\bTask\b" .claude/skills/librespin-concept/SKILL.md` returning hits.

### Pitfall 3: --output DIR argument removal leaving broken references
**What goes wrong:** The `--output DIR` argument is removed from the frontmatter argument-hint and the Step 1 argument parsing, but a reference to `OUTPUT_DIR` remains in Step 4 agent spawn parameters. The orchestrator passes an undefined variable.
**Why it happens:** The parameter appears in three places in the command file: frontmatter, parsing pseudocode, and the agent spawn context block.
**How to avoid:** After removing --output, grep for `OUTPUT_DIR` in SKILL.md and verify zero matches.
**Warning signs:** `OUTPUT_DIR` remaining in SKILL.md after the port.

### Pitfall 4: Config file path change breaking state management
**What goes wrong:** Config path changed to `.librespin/config.yaml` but the state management section still references the old path format, or the Phase 1 instructions for config initialization still point to `.planning/hw-concept-config.yaml`.
**Why it happens:** Config path appears in 12+ locations across AGENT.md, often in inline pseudocode strings.
**How to avoid:** Systematic replacement using the path replacement map table above. Verify with: `grep -n "planning.*config\|hw-concept-config" .claude/skills/librespin-concept/SKILL.md`.
**Warning signs:** Any grep hit for `hw-concept-config`.

### Pitfall 5: Template path references not updated inside AGENT.md content
**What goes wrong:** Templates are installed to `.claude/librespin/templates/` but AGENT.md body still tells the agent to load from `.claude/hw-concept/templates/requirements.yaml`. Agent errors on first run with "file not found".
**Why it happens:** Two locations: the explicit template loading comment (line ~6952) and the error message on line ~150 that references the template path as a help string.
**How to avoid:** Include `.claude/hw-concept/templates/` in the path replacement map and verify with grep after port.
**Warning signs:** `grep "hw-concept/templates" .claude/skills/librespin-concept/SKILL.md` returning hits.

---

## Code Examples

### Verification commands (post-port)
```bash
# Success criterion 1 — zero hw-concept strings
grep -r "hw-concept" ~/.claude/skills/librespin-concept/ ~/.claude/agents/librespin-concept.md ~/.claude/librespin/

# Verify no Task references remain (case-sensitive)
grep -n "Task" .claude/skills/librespin-concept/SKILL.md | grep -v "^.*#.*[Tt]ask\|description.*task"

# Verify OUTPUT_DIR removed
grep -n "OUTPUT_DIR" .claude/skills/librespin-concept/SKILL.md

# Verify config path updated
grep -n "hw-concept-config\|planning.*config" .claude/skills/librespin-concept/SKILL.md

# Verify template path updated
grep -n "hw-concept/templates" .claude/skills/librespin-concept/SKILL.md

# Verify command heading
head -20 .claude/skills/librespin-concept/SKILL.md | grep "/librespin:concept"
```

### SKILL.md frontmatter (final form — Claude's Discretion decision)
The Phase 1 placeholder already has the correct frontmatter. It must be preserved exactly:
```yaml
---
description: LibreSpin hardware concept design workflow
argument-hint: "[--input FILE] [--depth quick|medium|thorough]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Glob
  - Bash
  - WebSearch
---
```
`--output DIR` is absent (already removed from Phase 1 placeholder). WebSearch is present (needed by the validation phases in AGENT.md body). Grep is absent from SKILL.md allowed-tools because the orchestrator doesn't use it — but Grep is in the agent's tools list in librespin-concept.md frontmatter.

### Agent file frontmatter (already correct in Phase 1 placeholder)
```yaml
---
name: librespin-concept
description: Generate hardware concept designs with BOMs and block diagrams. Supports multi-phase workflow with state persistence.
tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion
color: blue
---
```

### Config schema (for SKL-04 compliance — appears in AGENT.md integration section)
Config written by Phase 1 (requirements gathering) to `.librespin/config.yaml`:
```yaml
draft_count: 5          # integer 3-10; number of concepts to generate
iteration_limit: 5      # integer; max refinement passes in Phase 6-8
confidence_threshold: 80  # integer 60-95; min score to proceed past validation
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `commands/name.md` skill files | `skills/name/SKILL.md` | Recent Claude Code versions | hw-concept's commands/ directory is deprecated; Phase 1 already used skills/ |
| `Task` tool for subagent spawn | `Agent` tool | Recent Claude Code API | Task still works as alias but Agent is canonical |
| `.planning/` as workflow output | Per-tool subdirectory (`.librespin/`, `.planning/`) | LibreSpin architecture decision | Keeps GSD and LibreSpin outputs separate |

**Deprecated/outdated:**
- `commands/` directory: replaced by `skills/`. The hw-concept `commands/hw-concept.md` file is the pattern being superseded.
- `Task` tool alias: functional but not idiomatic. NSP-04 requires migration to `Agent`.
- `--output DIR` parameter: never actually wired end-to-end in hw-concept — agent hardcoded its output paths regardless of this parameter.

---

## Open Questions

1. **Config file creation — where does .librespin/config.yaml get written?**
   - What we know: In hw-concept, the config was read from `.planning/hw-concept-config.yaml` but the search above did not reveal where it is *created*. The agent validates and reads it but does not appear to write it with defaults in the AGENT.md content reviewed.
   - What's unclear: Is the config written by the orchestrator before spawning the agent, or is it auto-initialized by the agent on first run if absent? The AGENT.md initialization section (line 117-125) describes reading state but does not explicitly show config creation.
   - Recommendation: Read AGENT.md lines ~850-915 more carefully during planning for the config initialization logic. If absent, Phase 2 must add a config initialization step to SKILL.md (the orchestrator). This is low-risk — config creation is a one-liner.

2. **SKL-01 path discrepancy: REQUIREMENTS.md vs CONTEXT.md**
   - What we know: REQUIREMENTS.md SKL-01 says orchestrator lives at `~/.claude/skills/librespin/concept.md`; CONTEXT.md D-01 says `skills/librespin-concept/SKILL.md`. Phase 1 created the file at `skills/librespin-concept/SKILL.md`.
   - What's unclear: Are these two naming conventions in conflict, or is this a requirements artifact from before the flat agent pattern was finalized in Phase 1?
   - Recommendation: CONTEXT.md and Phase 1 artifacts establish the ground truth. Use `skills/librespin-concept/SKILL.md`. REQUIREMENTS.md text is an older description of the same intent. No action needed during planning — the planner should use the CONTEXT.md path.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | bin/install.js | Yes | v24.12.0 | — |
| Python 3 | pyproject.toml | Yes | 3.12.3 | — |
| KiCad | Future phases | Yes | /usr/bin/kicad | — |
| NGSpice | Future phases | Not checked | — | Out of scope for Phase 2 |

**Phase 2 has no external dependencies.** All work is markdown/YAML file editing. Environment availability is a non-issue.

---

## Sources

### Primary (HIGH confidence)
- Direct read of `/home/william/repo/hw-concept/.claude/agents/hw-concept/AGENT.md` (6960 lines) — authoritative source for all content, path references, and API usage
- Direct read of `/home/william/repo/hw-concept/.claude/commands/hw-concept.md` (157 lines) — authoritative orchestrator structure
- Direct read of Phase 1 target files: SKILL.md placeholder, librespin-concept.md, three template placeholders
- Direct read of `.planning/phases/02-namespace-port/02-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` — requirement IDs and descriptions
- `.planning/STATE.md` — accumulated decisions and project state

### Tertiary (LOW confidence)
- None — all findings are from direct file inspection

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed by direct file inspection and Phase 1 artifacts
- Architecture: HIGH — target files exist, source files fully read, all reference counts verified
- Pitfalls: HIGH — identified through direct inspection of the 81 hw-concept occurrence locations

**Research date:** 2026-04-04
**Valid until:** No expiry — source files are local and static; findings remain accurate until hw-concept upstream changes
