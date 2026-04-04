# Coding Conventions

**Analysis Date:** 2026-04-04

## Naming Patterns

**Files:**
- Modules use lowercase with underscores: `src/librespin/__init__.py`
- Descriptive module names reflect functionality (e.g., `circuit.py`, `simulator.py`, `layout.py`)

**Functions:**
- Use snake_case for function names, following PEP 8
- Descriptive names that indicate purpose (e.g., `validate_design`, `generate_netlist`)

**Variables:**
- Use snake_case for local variables and module-level variables
- Use UPPER_CASE for module-level constants
- Avoid single-letter variables except in obvious contexts (loop indices)

**Types:**
- Use PascalCase for class names
- Type hints encouraged (Python 3.10+ supports modern union syntax with `|`)

**Package/Module Naming:**
- Display name: `LibreSpin` (CamelCase, as per `CLAUDE.md`)
- Slug/import name: `librespin` (lowercase)
- Pattern: `src/librespin/` layout (source layout, not root layout)

## Code Style

**Formatting:**
- Follow PEP 8 as baseline
- Line length: Standard 79-88 characters (consider using Ruff or Black for enforcement in future)
- Indentation: 4 spaces (PEP 8 standard)

**Linting:**
- Not yet configured (pre-alpha stage)
- Recommended future: Ruff (fast, modern Python linter) or Pylint
- Python version: 3.10+ required (`requires-python = ">=3.10"` in pyproject.toml)

## Import Organization

**Order:**
1. Standard library imports (e.g., `import os`, `import sys`)
2. Third-party imports (e.g., `import numpy`, `import kicad_api`)
3. Local application imports (e.g., `from librespin.circuit import Design`)

**Path Aliases:**
- Use absolute imports within the package: `from librespin.circuit import ...`
- Avoid relative imports in future code for clarity

**Imports in Package:**
- `src/librespin/__init__.py` serves as the package entry point with docstring explaining purpose
- Submodules organized by functional domain (circuit, simulation, layout, export, validation)

## Error Handling

**Patterns:**
- Raise descriptive custom exceptions for domain-specific errors
- Include context in exception messages (what failed and why)
- Use try/except for specific exceptions, not bare except clauses
- Log errors before raising when appropriate for debugging

**Exception Pattern (future):**
```python
class CircuitValidationError(Exception):
    """Raised when circuit design fails validation checks."""
    pass

def validate_design(design):
    if not design.components:
        raise CircuitValidationError("Design must contain at least one component")
```

## Logging

**Framework:** Use Python's standard `logging` module (not print statements for debug/info)

**Patterns:**
- Create logger per module: `logger = logging.getLogger(__name__)`
- Use appropriate log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL
- Log at INFO level for major workflow steps, DEBUG for detailed diagnostics
- Include relevant context (design name, simulation parameters) in log messages

**Example:**
```python
import logging

logger = logging.getLogger(__name__)

def simulate_circuit(design):
    logger.info(f"Starting simulation for design: {design.name}")
    try:
        result = run_spice(design)
        logger.debug(f"Simulation converged: {result.status}")
        return result
    except Exception as e:
        logger.error(f"Simulation failed for {design.name}: {e}")
        raise
```

## Comments

**When to Comment:**
- Explain *why*, not what (code shows what, comments explain decisions)
- Comment non-obvious algorithms or complex calculations
- Mark TODOs with context: `# TODO: Implement tolerance stack-up analysis (spec 2.3)`
- Document assumptions about input ranges or constraints

**Avoid:**
- Obvious comments that restate code: `x = 5  # Set x to 5`
- Outdated comments (remove rather than leaving stale notes)

**JSDoc/TSDoc:**
- Use docstrings for modules, classes, and public functions (not applicable to TypeScript, but docstring pattern below)

## Docstrings

**Module level:**
```python
"""
Circuit design workflow module.

Handles schematic creation, component placement, and netlist generation.
"""
```

**Function/Class level (Google style):**
```python
def calculate_trace_impedance(width: float, height: float, er: float) -> float:
    """Calculate trace impedance for PCB routing.
    
    Args:
        width: Trace width in mm
        height: Trace height above reference plane in mm
        er: Relative permittivity of dielectric
    
    Returns:
        Impedance in ohms
    
    Raises:
        ValueError: If width or height <= 0
    """
```

## Function Design

**Size:** Keep functions focused and under ~40 lines (rule of thumb)
- Each function should do one thing well
- Extract complex logic into helper functions

**Parameters:**
- Limit to 4-5 parameters (use dataclass or dict for related params)
- Use type hints: `def validate(design: Design) -> ValidationResult:`
- Prefer keyword-only args for optional params: `def simulate(..., timeout_seconds: int = 60)`

**Return Values:**
- Return meaningful values or Result objects, not None for success
- Use tuple for multiple returns or dedicated result class
- Document what None means if it's a valid return

## Module Design

**Exports:**
- Define `__all__` in each module to clarify public API:
  ```python
  __all__ = ["Design", "validate_design", "export_netlist"]
  ```

**Barrel Files:**
- Use `src/librespin/__init__.py` as entry point, re-exporting key classes from submodules:
  ```python
  from librespin.circuit import Design, Component
  from librespin.validator import validate_design
  
  __all__ = ["Design", "Component", "validate_design"]
  ```

**Submodule Organization (proposed):**
- `librespin/circuit/` — Design, Component, Netlist classes
- `librespin/simulator/` — SPICE integration, simulation runner
- `librespin/layout/` — PCB layout, routing (KiCAD integration)
- `librespin/validation/` — ERC, DRC, DFM checks
- `librespin/export/` — Gerber, BOM, production file export

---

*Convention analysis: 2026-04-04*
