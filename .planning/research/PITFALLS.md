# Pitfalls Research

**Domain:** Claude Code skill pack — namespace port of an existing agent system
**Researched:** 2026-04-04
**Confidence:** HIGH (official Claude Code docs verified, source code directly inspected)

---

## Critical Pitfalls

### Pitfall 1: Namespace String Sprawl — 67 Hardcoded Paths Need Updating

**What goes wrong:**
The AGENT.md contains 67 occurrences of `hw-concept` embedded in file paths, directory names, state file names, config file names, and template references. A naive port that renames the command and agent file but misses interior strings will silently break. The agent will write state to `.planning/hw-concept-state.md` and read config from `.planning/hw-concept-config.yaml` while the command looks for `.planning/librespin-state.md` — leaving orphaned files and confusing resume logic.

**Why it happens:**
The source was built for a single namespace and never needed abstraction. Path strings appear inside JavaScript pseudocode blocks, markdown prose sections, YAML examples, and console.log output strings — not just in one configuration section. A text search-and-replace will catch most but miss the ones embedded in code comments and error messages.

**How to avoid:**
Before touching any content, produce an exhaustive inventory: `grep -n "hw-concept" AGENT.md` (81 matches) and `grep -n "\.planning/hw-concept" AGENT.md` (67 matches). Map every occurrence to one of four categories: (1) path literals that must change to `.librespin/`, (2) namespace identifiers that must change to `librespin`, (3) command references (`/hw-concept`) that must change to `/librespin`, (4) package/installer references that must change in `package.json` and `install.js`. Make a substitution plan before making any edit. Verify count drops to zero after substitution.

**Warning signs:**
- Running `/librespin` produces output mentioning `hw-concept` in any path or message
- `.planning/hw-concept-state.md` appears in the project after first run (wrong namespace)
- Resume logic fails because state file has wrong name

**Phase to address:** Phase 1 (port) — must be complete before any testing. Block all QA on this check.

---

### Pitfall 2: OUTPUT_DIR Parameter Is a Dead Parameter

**What goes wrong:**
The command file declares `--output DIR` (default `./concepts/`) and passes it to the agent as `OUTPUT_DIR`. The agent receives this parameter but ignores it entirely — all 9 phases write exclusively to hardcoded `.planning/hw-concept/0N-*/` paths. If LibreSpin's goal is to write outputs to `.librespin/` instead of `.planning/`, the parameter rename alone is insufficient. The output paths are hardcoded in ~30 locations inside AGENT.md and must be changed explicitly.

**Why it happens:**
The parameter was likely planned for a future "configurable output" feature but the agent was implemented with hardcoded paths for predictability. The command documentation implies the parameter works; the agent implementation does not honor it.

**How to avoid:**
When porting, treat OUTPUT_DIR as vestigial. Decide upfront: does LibreSpin write to `.librespin/hw-concept/` (preserving hw-concept subdirectory structure) or to `.librespin/concept/`? Then grep all 30 path literals in AGENT.md and replace systematically. Either remove the `--output` argument or wire it up properly to all write calls.

**Warning signs:**
- User passes `--output ./my-project/` and outputs still appear in `.librespin/`
- Docs and command `argument-hint` describe a parameter that has no effect

**Phase to address:** Phase 1 (port) — decide on output directory structure before porting, then apply consistently.

---

### Pitfall 3: Agent Name in `subagent_type` Must Match YAML `name` Field Exactly

**What goes wrong:**
The command file invokes the agent with `subagent_type="hw-concept"`. Claude Code resolves this by finding the agent file whose YAML frontmatter `name:` field equals `hw-concept`. If the AGENT.md is renamed to `librespin-concept.md` but the `name:` field inside it still reads `hw-concept`, or vice versa, the spawn silently fails or routes to an unexpected agent.

**Why it happens:**
The file path and the `name:` field are independent. Renaming the file does not rename the agent identity. The Task tool (now called Agent tool as of Claude Code v2.1.63) resolves by name, not filename.

**How to avoid:**
The YAML frontmatter `name:` field is the canonical identity. Change it to `librespin-concept` (or whichever identifier is chosen). Then update every `subagent_type=` reference in the command file to match. Verify with `/agents` command — the agent should appear under the new name.

**Warning signs:**
- `/librespin` runs without error but no files are created (agent spawn silently fails)
- Claude Code spawns the wrong agent (e.g., a `general-purpose` fallback)
- `claude agents` CLI output shows `hw-concept` still listed after port

**Phase to address:** Phase 1 (port) — verify with `claude agents` after first install.

---

### Pitfall 4: `Task` Tool Renamed to `Agent` Tool — `subagent_type` Parameter Still Works but May Not Forever

**What goes wrong:**
hw-concept uses `Task tool with subagent_type="hw-concept"` throughout. Per the official Claude Code docs (verified April 2026): "In version 2.1.63, the Task tool was renamed to Agent. Existing `Task(...)` references in settings and agent definitions still work as aliases." The alias is currently active but is an undocumented compatibility shim. A new skill pack built today should use Agent tool nomenclature to avoid a future breaking change.

**Why it happens:**
hw-concept was written before v2.1.63. The compatibility alias means it still works, but documentation for `Task` is being phased out.

**How to avoid:**
When porting, update all command file references from "Use Task tool with subagent_type=" to "Use Agent tool with agent_type=" to use current nomenclature. This is a low-risk cosmetic change that avoids future confusion and aligns with current docs.

**Warning signs:**
- Future Claude Code update breaks subagent invocation
- Developers reading the code are confused by outdated tool names

**Phase to address:** Phase 1 (port) — update during initial namespace pass.

---

### Pitfall 5: 6,960-Line AGENT.md Will Consume Agent Context Window at Startup

**What goes wrong:**
AGENT.md is the subagent system prompt. At 232 KB (6,960 lines, ~58,000 tokens estimated), it occupies a large portion of the agent's context window before it has processed a single user message. The docs note that subagents receive only their system prompt plus basic environment details — no conversation history. This means the agent starts with most of its context already consumed by instructions. Complex phases that require extensive output may hit context limits mid-workflow.

**Why it happens:**
hw-concept grew organically phase by phase. Each phase added disambiguation tables, JavaScript pseudocode, scoring algorithms, and domain databases. There was no budget discipline because it "works" — but context pressure manifests as subtle degradation: truncated outputs, missed instructions from early sections, or hard failures on long runs.

**How to avoid:**
The official Claude Code docs recommend keeping SKILL.md under 500 lines. For subagents, no hard limit is stated but the principle applies: "Large reference docs, API specifications, or example collections don't need to load into context every time the skill runs." Split the monolithic AGENT.md into: (a) a core AGENT.md under 1,000 lines covering phase routing logic, state management, and disambiguation protocol, and (b) per-phase reference files (`phase-01-requirements.md`, `phase-02-concepts.md`, etc.) loaded via Read tool only when that phase executes. This is the "supporting files" pattern described in Claude Code skills documentation.

**Warning signs:**
- Late phases (5-9) produce shorter or incomplete outputs than early phases
- Agent skips sections of instructions in complex runs
- Token usage metrics show >80% context utilization at phase start

**Phase to address:** Phase 1 for immediate port (accept current size). Phase 2 or a dedicated refactor milestone for context optimization.

---

### Pitfall 6: `commands/` Directory Is Being Superseded by `skills/` — Install Target Is Wrong

**What goes wrong:**
hw-concept installs `hw-concept.md` to `~/.claude/commands/hw-concept.md`. The current Claude Code documentation states: "Custom commands have been merged into skills. A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy` and work the same way. Your existing `.claude/commands/` files keep working. Skills add optional features." The `commands/` path still functions as a compatibility layer, but the canonical install target for new skill packs is `~/.claude/skills/<name>/SKILL.md`. Building LibreSpin on `commands/` means using a deprecated install target that may eventually stop working and misses skill-specific features (`context: fork`, `agent:` field, `disable-model-invocation`, supporting files directory).

**Why it happens:**
hw-concept predates the skills system (October 2025). It was correct at build time.

**How to avoid:**
Port the command file as `~/.claude/skills/librespin-concept/SKILL.md` with a `SKILL.md` entrypoint. Update `install.js` to create `skills/librespin-concept/` instead of `commands/`. This is a one-line path change in the installer but enables the full modern skill feature set and follows the current recommended pattern. The supporting files directory (templates, phase reference files) can live alongside `SKILL.md` in the skill directory.

**Warning signs:**
- Future Claude Code version stops loading `commands/` files
- Skill-specific frontmatter fields (`context: fork`, `agent:`) have no effect when used in `commands/` files
- `/agents` command shows hw-concept agent but `/librespin` doesn't appear in skill listing

**Phase to address:** Phase 1 (port) — use `skills/` from day one. Do not start on `commands/` and migrate later.

---

### Pitfall 7: JavaScript Pseudocode Blocks May Confuse Claude (They Are Not Executed)

**What goes wrong:**
AGENT.md contains 118 `javascript` code blocks with `const yaml = require('js-yaml')`, `fs.writeFileSync()`, `yaml.dump()`, and similar Node.js patterns. These are not executed — they are pseudocode instructions for Claude to interpret and implement using its Write/Read tools. However, if the surrounding prose is ambiguous, Claude may attempt to run them as Bash scripts, or may attempt to interpret them literally and fail when `require` is undefined in its context.

**Why it happens:**
The agent was designed to give Claude precise, unambiguous instructions about what to write and where — using JavaScript syntax as a precise notation language. This worked in the original but relies on the surrounding instruction prose being clear that "this is what you should output" not "this is code you should execute."

**How to avoid:**
When porting, audit all code blocks for clear prose framing. Each JavaScript block should be preceded by an explicit instruction like "Write the following content to [path]:" or "The state file format is:". Remove or rewrite any code block that could be misread as an executable script. Consider converting `fs.writeFileSync()` patterns to explicit "Write tool call" instructions for clarity.

**Warning signs:**
- Agent attempts to run `node -e "require('js-yaml')"` via Bash
- Agent writes raw JavaScript code into output files instead of YAML/markdown
- Agent errors with "js-yaml module not found"

**Phase to address:** Phase 1 (port) — audit during rename pass. Phase 2 (refactor) — systematic rewrite to explicit tool instructions.

---

### Pitfall 8: State File Conflict With GSD If Both Tools Used in Same Project

**What goes wrong:**
hw-concept writes state to `.planning/hw-concept-state.md` and config to `.planning/hw-concept-config.yaml`. GSD writes its project state to `.planning/STATE.md` and config to `.planning/config.json`. LibreSpin targets `.librespin/` to avoid this conflict, but if the port accidentally leaves any write target in `.planning/`, a project using both LibreSpin and GSD will have `.planning/` owned by two tools. GSD commands that scan `.planning/` may pick up LibreSpin state files and error or produce confusing output.

**Why it happens:**
The target output directory change (`.planning/hw-concept/` to `.librespin/`) must be complete across all 30+ path literals. Missing even one creates a foothold for cross-tool contamination.

**How to avoid:**
After completing the namespace substitution, run `grep -rn "\.planning/" .claude/` on the installed skill pack. Any remaining `.planning/` reference (outside of documentation examples) is a bug. The only acceptable `.planning/` references are in prose that says "LibreSpin uses `.librespin/` not `.planning/`".

**Warning signs:**
- Files appear in `.planning/` after running `/librespin` on a GSD project
- GSD commands fail with unexpected YAML parse errors (reading a LibreSpin state file)
- User confusion about which tool created which files in `.planning/`

**Phase to address:** Phase 1 (port) — final verification step before any QA.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Keep AGENT.md as single 6,960-line file | No refactoring needed for v1 | Context pressure degrades late phases; maintenance burden grows | Acceptable for v1 port; plan refactor in v2 |
| Use `commands/` install target instead of `skills/` | Fewer installer changes | Deprecated path; misses skill features; eventual breaking change | Never for new builds; only if you need to ship in < 1 day |
| Leave JavaScript pseudocode blocks as-is | No content rewrite | Occasional Claude misinterpretation of code vs instructions | Acceptable for v1 if framing prose is clear; rewrite in v2 |
| Keep `--output` as dead parameter | Familiar API from hw-concept | Misleads users; documentation says it works but it doesn't | Never — either wire it up or remove it |
| Copy `Task`/`subagent_type` terminology unchanged | No terminology audit needed | Deprecated alias; confuses developers reading current docs | Not recommended; 10-minute fix during port |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npx installer | Installing to `~/.claude/commands/` | Install to `~/.claude/skills/librespin-concept/` per current Claude Code conventions |
| npx installer | Not creating `~/.claude/skills/` directory if it doesn't exist | `mkdir -p` the full skills path; check existence before `cp` |
| npx installer | Hardcoding `hw-concept` in console output messages | Update all user-visible strings: "Installing hw-concept to..." → "Installing LibreSpin to..." |
| Agent spawn | Using `subagent_type="hw-concept"` | Use `subagent_type="librespin-concept"` matching the YAML `name:` field |
| State resume | Checking `.planning/hw-concept-state.md` | Check `.librespin/state.md` (or equivalent LibreSpin path) |
| YAML templates | Template references like `.claude/hw-concept/templates/` | Update to `.claude/librespin/templates/` or skill-relative `${CLAUDE_SKILL_DIR}/templates/` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Single monolithic AGENT.md loaded at every phase start | Late phases produce truncated outputs; agent misses early-section instructions | Split into core + per-phase reference files; load via Read tool per phase | Approximately phase 5+ with thorough depth; complex requirements YAML |
| js-yaml loaded as npm dependency in installer but not in agent | Installer works; agent's JavaScript blocks are pseudocode that don't actually run `require()` | Accept the pattern; ensure prose makes clear these are instructions not execution | Never (not a runtime issue) — but confuses contributors |
| All 9 phases in a single agent spawn | Context accumulates across phases; phase 9 has very little working memory | Orchestrator spawns one agent per phase (hw-concept already does this) | Any run with medium or thorough depth |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| YAML loaded without FAILSAFE_SCHEMA | Arbitrary type coercion; potential code execution via crafted requirements.yaml (CVE-2022-1471 pattern) | hw-concept already uses `FAILSAFE_SCHEMA` — preserve this in the port; do not simplify YAML loading |
| Installer copies files with `force: true` to ~/.claude/ | Overwrites user's custom agents/commands silently | Consider adding a backup step or `--dry-run` flag; at minimum warn when overwriting existing files |
| requirements.yaml accepts arbitrary file paths via `--input` | Path traversal if validation is weak | hw-concept validates file existence; preserve the existence check in the ported command |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Command still shows `hw-concept` branding in output messages | User confusion about which tool they're running | Audit all `console.log` strings in install.js and all user-facing text in SKILL.md |
| Restart required after install but not communicated | `/librespin` command not available after npx install; user thinks install failed | hw-concept already says "Restart Claude Code to activate"; preserve and make prominent |
| Resume logic checks for `hw-concept-state.md` instead of `.librespin/state.md` | Second invocation starts a new project instead of resuming | State path check is the first thing the command does; test resume explicitly in QA |
| OUTPUT_DIR parameter documented but non-functional | User specifies `--output ./my-designs/` and concepts appear in `.librespin/` | Either remove the flag or implement it; document the actual output location prominently |

---

## "Looks Done But Isn't" Checklist

- [ ] **Namespace rename:** `grep -rn "hw-concept" ~/.claude/skills/librespin-concept/` returns zero results — verify every string was replaced, including in error messages and console output
- [ ] **State path:** Running `/librespin` then checking for `.librespin/` files (not `.planning/hw-concept/` files) — verify output lands in correct directory
- [ ] **Agent spawn:** Running `claude agents` shows `librespin-concept` agent, not `hw-concept`
- [ ] **Resume logic:** Second invocation of `/librespin` resumes from correct phase, not restarts
- [ ] **Install target:** `ls ~/.claude/skills/librespin-concept/SKILL.md` exists (not in `commands/`)
- [ ] **Template paths:** Requirements template loads correctly from new skill directory path
- [ ] **YAML safety:** `FAILSAFE_SCHEMA` preserved in all YAML loading instructions
- [ ] **Dead parameter removed or wired up:** `--output` either works or is absent from `argument-hint`

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missed namespace strings left hw-concept paths | LOW | `grep -rn "hw-concept" .claude/` to find remaining instances; surgical replacement |
| State files in wrong directory (.planning/ vs .librespin/) | LOW | Delete wrong-path state files; re-run from phase 1 (state is regenerated) |
| Agent not found on spawn (name mismatch) | LOW | Check `name:` field in AGENT.md frontmatter; update `subagent_type` in SKILL.md to match |
| AGENT.md context overflow causing truncated phase output | MEDIUM | Split AGENT.md into per-phase files; requires content restructure of 6,960 lines |
| Installed to `commands/` instead of `skills/` | LOW | Re-run installer with updated install.js targeting `skills/` path; no content changes needed |
| OUTPUT_DIR mismatch confusing users | LOW | Remove parameter from `argument-hint` and document actual output path clearly |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Namespace string sprawl (67 paths) | Phase 1 (port) | `grep -rn "hw-concept"` returns 0 results in installed skill |
| Dead OUTPUT_DIR parameter | Phase 1 (port) | Remove from `argument-hint` or wire to all write calls; user test with explicit `--output` |
| Agent name / subagent_type mismatch | Phase 1 (port) | `claude agents` shows `librespin-concept`; `/librespin` spawns correct agent |
| Task vs Agent tool terminology | Phase 1 (port) | Code review: no `Task tool` references in SKILL.md |
| AGENT.md context pressure | Phase 1 accept; Phase 2 fix | Run all 9 phases with thorough depth on complex requirements; check Phase 7+ output completeness |
| commands/ vs skills/ install target | Phase 1 (port) | `ls ~/.claude/skills/librespin-concept/SKILL.md` succeeds |
| JavaScript pseudocode ambiguity | Phase 1 audit; Phase 2 rewrite | Agent does not attempt to run bash scripts during requirements phase |
| .planning/ vs .librespin/ state conflict | Phase 1 (port) | `grep -rn "\.planning/"` in skill files returns 0 results outside documentation prose |

---

## Sources

- Official Claude Code skills documentation: https://code.claude.com/docs/en/skills (verified April 2026)
- Official Claude Code subagents documentation: https://code.claude.com/docs/en/sub-agents (verified April 2026)
- hw-concept source: `/home/william/repo/hw-concept/.claude/agents/hw-concept/AGENT.md` (6,960 lines, 232 KB, directly inspected)
- hw-concept installer: `/home/william/repo/hw-concept/bin/install.js` (directly inspected)
- hw-concept command: `/home/william/repo/hw-concept/.claude/commands/hw-concept.md` (directly inspected)
- Claude Code docs: Task tool renamed to Agent tool in v2.1.63 (aliases still work)
- Claude Code docs: Skill description budget truncated at 250 characters per entry
- Claude Code docs: "Keep SKILL.md under 500 lines. Move detailed reference material to separate files."

---
*Pitfalls research for: Claude Code skill pack — porting hw-concept agent to LibreSpin namespace*
*Researched: 2026-04-04*
