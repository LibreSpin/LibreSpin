# LibreSpin

AI-driven hardware concept design for Claude Code. Describe your circuit in plain English and LibreSpin generates 4-6 fully evaluated architecture concepts — complete with bills of materials, block diagrams, and a side-by-side comparison matrix.

**Status:** Pre-alpha. The concept workflow is functional; SPICE simulation, KiCad integration, and production export are on the v2+ roadmap.

## Install

**Via Claude Code plugin marketplace (recommended)**

```
/plugin marketplace add LibreSpin/LibreSpin
/plugin install librespin
```

**Via npx (also installs YAML templates)**

```
npx librespin-install
```

Use `--local` to install into the current project's `.claude/` instead of `~/.claude/`.

## Prerequisites

- [Claude Code](https://claude.ai/code)
- Node.js >= 18 (only required for the npx installer)

## Quick Start

After installing, restart Claude Code, open any project, and run:

```
/librespin:concept
```

LibreSpin will ask you a series of questions about your hardware requirements (target use case, power budget, connectivity, environment, cost), then drive a 9-phase workflow:

1. Requirements gathering and completeness scoring
2. Architecture concept generation (4-6 diverse approaches)
3. Concept validation against confidence thresholds
4. Component research with real part numbers
5. Detailed block diagrams with MPNs
6. Self-critique and refinement
7. Quality scoring
8. Cross-concept comparison
9. Recommendation with comparison matrix

Expect the full workflow to take roughly 5-15 minutes depending on complexity. All output is written to `.librespin/` in your project.

## Uninstall

```
npx librespin-install --uninstall
```

Add `--local` if you installed locally.

## License

MIT
