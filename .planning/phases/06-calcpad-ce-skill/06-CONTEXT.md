# Phase 6: CalcPad CE Skill - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver `/librespin:calcpad` — a Claude Code skill that guides AI-assisted circuit calculations using CalcPad CE CLI, from design target extraction through human-approved results saved to `.librespin/08-calculations/`.

Skill structure follows the established pattern: `skills/calcpad/SKILL.md` + `agents/calcpad.md`. Pure markdown — no Python, no runtime code.

</domain>

<decisions>
## Implementation Decisions

### Binary Distribution (CALC-01)
- **D-01:** Pre-built self-contained Linux binaries hosted as GitHub Releases in `LibreSpin/CalcpadCE` — a full fork of `imartincei/CalcpadCE`. Skill installs via `curl -L .../releases/latest/download/Cli -o ~/.librespin/bin/Cli`. No build step, no .NET required at user runtime.
- **D-02:** The AuthSettings patch (CalcpadService.cs fix from spike) is applied permanently in the fork — baked into every published binary. Users get a clean binary download.
- **D-03:** Binary source: `LibreSpin/CalcpadCE` fork, pinned initially to commit `3bc026b70c78a4385bd222c68620374be80f3be0` with the patch applied. GitHub Actions CI builds the self-contained Linux binary and publishes it as a GitHub Release on tag.
- **D-04:** `LibreSpin/CalcpadCE` serves dual purpose: (1) binary distribution via GitHub Releases, (2) upstream contribution path — PRs to `imartincei/CalcpadCE` are submitted from this fork. No personal fork needed.

### REST Fallback (CALC-08)
- **D-05:** REST fallback activates only when the `Cli` binary is not found at startup (prereq check fails). Not a runtime fallback.
- **D-06:** REST path: `POST /api/calcpad/convert` with `{"Content": "<cpd text>"}`, response is `text/html`. Start server with `--urls http://localhost:{port}` to pin port. Parse `Now listening on:` from server stdout to confirm bound URL.
- **D-07:** CLI-first is the primary path; REST is explicitly the fallback for environments where the binary can't be installed.

### Circuit Block Selection (CALC-02)
- **D-08:** Default: skill reads `.librespin/07-final-output/`, identifies all circuit blocks, and presents a menu for the user to select which block to calculate this session.
- **D-09:** `--auto` flag: skips the menu and auto-selects the primary/recommended block from the concept output. User can set this as their default for unattended runs.

### Worksheet Generation (CALC-03)
- **D-10:** Draft-then-review flow: Claude generates the `.cpd` worksheet from design targets extracted from `.librespin/07-final-output/` and shows the draft inline in chat before running the CLI.
- **D-11:** User reviews the worksheet in-session. If corrections are needed, user types them directly in chat — Claude applies changes to the `.cpd` content and confirms before execution.
- **D-12:** After user approval, Claude runs the CLI and presents results. Human review gate (CALC-06) occurs after results are shown — not before.

### CLI Invocation (CALC-04)
- **D-13:** Binary name on Linux: `Cli` (not `Calcpad.Cli`). Installed to `~/.librespin/bin/Cli`.
- **D-14:** Success detection: exit code 0 AND output file exists. CLI produces no stdout/stderr with `-s` flag — do not attempt stdout parsing.
- **D-15:** Command: `~/.librespin/bin/Cli input.cpd output.html -s`

### Upstream PR Deliverables
- **D-16:** Phase 6 produces PR content (diff + description) as `.planning/` artifacts for two PRs to submit from `LibreSpin/CalcpadCE` → `imartincei/CalcpadCE`:
  1. CalcpadService.cs AuthSettings fix (build-breaking for source builds)
  2. Linux build documentation (binary naming, port anomaly, dotnet-install.sh path)
- **D-17:** PRs are NOT auto-submitted — user submits manually when ready. Phase 6 completion does not depend on upstream acceptance.
- **D-18:** These are goodwill contributions. Phase 6 ships independently — binaries in `LibreSpin/CalcpadCE` releases already have the patch applied.

### Output (CALC-07)
- **D-19:** Worksheet (`.cpd`) and results (HTML output) saved to `.librespin/08-calculations/`.

### Claude's Discretion
- Exact `.cpd` syntax and formula structure Claude generates per circuit type (voltage divider, buck converter, LDO, etc.)
- How Claude parses the HTML output to extract scalar values for the pass/fail summary
- Specific port number used for REST fallback (anything predictable and unlikely to conflict)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CALC-01 through CALC-08 are the Phase 6 requirements
- `.planning/ROADMAP.md` §Phase 6 — success criteria and phase boundary

### Spike Findings (critical — read before planning)
- `.planning/spike-calcpad.md` — Phase 5 go/no-go report: binary name, invocation syntax, CLI success detection, REST path, anomalies to handle

### Project Context
- `.planning/PROJECT.md` — key decisions table, constraints (MIT, FOSS-only, minimalism-first, pure markdown skill)

No other external specs — all requirements are captured in decisions above and REQUIREMENTS.md.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `skills/concept/SKILL.md` — reference for skill file structure and `.librespin/` output conventions
- `agents/concept.md` — reference for agent frontmatter pattern (name, description, tools, color)

### Established Patterns
- Skill files: `skills/<name>/SKILL.md`
- Agent files: `agents/<name>.md`
- Output directory per skill: `.librespin/<NN>-<name>/`
- Phase 6 reads from: `.librespin/07-final-output/` (concept skill output)
- Phase 6 writes to: `.librespin/08-calculations/`

### Integration Points
- Phase 7 (NGSpice) reads component values from `.librespin/08-calculations/` — the output contract Phase 6 establishes must be stable before Phase 7 is planned

</code_context>

<specifics>
## Specific Ideas

- `LibreSpin/CalcpadCE` is a new fork to create in the LibreSpin org — it hosts the patched source and publishes pre-built binaries via GitHub Actions CI on tag. One repo serves both binary distribution and upstream contribution.
- Upstream PRs are submitted from `LibreSpin/CalcpadCE` → `imartincei/CalcpadCE` (standard fork-PR workflow). No personal fork needed — `WilliamxLeismer` contributes as a LibreSpin org member.
- VSCode CalcPad CE extension is user workflow for worksheet authoring preview — not LibreSpin skill scope

</specifics>

<deferred>
## Deferred Ideas

- Upstream CalcpadCE PRs — produced as artifacts in Phase 6, submitted from `LibreSpin/CalcpadCE` → `imartincei/CalcpadCE` by user when ready
- Windows/macOS binary packaging — spike was Linux-only; cross-platform distribution deferred to future milestone
- CalcPad CE version pinning strategy (what triggers a binary update in `LibreSpin/calcpad-ce-linux`) — operational decision, not Phase 6 scope
- Output quality validation with realistic engineering calculations — Phase 6 functional tests use a simple worksheet; full validation deferred

</deferred>

---

*Phase: 06-calcpad-ce-skill*
*Context gathered: 2026-04-08*
