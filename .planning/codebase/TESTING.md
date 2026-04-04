# Testing Patterns

**Analysis Date:** 2026-04-04

## Test Framework

**Runner:**
- Not yet configured (pre-alpha stage)
- Recommended: `pytest` (de facto Python standard, excellent plugin ecosystem)
- Alternative: `unittest` (standard library, more verbose)

**Assertion Library:**
- `pytest` built-in assertions (simple and expressive)
- Third-party: `pytest-sugar` for better output formatting

**Run Commands (when pytest is added):**
```bash
pytest                 # Run all tests
pytest -v              # Verbose output with test names
pytest -s              # Show print statements and logging
pytest --cov           # Generate coverage report
pytest -k "pattern"    # Run tests matching pattern
pytest tests/unit/     # Run specific test directory
pytest -x              # Stop on first failure
```

**Installation (when ready):**
```bash
pip install pytest pytest-cov
```

## Test File Organization

**Location:**
- Co-located pattern preferred: `src/librespin/circuit.py` pairs with `tests/unit/test_circuit.py`
- Alternative: `tests/librespin/circuit/` mirrors source structure
- Keep tests outside `src/` directory for clean package distribution

**Naming:**
- Test modules: `test_<module_name>.py`
- Test classes: `Test<Class>` (e.g., `TestDesign` for `Design` class)
- Test functions: `test_<function>_<scenario>` (e.g., `test_validate_design_with_no_components`)

**Structure:**
```
tests/
├── unit/               # Fast, isolated tests (no I/O, no networking)
│   ├── test_circuit.py
│   ├── test_validator.py
│   └── test_layout.py
├── integration/        # Slower tests involving multiple modules
│   ├── test_design_workflow.py
│   └── test_kicad_export.py
├── fixtures/           # Shared test data
│   ├── conftest.py     # pytest fixtures
│   ├── sample_designs.py
│   └── mock_kicad.py
└── e2e/               # End-to-end tests (if added later)
    └── test_full_pipeline.py
```

## Test Structure

**Suite Organization:**
```python
# tests/unit/test_circuit.py

import pytest
from librespin.circuit import Design, Component, CircuitError

class TestDesign:
    """Test suite for Design class."""
    
    @pytest.fixture
    def empty_design(self):
        """Provide a fresh empty design for each test."""
        return Design(name="test_design")
    
    def test_design_creation(self, empty_design):
        """Design should initialize with name and empty component list."""
        assert empty_design.name == "test_design"
        assert len(empty_design.components) == 0
    
    def test_add_component(self, empty_design):
        """Adding component should update component list."""
        comp = Component(name="R1", value="1k")
        empty_design.add_component(comp)
        assert len(empty_design.components) == 1
        assert empty_design.components[0].name == "R1"
    
    def test_validate_empty_design_fails(self, empty_design):
        """Design with no components should fail validation."""
        with pytest.raises(CircuitError):
            empty_design.validate()

class TestComponent:
    """Test suite for Component class."""
    
    def test_component_value_parsing(self):
        """Component should parse resistor values with multipliers."""
        comp = Component(name="R1", value="1k5")
        assert comp.value_ohms == 1500
    
    def test_invalid_component_raises(self):
        """Invalid component value should raise on creation."""
        with pytest.raises(ValueError):
            Component(name="R1", value="invalid")
```

**Patterns:**
- Use class-based organization for related tests (`TestDesign`, `TestComponent`)
- Use pytest fixtures for setup/teardown (`@pytest.fixture`)
- Name fixtures descriptively: `empty_design`, `valid_design_with_components`
- One assertion per test is ideal; multiple OK if testing a single behavior

## Mocking

**Framework:** `unittest.mock` (standard library) or `pytest-mock`

**Patterns:**
```python
import pytest
from unittest.mock import Mock, patch, call
from librespin.simulator import SPICESimulator

class TestSPICESimulator:
    """Test SPICE integration."""
    
    def test_simulator_calls_ngspice_with_correct_netlist(self, mocker):
        """Verify simulator passes correct netlist to ngspice CLI."""
        # Mock the external subprocess call
        mock_run = mocker.patch("subprocess.run")
        mock_run.return_value = Mock(returncode=0, stdout="simulation completed")
        
        simulator = SPICESimulator()
        netlist = "* Test circuit\nV1 1 0 DC 5V\nR1 1 2 1k"
        result = simulator.run(netlist)
        
        # Verify ngspice was called with correct args
        mock_run.assert_called_once()
        args = mock_run.call_args[0][0]
        assert "ngspice" in args[0]
    
    def test_design_export_to_kicad(self, mocker):
        """Design export should call KiCAD API with correct structure."""
        mock_kicad = mocker.patch("librespin.layout.kicad_api.create_schematic")
        
        design = Design(name="test")
        design.add_component(Component("R1", "10k"))
        
        design.export_to_kicad()
        
        mock_kicad.assert_called_once()
        call_args = mock_kicad.call_args
        assert len(call_args.kwargs["components"]) == 1
```

**What to Mock:**
- External services (KiCAD, NGSpice, cloud APIs)
- File I/O operations (when not testing actual file writing)
- Slow operations (database calls, network requests)
- Random number generators (to ensure deterministic tests)

**What NOT to Mock:**
- Internal business logic you're testing
- Data structures (use real objects)
- Standard library functions (unless testing error handling)

## Fixtures and Factories

**Test Data:**
```python
# tests/fixtures/conftest.py

import pytest
from librespin.circuit import Design, Component

@pytest.fixture
def simple_resistor_circuit():
    """Provide a simple R circuit: 5V source -> 1k resistor -> GND."""
    design = Design(name="simple_r_circuit")
    design.add_component(Component("V1", "5V", type="voltage_source"))
    design.add_component(Component("R1", "1k", type="resistor"))
    return design

@pytest.fixture
def complex_filter_design():
    """Provide a multi-stage active filter design."""
    design = Design(name="active_filter")
    # Add opamp, resistors, capacitors, voltage rails
    return design

class ComponentFactory:
    """Factory for generating test components."""
    
    @staticmethod
    def resistor(name="R1", value="1k"):
        return Component(name, value, type="resistor")
    
    @staticmethod
    def capacitor(name="C1", value="100nF"):
        return Component(name, value, type="capacitor")
    
    @staticmethod
    def opamp(name="U1", model="TL072"):
        return Component(name, value=model, type="opamp")

# Usage in tests:
def test_rc_filter_response():
    design = Design(name="rc_filter")
    design.add_component(ComponentFactory.resistor("R1", "10k"))
    design.add_component(ComponentFactory.capacitor("C1", "100nF"))
    # ... test filter behavior
```

**Location:**
- `tests/fixtures/conftest.py` — Shared pytest fixtures (auto-discovered)
- `tests/fixtures/factories.py` — Factory classes for test data
- `tests/fixtures/sample_designs.py` — Pre-built design examples (JSON/YAML)

## Coverage

**Requirements:** Not yet enforced (pre-alpha)
- Target: 80%+ coverage for core logic (circuit validation, export)
- Target: 70%+ for simulator and layout modules
- Lower priority: CLI/user interface code

**View Coverage:**
```bash
pytest --cov=librespin --cov-report=html
# Opens htmlcov/index.html with detailed coverage report

pytest --cov=librespin --cov-report=term-missing
# Shows coverage % + lines not covered in terminal
```

**Configuration (when added to pyproject.toml):**
```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "--cov=librespin --cov-report=html --cov-report=term-missing"
minversion = "7.0"
```

## Test Types

**Unit Tests:**
- Scope: Single function or class method
- Approach: Fast, isolated, no external dependencies
- File location: `tests/unit/test_<module>.py`
- Example: Testing `Component.value_parser()` with various resistor value formats

**Integration Tests:**
- Scope: Multiple modules working together (Design + Validator + Exporter)
- Approach: Use real objects, mock external services only
- File location: `tests/integration/test_<workflow>.py`
- Example: Full design validation flow from creation through checks

**E2E Tests:**
- Scope: Full pipeline from input to output
- Framework: Not yet implemented (added later if needed)
- Approach: Use actual KiCAD and NGSpice if available in CI environment
- File location: `tests/e2e/test_<pipeline>.py`
- Example: Load design requirements → simulate → export Gerbers

## Common Patterns

**Async Testing:**
Not applicable (project is synchronous Python). If async added in future:
```python
import pytest
import asyncio

@pytest.mark.asyncio
async def test_async_simulation():
    """Test asynchronous simulation runner."""
    simulator = AsyncSPICESimulator()
    result = await simulator.run_async(netlist)
    assert result.converged
```

**Error Testing:**
```python
def test_validation_catches_floating_nets(self):
    """Design validation should reject unconnected nets."""
    design = Design(name="floating_nets")
    design.add_component(Component("R1", "1k"))  # Not connected
    
    with pytest.raises(CircuitValidationError) as exc_info:
        design.validate()
    
    assert "floating" in str(exc_info.value).lower()

def test_missing_required_parameter(self):
    """Component should require value parameter."""
    with pytest.raises(ValueError, match="value.*required"):
        Component(name="R1")  # Missing value
```

**Parametrized Testing:**
```python
@pytest.mark.parametrize("value_str,expected_ohms", [
    ("1k", 1000),
    ("1.5k", 1500),
    ("10m", 0.01),
    ("100", 100),
])
def test_resistor_value_parsing(value_str, expected_ohms):
    """Resistor values should parse correctly with all multipliers."""
    comp = Component("R1", value_str)
    assert comp.value_ohms == expected_ohms
```

---

*Testing analysis: 2026-04-04*
