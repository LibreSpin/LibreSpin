# Phase 1: Package Scaffold - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-04
**Phase:** 01-package-scaffold
**Areas discussed:** Vestigial Python cleanup, Installer behavior, Package naming, Directory layout

---

## Vestigial Python Cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Remove all now | Delete pyproject.toml, src/, .venv/, dist/. Clean slate for npm package | |
| Keep pyproject.toml only | Retain as metadata/future placeholder. Remove src/, .venv/, dist/ | |
| Keep everything | Leave Python artifacts alongside npm package | |

**User's choice:** Remove all now (initially), then clarified: remove src/, .venv/, dist/ but keep pyproject.toml as minimal placeholder for future Python harnessing
**Notes:** User wants to retain ability for custom Python harnessing later. Agreed on stripping pyproject.toml to minimal fields only.

### Follow-up: Gitignore

| Option | Description | Selected |
|--------|-------------|----------|
| Add to .gitignore | Add .venv/, dist/, node_modules/, and standard npm ignores | ✓ |
| No gitignore changes | Handle separately later | |

**User's choice:** Add to .gitignore

---

## Installer Behavior

### Overwrite behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Same as hw-concept | Silent overwrite with force: true. Simple, idempotent | ✓ |
| Warn before overwrite | Detect existing files, print what will be replaced | |
| Prompt before overwrite | Ask for confirmation if files exist | |

**User's choice:** Same as hw-concept

### --local flag

| Option | Description | Selected |
|--------|-------------|----------|
| Keep --local | Same behavior as hw-concept. Useful for testing | ✓ |
| Drop --local | Only support ~/.claude/ install | |

**User's choice:** Keep --local

### Uninstall support

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to Phase 4 | Phase 4 owns PKG-02. Keep scaffold installer minimal | ✓ |
| Add --uninstall now | Wire up removal logic in Phase 1 | |

**User's choice:** Defer to Phase 4

---

## Package Naming

### npm package name

| Option | Description | Selected |
|--------|-------------|----------|
| librespin-install | Matches `npx librespin-install` pattern. Matches PKG-01 | ✓ |
| librespin | Cleaner but competes with future CLI tool | |
| @librespin/install | Scoped package. Requires npm org setup | |

**User's choice:** librespin-install

### Dependencies

| Option | Description | Selected |
|--------|-------------|----------|
| Drop js-yaml | Installer just copies files. Zero dependencies | ✓ |
| Keep js-yaml | Carry over from hw-concept | |
| You decide | Claude evaluates during implementation | |

**User's choice:** Drop js-yaml

---

## Directory Layout

### Agent file path

| Option | Description | Selected |
|--------|-------------|----------|
| librespin-concept.md (flat) | Flat file in agents/. Matches GSD pattern and SKL-02 | ✓ |
| librespin/AGENT.md (nested) | Nested directory. Room for future agents | |

**User's choice:** librespin-concept.md (flat)

### Placeholder content

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal placeholders | Valid frontmatter + TODO body. Templates as YAML stubs | ✓ |
| Empty files | Just touch files. Phase 2 writes all content | |
| You decide | Claude determines testable placeholder level | |

**User's choice:** Minimal placeholders

### Skill file name

| Option | Description | Selected |
|--------|-------------|----------|
| SKILL.md | Matches roadmap SC-2 and GSD convention | ✓ |
| concept.md | Named after the skill | |

**User's choice:** SKILL.md

---

## Claude's Discretion

- Exact .gitignore entries beyond discussed ones
- Placeholder frontmatter field values (tools, color, description)

## Deferred Ideas

None — discussion stayed within phase scope
