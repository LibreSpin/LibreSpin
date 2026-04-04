# Codebase Concerns

**Analysis Date:** 2026-04-04

## Pre-Alpha Status & Incomplete Architecture

**Foundation Not Yet Laid:**
- Issue: Project is in "Development Status :: 1 - Planning" with only package skeleton (5 lines in `src/librespin/__init__.py`)
- Files: `src/librespin/__init__.py`, `pyproject.toml`
- Impact: No production-ready code exists. All core functionality (circuit calculations, SPICE simulation orchestration, KiCAD integration, design rule checking) is unimplemented
- Fix approach: Establish architectural foundation before feature development. Define core module structure (calculation engine, simulator bridge, EDA orchestrator, design checker). Start with spike/MVP for one pipeline stage.

## Vague Dependency Strategy

**Missing Concrete Dependencies:**
- Issue: `pyproject.toml` defines no project dependencies despite ambitious feature scope (AI calculations, SPICE simulation, KiCAD integration)
- Files: `pyproject.toml`
- Impact: Unclear how external tools (NGSpice CLI, KiCAD) will be integrated. No clarity on Python libraries for circuit calculation, simulation interfacing, or design rule checks. Risk of choosing incompatible library combinations later.
- Fix approach: Create explicit dependency list mapping each pipeline stage to libraries. Evaluate: CalcPad recreation (pure Python or wrapped library?), SPICE bridge (subprocess wrapper vs PySpice vs ngspice-python?), KiCAD integration (PCBNew API vs file-based), ERC/DRC (custom or KiCAD plugin model?). Document rationale in ADR.

## CalcPad Clean-Room Reimplementation Risk

**Intellectual Property & Knowledge Constraints:**
- Issue: CalcPad (circuit calculation skill) must be implemented without referencing original code from prior employment
- Files: (TBD - not yet implemented)
- Current mitigation: CLAUDE.md explicitly prohibits porting prior code
- Impact: High risk of incomplete or suboptimal circuit calculation engine. CalcPad is core to pipeline — weak implementation blocks entire workflow. Time pressure may tempt spec violations.
- Recommendations: 
  1. Document CalcPad specification (input/output contracts, calculation categories) before implementation starts
  2. Review completed CalcPad code with legal/IP counsel before merge
  3. Implement calculation categories incrementally with test cases derived from published EE references (not prior code)
  4. Consider starting with subset: basic passive calculations before advanced amplifier/filter synthesis

## KiCAD Integration Complexity & Coupling

**Unknown Integration Pattern:**
- Issue: KiCAD integration approach undefined (PCBNew Python plugin API vs file-based KiCAD-to-schematic/layout vs standalone schematic/PCB generation)
- Files: (TBD)
- Impact: Early design decisions here will lock in entire schema generation strategy. Wrong choice makes layout automation fragile or impossible.
- Improvement path: 
  1. Spike KiCAD Python plugin API (complexity, version stability, maintainability)
  2. Spike file-based approach (KiCAD symbol/footprint library integration, board format version compatibility)
  3. Evaluate: native Python schematic/PCB generation (more control, zero KiCAD dependency, but reinvents EDA wheels)
  4. Document chosen approach in architecture decision record before implementing `src/librespin/eda/` module

## FOSS-Only Constraint Viability

**Tool Availability & Feature Gaps:**
- Issue: Explicit constraint to use KiCAD + NGSpice only. No proprietary EDA tools allowed.
- Files: CLAUDE.md (constraint noted, no alternative specified)
- Current capacity: NGSpice for circuit simulation, KiCAD for schematic/layout/DRC. No explicit DFM (Design for Manufacture) tooling in FOSS stack.
- Limit: Manufacturing rule checks beyond KiCAD DRC (panelization, assembly compatibility, cost optimization) not available in open-source. May require custom rule engine or third-party integration.
- Scaling path: Define DFM scope early. Build custom rule validator for assembly/manufacturing constraints, or integrate with open-source DFM tools (FreeCAD?). Document tradeoff vs proprietary solutions.

## SPICE Simulation Bridge Uncertainty

**Process Management & Error Handling Unknown:**
- Issue: NGSpice CLI subprocess orchestration strategy not defined. No error handling, timeout, output parsing, or result serialization planned.
- Files: (TBD)
- Impact: High-risk integration point. SPICE failures could hang the entire pipeline, corrupt intermediate state, or fail silently.
- Improvement path: 
  1. Design subprocess wrapper with explicit lifecycle: spawn, write netlist, monitor execution, parse results, cleanup
  2. Implement timeout guards (user-configurable, with reasonable defaults)
  3. Handle common failures: syntax errors in generated netlist, convergence failures, tool unavailability
  4. Serialize results to persistent format (JSON?) for audit trail and debugging
  5. Add logging at simulation boundary for observability

## Test Coverage Gaps — Critical Path Untested

**What's Not Tested:**
- Entire pipeline integration (requirements → final production files). No integration tests, end-to-end tests, or manual test procedures documented.
- CalcPad calculation correctness against published EE standards
- SPICE netlist generation from circuit specification
- KiCAD layout rule compliance
- Error handling and user feedback for pipeline failures
- Files: All (not yet written)
- Risk: Shipping broken workflows. Early users encounter unusable pipeline before hitting documented constraints.
- Priority: HIGH. Scope test plan before implementation:
  1. Unit tests for each calculation module (with reference values from EE handbooks)
  2. Integration tests for pipeline stages (mock SPICE for now)
  3. Fixture library for test circuits (simple RC, amplifier, mixed-signal examples)
  4. Regression suite for major pipeline changes

## Human Review Report Generation — Undefined

**Missing Final Pipeline Stage:**
- Issue: Target pipeline ends with "Human review report" but no specification for report content, format, or generation logic
- Files: README.md (promised but unspecified)
- Impact: Pipeline incomplete until review report automated. Unclear what data to collect, how to present design decisions, what constraints to highlight.
- Fix approach: Define report specification: sections (schematic image, BOM with sourcing links, constraint compliance checklist, simulation results, DRC/ERC summary, production file manifest). Prototype with manual report, then automate generation.

## Python Version Constraint (≥3.10)

**Maintenance Burden:**
- Issue: Requires Python ≥3.10. No mention of upper-bound or legacy version support strategy.
- Files: `pyproject.toml`
- Impact: Drops support for Python 3.9 (still actively maintained). May limit adoption in locked-down environments. No guidance if future versions introduce breaking changes.
- Recommendations: 
  1. Document why 3.10 minimum (match-statement syntax? structural pattern matching? newer typing features?)
  2. Add upper-bound check if code uses 3.11+ features (e.g., tomllib)
  3. CI/CD should test against minimum (3.10) and latest stable (3.12+)

## Missing Build & Distribution Validation

**No Build Verification:**
- Issue: `hatchling` configured but no CI pipeline, build testing, or distribution validation
- Files: `pyproject.toml`, `dist/` (exists but likely stale)
- Impact: High risk of broken distributions. Forgotten data files, missing dependencies, import errors on clean install not caught until user reports.
- Improvement path: Add GitHub Actions (or similar) CI:
  1. Build wheel on Python 3.10, 3.11, 3.12
  2. Install in fresh venv, run import checks
  3. Run test suite
  4. Validate package metadata (no missing files in MANIFEST)

## Documentation Sparse — User & Developer Guidance Missing

**Installation Not Documented:**
- Issue: CLAUDE.md includes dev setup (`pip install -e .`) but no user installation guide, getting started guide, or feature roadmap
- Files: README.md (5 lines), CLAUDE.md (51 lines, developer-focused)
- Impact: Early adopters confused about project maturity, installation path, use cases. No roadmap to understand when features will ship.
- Fix approach: 
  1. Expand README.md: "Status" section (pre-alpha, no shipped features yet), "Getting Started" (install + minimal example), "Roadmap" (current focus, blockers)
  2. Create docs/ structure: architecture.md (layer descriptions), pipeline.md (stage-by-stage flow), faq.md
  3. Add CONTRIBUTING.md with dev setup and PR guidelines

## Git History Minimal — No Semantic Versioning Path

**No Release Strategy:**
- Issue: Only 2 commits in repo. Version pinned at "0.0.1" with no versioning or release planning
- Files: `pyproject.toml`
- Current capacity: Pre-alpha skeleton only
- Limit: No clear path to 0.1.0 release criteria or breaking change handling
- Scaling path: Define versioning policy (semantic versioning recommended). Set 0.1.0 entry criteria (e.g., "complete first end-to-end pipeline stage"). Plan breaking change communication for pre-1.0 versions.

## License & Legal Considerations

**MIT but Constraints Not Formalized:**
- Issue: MIT license declared but no CONTRIBUTORS.md, CLA, or IP agreement process documented
- Files: LICENSE, pyproject.toml
- Current mitigation: CLAUDE.md mentions "clean-room" CalcPad but no formal process
- Impact: Unclear how external contributors should handle IP. Risk of conflicting contributions or legal ambiguity.
- Recommendations: 
  1. Add CONTRIBUTORS.md documenting contribution process and IP expectations
  2. Require commit signatures (git config user.signingkey) for accountability
  3. Consider DCO (Developer Certificate of Origin) if planning external contributions

---

*Concerns audit: 2026-04-04*
