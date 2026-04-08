# Phase 6: CalcPad CE Skill - Research

**Researched:** 2026-04-08
**Domain:** Claude Code skill authoring (pure markdown) + CalcPad CE CLI/REST integration
**Confidence:** HIGH — all critical technical questions resolved by Phase 5 spike (live system evidence)

## Summary

Phase 5 produced a GO verdict with concrete evidence: the `Cli` binary (79MB self-contained ELF) executes headless, exits 0, and writes correct HTML output. The REST API (`Calcpad.Server`) is a confirmed fallback at `POST /api/calcpad/convert`. All anomalies (binary name, silent stdout, non-deterministic port) are documented with mitigations.

Phase 6 is a pure skill-authoring phase. No new technical unknowns. The work is: write `skills/calcpad/SKILL.md` + `agents/calcpad.md` following the established concept skill pattern, implement the install-download-prereq-worksheet-CLI-validate-gate-save flow in markdown, and produce the two upstream PR artifacts as `.planning/` files.

The `LibreSpin/CalcpadCE` fork (decision D-03) does not exist yet — creating it and setting up GitHub Actions CI for binary release is a required deliverable of Phase 6, not pre-existing infrastructure.

**Primary recommendation:** Three-wave delivery — (1) fork + CI + binary release in `LibreSpin/CalcpadCE`, (2) skill files (`SKILL.md` + `agents/calcpad.md`), (3) upstream PR artifacts. All three must be complete for Phase 6 to pass its success criteria.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Binary Distribution (CALC-01)**
- D-01: Pre-built self-contained Linux binaries hosted as GitHub Releases in `LibreSpin/CalcpadCE` — a full fork of `imartincei/CalcpadCE`. Skill installs via `curl -L .../releases/latest/download/Cli -o ~/.librespin/bin/Cli`. No build step, no .NET required at user runtime.
- D-02: The AuthSettings patch (CalcpadService.cs fix from spike) is applied permanently in the fork — baked into every published binary.
- D-03: Binary source: `LibreSpin/CalcpadCE` fork, pinned initially to commit `3bc026b70c78a4385bd222c68620374be80f3be0` with the patch applied. GitHub Actions CI builds the self-contained Linux binary and publishes it as a GitHub Release on tag.
- D-04: `LibreSpin/CalcpadCE` serves dual purpose: (1) binary distribution via GitHub Releases, (2) upstream contribution path — PRs to `imartincei/CalcpadCE` submitted from this fork.

**REST Fallback (CALC-08)**
- D-05: REST fallback activates only when the `Cli` binary is not found at startup (prereq check fails). Not a runtime fallback.
- D-06: REST path: `POST /api/calcpad/convert` with `{"Content": "<cpd text>"}`, response is `text/html`. Start server with `--urls http://localhost:{port}` to pin port. Parse `Now listening on:` from server stdout to confirm bound URL.
- D-07: CLI-first is the primary path; REST is explicitly the fallback for environments where the binary can't be installed.

**Circuit Block Selection (CALC-02)**
- D-08: Default: skill reads `.librespin/07-final-output/`, identifies all circuit blocks, presents a menu for user to select which block to calculate this session.
- D-09: `--auto` flag: skips the menu and auto-selects the primary/recommended block. User can set as default for unattended runs.

**Worksheet Generation (CALC-03)**
- D-10: Draft-then-review flow: Claude generates `.cpd` worksheet from design targets and shows the draft inline in chat before running the CLI.
- D-11: User reviews worksheet in-session. Corrections typed in chat — Claude applies and confirms before execution.
- D-12: Human review gate (CALC-06) occurs after results are shown, not before.

**CLI Invocation (CALC-04)**
- D-13: Binary name on Linux: `Cli` (not `Calcpad.Cli`). Installed to `~/.librespin/bin/Cli`.
- D-14: Success detection: exit code 0 AND output file exists. CLI produces no stdout/stderr with `-s` flag.
- D-15: Command: `~/.librespin/bin/Cli input.cpd output.html -s`

**Upstream PR Deliverables**
- D-16: Phase 6 produces PR content (diff + description) as `.planning/` artifacts for two PRs to `imartincei/CalcpadCE`.
- D-17: PRs are NOT auto-submitted — user submits manually when ready.
- D-18: Goodwill contributions. Phase 6 ships independently.

**Output (CALC-07)**
- D-19: Worksheet (`.cpd`) and results (HTML output) saved to `.librespin/08-calculations/`.

### Claude's Discretion

- Exact `.cpd` syntax and formula structure Claude generates per circuit type (voltage divider, buck converter, LDO, etc.)
- How Claude parses the HTML output to extract scalar values for the pass/fail summary
- Specific port number used for REST fallback (anything predictable and unlikely to conflict)

### Deferred Ideas (OUT OF SCOPE)

- Upstream CalcpadCE PRs — produced as artifacts in Phase 6, submitted by user when ready
- Windows/macOS binary packaging — spike was Linux-only; cross-platform deferred
- CalcPad CE version pinning strategy — operational decision, not Phase 6 scope
- Output quality validation with realistic engineering calculations — Phase 6 uses a simple test worksheet; full validation deferred
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CALC-01 | Skill verifies CalcPad CE CLI prerequisites and provides install instructions if absent | D-01/D-03: binary lives at `~/.librespin/bin/Cli`; prereq check = `test -x ~/.librespin/bin/Cli`; install = curl from GitHub Releases |
| CALC-02 | Skill reads concept output from `.librespin/07-final-output/` to extract design targets | D-08/D-09: skill reads output dir, shows block menu, user selects |
| CALC-03 | Skill generates a `.cpd` worksheet for the selected circuit block | D-10/D-11: draft-then-review flow; Claude generates .cpd inline in chat |
| CALC-04 | Skill runs `~/.librespin/bin/Cli input.cpd output.html -s` headless | D-13/D-14/D-15: exact command locked; success = exit 0 AND file exists |
| CALC-05 | Skill validates calculated values against design targets and presents pass/fail summary | Claude's discretion on HTML parsing; present as table with PASS/FAIL per target |
| CALC-06 | User reviews and approves calculations before proceeding (human review gate) | D-12: gate occurs after results shown; AskUserQuestion pattern from concept skill |
| CALC-07 | Skill saves `.cpd` worksheet and results to `.librespin/08-calculations/` | D-19: output dir is `.librespin/08-calculations/` |
| CALC-08 | Skill falls back to `Calcpad.Server` REST API when CLI binary is unavailable | D-05/D-06/D-07: REST path confirmed working; activate only when Cli missing |
</phase_requirements>

---

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| `Cli` binary (CalcpadCE) | Built from commit 3bc026b | Headless `.cpd` → HTML conversion | Confirmed working in spike; self-contained ELF, no runtime deps |
| `Calcpad.Server` binary | Built from commit 3bc026b (patched) | REST API fallback | Confirmed working; `POST /api/calcpad/convert` → HTML |
| GitHub Actions | N/A | CI for building + releasing self-contained binary | Standard for open-source binary distribution |
| `curl` | System | Install Cli binary; REST API fallback requests | Available on all Linux systems |

### Skill File Stack
| File | Purpose |
|------|---------|
| `skills/calcpad/SKILL.md` | Orchestrator — argument parsing, prereq check, phase dispatch |
| `agents/calcpad.md` | Worker agent — spawned by orchestrator, runs worksheet+CLI+validation flow |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `chmod +x` | Make downloaded binary executable | Always after curl download |
| `dotnet publish` (source build fallback) | Build `Cli` from source when pre-built binary unavailable for platform | Only documented in fallback instructions, not executed by skill |

**Installation (user, one-time):**
```bash
mkdir -p ~/.librespin/bin
curl -L https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli \
  -o ~/.librespin/bin/Cli
chmod +x ~/.librespin/bin/Cli
```

## Architecture Patterns

### Skill File Structure (follows concept skill pattern exactly)
```
skills/
  calcpad/
    SKILL.md          # orchestrator — argument parsing, prereq, agent spawn
agents/
  calcpad.md          # worker agent frontmatter + capability description
```

### Skill Orchestrator Pattern (from concept/SKILL.md)
```yaml
---
description: LibreSpin circuit calculation workflow
argument-hint: "[--auto] [--block NAME]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Bash
  - Glob
---
```

The orchestrator (SKILL.md) does argument parsing, prereq checks, state reads, and spawns the worker agent via `Agent` tool. It stays lean — 15–20% of context budget. Heavy workflow lives in the agent.

### Agent Frontmatter Pattern (from agents/concept.md)
```yaml
---
name: calcpad
description: Run AI-assisted circuit calculations using CalcPad CE CLI.
tools: Read, Write, Bash, AskUserQuestion, Glob
color: cyan
---
```

### Workflow Flow (6 stages mapped to requirements)

```
SKILL.md (orchestrator)
  │
  ├─ Step 1: Parse arguments ($ARGUMENTS → --auto, --block)
  ├─ Step 2: Prereq check (test -x ~/.librespin/bin/Cli)
  │    └─ If absent: show install instructions + offer REST fallback
  ├─ Step 3: Read .librespin/07-final-output/ → identify circuit blocks
  ├─ Step 4: Block selection (menu or --auto)
  └─ Step 5: Spawn calcpad agent with context
       │
       agents/calcpad.md (worker)
         ├─ Generate .cpd worksheet from design targets
         ├─ Show draft inline → await user review (AskUserQuestion)
         ├─ Run ~/.librespin/bin/Cli input.cpd output.html -s
         ├─ Check exit code + output file existence
         ├─ Parse HTML for scalar values
         ├─ Present pass/fail table vs. design targets
         ├─ Human gate: AskUserQuestion (approve / request changes)
         └─ On approval: save .cpd + .html to .librespin/08-calculations/
```

### REST Fallback Branch (CALC-08 only — when Cli absent)
```
Prereq check fails
  └─ Skill shows install instructions
  └─ Offers: "Proceed with REST API fallback? [y/N]"
       └─ If yes:
            ├─ Start Calcpad.Server --urls http://localhost:9421
            ├─ Parse "Now listening on:" from server stdout for actual URL
            ├─ POST /api/calcpad/convert {"Content": "<cpd text>"}
            ├─ Write response body to output.html
            └─ Continue with normal validation + gate + save flow
```

### .cpd Worksheet Format

From spike evidence (`/tmp/spike-calcpad/test.cpd`, 84 bytes):
```
"Voltage divider\nV_in = 12\nR1 = 1000\nR2 = 2000\nV_out = V_in*R2/(R1 + R2)
```

Key syntax rules (HIGH confidence — from spike + CALCPAD_VSCODE.md research):
- Quoted strings with `"` are labels/headings rendered as text
- Variable assignments: `Name = expression`
- Comments: `'comment text`  
- Units: appended after value with `|` — e.g., `R1 = 1000|Ω`
- Formulas reference previously-defined variables — sequential evaluation order
- Output file is HTML with evaluated values inlined — no separate result file needed

Claude generates the `.cpd` content per circuit type. The skill must include template formulas for the common EE circuit types a user of the concept skill would encounter: voltage divider, LDO, buck converter, RC filter. Claude's discretion per D-10/D-11.

### HTML Output Parsing for Pass/Fail

The HTML output contains evaluated formula results inlined. Extraction approach (Claude's discretion):
- Search HTML for `<td>` or result rows containing the target variable names
- Strip HTML tags from matched lines
- Compare extracted numeric value against design target (e.g., `3.3 V ±2%`)
- Regex or simple `grep` sufficient — no external HTML parser needed

### GitHub Actions CI Pattern (new — not yet in repo)

Required deliverable: `.github/workflows/build-calcpad-cli.yml` in `LibreSpin/CalcpadCE` fork.

```yaml
name: Build CalcPad CE CLI
on:
  push:
    tags: ['v*']
jobs:
  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '10.0.x'
      - name: Apply AuthSettings patch
        run: # patch already in fork — no action needed
      - name: Build self-contained Cli binary
        run: |
          dotnet publish Calcpad.Cli/Calcpad.Cli.csproj \
            -r linux-x64 \
            --self-contained true \
            -p:PublishSingleFile=true \
            -c Release \
            -o ./dist/
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: ./dist/Cli
```

(Exact YAML is Claude's discretion — pattern is standard and well-established.)

### Upstream PR Artifacts Structure

```
.planning/artifacts/
  pr-001-calcpadservice-authsettings-fix.md    # diff + PR description
  pr-002-linux-build-documentation.md          # diff + PR description
```

These are markdown files the user pastes into GitHub PR form manually.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Binary distribution | Custom binary hosting / S3 | GitHub Releases via `LibreSpin/CalcpadCE` | Standard, free, authenticated, CDN-backed |
| .NET runtime bundling | Custom packaging script | `--self-contained true -p:PublishSingleFile=true` in dotnet publish | dotnet's own mechanism; proven in spike |
| .cpd calculation engine | Any custom calculation logic | CalcPad CE `Cli` binary | That's the whole point — CalcPad is the engine |
| HTML parsing library | Any external parser | grep / regex on HTML text | Output is simple enough; no DOM needed |
| Port management for REST | Custom port allocation | `--urls http://localhost:9421` flag | dotnet Kestrel accepts explicit port; avoids dynamic-port problem |
| State persistence across skill invocations | Custom state system | `.librespin/08-calculations/` file-based | Established pattern; concept skill uses same approach |

## Common Pitfalls

### Pitfall 1: Binary name `Calcpad.Cli` instead of `Cli`
**What goes wrong:** Skill tries to invoke `~/.librespin/bin/Calcpad.Cli` — file not found, silent failure or confusing error.
**Why it happens:** Documentation and GitHub repo name say "Calcpad.Cli" but the Linux ELF assembly name is just `Cli` (dotnet csproj `<AssemblyName>` defaults to project name without namespace).
**How to avoid:** Spike evidence is definitive — always use `Cli`. Hard-code this in SKILL.md with a comment referencing the spike finding.
**Warning signs:** "No such file" errors, prereq check always reporting absent.

### Pitfall 2: Parsing server port as 8080
**What goes wrong:** REST fallback tries `http://localhost:8080` — connection refused. (Spike: actual port was 9420.)
**Why it happens:** 8080 is the documented default; actual Kestrel behavior differs.
**How to avoid:** Always start server with `--urls http://localhost:9421` (or another explicit port). Never read/hardcode 8080.
**Warning signs:** REST path always returns connection refused despite server running.

### Pitfall 3: Treating CLI stdout as output
**What goes wrong:** Skill waits for stdout content, reads 0 bytes, reports failure.
**Why it happens:** `-s` flag silences all output. Zero bytes stdout is success, not failure.
**How to avoid:** Success detection = `$? -eq 0 && test -f output.html`. Do not attempt stdout parsing.

### Pitfall 4: AskUserQuestion stalls in background agent
**What goes wrong:** Agent spawned with `run_in_background=true` — AskUserQuestion never surfaces to user, skill burns ~100k tokens and times out.
**Why it happens:** Background agents cannot present interactive prompts.
**How to avoid:** Always spawn calcpad agent with `run_in_background=false`. This is established in MEMORY.md and the concept skill pattern.
**Warning signs:** Agent completes without user interaction in a phase that requires worksheet review.

### Pitfall 5: Worksheet `.cpd` format errors
**What goes wrong:** CLI exits non-zero; output file not produced. No diagnostic output (silent with `-s`).
**Why it happens:** CalcPad CE formula syntax errors cause CLI to fail silently.
**How to avoid:** Show worksheet draft to user before execution (D-10). If CLI fails (exit != 0 or no output file), re-show worksheet and ask user to correct it. Do not retry silently.
**Warning signs:** Exit code non-zero + no output.html.

### Pitfall 6: `LibreSpin/CalcpadCE` fork doesn't exist yet
**What goes wrong:** Planner writes tasks assuming the fork and GitHub Releases are already set up.
**Why it happens:** D-01/D-03 describe the target state, not the current state.
**How to avoid:** Wave 0 of the plan must include: fork creation, AuthSettings patch commit, GitHub Actions workflow, and tag/release to generate the first binary. The skill cannot install the binary until the release exists.

## Code Examples

### Prereq Check (in SKILL.md bash block)
```bash
# Source: spike finding — binary name is 'Cli', not 'Calcpad.Cli'
if test -x "$HOME/.librespin/bin/Cli"; then
  echo "CalcPad CE CLI found — proceeding"
else
  echo "CalcPad CE CLI not found at ~/.librespin/bin/Cli"
  echo "Install:"
  echo "  mkdir -p ~/.librespin/bin"
  echo "  curl -L https://github.com/LibreSpin/CalcpadCE/releases/latest/download/Cli \\"
  echo "    -o ~/.librespin/bin/Cli"
  echo "  chmod +x ~/.librespin/bin/Cli"
fi
```

### CLI Invocation (in agent workflow)
```bash
# Source: spike evidence — D-15
"$HOME/.librespin/bin/Cli" input.cpd output.html -s
EXIT=$?
if [ $EXIT -eq 0 ] && [ -f output.html ]; then
  echo "SUCCESS — output.html produced"
else
  echo "FAILED — exit $EXIT, output file exists: $(test -f output.html && echo yes || echo no)"
fi
```

### REST API Call (CALC-08 fallback, D-06)
```bash
# Source: spike evidence
# Start server with explicit port to avoid dynamic assignment
"$HOME/.librespin/bin/Calcpad.Server" --urls http://localhost:9421 &
SERVER_PID=$!
sleep 1   # wait for Kestrel startup (spike: < 1s actual)

# Send worksheet content
curl -s -X POST http://localhost:9421/api/calcpad/convert \
  -H "Content-Type: application/json" \
  -d "{\"Content\": \"$(cat input.cpd | sed 's/"/\\"/g')\"}" \
  -o output.html

kill $SERVER_PID
```

### Minimal .cpd Worksheet (voltage divider — spike pattern)
```
"Voltage divider calculation
V_in = 3.3
R1 = 10000
R2 = 3300
V_out = V_in * R2 / (R1 + R2)
```

### Agent Frontmatter (agents/calcpad.md)
```yaml
---
name: calcpad
description: Run AI-assisted circuit calculations using CalcPad CE CLI. Handles worksheet generation, CLI execution, pass/fail validation, and human review gate.
tools: Read, Write, Bash, AskUserQuestion, Glob
color: cyan
---
```

## State of the Art

| Old Assumption | Confirmed Reality | Impact |
|----------------|-------------------|--------|
| Binary named `Calcpad.Cli` | Binary named `Cli` on Linux | Hard-code `Cli` in all skill invocations |
| Server default port 8080 | Observed 9420 in spike | Use `--urls` flag; never hardcode 8080 |
| CLI produces log output | Zero bytes stdout with `-s` | Success detection = exit code + file existence |
| .NET required at runtime | Self-contained binary includes runtime | No dotnet needed after install |
| Pre-built .deb available | Must build from source OR download from LibreSpin/CalcpadCE releases | Phase 6 must create the GitHub Release before skill can install |
| CalcpadService.cs compiles clean | CS1061/CS0234 build error — AuthSettings removed from MacroParser | Patch applied in fork; baked into released binary |

## Open Questions

1. **`.librespin/07-final-output/` file format**
   - What we know: Concept skill writes output here; Phase 6 reads from it.
   - What's unclear: Exact filenames, schema, and which fields contain "design targets" and "circuit blocks." The concept skill SKILL.md (239KB) defines this output contract but was too large to read in full.
   - Recommendation: Planner should add a task to read the concept skill output section (last ~100 lines of SKILL.md, the "Phase 9" output) and document the field names. Alternatively, the agent should do a Glob on `.librespin/07-final-output/` at runtime and present whatever it finds to the user.

2. **`LibreSpin/CalcpadCE` fork creation — GitHub org access**
   - What we know: Fork must exist and have a GitHub Release before the skill can install the binary (D-01/D-03).
   - What's unclear: Whether the `LibreSpin` GitHub org exists and whether the user has org-level permissions to create a fork under it.
   - Recommendation: Plan Wave 0 task to verify org access. If org doesn't exist, the fork goes under `WilliamxLeismer` initially and URL in the skill is updated accordingly.

3. **GitHub Actions `.github/workflows/` syntax for dotnet 10**
   - What we know: `actions/setup-dotnet@v4` supports `dotnet-version: '10.0.x'`.
   - What's unclear: Whether .NET 10 is available on `ubuntu-latest` (2024 runner) or requires a newer runner.
   - Recommendation: Use `ubuntu-22.04` or `ubuntu-latest` — .NET 10 via `actions/setup-dotnet@v4` installs from Microsoft feed, not OS packages. This is standard and should work.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `curl` | Binary install, REST fallback | Yes (Linux standard) | — | wget |
| `chmod` | Post-download | Yes (POSIX) | — | — |
| GitHub.com access | Downloading Cli binary | Assumed yes | — | Source build |
| `LibreSpin/CalcpadCE` fork | D-01: binary release URL | Does not exist yet | — | `WilliamxLeismer/CalcpadCE` initially |
| GitHub Actions runner | CI binary build | Yes (via GitHub) | ubuntu-latest | — |
| `dotnet` SDK 10 | CI build only (not user runtime) | Available via setup-dotnet@v4 | 10.0.x | — |

**Missing dependencies with no fallback:**
- `LibreSpin/CalcpadCE` fork + GitHub Release: Must be created in Phase 6 Wave 0 before the install curl command in the skill has a valid URL. Skill SKILL.md cannot reference a release URL that doesn't exist.

**Missing dependencies with fallback:**
- GitHub.com: If unavailable, user can build from source using the spike's `dotnet publish` command (documented in CALC-01 fallback instructions).

## Validation Architecture

> nyquist_validation not explicitly disabled — including section.

Phase 6 is a pure markdown skill-authoring phase. There is no automated test suite for skill prompt quality. Validation is functional — does the skill work end-to-end on a real `.cpd` worksheet?

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual functional test (no pytest/jest applicable) |
| Config file | None |
| Quick run | `/librespin:calcpad` in Claude Code against a test `.librespin/07-final-output/` fixture |
| Full suite | End-to-end run: prereq check → worksheet generation → CLI execution → pass/fail → save |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CALC-01 | Prereq check detects absent Cli binary and shows install instructions | manual | Remove `~/.librespin/bin/Cli`, invoke skill | ❌ Wave 0 |
| CALC-01 | Prereq check passes when Cli binary present | manual | Install binary, invoke skill | ❌ Wave 0 |
| CALC-02 | Reads `.librespin/07-final-output/`, presents block menu | manual | Create fixture output dir, invoke skill | ❌ Wave 0 |
| CALC-03 | Generates syntactically valid `.cpd` for voltage divider | manual | Review generated worksheet; CLI exits 0 | ❌ Wave 0 |
| CALC-04 | CLI invoked correctly; output.html produced | manual | Check `.librespin/08-calculations/` | ❌ Wave 0 |
| CALC-05 | Pass/fail table shown with correct values | manual | Review output vs. known design targets | ❌ Wave 0 |
| CALC-06 | Human gate fires before saving | manual | Verify AskUserQuestion appears | ❌ Wave 0 |
| CALC-07 | `.cpd` and `.html` saved to `.librespin/08-calculations/` | manual | `ls .librespin/08-calculations/` | ❌ Wave 0 |
| CALC-08 | REST fallback invoked when Cli absent | manual | Remove binary, select REST path | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] Test fixture: `.librespin/07-final-output/` with a minimal concept output (voltage divider circuit block)
- [ ] Verified Cli binary at `~/.librespin/bin/Cli` (install before skill testing)
- [ ] `LibreSpin/CalcpadCE` GitHub Release must exist before CALC-01 install path is testable

*(No automated test infrastructure needed — this is a markdown skill, not a Python/JS codebase.)*

## Sources

### Primary (HIGH confidence)
- `.planning/spike-calcpad.md` — Phase 5 live execution evidence: binary name, invocation, exit codes, REST API, all anomalies
- `skills/concept/SKILL.md` (lines 1–120) — Orchestrator pattern for SKILL.md structure and agent spawning
- `agents/concept.md` — Agent frontmatter pattern
- `.planning/phases/06-calcpad-ce-skill/06-CONTEXT.md` — All locked decisions (D-01 through D-19)

### Secondary (MEDIUM confidence)
- `.planning/research/CALCPAD_VSCODE.md` — Pre-spike research on CalcPad CE REST API schema and `.cpd` format
- `actions/setup-dotnet@v4` GitHub Actions — standard dotnet CI action, well-documented

### Tertiary (LOW confidence — not validated in spike)
- `.cpd` formula syntax for complex circuit types (buck converter, LDO) — spike only tested voltage divider; other circuit types assumed similar but not confirmed
- GitHub Actions `ubuntu-latest` + .NET 10 compatibility — standard setup, not explicitly tested

## Metadata

**Confidence breakdown:**
- CLI integration (binary name, invocation, success detection): HIGH — spike evidence
- REST fallback path: HIGH — spike evidence (HTTP 200, correct output)
- Skill file structure/pattern: HIGH — concept skill is the template
- `.cpd` worksheet syntax: MEDIUM — spike shows basics; complex circuit syntax not tested
- GitHub Actions CI workflow: MEDIUM — standard dotnet pattern, not executed in repo yet
- HTML output parsing for pass/fail: LOW — Claude's discretion; no tested pattern

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable domain — CalcPad CE CLI API unlikely to change)
