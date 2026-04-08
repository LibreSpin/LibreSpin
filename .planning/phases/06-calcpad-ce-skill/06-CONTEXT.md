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
- **D-01:** Pre-built self-contained Linux binaries hosted as GitHub Releases in `LibreSpin/calcpad-ce-linux` (new repo to create). Skill installs via `curl -L .../releases/latest/download/Cli -o ~/.librespin/bin/Cli`. No build step, no .NET required at user runtime.
- **D-02:** The AuthSettings patch (CalcpadService.cs fix from spike) is baked into the published binary — not applied at install time. Users get a clean binary download.
- **D-03:** Binary source: built from CalcpadCE @ commit `3bc026b70c78a4385bd222c68620374be80f3be0` with the AuthSettings patch applied. `LibreSpin/calcpad-ce-linux` repo maintains the build recipe.

### REST Fallback (CALC-08)
- **D-04:** REST fallback activates only when the `Cli` binary is not found at startup (prereq check fails). Not a runtime fallback.
- **D-05:** REST path: `POST /api/calcpad/convert` with `{"Content": "<cpd text>"}`, response is `text/html`. Start server with `--urls http://localhost:{port}` to pin port. Parse `Now listening on:` from server stdout to confirm bound URL.
- **D-06:** CLI-first is the primary path; REST is explicitly the fallback for environments where the binary can't be installed.

### Circuit Block Selection (CALC-02)
- **D-07:** Default: skill reads `.librespin/07-final-output/`, identifies all circuit blocks, and presents a menu for the user to select which block to calculate this session.
- **D-08:** `--auto` flag: skips the menu and auto-selects the primary/recommended block from the concept output. User can set this as their default for unattended runs.

### Worksheet Generation (CALC-03)
- **D-09:** Draft-then-review flow: Claude generates the `.cpd` worksheet from design targets extracted from `.librespin/07-final-output/` and shows the draft inline in chat before running the CLI.
- **D-10:** User reviews the worksheet in-session. If corrections are needed, user types them directly in chat — Claude applies changes to the `.cpd` content and confirms before execution.
- **D-11:** After user approval, Claude runs the CLI and presents results. Human review gate (CALC-06) occurs after results are shown — not before.

### CLI Invocation (CALC-04)
- **D-12:** Binary name on Linux: `Cli` (not `Calcpad.Cli`). Installed to `~/.librespin/bin/Cli`.
- **D-13:** Success detection: exit code 0 AND output file exists. CLI produces no stdout/stderr with `-s` flag — do not attempt stdout parsing.
- **D-14:** Command: `~/.librespin/bin/Cli input.cpd output.html -s`

### Upstream PR Deliverables
- **D-15:** Phase 6 produces PR content (diff + description) as `.planning/` artifacts for two PRs:
  1. CalcpadService.cs AuthSettings fix (build-breaking for source builds)
  2. Linux build documentation (binary naming, port anomaly, dotnet-install.sh path)
- **D-16:** PRs are NOT auto-submitted via `gh pr create` — user submits to `imartincei/CalcpadCE` manually when ready. Phase 6 completion does not depend on upstream acceptance.
- **D-17:** These PRs are goodwill contributions — Phase 6 ships independently of upstream PR status (binaries are pre-built and self-contained).

### Output (CALC-07)
- **D-18:** Worksheet (`.cpd`) and results (HTML output) saved to `.librespin/08-calculations/`.

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

- `LibreSpin/calcpad-ce-linux` is a new repo to create in the LibreSpin org — it hosts pre-built binaries as GitHub Releases and contains the build recipe (the pinned commit + patch)
- Option D (submit AuthSettings PR upstream to `imartincei/CalcpadCE`) is a future user action — not Phase 6 scope
- VSCode CalcPad CE extension is user workflow for worksheet authoring preview — not LibreSpin skill scope

</specifics>

<deferred>
## Deferred Ideas

- Option D (upstream CalcpadCE PRs) — user will submit to `imartincei/CalcpadCE` manually after Phase 6 ships
- Windows/macOS binary packaging — spike was Linux-only; cross-platform distribution deferred to future milestone
- CalcPad CE version pinning strategy (what triggers a binary update in `LibreSpin/calcpad-ce-linux`) — operational decision, not Phase 6 scope
- Output quality validation with realistic engineering calculations — Phase 6 functional tests use a simple worksheet; full validation deferred

</deferred>

---

*Phase: 06-calcpad-ce-skill*
*Context gathered: 2026-04-08*
