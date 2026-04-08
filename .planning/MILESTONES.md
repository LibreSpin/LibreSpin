# Milestones

## v1.0 MVP (Shipped: 2026-04-08)

**Phases completed:** 7 phases, 10 plans, 17 tasks

**Key accomplishments:**

- npm package scaffold with ESM installer, placeholder skill/agent/template files, and Python cleanup
- Four hw-concept files ported to librespin namespace: agent flat file with brief body + three verbatim content-neutral hardware design templates (requirements schema, concept output, overview comparison)
- 7105-line merged SKILL.md with complete hw-concept-to-librespin-concept namespace replacement, Agent tool calls, and .librespin/ output paths
- SKILL.md phase dispatch wired for all 7 phases with config.yaml creation and per-phase state updates — multi-phase execution unblocked
- IoT sensor node complete YAML fixture and LED driver stripped YAML fixture created, plus CW-01 through CW-10 evidence checklist ready for manual walkthrough
- Full 7-phase hardware concept workflow executed on IoT sensor node requirements — 5 concepts generated, 4 validated, Concept A (STM32L053 + RFM95W LoRaWAN) recommended with score 92/100
- Background agent blocks AskUserQuestion
- Skill pack files relocated from .claude/ to repo root via git mv, installer repointed and extended with --uninstall branch, package.json files array updated — npx install/uninstall round-trip validated end-to-end
- .claude-plugin/plugin.json and marketplace.json created — repo is now both a Claude Code plugin marketplace and plugin, enabling `/plugin marketplace add LibreSpin/LibreSpin` + `/plugin install librespin`
- README.md replaced with 61-line quick-start covering marketplace install, npx install, /librespin:concept first run, 9-phase what-to-expect, and uninstall — satisfying PKG-03

---
