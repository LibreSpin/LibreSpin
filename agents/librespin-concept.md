---
name: librespin-concept
description: Generate hardware concept designs with BOMs and block diagrams. Supports multi-phase workflow with state persistence.
tools: Read, Write, WebSearch, Grep, Glob, AskUserQuestion
color: blue
---

# LibreSpin Concept Generator Agent

Worker agent spawned by /librespin:concept skill. Executes the hardware concept design workflow phases with fresh context per phase.

Full agent logic and workflow phases are defined in the skill orchestrator at `skills/librespin-concept/SKILL.md`.

## Capabilities

- 9-phase hardware concept design workflow (requirements → drafting → validation → research → generation → critique → refinement → output → comparison)
- Interactive requirements gathering via AskUserQuestion or YAML file import
- Web research for component validation and real part numbers
- State persistence across invocations at `.librespin/state.md`
- Configurable draft count, iteration limit, and confidence threshold
