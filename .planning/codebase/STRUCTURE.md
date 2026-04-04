# Codebase Structure

**Analysis Date:** 2026-04-04

## Directory Layout

```
librespin/
├── src/
│   └── librespin/           # Main package (src layout)
│       ├── __init__.py      # Package root, public API exports
│       ├── __main__.py      # CLI entry point (planned)
│       ├── workflow.py      # Workflow state machine (planned)
│       ├── project.py       # Design project container (planned)
│       │
│       ├── skills/          # Individual design task implementations (planned)
│       │   ├── __init__.py
│       │   ├── calcpad.py   # Circuit calculation skill
│       │   ├── simulate.py  # SPICE simulation skill
│       │   ├── layout.py    # Schematic/PCB layout skill
│       │   └── validate.py  # ERC/DRC/DFM validation skill
│       │
│       ├── eda/             # EDA tool integrations (planned)
│       │   ├── __init__.py
│       │   ├── kicad.py     # KiCAD file handling, project management
│       │   ├── spice.py     # NGSpice simulation wrapper
│       │   └── parsers.py   # Result parsing (simulation, checks)
│       │
│       ├── config/          # Configuration (planned)
│       │   ├── __init__.py
│       │   └── settings.py  # Environment, paths, defaults
│       │
│       └── utils/           # Shared utilities (planned)
│           ├── __init__.py
│           ├── logging.py   # Structured logging setup
│           └── helpers.py   # File operations, text processing
│
├── tests/                   # Unit and integration tests (planned)
│   ├── conftest.py         # pytest fixtures
│   ├── unit/               # Unit tests by module
│   │   ├── test_workflow.py
│   │   ├── test_project.py
│   │   └── skills/
│   │       ├── test_calcpad.py
│   │       ├── test_simulate.py
│   │       └── ...
│   └── integration/        # End-to-end workflow tests (planned)
│       └── test_full_pipeline.py
│
├── docs/                    # User and developer documentation (planned)
│   ├── api.md              # Python API reference
│   ├── workflow.md         # Pipeline design and extension
│   ├── skills.md           # Skill development guide
│   └── dev_setup.md        # Development environment setup
│
├── examples/                # Example projects and templates (planned)
│   └── simple_led_circuit/  # Minimal working example
│
├── pyproject.toml          # Build config, dependencies, project metadata
├── README.md               # Project overview
├── LICENSE                 # MIT license
└── CLAUDE.md              # Developer guidance for Claude Code

```

## Directory Purposes

**src/librespin/:**
- Purpose: Main package implementation (src layout per PEP 517)
- Contains: All production Python code
- Key files: `__init__.py` (public API), `__main__.py` (CLI entry)

**src/librespin/skills/:**
- Purpose: Pluggable design task implementations
- Contains: CalcPad, simulation, layout, validation skills as separate modules
- Pattern: Each skill exports a consistent interface (input validation, execution, result formatting)

**src/librespin/eda/:**
- Purpose: Abstract EDA tool integration
- Contains: KiCAD file parsers, SPICE simulation wrapper, result parsers
- Pattern: High-level abstractions over CLI tools and file formats

**src/librespin/config/:**
- Purpose: Centralized configuration and environment setup
- Contains: Path resolution, tool availability checks, user preferences
- Pattern: Load on package initialization, available module-wide

**src/librespin/utils/:**
- Purpose: Shared helper functions
- Contains: Logging setup, file operations, text processing, validation helpers
- Pattern: Stateless utilities, no domain-specific logic

**tests/:**
- Purpose: Test suite (unit, integration, and e2e)
- Contains: pytest tests organized by module structure
- Pattern: Mirror src/ structure, use fixtures for common setup

**docs/:**
- Purpose: Developer and user documentation
- Contains: API reference, workflow extension guide, skill development guide
- Pattern: Markdown files with code examples

**examples/:**
- Purpose: Reference projects and templates
- Contains: Minimal complete project examples (e.g., simple LED circuit)
- Pattern: Real KiCAD projects demonstrating typical workflows

## Key File Locations

**Entry Points:**
- `src/librespin/__init__.py`: Package root, exports public API (Workflow, Project, Skills)
- `src/librespin/__main__.py`: CLI entry point, argument parsing, workflow instantiation (planned)
- `pyproject.toml`: Package metadata, dependencies, build backend

**Configuration:**
- `pyproject.toml`: Build system config, project metadata, tool settings
- `src/librespin/config/settings.py`: Runtime configuration, path resolution (planned)

**Core Logic:**
- `src/librespin/workflow.py`: Pipeline state machine, skill orchestration (planned)
- `src/librespin/project.py`: Design project container, file management (planned)
- `src/librespin/skills/`: Individual design task implementations

**EDA Integration:**
- `src/librespin/eda/kicad.py`: KiCAD file handling, project creation
- `src/librespin/eda/spice.py`: NGSpice simulation execution and parsing
- `src/librespin/eda/parsers.py`: Result parsing (ERC/DRC/DFM violations)

**Testing:**
- `tests/conftest.py`: pytest fixtures (temporary project directories, mock tools)
- `tests/unit/`: Unit tests parallel to src/ structure
- `tests/integration/`: End-to-end workflow tests

## Naming Conventions

**Files:**
- Module files: `snake_case.py` (e.g., `calcpad.py`, `kicad.py`)
- Test files: `test_*.py` (e.g., `test_calcpad.py`)
- Configuration: `settings.py`, `config.py`
- Main entry: `__main__.py`

**Directories:**
- Package dirs: `snake_case/` (e.g., `skills/`, `eda/`, `config/`)
- Test directories: Parallel to src structure (e.g., `tests/unit/skills/`)
- Examples: Kebab-case for project names (e.g., `simple_led_circuit/`)

**Python Classes:**
- Skill classes: `[Name]Skill` (e.g., `CalcPadSkill`, `SimulationSkill`)
- Project/workflow: `Project`, `Workflow`
- Exceptions: `[Context]Error` or `[Context]Exception` (e.g., `SimulationError`, `ToolNotFoundError`)

**Functions/Methods:**
- camelCase reserved for integration points with external tools
- snake_case for internal Python functions
- Public functions documented with docstrings (Google style)
- Private functions prefixed with `_` (e.g., `_parse_spice_output`)

**Variables:**
- Configuration: UPPER_CASE constants (e.g., `DEFAULT_TIMEOUT`, `TOOL_PATHS`)
- Instances: snake_case (e.g., `workflow`, `project`, `simulation_results`)
- Type hints: PEP 484 style (e.g., `project: Project`, `results: Dict[str, Any]`)

## Where to Add New Code

**New Design Skill:**
- Primary code: `src/librespin/skills/[skill_name].py` (e.g., `bom_generator.py`)
- Class name: `[Name]Skill` inheriting from base skill interface
- Tests: `tests/unit/skills/test_[skill_name].py`
- Registration: Add to skill loader in `src/librespin/workflow.py`

**New EDA Tool Integration:**
- Implementation: `src/librespin/eda/[tool_name].py` (e.g., `freeroute.py` for auto-router)
- Wrapper class: High-level abstraction over CLI invocation
- Parser: Add to `parsers.py` if result processing needed
- Tests: `tests/unit/eda/test_[tool_name].py`

**Utilities & Helpers:**
- Shared functions: `src/librespin/utils/[category].py` (e.g., `file_helpers.py`, `validators.py`)
- No domain-specific logic — only reusable utility code
- Well-documented with docstrings and examples

**Configuration/Constants:**
- Tool paths, timeouts: `src/librespin/config/settings.py`
- Environment variables: Document in CLAUDE.md and docs/dev_setup.md
- Feature flags: Add to settings with clear default behavior

**New Feature Spanning Multiple Modules:**
1. Update `src/librespin/workflow.py` for orchestration changes
2. Add/modify skills in `src/librespin/skills/`
3. Extend `src/librespin/eda/` if tool interaction needed
4. Add comprehensive tests before merging

## Special Directories

**dist/:**
- Purpose: Build output directory
- Generated: Yes (via `hatch build`)
- Committed: No (in .gitignore)

**.venv/:**
- Purpose: Python virtual environment
- Generated: Yes (via `python -m venv .venv`)
- Committed: No (in .gitignore)

**.planning/codebase/:**
- Purpose: Generated codebase analysis documents
- Generated: Yes (by GSD mapper)
- Committed: Yes (provides context for future phases)

**.git/:**
- Purpose: Git repository metadata
- Committed: Yes
- Contents: Full commit history, branch metadata

---

*Structure analysis: 2026-04-04*
