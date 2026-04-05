# Roadmap: LibreSpin

## Overview

LibreSpin v1 is a namespace port of the existing hw-concept agent system into a distributable Claude Code skill pack. The work is structural and verification-heavy, not creative: scaffold the npm package and installer, port all agent content from hw-concept to librespin namespace, validate the full 9-phase workflow end-to-end, then publish. Every feature exists in hw-concept already — the phases deliver correctness and distribution, not new capabilities.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Package Scaffold** - npm package + npx installer with correct Claude Code directory layout
- [x] **Phase 2: Namespace Port** - Port all hw-concept content to librespin namespace with skill structure (completed 2026-04-05)
- [ ] **Phase 3: End-to-End Validation** - Verify all 9 workflow phases work correctly after the port
- [ ] **Phase 4: Distribution and Docs** - Plugin marketplace, uninstall support, README, and optional npm publish

## Phase Details

### Phase 1: Package Scaffold
**Goal**: A working `npx librespin-install` command that copies the correct directory skeleton to ~/.claude/
**Depends on**: Nothing (first phase)
**Requirements**: PKG-01, PKG-04
**Success Criteria** (what must be TRUE):
  1. Running `npx librespin-install` completes without error and prints a restart instruction
  2. After install, `~/.claude/skills/librespin-concept/`, `~/.claude/agents/`, and `~/.claude/librespin/templates/` directories exist
  3. `package.json` has correct name, version, license, and bin entry pointing to `bin/install.js`
  4. Installer copies only `bin/` and `.claude/` subtree — no dev files included
**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md — Package scaffold: cleanup, config files, placeholders, and installer

### Phase 2: Namespace Port
**Goal**: All hw-concept content lives under the librespin namespace with no residual hw-concept strings in installed files
**Depends on**: Phase 1
**Requirements**: SKL-01, SKL-02, SKL-03, SKL-04, NSP-01, NSP-02, NSP-03, NSP-04, NSP-05, NSP-06
**Success Criteria** (what must be TRUE):
  1. `grep -r "hw-concept" ~/.claude/skills/librespin-concept/ ~/.claude/agents/librespin-concept.md ~/.claude/librespin/` returns zero matches
  2. Orchestrator lives at `~/.claude/skills/librespin-concept/SKILL.md` and the `/librespin:concept` command appears in Claude Code after install
  3. Worker agent at `~/.claude/agents/librespin-concept.md` has correct frontmatter (name: librespin-concept, description, tools, color)
  4. YAML templates are installed to `~/.claude/librespin/templates/` and config schema supports draft_count, iteration_limit, confidence_threshold
  5. All agent output paths reference `.librespin/` and all Tool references use `Agent` (not deprecated `Task`); the dead `--output DIR` parameter is either removed or fully wired
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Port templates and agent flat file
- [x] 02-02-PLAN.md — Port SKILL.md (merged orchestrator + full agent body with namespace replacement)

### Phase 3: End-to-End Validation
**Goal**: The ported concept agent completes all 9 workflow phases correctly for both interactive and file-based input modes
**Depends on**: Phase 2
**Requirements**: CW-01, CW-02, CW-03, CW-04, CW-05, CW-06, CW-07, CW-08, CW-09, CW-10
**Success Criteria** (what must be TRUE):
  1. User can start a requirements interview interactively via AskUserQuestion and reach Phase 1 completion
  2. User can provide a requirements YAML file and the agent ingests it without error
  3. Agent generates 5-6 diverse architecture concepts and produces a comparison matrix with a recommended concept
  4. On a second invocation after interruption, the agent resumes from the last completed phase (state file is present and loaded)
  5. Completeness scoring rejects under-specified requirements (sub-70 score triggers gap-fill) and accepts complete ones
**Plans**: TBD

### Phase 4: Distribution and Docs
**Goal**: Any stranger can install LibreSpin via Claude Code plugin marketplace, understand what it does, and cleanly remove it. npm publish is optional/secondary.
**Depends on**: Phase 3
**Requirements**: PKG-02, PKG-03, PKG-05, PKG-06
**Success Criteria** (what must be TRUE):
  1. `.claude-plugin/plugin.json` exists with correct name, description, and version
  2. Running `/plugin marketplace add LibreSpin/LibreSpin` then `/plugin install librespin` installs all skills, agents, and templates
  3. Running `npx librespin-install --uninstall` (or equivalent) removes all installed files from ~/.claude/ cleanly
  4. README includes marketplace install command (primary), npx install command (secondary), prerequisites, first-run walkthrough, and what to expect
  5. Skill/agent/template files live at repo root in plugin-compatible layout (`skills/`, `agents/`, etc.)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Package Scaffold | 0/1 | Planning complete | - |
| 2. Namespace Port | 2/2 | Complete   | 2026-04-05 |
| 3. End-to-End Validation | 0/? | Not started | - |
| 4. Distribution and Docs | 0/? | Not started | - |
