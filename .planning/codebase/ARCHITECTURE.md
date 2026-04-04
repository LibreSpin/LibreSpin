# Architecture

**Analysis Date:** 2026-04-04

## Pattern Overview

**Overall:** Modular plugin/skill architecture designed for Claude Code integration

**Key Characteristics:**
- CLI-driven workflow orchestration (analogous to Claude Code GSD)
- Modular skill-based design enabling incremental feature addition
- FOSS-only EDA stack (KiCAD, NGSpice)
- Human-in-the-loop design with quality gates
- AI-assisted guidance at each pipeline stage, not full automation

## Layers

**Pipeline Orchestration:**
- Purpose: Coordinate workflow from natural language requirements through production file export
- Location: `src/librespin/` (to be implemented)
- Contains: Workflow state machine, skill router, human decision gates
- Depends on: Individual skills, EDA tool integrations
- Used by: CLI entry point, Claude Code plugin harness

**Skill Layer:**
- Purpose: Implement individual design tasks (calculations, simulation, layout checks)
- Location: `src/librespin/skills/` (planned)
- Contains: CalcPad skill, SPICE simulation wrapper, ERC/DRC/DFM validators
- Depends on: External tools (NGSpice, KiCAD), utility functions
- Used by: Pipeline orchestration layer

**EDA Integration Layer:**
- Purpose: Abstract KiCAD and NGSpice interactions
- Location: `src/librespin/eda/` (planned)
- Contains: KiCAD file parsers, SPICE CLI wrapper, simulation result parsers
- Depends on: External command-line tools, file I/O
- Used by: Skills, result processors

**Utilities & Configuration:**
- Purpose: Shared helpers, path resolution, environment configuration
- Location: `src/librespin/utils/`, `src/librespin/config/` (planned)
- Contains: File helpers, logging setup, configuration loaders
- Depends on: Python stdlib
- Used by: All layers

## Data Flow

**Design Workflow:**

1. **Requirements Capture**: User provides natural language circuit description
2. **AI Interview**: Claude Code skill interviews user for clarifications, design constraints, performance targets
3. **Circuit Calculation**: CalcPad skill performs AI-assisted component selection and circuit calculations
4. **SPICE Simulation**: Simulation skill runs NGSpice, validates circuit behavior, reports results
5. **Layout Design**: KiCAD integration skill creates schematic and PCB layout with AI suggestions
6. **Design Checks**: ERC/DRC/DFM validation skill identifies violations and suggests fixes
7. **Production Export**: Gerber, drill files, BOM, pick-and-place data generated
8. **Human Review**: Comprehensive design report presented for final approval

**State Management:**
- Design state persists in KiCAD project files (`.kicad_pcb`, `.kicad_sch`, etc.)
- Intermediate results (simulation outputs, calculation sheets) stored in project subdirectories
- No centralized in-memory state — each skill operates on file-based project representation

## Key Abstractions

**Skill Interface:**
- Purpose: Standard contract for design tasks
- Examples: `CalcPadSkill`, `SimulationSkill`, `LayoutSkill`, `ValidationSkill` (to be implemented)
- Pattern: Each skill accepts project context and input parameters, returns results and design recommendations

**Design Project:**
- Purpose: Container for all project files and metadata
- Location: `src/librespin/project.py` (planned)
- Pattern: Manages KiCAD file paths, intermediate results, design history

**Workflow State Machine:**
- Purpose: Coordinate sequential design pipeline
- Location: `src/librespin/workflow.py` (planned)
- Pattern: Tracks current stage, manages transitions, enforces human decision gates

## Entry Points

**CLI Entry Point:**
- Location: `src/librespin/__main__.py` (planned)
- Triggers: `python -m librespin` or `librespin` command
- Responsibilities: Parse arguments, instantiate workflow, run pipeline

**Claude Code Plugin:**
- Location: Plugin harness/manifest (planned)
- Triggers: Via Claude Code skill selector
- Responsibilities: Adapt CLI workflow to Claude Code async callback model

**Programmatic Entry:**
- Location: `src/librespin/__init__.py`
- Pattern: Export main orchestration classes for use as library
- Responsibilities: Enable direct Python API usage

## Error Handling

**Strategy:** Fail-safe with detailed user reporting

**Patterns:**
- Validation errors captured at skill entry points with actionable feedback
- Tool integration failures (KiCAD, NGSpice not found) reported with setup instructions
- User-fixable design violations presented as repair suggestions, not failures
- Unrecoverable errors halt pipeline with diagnostic output, allow manual recovery

## Cross-Cutting Concerns

**Logging:** Python `logging` module with structured output (planned)
- DEBUG: Tool invocations, file operations
- INFO: Workflow progress, design milestone completions
- WARNING: Non-critical validation issues, tool version mismatches
- ERROR: Failures requiring user intervention

**Validation:** Multi-stage approach
- Input validation: User requirements parsed and clarified
- EDA tool validation: KiCAD, NGSpice availability checked at start
- Design validation: ERC/DRC/DFM performed at dedicated pipeline stage
- Human validation: Design report and approval gates before export

**AI Integration:** Claude Code plugin context
- Natural language requirements → requirements object (structured)
- AI recommendations → presented to user for decision
- User decisions → recorded in design history for audit trail

---

*Architecture analysis: 2026-04-04*
