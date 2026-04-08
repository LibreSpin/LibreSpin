# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v0.1 — MVP

**Shipped:** 2026-04-07
**Phases:** 4 | **Plans:** 10 | **Sessions:** ~4

### What Was Built
- Complete 9-phase hardware concept workflow (`/librespin:concept`) ported from hw-concept and deployed as a Claude Code plugin marketplace entry
- npx installer + `--uninstall` flag for local install/uninstall without plugin system
- Plugin manifest (`.claude-plugin/plugin.json` + `marketplace.json`) enabling `LibreSpin/LibreSpin` as a first-class Claude Code plugin
- 61-line quick-start README covering both install paths

### What Worked
- **Fork-don't-rewrite** was correct. The hw-concept workflow was complete — porting took 2 phases instead of the 3-4 a rewrite would have needed.
- **GSD plan→execute cycle** caught the plugin recursive-install bug (librespin/ dir collision) during UAT, not in production.
- **Parallel wave execution** (04-02 + 04-03 in wave 2) saved real time with zero conflicts — clean file separation is key.
- **Research phase** correctly flagged `source: "."` as medium-confidence before planning — paid off when it failed.

### What Was Inefficient
- **Plugin schema iteration**: 3 rounds to get `marketplace.json` right (`"."` invalid → `{"source":"url",...}` correct → recursive dir bug → `skills/concept/` rename). The plugin system's schema validation errors are opaque. Should have found a real-world example marketplace first.
- **Directory naming collision**: Naming the repo directory `librespin/` and the plugin `librespin` created an infinite cache recursion. A pre-flight check on plugin name vs top-level directory names would have caught this instantly.
- **Phase 1 completion tracking**: PKG-01 and PKG-04 shipped in Phase 1 but weren't checked off in REQUIREMENTS.md — caused a cosmetic gap at milestone close.

### Patterns Established
- **Plugin-as-marketplace pattern**: The repo is both the marketplace and the plugin. Keep distributable files (`skills/`, `agents/`) at repo root without a top-level directory matching the plugin name.
- **Templates inside skill dir**: `skills/concept/templates/` (not `librespin/templates/`) avoids namespace collisions and makes templates auto-discoverable by the plugin system.
- **librespin-concept agent runs foreground only**: Background agents block AskUserQuestion — this is a hard rule for the concept workflow.

### Key Lessons
1. **Check existing marketplace examples before designing plugin manifest** — the schema is not well-documented but real examples are in `~/.claude/plugins/marketplaces/`.
2. **Never use the plugin name as a top-level repo directory** — the plugin install cache path includes the plugin name, creating recursion.
3. **UAT is the real integration test** — automated checks passed cleanly; the plugin system bugs only surfaced during live human testing.

### Cost Observations
- Model mix: planner=opus, researcher/checker/executor/verifier=sonnet
- Sessions: ~4 across 3 days
- Notable: Opus planner for Phase 4 produced better deep_work_rules adherence than prior phases — worth the cost for complex dependency plans

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v0.1 | ~4 | 4 | Baseline — first GSD milestone for this project |

### Top Lessons (Verified Across Milestones)

1. Fork-don't-rewrite is almost always faster for v1 of a port project.
2. Plugin system integrations require live human UAT — automated checks cannot substitute.
