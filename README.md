# LibreSpin

AI-driven hardware concept design for Claude Code. Describe your circuit in plain English and LibreSpin generates 4-6 fully evaluated architecture concepts — complete with bills of materials, block diagrams, and a side-by-side comparison matrix.

## What's Available

| Feature | Status |
|---------|--------|
| `/librespin:concept` — 9-phase concept workflow | ✅ v1.0 |
| Plugin marketplace install | ✅ v1.0 |
| Circuit calculations (CalcPad CE) | 📋 v2.0 |
| SPICE simulation (NGSpice) | 📋 v2.0 |
| ERC / DRC / DFM checks | 📋 v3.0 |
| Production file export (KiCad CLI) | 📋 v4.0 |
| Schematic + PCB layout | 📋 v5–6.0 |

## Install

```
/plugin marketplace add LibreSpin/LibreSpin
/plugin install librespin
```

Then reload plugins when prompted.

> **npx install is not yet supported.** The `npx librespin-install` path is present in the repo but not yet published to npm. Use the plugin marketplace above.

## Prerequisites

- [Claude Code](https://claude.ai/code)

## Quick Start

After installing, open any project and run:

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
/plugin uninstall librespin
```

## License

MIT
