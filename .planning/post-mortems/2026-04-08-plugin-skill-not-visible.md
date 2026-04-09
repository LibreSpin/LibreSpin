---
date: 2026-04-08
severity: HIGH
domain: project-management
project: LibreSpin
recurrence_risk: high
---

# Post-Mortem: New Skills Not Appearing in Plugin After Install

**Date:** 2026-04-08
**Discovered by:** User (twice)
**Impact:** `/librespin:setup` was added to the repo but never appeared as a slash command, requiring manual troubleshooting each time.

## Failure Summary

When a new skill (`skills/setup/SKILL.md`) was added to the repo, it did not appear in Claude Code after the user updated the plugin. The skill existed on disk and had correct frontmatter. The install procedure was followed correctly. Despite this, the skill was invisible.

This happened twice — indicating the root cause was never addressed after the first occurrence.

**Expected Behavior:** After a skill is added to `skills/` and the plugin is reinstalled, the skill appears as a slash command in Claude Code.

**Actual Behavior:** Reinstalling the plugin served the stale cache. New skill was absent. No error or warning.

**Discovery Context:** User noticed the skill was absent and had to ask Claude to investigate.

## Root Cause Analysis

### Root Cause #1: No version bump discipline for skill additions

**5-Why Analysis:**

1. Why did `/librespin:setup` not appear after plugin reinstall?
   → Because Claude Code's plugin cache served the stale `0.1.0` copy, which predates the skill.

2. Why was the stale cache served?
   → Because the plugin version in `plugin.json` was still `0.1.0` — Claude Code treats same-version reinstalls as cache hits.

3. Why was the version not bumped?
   → Because no step in the "add a new skill" workflow requires bumping the version.

4. Why is there no such step?
   → Because `CLAUDE.md` documented how to install/uninstall but never mentioned the version-cache coupling.

5. Why was the version-cache coupling not documented?
   → Because it was not discovered until the first failure — and even then, the lesson wasn't captured in CLAUDE.md, so it recurred.

**ROOT CAUSE:** The skill-addition workflow has no version bump step, and the version-cache coupling was not documented after the first incident.

## Impact Assessment

**Severity:** HIGH
**Rationale:** New skills are completely invisible to users. No error is surfaced. The only way to notice is to look for the skill and find it absent — easy to miss in a multi-skill release.

**Scope:**
- Affected components: All future skill additions
- Affected workflows: `/plugin install librespin` after any `skills/` change
- User impact: Skill unavailable until manually diagnosed and fixed

**Recurrence Risk:** High — same failure happened twice before any fix was in place.

**Blast Radius:**
- User wasted time troubleshooting a working skill
- GSD phase 999.3-01/02/04 work was complete and correct, but invisible
- No data loss; purely a discoverability failure

## Prevention Strategy

### Immediate Fixes

1. **Bump plugin.json to 0.1.1**
   - File: `.claude-plugin/plugin.json`
   - Change: `"version": "0.1.0"` → `"version": "0.1.1"` ✅ done
   - Verification: `/plugin uninstall librespin && /plugin install librespin` → setup skill appears

2. **Document in CLAUDE.md**
   - File: `CLAUDE.md` (Local Testing section)
   - Change: Added CRITICAL callout — bump version + reinstall after any `skills/` change ✅ done

### Process Improvements

1. **Add version bump to skill-addition checklist**
   - Type: Documentation / workflow gate
   - Location: CLAUDE.md + any future phase plan that adds a skill
   - Rationale: Every plan that creates a `skills/*/SKILL.md` must also bump `plugin.json` patch version as a task

2. **Add acceptance criterion to skill-addition plans**
   - Type: Validation gate
   - Location: GSD plan frontmatter `must_haves`
   - Rationale: Future plans adding skills should include: `grep '"version"' .claude-plugin/plugin.json` shows a version higher than the previous plan's version

## Verification Approach

**Test Cases:**

1. **Skill appears after version bump + reinstall**
   - Setup: `plugin.json` at `0.1.1`, plugin uninstalled
   - Expected: `/plugin install librespin` → `/librespin:setup` appears in skill list
   - Verifies: cache invalidation works correctly

2. **Future skill addition includes version bump**
   - Setup: New plan in GSD that adds `skills/foo/SKILL.md`
   - Expected: Plan tasks include bumping `plugin.json` patch version
   - Verifies: workflow discipline maintained

**Success Criteria:**
- [ ] `/librespin:setup` appears as a slash command after reinstall with `0.1.1`
- [ ] Next skill-addition GSD plan includes a version-bump task
- [ ] CLAUDE.md CRITICAL callout prevents future omission

## Lessons Learned

**Key Takeaways:**

1. Claude Code plugin caching is version-keyed — same version = stale cache, always.
2. "Updated the plugin" does not mean "refreshed the skill list" unless the version changed.
3. A lesson not captured in CLAUDE.md after the first incident will repeat.

**Patterns to Watch For:**
- Any GSD plan that creates `skills/*/SKILL.md` without also bumping `plugin.json`
- User reports "skill not showing up" after adding a skill — first thing to check is plugin version

**Prevention Principles:**
- Skill addition = code change + version bump. They are inseparable.
- CLAUDE.md is the single source of truth for workflow constraints — if it's not there, it will be forgotten.

---

_Analysis performed: 2026-04-08_
_Analyzer: Claude (self-improve skill)_
