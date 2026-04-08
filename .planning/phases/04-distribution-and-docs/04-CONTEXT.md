# Phase 4: Distribution and Docs - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Make LibreSpin installable via the Claude Code plugin marketplace, add uninstall support to the npx installer, and write a README that gets a first-time user running `/librespin:concept` without friction. npm publish is explicitly out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### File layout migration
- **D-01:** Move distributable files from `.claude/skills/`, `.claude/agents/`, `.claude/librespin/` to repo root: `skills/librespin-concept/`, `agents/`, `librespin/templates/`. One source of truth — no duplication.
- **D-02:** Update `bin/install.js` to copy from repo root (`skills/`, `agents/`, `librespin/`) rather than `.claude/`. The source path changes from `join(__dirname, '..', '.claude')` to `join(__dirname, '..')` (with explicit per-subtree copies).
- **D-03:** Update `package.json` `files` array: replace `".claude/"` with `"skills/"`, `"agents/"`, `"librespin/"`.
- **D-04:** `.claude/worktrees/` stays in place — GSD internal state, not part of the migration.
- **D-05:** After migration, delete `.claude/skills/`, `.claude/agents/`, `.claude/librespin/` from the repo — no dead copies.

### Plugin manifest
- **D-06:** Create `.claude-plugin/plugin.json` with at minimum: `name`, `description`, `version`. Align version with `package.json` (0.1.0). Plugin marketplace install path: `/plugin marketplace add LibreSpin/LibreSpin` → `/plugin install librespin`.

### Uninstall support
- **D-07:** Add `--uninstall` flag to `bin/install.js` (deferred from Phase 1, D-06). Use hardcoded file/directory list matching what the installer places in `~/.claude/`: `skills/librespin-concept/`, `agents/librespin-concept.md`, `librespin/`. This is the minimal approach — no install manifest tracking needed for v1.
- **D-08:** `--uninstall` respects `--local` flag (removes from `./.claude/` if local install).

### README
- **D-09:** Quick-start format (~40-50 lines). Sections: marketplace install (primary), npx install (secondary), prerequisites (Claude Code + Node.js >= 18), first-run walkthrough showing `/librespin:concept`, what to expect (9-phase workflow: requirements → concepts → BOMs → comparison matrix).
- **D-10:** Do NOT include config options, troubleshooting, or architecture notes — that's v2 docs. Keep it tight enough that a first-time user reads it start to finish.

### npm publish
- **D-11:** Out of scope for Phase 4. The npm package name `librespin` availability has not been verified and publish is not a success criterion. Deferred to after v1 ships.

### Claude's Discretion
- Exact fields in `.claude-plugin/plugin.json` beyond name/description/version — research what Claude Code plugin manifest supports
- Whether plugin install also installs templates or only skills/agents — check plugin marketplace behavior
- Exact wording and structure of README sections
- Error message wording for `--uninstall` (file not found, partial uninstall, etc.)

</decisions>

<specifics>
## Specific Ideas

No specific references mentioned — open to standard approaches for plugin manifest and README formatting.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Installer (source to update)
- `bin/install.js` — Current installer: copies from `.claude/` to `~/.claude/`. Needs path updates for D-02. Also needs `--uninstall` flag added (D-07).

### Package metadata
- `package.json` — `files` array needs updating (D-03). Installer bin entry stays as-is.

### Requirements
- `.planning/REQUIREMENTS.md` — PKG-02 (uninstall), PKG-03 (README), PKG-05 (plugin.json), PKG-06 (plugin install works) are the Phase 4 requirements.
- `.planning/ROADMAP.md` §Phase 4 — Success criteria: plugin.json exists, plugin install works, npx --uninstall works, README covers the required sections, files at repo root.

### Prior phase context
- `.planning/phases/01-package-scaffold/01-CONTEXT.md` — D-04 through D-11 (installer behavior, directory layout decisions)
- `.planning/phases/02-namespace-port/02-CONTEXT.md` — D-09/D-10/D-11 (agent/skill/template target paths that uninstall must clean up)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/install.js` — 60-line ESM installer; add `--uninstall` branch alongside existing install logic. Parse args, iterate hardcoded file list, call `rm -rf` equivalent via `node:fs/promises`.
- Existing directories to migrate: `.claude/skills/librespin-concept/SKILL.md`, `.claude/agents/librespin-concept.md`, `.claude/librespin/templates/` (3 files: requirements.yaml, concept-template.md, overview-template.md).

### Established Patterns
- Zero npm dependencies (D-08 from Phase 1) — uninstall implementation must use `node:fs/promises` only, no third-party packages.
- ESM (`"type": "module"` in package.json) — any new installer code uses ESM imports.

### Integration Points
- Plugin manifest at `.claude-plugin/plugin.json` — new file, new directory.
- `skills/`, `agents/`, `librespin/` at repo root — new top-level directories after migration.
- README at repo root — currently a placeholder (17 lines), full replacement.

</code_context>

<deferred>
## Deferred Ideas

- npm publish to registry — deferred until after v1 ships; package name `librespin` availability not yet verified.
- Config options / troubleshooting in README — v2 docs (OPT-01/OPT-02).
- Install manifest for accurate uninstall tracking — v2; hardcoded list is sufficient for v1.

</deferred>

---

*Phase: 04-distribution-and-docs*
*Context gathered: 2026-04-07*
