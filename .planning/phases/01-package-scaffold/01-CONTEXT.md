# Phase 1: Package Scaffold - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a working `npx librespin-install` command that copies the correct directory skeleton to ~/.claude/. This phase delivers the npm package structure, installer script, and placeholder skill/agent/template files. No ported content — just the skeleton that Phase 2 fills.

</domain>

<decisions>
## Implementation Decisions

### Vestigial Python Cleanup
- **D-01:** Remove `src/`, `.venv/`, `dist/` directories (dead code from early planning)
- **D-02:** Keep `pyproject.toml` but strip to minimal placeholder (name/version/license/requires-python only) — preserves ability to add Python harnessing later
- **D-03:** Add `.gitignore` covering `.venv/`, `dist/`, `node_modules/`, and other standard ignores for an npm package

### Installer Behavior
- **D-04:** Silent overwrite with `force: true` (same as hw-concept). Idempotent — reinstall = upgrade
- **D-05:** Keep `--local` flag for per-project installs (install to `./.claude/` instead of `~/.claude/`)
- **D-06:** Defer `--uninstall` to Phase 4 (PKG-02 lives there). Phase 1 installer is install-only

### Package Naming
- **D-07:** npm package name: `librespin-install`. Command: `npx librespin-install`
- **D-08:** Zero npm dependencies. Drop `js-yaml` from hw-concept — installer just copies files, YAML parsing happens at Claude Code runtime

### Directory Layout
- **D-09:** Agent file: `~/.claude/agents/librespin-concept.md` (flat, matches GSD pattern)
- **D-10:** Skill orchestrator: `~/.claude/skills/librespin-concept/SKILL.md` (matches roadmap SC-2)
- **D-11:** Templates: `~/.claude/librespin/templates/` (YAML stubs)
- **D-12:** Minimal placeholder content in all files — valid frontmatter + TODO bodies for skill/agent, empty YAML stubs for templates. Enough for installer to work end-to-end

### Claude's Discretion
- Exact `.gitignore` entries beyond the discussed ones
- Placeholder frontmatter field values (tools, color, description) — align with what Phase 2 will need

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Source Material
- `/home/william/repo/hw-concept/package.json` — Reference for npm package structure, bin entry, files array
- `/home/william/repo/hw-concept/bin/install.js` — Reference installer to port (update paths, names, directory targets)

### Project Specs
- `.planning/REQUIREMENTS.md` — PKG-01 (npx install), PKG-04 (package.json metadata) are Phase 1 requirements
- `.planning/ROADMAP.md` §Phase 1 — Success criteria: npx command works, directories created, package.json correct

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- hw-concept `bin/install.js` — Direct port target. 86 lines, ESM, uses node:fs/promises. Needs path updates only
- hw-concept `package.json` — Structure to mirror (bin entry, files array, engines)

### Established Patterns
- ESM modules (`"type": "module"` in package.json)
- Node.js built-in APIs only (no external dependencies)
- `--local` / `--help` flag pattern in installer

### Integration Points
- `package.json` `bin` entry → `bin/install.js`
- `package.json` `files` array → `bin/` + `.claude/` subtree
- Installer creates: `skills/librespin-concept/`, `agents/`, `librespin/templates/`

</code_context>

<specifics>
## Specific Ideas

- User wants to retain future Python harnessing capability — keep pyproject.toml as minimal seed
- Mirror hw-concept installer behavior closely (proven pattern, minimal changes)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-package-scaffold*
*Context gathered: 2026-04-04*
