# Phase 1: Package Scaffold - Research

**Researched:** 2026-04-04
**Domain:** npm package scaffolding, npx installer pattern, Node.js ESM, Claude Code directory layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Vestigial Python Cleanup**
- D-01: Remove `src/`, `.venv/`, `dist/` directories (dead code from early planning)
- D-02: Keep `pyproject.toml` but strip to minimal placeholder (name/version/license/requires-python only) — preserves ability to add Python harnessing later
- D-03: Add `.gitignore` covering `.venv/`, `dist/`, `node_modules/`, and other standard ignores for an npm package

**Installer Behavior**
- D-04: Silent overwrite with `force: true` (same as hw-concept). Idempotent — reinstall = upgrade
- D-05: Keep `--local` flag for per-project installs (install to `./.claude/` instead of `~/.claude/`)
- D-06: Defer `--uninstall` to Phase 4 (PKG-02 lives there). Phase 1 installer is install-only

**Package Naming**
- D-07: npm package name: `librespin-install`. Command: `npx librespin-install`
- D-08: Zero npm dependencies. Drop `js-yaml` from hw-concept — installer just copies files, YAML parsing happens at Claude Code runtime

**Directory Layout**
- D-09: Agent file: `~/.claude/agents/librespin-concept.md` (flat, matches GSD pattern)
- D-10: Skill orchestrator: `~/.claude/skills/librespin-concept/SKILL.md` (matches roadmap SC-2)
- D-11: Templates: `~/.claude/librespin/templates/` (YAML stubs)
- D-12: Minimal placeholder content in all files — valid frontmatter + TODO bodies for skill/agent, empty YAML stubs for templates. Enough for installer to work end-to-end

### Claude's Discretion
- Exact `.gitignore` entries beyond the discussed ones
- Placeholder frontmatter field values (tools, color, description) — align with what Phase 2 will need

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PKG-01 | User can install LibreSpin skill pack via `npx librespin-install` to ~/.claude/ | npm `bin` entry + ESM installer script pattern documented below |
| PKG-04 | package.json has correct metadata (name, version, license, bin entry) | hw-concept package.json used as direct template; fields mapped below |
</phase_requirements>

---

## Summary

Phase 1 is a direct port and adaptation of the proven hw-concept npm package pattern. The hw-concept repo ships a working `npx hw-concept-install` command as an 86-line ESM installer with zero dependencies — LibreSpin needs the same pattern with three name/path changes: package name to `librespin-install`, bin command to `librespin-install`, and target directories to `skills/librespin-concept/`, `agents/librespin-concept.md`, and `librespin/templates/`.

The one structural difference from hw-concept is the destination layout. hw-concept uses `commands/` (deprecated) and `agents/hw-concept/` (subdirectory). LibreSpin targets `skills/librespin-concept/` (orchestrator SKILL.md) and `agents/librespin-concept.md` (flat file), which matches current GSD conventions. The installer must mkdir and cp to these new paths.

The repo also needs cleanup: Python scaffolding files (`src/`, `.venv/`, `dist/`) are dead code. They come out. `pyproject.toml` survives as a stripped placeholder per D-02.

**Primary recommendation:** Directly port `hw-concept/bin/install.js` with path/name substitutions. Add `package.json` mirroring hw-concept structure, drop `js-yaml` dependency, wire new Claude Code paths. Create placeholder skill/agent/template files. Remove Python scaffolding. Done.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | Node >= 18 | `fs/promises`, `os`, `path`, `url` | Zero deps. `cp()` with `recursive`+`force` is all the installer needs |
| ESM modules | `"type": "module"` | `import` syntax, `import.meta.url` for `__dirname` shim | hw-concept uses this; Node 18+ supports it without flags |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | D-08: zero npm dependencies |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node built-in `cp()` | `fs-extra`, `ncp` | External deps add install weight. Built-in `cp()` with `{recursive: true, force: true}` covers this use case fully (Node 16.7+) |
| ESM | CJS `require()` | hw-concept uses ESM; keeping consistent avoids `__dirname` vs `import.meta.url` confusion |

**Installation:** No `npm install` needed — zero dependencies by design (D-08).

---

## Architecture Patterns

### Source Layout (what lives in the repo)

```
LibreSpin/
├── bin/
│   └── install.js          # ESM installer script (the npx entry point)
├── .claude/                # Files that get copied to ~/.claude/
│   ├── skills/
│   │   └── librespin-concept/
│   │       └── SKILL.md    # Orchestrator placeholder
│   ├── agents/
│   │   └── librespin-concept.md   # Worker agent placeholder (flat file)
│   └── librespin/
│       └── templates/
│           ├── requirements.yaml
│           ├── concept-template.md
│           └── overview-template.md
├── package.json
├── pyproject.toml          # Stripped placeholder (D-02)
├── .gitignore
├── LICENSE
└── README.md
```

### Target Layout (what lands in ~/.claude/ after install)

```
~/.claude/
├── skills/
│   └── librespin-concept/
│       └── SKILL.md
├── agents/
│   └── librespin-concept.md
└── librespin/
    └── templates/
        ├── requirements.yaml
        ├── concept-template.md
        └── overview-template.md
```

Note: The agent file is a **flat file** (`agents/librespin-concept.md`), not a subdirectory. hw-concept used `agents/hw-concept/AGENT.md` — the new pattern copies a single `.md` file, not a directory tree.

### Pattern 1: npx ESM Installer

**What:** A `#!/usr/bin/env node` ESM script with `import.meta.url` for path resolution, `node:fs/promises` cp/mkdir, and a simple arg parser for `--local`/`--help`.

**When to use:** Any time a Claude Code skill pack needs `npx packagename` distribution.

**Example (adapted from hw-concept):**
```javascript
// Source: /home/william/repo/hw-concept/bin/install.js (canonical reference)
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const targetBase = isLocal
  ? join(process.cwd(), '.claude')
  : join(homedir(), '.claude');
const sourceBase = join(__dirname, '..', '.claude');
```

**Key adaptation for LibreSpin:** `cp()` copies `skills/librespin-concept/` (directory, use `{recursive: true}`), `agents/librespin-concept.md` (single file, no recursive), and `librespin/templates/` (directory, use `{recursive: true}`).

### Pattern 2: package.json for npx distribution

**What:** `bin` maps command name to installer script. `files` array limits what npm publishes. `engines` enforces Node version.

**Example:**
```json
{
  "name": "librespin-install",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "librespin-install": "./bin/install.js"
  },
  "files": ["bin/", ".claude/"],
  "engines": { "node": ">=18.0.0" },
  "license": "MIT"
}
```

Note: `"files"` is critical. Without it, `npm publish` ships everything including dev artifacts. With it, only `bin/` and `.claude/` are packed — satisfying PKG-04 success criterion 4.

### Pattern 3: Claude Code agent frontmatter (flat file)

**What:** Flat agent `.md` files in `~/.claude/agents/` with YAML frontmatter block.

**Example (hw-concept reference, adapted):**
```markdown
---
name: librespin-concept
description: Generate hardware concept designs with BOMs and block diagrams. Supports multi-phase workflow with state persistence.
tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion
color: blue
---

# LibreSpin Concept Generator Agent

TODO: Port from hw-concept in Phase 2.
```

### Pattern 4: Stripped pyproject.toml (D-02)

**What:** Minimal TOML keeping only build-system, name, version, license, and requires-python. All dependencies, classifiers, URLs, keywords removed.

**Example:**
```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "librespin"
version = "0.0.1"
license = { text = "MIT" }
requires-python = ">=3.10"
```

### Anti-Patterns to Avoid

- **Installing to `commands/`:** hw-concept's `commands/hw-concept.md` is the deprecated Claude Code pattern. LibreSpin uses `skills/` from day one (D-10). Do not replicate the `commands/` install target.
- **Agent as subdirectory:** hw-concept put the agent in `agents/hw-concept/AGENT.md`. LibreSpin uses a flat `agents/librespin-concept.md`. The cp call must copy a file, not a directory.
- **Keeping `js-yaml` dependency:** D-08 is explicit — zero deps. Remove from package.json entirely.
- **Leaving `src/`, `.venv/`, `dist/`:** These are dead Python scaffolding. Delete per D-01.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive directory copy | Custom walk + writeFile loop | `node:fs/promises` `cp()` with `{recursive: true, force: true}` | Built-in since Node 16.7, handles symlinks, permissions, nesting |
| Path resolution in ESM | `process.cwd()` hacks | `dirname(fileURLToPath(import.meta.url))` | Correct `__dirname` equivalent for ESM modules |
| Ensuring parent dirs exist | Manual mkdir chain | `mkdir(path, {recursive: true})` | Creates full path tree without erroring on existing dirs |

**Key insight:** The installer is ~80 lines of stdlib calls. No library fills a gap that doesn't already exist.

---

## Common Pitfalls

### Pitfall 1: Flat file vs. directory cp() semantics

**What goes wrong:** `cp(src_dir, dest_dir, {recursive: true})` copies a directory. `cp(src_file, dest_file)` copies a single file. If you call `cp('agents/librespin-concept.md', 'agents/', ...)` Node will error or produce wrong output.

**Why it happens:** hw-concept's agent target was a directory (`agents/hw-concept/`). LibreSpin's is a flat file. The cp call signature differs.

**How to avoid:** For the agent file, use `cp(join(sourceBase, 'agents', 'librespin-concept.md'), join(targetBase, 'agents', 'librespin-concept.md'), {force: true})`. No `recursive`. Ensure `agents/` directory exists first via mkdir.

**Warning signs:** Error "ENOENT: no such file or directory" on the agents cp step.

### Pitfall 2: `files` array omitting `.claude/` dotdir

**What goes wrong:** npm's default publish ignores dotfiles and dotdirectories unless explicitly listed in `files`. If `.claude/` is absent from `files`, `npm publish` ships an empty package.

**Why it happens:** npm treats directories starting with `.` as hidden/config by default.

**How to avoid:** Explicitly include `".claude/"` in the `files` array. Already present in hw-concept's package.json — carry it forward.

**Warning signs:** `npm pack --dry-run` shows no `.claude/` files in the tarball.

### Pitfall 3: Missing shebang in install.js

**What goes wrong:** `npx librespin-install` invokes the bin script directly. Without `#!/usr/bin/env node` as the first line, the OS doesn't know how to execute it.

**Why it happens:** Node scripts run fine with `node install.js` but fail as direct executables without the shebang.

**How to avoid:** First line of `bin/install.js` must be `#!/usr/bin/env node`. Carry this from hw-concept verbatim.

### Pitfall 4: Installer fails silently when target parent doesn't exist

**What goes wrong:** `cp(src, dest, {force: true})` does NOT create missing parent directories. If `~/.claude/skills/` doesn't exist yet, the skills cp will throw ENOENT.

**Why it happens:** `force: true` only means "overwrite existing". It does not imply `recursive mkdir`.

**How to avoid:** Call `mkdir(targetDir, {recursive: true})` for every target directory before the cp calls. hw-concept does this for `agents`, `commands`, `hw-concept`. LibreSpin needs it for `skills/librespin-concept`, `agents`, and `librespin/templates`.

---

## Code Examples

Verified patterns from canonical source (`/home/william/repo/hw-concept/bin/install.js`):

### Directory creation before copy
```javascript
// Source: hw-concept/bin/install.js — adapted for LibreSpin paths
const dirs = [
  'skills/librespin-concept',
  'agents',
  'librespin/templates',
];
for (const dir of dirs) {
  await mkdir(join(targetBase, dir), { recursive: true });
}
```

### Copy skill directory (recursive)
```javascript
// Source: hw-concept/bin/install.js cp pattern
await cp(
  join(sourceBase, 'skills', 'librespin-concept'),
  join(targetBase, 'skills', 'librespin-concept'),
  { recursive: true, force: true }
);
```

### Copy flat agent file (no recursive)
```javascript
// LibreSpin-specific: flat agent file, not a directory
await cp(
  join(sourceBase, 'agents', 'librespin-concept.md'),
  join(targetBase, 'agents', 'librespin-concept.md'),
  { force: true }
);
```

### Copy templates directory (recursive)
```javascript
await cp(
  join(sourceBase, 'librespin', 'templates'),
  join(targetBase, 'librespin', 'templates'),
  { recursive: true, force: true }
);
```

### Restart message (PKG-01 success criterion 1)
```javascript
console.log('\nRestart Claude Code to activate /librespin:concept skill.');
```

### Minimal SKILL.md placeholder (D-12)
```markdown
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

# /librespin:concept

TODO: Port from hw-concept in Phase 2.
```

### Minimal agent frontmatter (D-12, aligned with Phase 2 needs)
```markdown
---
name: librespin-concept
description: Generate hardware concept designs with BOMs and block diagrams. Supports multi-phase workflow with state persistence.
tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion
color: blue
---

# LibreSpin Concept Generator Agent

TODO: Port from hw-concept in Phase 2.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `commands/` directory for Claude Code skills | `skills/` directory | Claude Code update (2025) | LibreSpin must use `skills/`, never `commands/` |
| `Task` tool alias | `Agent` tool | Claude Code update (2025) | Phase 1 placeholder files should use `Agent` in allowed-tools to avoid fixing later |
| `agents/name/AGENT.md` subdirectory | `agents/name.md` flat file | GSD pattern (observed) | Installer must cp a file, not a directory |

**Deprecated/outdated:**
- `commands/` directory: Replaced by `skills/`. hw-concept still uses it — do not replicate.
- `Task` tool alias: Replaced by `Agent`. Phase 1 placeholder frontmatter should use `Agent` from the start.

---

## Open Questions

1. **SKILL.md frontmatter: exact `description` and `argument-hint` values**
   - What we know: Phase 2 will fill real content; Phase 1 needs valid-enough frontmatter for Claude Code to recognize the skill
   - What's unclear: Whether Claude Code validates frontmatter on restart or only on invocation
   - Recommendation: Use placeholder values matching hw-concept's structure. Claude Code parses frontmatter at invocation, not install — any valid YAML block is fine for Phase 1.

2. **`npm pack` dotdir behavior on current npm (11.9.0)**
   - What we know: npm < 7 excluded dotdirs by default; npm 7+ changed this behavior
   - What's unclear: Whether `.claude/` needs special handling in `files` array on npm 11.9.0
   - Recommendation: Keep `.claude/` explicit in `files` regardless. Verified: `npm pack --dry-run` should be a manual check step after package.json is written.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | install.js runtime, npx | ✓ | v24.12.0 | — |
| npm | Package management, npx | ✓ | 11.9.0 | — |
| Python 3 | pyproject.toml placeholder (build) | ✓ (system) | 3.12.3 | — |

**Missing dependencies with no fallback:** None — all required tools present.

**Missing dependencies with fallback:** None.

---

## Sources

### Primary (HIGH confidence)
- `/home/william/repo/hw-concept/bin/install.js` — Direct canonical reference; inspected in full. All installer patterns derived from this.
- `/home/william/repo/hw-concept/package.json` — Canonical reference for package structure; inspected in full.
- Node.js 18+ docs (built-in): `fs/promises.cp()`, `fs/promises.mkdir()` — used in production in hw-concept.

### Secondary (MEDIUM confidence)
- npm `files` array dotdir behavior — observed in hw-concept's working `"files": ["bin/", ".claude/"]` entry; consistent with npm docs.
- Claude Code `skills/` vs `commands/` pattern — observed from GSD skill layout (`.claude/skills/`) and hw-concept archived files (`skill.md.archived` present in hw-concept root, `commands/` still in use).

### Tertiary (LOW confidence)
- Claude Code frontmatter validation timing (at restart vs. invocation) — inferred from GSD behavior; not verified against Claude Code source.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero-dep Node.js ESM is the only reasonable choice; confirmed in canonical reference
- Architecture: HIGH — source and target layouts derived directly from inspected reference files and locked decisions
- Pitfalls: HIGH — all pitfalls identified from concrete code inspection, not speculation

**Research date:** 2026-04-04
**Valid until:** 2026-07-04 (Node.js stdlib API is stable; npm publish behavior is stable)
