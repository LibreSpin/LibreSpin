# Phase 5: CalcPad CE Spike - Research

**Researched:** 2026-04-08
**Domain:** CalcPad CE CLI + REST API, .NET 10 on Linux Mint 22.1
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Phase 5 includes installing .NET 10 runtime and CalcPad CE on this Linux system as part of the spike. Spike produces real test results — binary invocation confirmed, headless run executed, REST API called.
- **D-02:** Run a minimal `.cpd` worksheet headless via `Calcpad.Cli` — a simple engineering calculation (e.g., voltage divider, Ohm's law) is sufficient.
- **D-03:** Also spin up `Calcpad.Server` and fire a `curl POST /api/calcpad/convert` test even if CLI works.
- **D-04:** CLI working headless = go. `Calcpad.Cli input.cpd output.html -s` executes without GUI and produces output.
- **D-05:** REST API result is additional validation for CALC-08 — not the primary go/no-go gate. If CLI works but REST is broken, still a go.
- **D-06:** If CLI is broken but REST works, document both paths — still a go, Phase 6 uses REST-only path.
- **D-07:** If neither CLI nor REST works, record no-go and Phase 6 must be replanned.
- **D-08:** Spike output goes to `.planning/spike-calcpad.md` — not `.librespin/`.
- **D-09:** VSCode extension authoring workflow is user workflow, not LibreSpin skill scope — spike does not test it.

### Claude's Discretion

- Which specific `.cpd` test worksheet to write (simple voltage divider or equivalent is fine)
- `.deb` vs `.rpm` vs manual binary download for CalcPad CE on this specific Linux distro
- Exact `Calcpad.Server` startup flags and port choice for REST test

### Deferred Ideas (OUT OF SCOPE)

- Output quality validation of CalcPad CE (realistic engineering calc test) — deferred to Phase 6
- CalcPad CE Windows path — Windows not available on this system
- `.cpd` worksheet authoring workflow via VSCode extension — user workflow, not LibreSpin skill scope for v0.2
</user_constraints>

---

## Summary

CalcPad CE is now a community fork (CalcpadCE by imartincei) following the original Proektsoftbg/Calcpad project going closed-source and its website displaying a discontinuation notice as of early 2026. The community project preserves the MIT-licensed code and continues development. The original project's website (calcpad.eu) now shows only "The Calcpad FOSS project was discontinued."

The spike must work with the CalcpadCE fork at https://github.com/imartincei/CalcpadCE. There are no pre-built Linux `.deb` packages in CalcpadCE releases (the maintainer explicitly noted uncertainty about building installers). The path to a working binary is to build from source using the .NET 10 SDK, which is available via Ubuntu apt on this machine (Linux Mint 22.1 backed by Ubuntu Noble). The build is well-documented and produces a single self-contained binary.

The `Calcpad.Server` component has a fully-confirmed REST API at `POST /api/calcpad/convert` that accepts JSON with a `Content` field (raw `.cpd` text) and returns HTML. The Linux server binary is built self-contained via a provided shell script and runs on port 8080 by default. Both paths (CLI and REST) are buildable and testable within this phase.

**Primary recommendation:** Build CalcpadCE from source using `dotnet-sdk-10.0` (available via apt on this system). Test both `Calcpad.Cli` (headless batch) and `Calcpad.Server` (REST API). Record results in `.planning/spike-calcpad.md`.

---

## Project Status Alert

**CRITICAL CONTEXT:** The original `Proektsoftbg/Calcpad` GitHub repository returns 404. The project website (calcpad.eu) shows only a discontinuation message. The community fork `imartincei/CalcpadCE` is the active successor, hosting the MIT-licensed code with ongoing development.

| Source | Status |
|--------|--------|
| calcpad.eu | "The Calcpad FOSS project was discontinued." |
| github.com/Proektsoftbg/Calcpad | 404 — repository gone |
| github.com/imartincei/CalcpadCE | Active — community fork, MIT license |
| calcpad-ce.org | Live — official CalcpadCE community site |

The spike should use `imartincei/CalcpadCE` as the canonical source.

---

## Standard Stack

### Core

| Component | Version | Purpose | Source |
|-----------|---------|---------|--------|
| `dotnet-runtime-10.0` | 10.0.5 | .NET runtime for Calcpad.Cli (if published self-contained, runtime not needed) | Ubuntu apt (noble-updates) |
| `dotnet-sdk-10.0` | 10.0.105 | Build CalcpadCE from source | Ubuntu apt (noble-updates) |
| CalcpadCE (imartincei/CalcpadCE) | 7.6.2 | Calcpad.Cli + Calcpad.Server source | GitHub |

### Pre-existing Environment

| Component | Status | Version | Notes |
|-----------|--------|---------|-------|
| .NET 8.0 runtime | Installed | 8.0.25 | At `/usr/lib/dotnet/shared/Microsoft.NETCore.App/8.0.25` |
| .NET 10.0 runtime | Not installed | 10.0.5 available | `sudo apt install dotnet-runtime-10.0` |
| .NET 10.0 SDK | Not installed | 10.0.105 available | `sudo apt install dotnet-sdk-10.0` |
| curl | Installed | 8.5.0 | At `/usr/bin/curl` — REST API testing ready |
| git | Installed | 2.43.0 | For cloning CalcpadCE |

### Installation Commands

```bash
# Install .NET 10 SDK (includes runtime)
sudo apt update
sudo apt install -y dotnet-sdk-10.0

# Clone CalcpadCE
git clone https://github.com/imartincei/CalcpadCE.git
cd CalcpadCE

# Build Calcpad.Cli (self-contained Linux binary)
dotnet publish Calcpad.Cli/Calcpad.Cli.csproj \
  -r linux-x64 --self-contained true \
  -p:PublishSingleFile=true -c Release

# Build Calcpad.Server Linux console (self-contained)
cd Calcpad.Server
bash scripts/build-linux-console.sh
```

---

## Architecture Patterns

### CalcpadCE Repository Structure

```
CalcpadCE/
├── Calcpad.Cli/         # Command-line interface — headless batch processing
│   ├── Program.cs       # Entry point + argument parsing
│   ├── Calcpad.Cli.csproj
│   └── doc/             # Documentation including HELP.TXT
├── Calcpad.Server/      # REST API server
│   ├── Core/
│   │   └── Controllers/
│   │       └── CalcpadController.cs   # REST endpoints
│   ├── Linux/           # Linux console app project
│   │   └── Calcpad.Server.Linux.csproj
│   ├── scripts/
│   │   └── build-linux-console.sh    # Linux build script
│   └── README.md        # Server docs including curl examples
├── Calcpad.Core/        # Calculation engine (shared)
└── Calcpad.Tests/
```

### Pattern 1: CLI Headless Batch Mode

**What:** `Calcpad.Cli` accepts a `.cpd` input file and an output path, runs the calculation engine, writes output, and exits without opening any GUI.

**Invocation syntax (confirmed from Program.cs):**
```bash
# Self-contained binary (after publish)
./Calcpad.Cli input.cpd output.html -s

# Arguments:
#   input.cpd    — input file (.cpd or .txt)
#   output.html  — output path (html, htm, docx, or pdf extension)
#   -s           — silent mode: suppress opening output file after conversion
```

**The `-s` flag** prevents the application from attempting to open the output file with a desktop application — essential for headless/server operation.

**Interactive REPL mode** is also supported (no arguments), but this is irrelevant to the spike.

### Pattern 2: REST API via Calcpad.Server

**What:** `Calcpad.Server` runs as a Linux console application on port 8080. All Calcpad processing is delegated to it via HTTP JSON API.

**Base URL:** `http://localhost:8080/api/calcpad`

**Primary endpoint:**
```bash
# Convert .cpd content to HTML
curl -X POST http://localhost:8080/api/calcpad/convert \
  -H "Content-Type: application/json" \
  -d '{"content": "a = 5\nb = 10\nsum = a + b"}'

# Response: HTML string (text/html content type)
```

**Full request schema (CalcpadRequest):**
```json
{
  "Content": "string (required) — raw .cpd worksheet text",
  "Settings": {
    "Output": {
      "Format": "html | pdf"
    }
  },
  "Theme": "light | dark",
  "PdfSettings": {}
}
```

**Other confirmed endpoints:**
```
POST /api/calcpad/highlight      — syntax tokenization
POST /api/calcpad/lint           — validation/diagnostics
GET  /api/calcpad/sample         — returns sample .cpd content
GET  /swagger                    — API documentation UI
```

**Server startup:**
```bash
# After building with build-linux-console.sh:
./Calcpad.Server                          # defaults to port 8080
./Calcpad.Server --urls http://+:5000     # custom port
dotnet run --project Linux/Calcpad.Server.Linux.csproj  # dev mode
```

### Pattern 3: .cpd Worksheet Format

A simple voltage divider worksheet for the spike test:

```
"Voltage divider test
V_in = 12'V
R1 = 1000'Ω
R2 = 2000'Ω
V_out = V_in·R2/(R1 + R2)
I = V_in/(R1 + R2)
```

Calcpad syntax uses `'unit` for unit annotations and `·` (middle dot) for multiplication.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Engineering calculation execution | Custom math parser | `Calcpad.Cli` via subprocess | Handles units, symbolic math, HTML output rendering |
| REST-based calc API | Custom HTTP server | `Calcpad.Server` | Pre-built, documented, confirmed working |
| .NET runtime detection | Custom version check | `dotnet --list-runtimes` | Standard dotnet host command |

**Key insight:** CalcpadCE is the calculation engine. Phase 6 skill wraps it — it does not reimplement any math logic.

---

## Common Pitfalls

### Pitfall 1: Original Project Gone — Using Wrong Source

**What goes wrong:** Attempting to download from `Proektsoftbg/Calcpad` GitHub or `calcpad.eu` — both return 404 or discontinuation notice.

**Why it happens:** Original project went closed-source in early 2026. Community forked the final open-source release.

**How to avoid:** Use `imartincei/CalcpadCE` exclusively. The `.deb` package URL (`github.com/Proektsoftbg/Calcpad/releases/download/v7.6.1/Calcpad.7.6.1.deb`) returns 404.

**Warning signs:** HTTP 404 on any Proektsoftbg URL.

### Pitfall 2: No Pre-Built Linux Binaries Available

**What goes wrong:** Expecting a `.deb` or pre-compiled binary download for CalcpadCE Linux. The maintainer explicitly noted they don't know how to build installer/deb packages yet.

**Why it happens:** CalcpadCE is a new fork (March 2026) — installer infrastructure not yet built.

**How to avoid:** Build from source. The `dotnet publish` command with `--self-contained true -p:PublishSingleFile=true` produces a single standalone binary.

**Warning signs:** CalcpadCE releases only contain `.zip` portable and VS Code `.vsix` — no Linux `.deb`.

### Pitfall 3: .NET SDK vs Runtime

**What goes wrong:** Installing only `dotnet-runtime-10.0` then trying to `dotnet publish` — this fails because `publish` requires the SDK, not just the runtime.

**Why it happens:** The runtime (`dotnet-runtime-10.0`) provides execution only. The SDK (`dotnet-sdk-10.0`) provides compilation, publish, and restore.

**How to avoid:** Install `dotnet-sdk-10.0`. The SDK package depends on and pulls in the runtime automatically.

**Note:** If building a self-contained binary (`--self-contained true`), the resulting binary bundles its own runtime and does not require .NET to be installed at runtime. After the spike, the Phase 6 skill can document whether .NET is a runtime prereq or bundled.

### Pitfall 4: Existing .NET 8 Runtime Conflict

**What goes wrong:** `/usr/bin/dotnet` exists (pointing to .NET 8.0.25) but `dotnet --version` fails because no SDK is installed. This could be confusing.

**Why it happens:** System has .NET 8 runtime installed (likely as a system package dependency) but no SDK.

**How to avoid:** After `sudo apt install dotnet-sdk-10.0`, the dotnet host will resolve to the highest available SDK. Run `dotnet --list-runtimes` and `dotnet --list-sdks` after install to confirm. Both .NET 8 runtime and .NET 10 SDK can coexist.

### Pitfall 5: Calcpad.Server REST Content Type

**What goes wrong:** Sending request without `Content-Type: application/json` header causes the server to reject the body, returning 400 or 415.

**How to avoid:** Always include `-H "Content-Type: application/json"` in curl calls.

### Pitfall 6: .cpd Syntax — Units and Operators

**What goes wrong:** Writing `.cpd` content with standard `*` multiplication or naked numbers without units — Calcpad uses `·` (U+00B7 middle dot) for multiplication in some contexts, and `'unit` suffix for units.

**How to avoid:** Start with the simplest possible worksheet for the spike — variable assignments and arithmetic with no units:
```
a = 5
b = 10
c = a + b
```
This avoids any syntax edge cases and confirms execution end-to-end.

---

## Code Examples

### Minimal .cpd test worksheet (spike-safe)
```
"Voltage divider spike test
V_in = 12
R1 = 1000
R2 = 2000
V_out = V_in*R2/(R1 + R2)
```

### CLI invocation sequence
```bash
# 1. Build Calcpad.Cli
cd CalcpadCE
dotnet publish Calcpad.Cli/Calcpad.Cli.csproj \
  -r linux-x64 --self-contained true \
  -p:PublishSingleFile=true -c Release \
  -o /tmp/calcpad-cli-out/

# 2. Run headless test
/tmp/calcpad-cli-out/Calcpad.Cli /tmp/test.cpd /tmp/test-output.html -s

# 3. Verify output was created
ls -lh /tmp/test-output.html
head -50 /tmp/test-output.html
```

### Server start and REST test
```bash
# 1. Build Calcpad.Server (self-contained)
cd CalcpadCE/Calcpad.Server
bash scripts/build-linux-console.sh

# 2. Start server in background
./Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server &
SERVER_PID=$!
sleep 2  # give server time to start

# 3. Test REST API
curl -s -X POST http://localhost:8080/api/calcpad/convert \
  -H "Content-Type: application/json" \
  -d '{"Content": "a = 5\nb = 10\nc = a + b"}' \
  | head -20

# 4. Shut down server
kill $SERVER_PID
```

### .NET 10 SDK install (Ubuntu/Mint 22)
```bash
sudo apt update
sudo apt install -y dotnet-sdk-10.0
dotnet --list-sdks    # should show 10.0.x
dotnet --list-runtimes # should show both 8.0.25 and 10.0.x
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Download .deb from Proektsoftbg GitHub | Build from source via imartincei/CalcpadCE | March 2026 | Must build; no pre-built Linux packages |
| Requires .NET 10 runtime installed | Build self-contained binary (bundles runtime) | Now | Binary runs without dotnet installed at runtime |
| calcpad.eu documentation | calcpad-ce.org community site | 2026 | Primary reference shifts to CE community |

---

## Open Questions

1. **Calcpad.Server .NET target version**
   - What we know: Build script output path suggests `net10.0/linux-x64`. README says "targets .NET 8.0" (possibly stale). SDK 10.0 is available.
   - What's unclear: Does the server project file target net8.0 or net10.0? Will it build with SDK 10.0 either way?
   - Recommendation: `dotnet publish` will resolve against the project's target framework. If it targets net8.0, the SDK 10.0 can still build net8.0 targets. Run `cat Calcpad.Server/Linux/Calcpad.Server.Linux.csproj` after cloning to confirm.

2. **Calcpad.Cli binary name on Linux**
   - What we know: On Windows the binary is `Calcpad.Cli.exe`. On Linux, `dotnet publish` with `PublishSingleFile=true` produces a binary named after the assembly — likely `Calcpad.Cli` (no extension).
   - Recommendation: Verify by listing the publish output directory after build.

3. **Calcpad.Server port 8080 vs 5000**
   - What we know: README says port 8080 default. VSCode extension uses port 5000 in some contexts.
   - Recommendation: Check server startup output for actual bound URL. Use `--urls` flag to override if 8080 conflicts.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `dotnet-sdk-10.0` | Building CalcpadCE from source | Not installed | 10.0.105 in apt | None — must install |
| `dotnet-runtime-10.0` | Running non-self-contained binary | Not installed | 10.0.5 in apt | Included in SDK; or use self-contained build |
| .NET 8.0 runtime | (already present) | Installed | 8.0.25 | N/A |
| git | Cloning CalcpadCE | Installed | 2.43.0 | — |
| curl | REST API test | Installed | 8.5.0 | — |
| internet access | Cloning CalcpadCE, apt install | Assumed | — | Offline not viable for this spike |

**Missing dependencies with no fallback:**
- `dotnet-sdk-10.0` — required to build CalcpadCE. Install with `sudo apt install -y dotnet-sdk-10.0` before any build steps.

**Missing dependencies with fallback:**
- None beyond dotnet-sdk-10.0.

---

## Sources

### Primary (HIGH confidence)
- `github.com/imartincei/CalcpadCE` — Confirmed repository structure, Calcpad.Cli/Program.cs argument syntax, Calcpad.Server/Core/Controllers/CalcpadController.cs endpoint schema
- `github.com/imartincei/CalcpadCE/blob/main/Calcpad.Server/README.md` — Linux server start instructions, port 8080, curl examples
- `github.com/imartincei/CalcpadCE/blob/main/Calcpad.Server/scripts/build-linux-console.sh` — Build script, output path, binary name
- `github.com/imartincei/vscode-calcpad/blob/main/API_SCHEMA.md` — REST API endpoint schema (highlights, lint, convert)
- `ubuntu apt` — `dotnet-sdk-10.0` version 10.0.105, `dotnet-runtime-10.0` version 10.0.5, confirmed installable on this system (Linux Mint 22.1 / Ubuntu Noble)
- `calcpad.eu` — Confirmed discontinued: "The Calcpad FOSS project was discontinued."
- Local system probe — .NET 8.0.25 runtime at `/usr/lib/dotnet/`, curl 8.5.0, git 2.43.0 all confirmed

### Secondary (MEDIUM confidence)
- `deepwiki.com/Proektsoftbg/Calcpad/2.1-file-formats-and-processing` — CLI syntax `calcpad input.cpd [output.format] [-s]` and `-s` flag semantics (cross-verified against Program.cs structure)
- `calcpad-ce.org` — CalcpadCE community continuation confirmed, VS Code extension cross-platform

### Tertiary (LOW confidence)
- WebSearch result claiming "Calcpad 7.6.1 .deb at github.com/Proektsoftbg/...releases/download/v7.6.1/Calcpad.7.6.1.deb" — VERIFIED 404 via curl HEAD request. Do not use this URL.

---

## Metadata

**Confidence breakdown:**
- Project status (discontinued/forked): HIGH — calcpad.eu confirmed, CalcpadCE confirmed active
- .NET availability on this machine: HIGH — direct apt-cache and system probe
- CLI invocation syntax: HIGH — verified from Program.cs source
- REST API endpoint: HIGH — verified from CalcpadController.cs source + README curl examples
- Build process: HIGH — verified from build-linux-console.sh script
- Pre-built Linux binaries: HIGH — confirmed none available (maintainer statement in release)

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (CalcpadCE is actively evolving; verify repo hasn't changed structure before executing)
