# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What LibreSpin Is

LibreSpin is an open-source, AI-driven end-to-end PCB and embedded circuit design workflow tool — analogous to Claude Code for software, but for hardware. The name follows LibrePCB convention: `Libre` = open source, `Spin` = EE slang for the full board design cycle ("spinning a board").

**Target pipeline:**
```
Natural language requirements interview
  → AI-assisted circuit calculations (CalcPad skill)
  → SPICE simulation (NGSpice CLI)
  → Schematic + PCB layout (KiCAD)
  → ERC / DRC / DFM checks
  → Production file export (Gerber, drill, BOM, pick-and-place)
  → Human review report
```

**Status:** Pre-alpha / planning. The repo currently contains only the package skeleton.

## Build & Dev Commands

```bash
# Install in editable mode (run from repo root)
pip install -e .

# Build distribution
pip install hatch
hatch build
```

The project uses `hatchling` as its build backend (`pyproject.toml`). Python ≥ 3.10 required.

## Project Structure

```
src/librespin/     # Main package (src layout)
pyproject.toml     # Build config, metadata, dependencies
```

The package uses a `src/` layout — imports go through `src/librespin/`, not the repo root.

## Key Decisions & Constraints

- **MIT license** — open source from day one.
- **FOSS EDA stack only:** KiCAD + NGSpice. No proprietary EDA dependencies.
- **CalcPad skill** will be recreated clean-room (original was written at a prior employer — do not reference or port that code).
- **Naming:** Display as `LibreSpin` (CamelCase); slugs/packages use `librespin` (lowercase).
- **Implementation target:** Claude Code plugin/skill harness (similar to GSD), Python CLI.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**LibreSpin**

An open-source, AI-driven end-to-end PCB and embedded circuit design workflow tool — packaged as a Claude Code skill pack (like GSD). LibreSpin wraps Claude Code with domain-specific skills that guide hardware designers from natural language requirements through to production-ready Gerber files. Target users: EE professionals, hobbyists, students, and anyone designing circuit boards.

**Core Value:** A minimal, lightweight harness that makes Claude Code an expert hardware design assistant — the intelligence lives in the prompts, not in code.

### Constraints

- **License**: MIT — open source from day one
- **EDA stack**: FOSS only — KiCad + NGSpice. No proprietary EDA dependencies
- **Minimalism**: Primary design goal. Fewer lines of code, not more. Markdown over Python. Prompt engineering over software engineering
- **CalcPad CE**: Clean-room skill implementation wrapping the CLI. Can reference CalcPad CE freely. Cannot reference or port employer's CalcPad skill
- **Distribution**: npx installer (like hw-concept) — copies skill files to ~/.claude/
- **Output directory**: .librespin/ per project (separate from GSD .planning/)
- **Python**: >= 3.10 (for any future utility scripts; not needed for v1 skill pack)
- **Node.js**: >= 18.0.0 (for npx installer)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Python 3.10+ - Core project language (requires Python >=3.10, tested on 3.12.3)
## Runtime
- Python 3.12.3 (local development)
- Requires Python >=3.10
- pip (via venv at `.venv/`)
- Lockfile: Missing (no constraints file, only pyproject.toml)
## Frameworks
- Hatchling 1.29.0 - Python packaging and build backend (specified in [project] build-system in `pyproject.toml`)
- Twine 6.2.0 - Package upload to PyPI
- Build 1.4.2 - Python project build tool
## Key Dependencies
- Rich 14.3.3 - Terminal formatting and output (likely for CLI workflows)
- Requests 2.33.1 - HTTP client library (API integrations with external services)
- Cryptography 46.0.6 - Encryption and cryptographic operations
- Certifi 2026.2.25 - SSL certificates for HTTPS connections
- Markdown-it-py 4.0.0 - Markdown parsing and rendering
- Readme-renderer 44.0.0 - README rendering for PyPI
- Keyring 25.7.0 - Credential storage (for PyPI publishing)
- Requests-toolbelt 1.0.0 - HTTP utilities
- Pluggy 1.6.0 - Plugin framework support
## Configuration
- Project name: `librespin`
- Project version: `0.0.1` (pre-alpha)
- License: MIT
- Keywords: `pcb`, `eda`, `kicad`, `ai`, `hardware`
- Build config: `pyproject.toml` (PEP 517/518 compliant)
- Build backend: Hatchling
- Entry points: None defined (library-only package in pre-alpha)
- Homepage: https://librespin.org
- Repository: https://github.com/LibreSpin/LibreSpin
- README: `README.md`
## Platform Requirements
- Python >=3.10
- Linux/macOS/Windows (no platform-specific dependencies detected)
- Virtualenv setup present at `.venv/`
- Python >=3.10 runtime
- No external service dependencies required for core module
- SSL/TLS support (via certifi for secure HTTP)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Modules use lowercase with underscores: `src/librespin/__init__.py`
- Descriptive module names reflect functionality (e.g., `circuit.py`, `simulator.py`, `layout.py`)
- Use snake_case for function names, following PEP 8
- Descriptive names that indicate purpose (e.g., `validate_design`, `generate_netlist`)
- Use snake_case for local variables and module-level variables
- Use UPPER_CASE for module-level constants
- Avoid single-letter variables except in obvious contexts (loop indices)
- Use PascalCase for class names
- Type hints encouraged (Python 3.10+ supports modern union syntax with `|`)
- Display name: `LibreSpin` (CamelCase, as per `CLAUDE.md`)
- Slug/import name: `librespin` (lowercase)
- Pattern: `src/librespin/` layout (source layout, not root layout)
## Code Style
- Follow PEP 8 as baseline
- Line length: Standard 79-88 characters (consider using Ruff or Black for enforcement in future)
- Indentation: 4 spaces (PEP 8 standard)
- Not yet configured (pre-alpha stage)
- Recommended future: Ruff (fast, modern Python linter) or Pylint
- Python version: 3.10+ required (`requires-python = ">=3.10"` in pyproject.toml)
## Import Organization
- Use absolute imports within the package: `from librespin.circuit import ...`
- Avoid relative imports in future code for clarity
- `src/librespin/__init__.py` serves as the package entry point with docstring explaining purpose
- Submodules organized by functional domain (circuit, simulation, layout, export, validation)
## Error Handling
- Raise descriptive custom exceptions for domain-specific errors
- Include context in exception messages (what failed and why)
- Use try/except for specific exceptions, not bare except clauses
- Log errors before raising when appropriate for debugging
## Logging
- Create logger per module: `logger = logging.getLogger(__name__)`
- Use appropriate log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Log at INFO level for major workflow steps, DEBUG for detailed diagnostics
- Include relevant context (design name, simulation parameters) in log messages
## Comments
- Explain *why*, not what (code shows what, comments explain decisions)
- Comment non-obvious algorithms or complex calculations
- Mark TODOs with context: `# TODO: Implement tolerance stack-up analysis (spec 2.3)`
- Document assumptions about input ranges or constraints
- Obvious comments that restate code: `x = 5  # Set x to 5`
- Outdated comments (remove rather than leaving stale notes)
- Use docstrings for modules, classes, and public functions (not applicable to TypeScript, but docstring pattern below)
## Docstrings
## Function Design
- Each function should do one thing well
- Extract complex logic into helper functions
- Limit to 4-5 parameters (use dataclass or dict for related params)
- Use type hints: `def validate(design: Design) -> ValidationResult:`
- Prefer keyword-only args for optional params: `def simulate(..., timeout_seconds: int = 60)`
- Return meaningful values or Result objects, not None for success
- Use tuple for multiple returns or dedicated result class
- Document what None means if it's a valid return
## Module Design
- Define `__all__` in each module to clarify public API:
- Use `src/librespin/__init__.py` as entry point, re-exporting key classes from submodules:
- `librespin/circuit/` — Design, Component, Netlist classes
- `librespin/simulator/` — SPICE integration, simulation runner
- `librespin/layout/` — PCB layout, routing (KiCAD integration)
- `librespin/validation/` — ERC, DRC, DFM checks
- `librespin/export/` — Gerber, BOM, production file export
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- CLI-driven workflow orchestration (analogous to Claude Code GSD)
- Modular skill-based design enabling incremental feature addition
- FOSS-only EDA stack (KiCAD, NGSpice)
- Human-in-the-loop design with quality gates
- AI-assisted guidance at each pipeline stage, not full automation
## Layers
- Purpose: Coordinate workflow from natural language requirements through production file export
- Location: `src/librespin/` (to be implemented)
- Contains: Workflow state machine, skill router, human decision gates
- Depends on: Individual skills, EDA tool integrations
- Used by: CLI entry point, Claude Code plugin harness
- Purpose: Implement individual design tasks (calculations, simulation, layout checks)
- Location: `src/librespin/skills/` (planned)
- Contains: CalcPad skill, SPICE simulation wrapper, ERC/DRC/DFM validators
- Depends on: External tools (NGSpice, KiCAD), utility functions
- Used by: Pipeline orchestration layer
- Purpose: Abstract KiCAD and NGSpice interactions
- Location: `src/librespin/eda/` (planned)
- Contains: KiCAD file parsers, SPICE CLI wrapper, simulation result parsers
- Depends on: External command-line tools, file I/O
- Used by: Skills, result processors
- Purpose: Shared helpers, path resolution, environment configuration
- Location: `src/librespin/utils/`, `src/librespin/config/` (planned)
- Contains: File helpers, logging setup, configuration loaders
- Depends on: Python stdlib
- Used by: All layers
## Data Flow
- Design state persists in KiCAD project files (`.kicad_pcb`, `.kicad_sch`, etc.)
- Intermediate results (simulation outputs, calculation sheets) stored in project subdirectories
- No centralized in-memory state — each skill operates on file-based project representation
## Key Abstractions
- Purpose: Standard contract for design tasks
- Examples: `CalcPadSkill`, `SimulationSkill`, `LayoutSkill`, `ValidationSkill` (to be implemented)
- Pattern: Each skill accepts project context and input parameters, returns results and design recommendations
- Purpose: Container for all project files and metadata
- Location: `src/librespin/project.py` (planned)
- Pattern: Manages KiCAD file paths, intermediate results, design history
- Purpose: Coordinate sequential design pipeline
- Location: `src/librespin/workflow.py` (planned)
- Pattern: Tracks current stage, manages transitions, enforces human decision gates
## Entry Points
- Location: `src/librespin/__main__.py` (planned)
- Triggers: `python -m librespin` or `librespin` command
- Responsibilities: Parse arguments, instantiate workflow, run pipeline
- Location: Plugin harness/manifest (planned)
- Triggers: Via Claude Code skill selector
- Responsibilities: Adapt CLI workflow to Claude Code async callback model
- Location: `src/librespin/__init__.py`
- Pattern: Export main orchestration classes for use as library
- Responsibilities: Enable direct Python API usage
## Error Handling
- Validation errors captured at skill entry points with actionable feedback
- Tool integration failures (KiCAD, NGSpice not found) reported with setup instructions
- User-fixable design violations presented as repair suggestions, not failures
- Unrecoverable errors halt pipeline with diagnostic output, allow manual recovery
## Cross-Cutting Concerns
- DEBUG: Tool invocations, file operations
- INFO: Workflow progress, design milestone completions
- WARNING: Non-critical validation issues, tool version mismatches
- ERROR: Failures requiring user intervention
- Input validation: User requirements parsed and clarified
- EDA tool validation: KiCAD, NGSpice availability checked at start
- Design validation: ERC/DRC/DFM performed at dedicated pipeline stage
- Human validation: Design report and approval gates before export
- Natural language requirements → requirements object (structured)
- AI recommendations → presented to user for decision
- User decisions → recorded in design history for audit trail
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
