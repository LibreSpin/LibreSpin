# Technology Stack

**Analysis Date:** 2026-04-04

## Languages

**Primary:**
- Python 3.10+ - Core project language (requires Python >=3.10, tested on 3.12.3)

## Runtime

**Environment:**
- Python 3.12.3 (local development)
- Requires Python >=3.10

**Package Manager:**
- pip (via venv at `.venv/`)
- Lockfile: Missing (no constraints file, only pyproject.toml)

## Frameworks

**Build/Dev:**
- Hatchling 1.29.0 - Python packaging and build backend (specified in [project] build-system in `pyproject.toml`)

**Distribution & Publishing:**
- Twine 6.2.0 - Package upload to PyPI
- Build 1.4.2 - Python project build tool

## Key Dependencies

**Utility & CLI:**
- Rich 14.3.3 - Terminal formatting and output (likely for CLI workflows)
- Requests 2.33.1 - HTTP client library (API integrations with external services)

**Security & Cryptography:**
- Cryptography 46.0.6 - Encryption and cryptographic operations
- Certifi 2026.2.25 - SSL certificates for HTTPS connections

**Code Quality & Documentation:**
- Markdown-it-py 4.0.0 - Markdown parsing and rendering
- Readme-renderer 44.0.0 - README rendering for PyPI

**Infrastructure (Build-time):**
- Keyring 25.7.0 - Credential storage (for PyPI publishing)
- Requests-toolbelt 1.0.0 - HTTP utilities
- Pluggy 1.6.0 - Plugin framework support

## Configuration

**Environment:**
- Project name: `librespin`
- Project version: `0.0.1` (pre-alpha)
- License: MIT
- Keywords: `pcb`, `eda`, `kicad`, `ai`, `hardware`

**Build:**
- Build config: `pyproject.toml` (PEP 517/518 compliant)
- Build backend: Hatchling
- Entry points: None defined (library-only package in pre-alpha)

**Package Metadata:**
- Homepage: https://librespin.org
- Repository: https://github.com/LibreSpin/LibreSpin
- README: `README.md`

## Platform Requirements

**Development:**
- Python >=3.10
- Linux/macOS/Windows (no platform-specific dependencies detected)
- Virtualenv setup present at `.venv/`

**Production:**
- Python >=3.10 runtime
- No external service dependencies required for core module
- SSL/TLS support (via certifi for secure HTTP)

---

*Stack analysis: 2026-04-04*
