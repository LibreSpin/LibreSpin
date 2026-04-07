# Phase 4: Distribution and Docs - Research

**Researched:** 2026-04-07
**Domain:** Claude Code plugin marketplace, Node.js installer, README authoring
**Confidence:** HIGH

## Summary

Phase 4 makes LibreSpin installable from the Claude Code plugin marketplace. The work splits into four concrete tasks: (1) migrate distributable files from `.claude/` to repo root, (2) create `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`, (3) add `--uninstall` to `bin/install.js`, and (4) replace the placeholder README.

The Claude Code plugin system is fully documented with an official schema (fetched 2026-04-07). The key insight is that the repo itself serves as both a marketplace and a plugin. `marketplace.json` lists one plugin entry pointing at the repo root via a relative path (`.`); `plugin.json` declares `name`, `version`, `description`. Skills at `skills/`, agents at `agents/`, and templates at `librespin/` are auto-discovered by the plugin system — no custom paths needed in `plugin.json` for standard layouts.

All four tasks are low-risk. The file migration is a git mv operation. The manifest files are new JSON files with known schemas. The uninstall flag is a ~20-line addition to `bin/install.js`. The README is a full replacement of a 5-line placeholder.

**Primary recommendation:** Implement in sequence — migrate files first, then manifest, then uninstall, then README. Each step is independently verifiable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**File layout migration**
- D-01: Move distributable files from `.claude/skills/`, `.claude/agents/`, `.claude/librespin/` to repo root: `skills/librespin-concept/`, `agents/`, `librespin/templates/`. One source of truth — no duplication.
- D-02: Update `bin/install.js` to copy from repo root (`skills/`, `agents/`, `librespin/`) rather than `.claude/`. The source path changes from `join(__dirname, '..', '.claude')` to `join(__dirname, '..')` (with explicit per-subtree copies).
- D-03: Update `package.json` `files` array: replace `".claude/"` with `"skills/"`, `"agents/"`, `"librespin/"`.
- D-04: `.claude/worktrees/` stays in place — GSD internal state, not part of the migration.
- D-05: After migration, delete `.claude/skills/`, `.claude/agents/`, `.claude/librespin/` from the repo — no dead copies.

**Plugin manifest**
- D-06: Create `.claude-plugin/plugin.json` with at minimum: `name`, `description`, `version`. Align version with `package.json` (0.1.0). Plugin marketplace install path: `/plugin marketplace add LibreSpin/LibreSpin` → `/plugin install librespin`.

**Uninstall support**
- D-07: Add `--uninstall` flag to `bin/install.js`. Use hardcoded file/directory list matching what the installer places in `~/.claude/`: `skills/librespin-concept/`, `agents/librespin-concept.md`, `librespin/`. Minimal approach — no install manifest tracking needed for v1.
- D-08: `--uninstall` respects `--local` flag (removes from `./.claude/` if local install).

**README**
- D-09: Quick-start format (~40-50 lines). Sections: marketplace install (primary), npx install (secondary), prerequisites (Claude Code + Node.js >= 18), first-run walkthrough showing `/librespin:concept`, what to expect (9-phase workflow: requirements → concepts → BOMs → comparison matrix).
- D-10: Do NOT include config options, troubleshooting, or architecture notes — that's v2 docs.

**npm publish**
- D-11: Out of scope for Phase 4.

### Claude's Discretion
- Exact fields in `.claude-plugin/plugin.json` beyond name/description/version — research what Claude Code plugin manifest supports
- Whether plugin install also installs templates or only skills/agents — check plugin marketplace behavior
- Exact wording and structure of README sections
- Error message wording for `--uninstall` (file not found, partial uninstall, etc.)

### Deferred Ideas (OUT OF SCOPE)
- npm publish to registry — deferred until after v1 ships; package name `librespin` availability not yet verified.
- Config options / troubleshooting in README — v2 docs (OPT-01/OPT-02).
- Install manifest for accurate uninstall tracking — v2; hardcoded list is sufficient for v1.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-02 | User can uninstall LibreSpin cleanly (all installed files removed) | D-07/D-08 in CONTEXT.md; `--uninstall` flag added to `bin/install.js` using `node:fs/promises rm` on hardcoded list |
| PKG-03 | Repository includes README with quick-start instructions (install, first run, what to expect) | D-09/D-10 in CONTEXT.md; 40-50 line replacement for current 5-line placeholder |
| PKG-05 | `.claude-plugin/plugin.json` manifest exists with correct name, description, and version | Plugin manifest schema confirmed from official docs; minimum fields are `name`, `version`, `description` |
| PKG-06 | Repository serves as a Claude Code plugin — `/plugin marketplace add LibreSpin/LibreSpin` then `/plugin install librespin` works | Requires both `plugin.json` AND `marketplace.json`; skills/agents/librespin at repo root auto-discovered |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs/promises` | built-in (Node >=18) | File deletion for uninstall | Zero-dep constraint from Phase 1 |
| `node:path` | built-in | Path construction | Already used in installer |
| `node:os` | built-in | `homedir()` for target resolution | Already used in installer |

No new npm packages are introduced. All work is JSON authoring, file moves, and a ~20-line addition to an existing Node.js script.

### Supporting
None — this phase is purely file/config authoring and a small installer extension.

## Architecture Patterns

### Plugin System — How LibreSpin Fits

The Claude Code plugin system requires a repo to serve two roles simultaneously:

1. **Marketplace** — `.claude-plugin/marketplace.json` at repo root lists one or more plugins and where to find them.
2. **Plugin** — `.claude-plugin/plugin.json` describes the plugin itself (name, version, description).

For a single-plugin repo (LibreSpin), the plugin lives at the repo root and `marketplace.json` sources it via the relative path `.` (current directory).

**Install flow** (verified from official docs):
```
/plugin marketplace add LibreSpin/LibreSpin
  → Claude Code clones https://github.com/LibreSpin/LibreSpin
  → reads .claude-plugin/marketplace.json
  → registers marketplace named "librespin" (or whatever name field says)

/plugin install librespin
  → Claude Code looks up "librespin" in registered marketplaces
  → fetches plugin from source path
  → copies plugin directory to ~/.claude/plugins/cache/
  → auto-discovers: skills/librespin-concept/SKILL.md, agents/librespin-concept.md
  → NOTE: librespin/templates/ is NOT auto-discovered by the plugin system
```

**Critical finding:** The plugin system auto-discovers `skills/` and `agents/` by default. It does NOT auto-discover arbitrary directories like `librespin/templates/`. Templates will not be installed via the plugin marketplace path — only via the `npx librespin-install` path. This is acceptable for v1 (templates are optional context files, not required to run the skill).

### Recommended Repo Layout After Migration

```
LibreSpin/                          # repo root = plugin root
├── .claude-plugin/
│   ├── plugin.json                 # plugin manifest (name, version, description)
│   └── marketplace.json            # marketplace catalog (lists this repo as plugin)
├── skills/
│   └── librespin-concept/
│       └── SKILL.md                # auto-discovered by plugin system
├── agents/
│   └── librespin-concept.md        # auto-discovered by plugin system
├── librespin/
│   └── templates/                  # installed by npx installer only
│       ├── requirements.yaml
│       ├── concept-template.md
│       └── overview-template.md
├── bin/
│   └── install.js                  # npx installer (updated)
├── .claude/                        # GSD worktrees stay here (D-04)
│   └── worktrees/
├── package.json                    # files: ["bin/", "skills/", "agents/", "librespin/"]
├── README.md                       # full replacement
├── CLAUDE.md
├── LICENSE
└── pyproject.toml
```

### Pattern 1: plugin.json Manifest (Minimal)

From official docs — `name` is the only required field; add `version` and `description` per D-06:

```json
// Source: https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema
{
  "name": "librespin",
  "version": "0.1.0",
  "description": "AI-driven hardware concept design workflow for Claude Code",
  "license": "MIT",
  "repository": "https://github.com/LibreSpin/LibreSpin",
  "homepage": "https://librespin.org",
  "keywords": ["pcb", "eda", "kicad", "hardware", "electronics"]
}
```

Note: Do NOT declare `skills` or `agents` paths in plugin.json — default auto-discovery handles standard layouts. Only specify custom paths when the layout is non-standard.

### Pattern 2: marketplace.json (Single-Plugin Repo)

The repo is both the marketplace and the plugin source. The `source` field uses `.` (repo root as plugin):

```json
// Source: https://code.claude.com/docs/en/plugin-marketplaces#create-the-marketplace-file
{
  "name": "librespin",
  "owner": {
    "name": "LibreSpin Contributors"
  },
  "plugins": [
    {
      "name": "librespin",
      "source": ".",
      "description": "AI-driven hardware concept design workflow for Claude Code"
    }
  ]
}
```

**Warning from official docs:** Avoid setting `version` in both `plugin.json` and `marketplace.json` — `plugin.json` wins silently if both are set. Set it only in `plugin.json`.

### Pattern 3: --uninstall Flag in install.js

Parallel structure to the existing `install()` function. Uses `rm` from `node:fs/promises`:

```javascript
// Source: Node.js 18+ built-in fs/promises
import { rm } from 'node:fs/promises';

// Hardcoded list of what the installer places in ~/.claude/ (D-07)
const INSTALLED_PATHS = [
  'skills/librespin-concept',
  join('agents', 'librespin-concept.md'),
  join('librespin', 'templates'),
];

async function uninstall() {
  console.log(`Uninstalling LibreSpin from ${targetBase}...\n`);
  let anyMissing = false;

  for (const rel of INSTALLED_PATHS) {
    const target = join(targetBase, rel);
    try {
      await rm(target, { recursive: true, force: true });
      console.log(`  ✓ Removed ${rel}`);
    } catch (err) {
      console.warn(`  ! Could not remove ${rel}: ${err.message}`);
      anyMissing = true;
    }
  }

  if (anyMissing) {
    console.log('\n! Some files were already absent — uninstall may be incomplete.');
  } else {
    console.log('\n✓ Uninstall complete.');
  }
}
```

`rm({ recursive: true, force: true })` silently succeeds if path does not exist, so explicit "not found" handling is not required. The `anyMissing` flag is optional UX polish.

### Anti-Patterns to Avoid

- **Putting skills/agents inside .claude-plugin/:** Only `plugin.json` belongs in `.claude-plugin/`. Skills and agents at plugin root are auto-discovered. (Verified from official docs warning.)
- **Setting version in both plugin.json and marketplace.json:** Official docs warn that `plugin.json` wins silently — set in one place only.
- **Referencing files outside plugin root in plugin.json:** After marketplace install, the plugin is copied to `~/.claude/plugins/cache/`; paths like `../librespin/templates` break. Templates must either be in the plugin root tree or handled separately (npx installer handles them).
- **Using `rm -rf` equivalent without `force: true`:** Without `force: true`, `rm` throws if the path doesn't exist. Use `{ recursive: true, force: true }` for idempotent uninstall.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plugin auto-discovery | Custom copy logic for skills/agents | Standard `skills/` and `agents/` layout | Plugin system auto-discovers these by default — no manifest entries needed |
| Version management | Separate version files | Single `version` field in `plugin.json` | Plugin system uses this for update detection — duplicating causes silent bugs |
| File deletion | Custom path-existence checks before rm | `rm({ recursive: true, force: true })` | `force: true` makes it idempotent — no need to check first |

**Key insight:** The plugin system handles discovery, caching, and installation. The only work is authoring the two JSON files with the right structure.

## Common Pitfalls

### Pitfall 1: marketplace.json source path for self-hosted plugin
**What goes wrong:** Setting `source` to a GitHub object (`{"source": "github", "repo": "..."}`) instead of `"."` causes the installer to clone the repo twice — once for the marketplace, once for the plugin — and can cause version drift.
**Why it happens:** Confusion between marketplace source (how to find marketplace.json) and plugin source (where plugin files live).
**How to avoid:** For a single-plugin repo where the plugin lives at the repo root, use `"source": "."` in marketplace.json. The marketplace IS the plugin repo.
**Warning signs:** Plugin install clones a second copy of the repo.

### Pitfall 2: Templates not installed via plugin marketplace
**What goes wrong:** Users who install via `/plugin install librespin` get skills and agents but not templates in `~/.claude/librespin/templates/`. Template-dependent workflow steps fail.
**Why it happens:** The plugin system only auto-discovers `skills/`, `agents/`, `commands/`, `hooks/`, `output-styles/`. It does not copy arbitrary directories.
**How to avoid:** Document in README that templates require npx install, OR move templates inside `skills/librespin-concept/` so they're copied with the skill. Decision for planner.
**Warning signs:** `/librespin:concept` runs but YAML import fails because requirements.yaml template is missing.

### Pitfall 3: plugin.json name must be kebab-case
**What goes wrong:** Using `LibreSpin` (CamelCase) as the plugin name causes validation warnings and the Claude.ai marketplace sync rejects it.
**Why it happens:** Official docs specify: "Claude Code accepts other forms, but the Claude.ai marketplace sync rejects them." Plugin name must be lowercase letters, digits, and hyphens only.
**How to avoid:** Use `"name": "librespin"` (all lowercase). This also determines the install command: `/plugin install librespin`.

### Pitfall 4: install.js still points at .claude/ source after migration
**What goes wrong:** If `sourceBase` in install.js still points to `join(__dirname, '..', '.claude')` after the file migration, `npx librespin-install` will fail with "no such file or directory" because `.claude/skills/` etc. no longer exist.
**Why it happens:** D-02 requires updating the source path — easy to migrate files but forget the installer.
**How to avoid:** Update `sourceBase` to `join(__dirname, '..')` and update each `cp()` call to reference top-level `skills/`, `agents/`, `librespin/` directly.

### Pitfall 5: package.json files array still references .claude/
**What goes wrong:** `npm pack` / `npx librespin-install` downloads a tarball that includes `.claude/` (now empty/deleted) instead of `skills/`, `agents/`, `librespin/`. Installation silently installs nothing.
**Why it happens:** D-03 requires updating the `files` array but it's easy to forget.
**How to avoid:** Update `package.json` `files` to `["bin/", "skills/", "agents/", "librespin/"]` in the same commit as the file migration.

## Code Examples

### Complete plugin.json
```json
{
  "name": "librespin",
  "version": "0.1.0",
  "description": "AI-driven hardware concept design workflow for Claude Code",
  "license": "MIT",
  "repository": "https://github.com/LibreSpin/LibreSpin",
  "homepage": "https://librespin.org",
  "keywords": ["pcb", "eda", "kicad", "hardware", "electronics"]
}
```

### Complete marketplace.json
```json
{
  "name": "librespin",
  "owner": {
    "name": "LibreSpin Contributors"
  },
  "plugins": [
    {
      "name": "librespin",
      "source": ".",
      "description": "AI-driven hardware concept design workflow for Claude Code"
    }
  ]
}
```

### Updated install.js sourceBase (D-02)
```javascript
// Before (Phase 1):
const sourceBase = join(__dirname, '..', '.claude');

// After (Phase 4, D-02):
const sourceBase = join(__dirname, '..');
// Each cp() call uses join(sourceBase, 'skills', ...) etc. — no change to structure.
```

### Uninstall branch in install.js (D-07, D-08)
```javascript
import { rm } from 'node:fs/promises';

const isUninstall = args.includes('--uninstall');

const INSTALL_ITEMS = [
  { path: join('skills', 'librespin-concept'), recursive: true },
  { path: join('agents', 'librespin-concept.md'), recursive: false },
  { path: join('librespin', 'templates'), recursive: true },
];

async function uninstall() {
  console.log(`Uninstalling LibreSpin from ${targetBase}...\n`);
  for (const item of INSTALL_ITEMS) {
    await rm(join(targetBase, item.path), { recursive: item.recursive, force: true });
    console.log(`  ✓ Removed ${item.path}`);
  }
  console.log('\n✓ Uninstall complete.');
}

if (isUninstall) {
  uninstall();
} else {
  install();
}
```

### README skeleton (D-09 / D-10)
```markdown
# LibreSpin

AI-driven hardware concept design for Claude Code.
From a description of your circuit to 4-6 fully evaluated architecture concepts,
complete with BOMs, block diagrams, and a comparison matrix.

## Install

**Via Claude Code plugin marketplace (recommended)**
```
/plugin marketplace add LibreSpin/LibreSpin
/plugin install librespin
```

**Via npx (installs templates too)**
```
npx librespin-install
```

## Prerequisites
- [Claude Code](https://claude.ai/code) — any version
- Node.js >= 18 (for npx installer only)

## Quick Start

After installing, open any project in Claude Code and run:
```
/librespin:concept
```

Claude will ask you a series of questions about your hardware requirements,
then generate 4-6 architecture concepts through a 9-phase workflow:
requirements → concept generation → validation → BOM research →
block diagrams → refinement → scoring → comparison matrix.

Expect the full workflow to take 5-15 minutes depending on complexity.

## Uninstall
```
npx librespin-install --uninstall
```
```

## Runtime State Inventory

> This is a file migration phase, not a rename/rebrand phase. No string values change — only file locations change.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — LibreSpin has no persistent datastore | None |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None | None |
| Build artifacts | `.claude/skills/`, `.claude/agents/`, `.claude/librespin/` — source directories being migrated | git mv + delete originals (D-01, D-05) |

The installer `bin/install.js` reads from `sourceBase` at runtime. After migration, `sourceBase` must point to repo root (D-02) or `npx librespin-install` will fail with file-not-found.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | bin/install.js | Yes | v24.12.0 | — |
| npx | npx librespin-install test | Yes | bundled with npm | — |
| git | Verify plugin.json schema valid | Yes | system | — |

No blocking dependencies. All work is file authoring and a small script edit.

## Open Questions

1. **Templates via plugin marketplace install**
   - What we know: Plugin system only auto-discovers `skills/`, `agents/`, `commands/` — not arbitrary dirs like `librespin/templates/`
   - What's unclear: Should templates move inside `skills/librespin-concept/` so they're copied with the skill, or stay at `librespin/templates/` with a README note that npx is required for template support?
   - Recommendation: Move templates to `skills/librespin-concept/templates/` and update SKILL.md paths — this makes the plugin-marketplace install fully functional. Requires a SKILL.md path update (minor). Alternatively, accept the gap and document it in README.

2. **marketplace.json `source: "."` for GitHub-hosted repo**
   - What we know: Official docs say relative paths work for git-based marketplaces but "do not resolve correctly" for URL-based marketplaces.
   - What's unclear: `/plugin marketplace add LibreSpin/LibreSpin` uses GitHub source (git-based), so `"source": "."` should work — but this hasn't been tested.
   - Recommendation: Use `"source": "."` for v1. If it fails, fallback is `{"source": "github", "repo": "LibreSpin/LibreSpin"}` as the plugin source. The planner should note this as a verification step.

## Sources

### Primary (HIGH confidence)
- `https://code.claude.com/docs/en/plugins-reference#plugin-manifest-schema` — Complete plugin.json schema, auto-discovery behavior, directory structure (fetched 2026-04-07)
- `https://code.claude.com/docs/en/plugin-marketplaces` — marketplace.json schema, source types, install flow, version management warnings (fetched 2026-04-07)
- `bin/install.js` in repo — Current installer structure, confirmed 60-line ESM, sourceBase pattern
- `package.json` in repo — Confirmed `"files": [".claude/"]` needs updating to D-03

### Secondary (MEDIUM confidence)
- WebSearch results confirming official docs URLs exist and are current (2026-04-07)

## Metadata

**Confidence breakdown:**
- Plugin manifest schema: HIGH — fetched directly from official Claude Code docs
- marketplace.json structure: HIGH — fetched directly from official Claude Code docs
- `source: "."` behavior for GitHub-hosted single-plugin repos: MEDIUM — documented as working for git-based marketplaces, not yet tested for LibreSpin specifically
- Installer modifications: HIGH — straightforward extension of existing code pattern
- Templates gap (not auto-discovered): HIGH — confirmed from official docs component list

**Research date:** 2026-04-07
**Valid until:** 2026-07-07 (stable docs, but Claude Code plugin system is actively developed — verify if > 30 days)
