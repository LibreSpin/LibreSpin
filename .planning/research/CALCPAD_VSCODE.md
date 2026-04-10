# CalcPad CE VS Code Extension Research

**Researched:** 2026-04-08
**Branch:** https://github.com/imartincei/CalcpadCE/tree/calcpad-experimental
**Confidence:** HIGH (direct source inspection)

---

## What the experimental branch is

The `calcpad-experimental` branch of CalcpadCE is NOT a VS Code extension repository — it is the full CalcpadCE monorepo containing:

- `Calcpad.Core` — the C# math engine
- `Calcpad.Cli` — a command-line interface wrapping the engine
- `Calcpad.Web/` — a web platform split into:
  - `backend/` — ASP.NET Core 8 REST API server (`Calcpad.Server`)
  - `frontend/` — a TypeScript/Vue monorepo with four sub-projects:
    - `calcpad-frontend/` — shared library
    - `calcpad-web/` — browser editor (Monaco + Vue)
    - `calcpad-desktop/` — Neutralino.js desktop wrapper
    - `vscode-calcpad/` — the VS Code extension
- `Calcpad.Tests`, `Calcpad.OpenXml`, `Calcpad.Wpf`, etc.

The VS Code extension lives at `Calcpad.Web/frontend/vscode-calcpad/`. It is a TypeScript extension that registers `.cpd`/`.cpdz` file support, provides syntax highlighting via 27 custom semantic token types, live preview, linting, and PDF export. It does NOT contain a calculation engine — all computation is delegated to `Calcpad.Server` via REST API at `http://localhost:9420` (default, configurable).

The original VS Code extension (`imartincei/vscode-calcpad`) was separately authored; that repo is now archived. The `calcpad-experimental` branch is where active community development continues. The extension is distributed as a `.vsix` file, not published to the VS Code Marketplace.

---

## Headless invocation feasibility

### VS Code extension — NOT headless

The `vscode-calcpad` extension has no programmatic API exports. Its `package.json` exposes 36 UI commands (palette/toolbar/context-menu) and an empty `activationEvents` array. There is no exported module, no `vsce` API surface, and no documented way to drive it from a shell script or external process. Invoking it headlessly would require spinning up a full VS Code extension host (`vscode-test` harness) — impractical for a skill pack.

### Calcpad.Server REST API — YES, fully headless

The real capability is the `Calcpad.Server` (.NET 8 ASP.NET Core) that the extension calls. It exposes:

**POST `/api/calcpad/convert`**
- Input: JSON `{ "content": "<raw .cpd text>", "settings": {...}, "theme": "light" }`
- Output: `text/html` — the fully-calculated HTML report (formulas evaluated, units resolved, plots rendered)
- No authentication required for local server

**POST `/api/calcpad/lint`**
- Input: JSON `{ "content": "..." }`
- Output: structured diagnostics with error codes (CPD-11xx through CPD-34xx)

**POST `/api/calcpad/definitions`**
- Output: extracted variables, functions, macros with types and source locations

From a shell script or Claude Code skill, the workflow would be:
```bash
# 1. Start server (once, as background process or daemon)
docker-compose up -d   # or: dotnet run --project Calcpad.Server/

# 2. Send .cpd content to convert endpoint
curl -s -X POST http://localhost:9420/api/calcpad/convert \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$(cat design.cpd | jq -Rs .)\"}" \
  -o output.html
```

The server's canonical deployment is Docker (two containers: .NET math engine + Node.js/Chromium PDF service). A bare `dotnet run` without Docker is not documented but is architecturally possible since it is a standard ASP.NET Core app.

---

## VS Code extension vs CLI comparison for skill automation

| Criterion | `Calcpad.Cli` (dotnet) | VS Code extension | `Calcpad.Server` REST API |
|---|---|---|---|
| Cross-platform (Linux) | YES — framework-dependent on .NET 10; Linux `.deb`/`.rpm` packages exist via `create-Linux-packages.bat` | NO — requires VS Code runtime; no headless mode | YES — Docker on any platform; bare dotnet run likely works |
| Headless invocation | YES — `calcpad input.cpd output.html` | NO | YES — `curl` / `fetch` |
| Skill pack complexity | Low — single binary call | Impractical | Medium — requires server process |
| Pre-built binary | Not confirmed; framework-dependent (requires .NET 10 runtime) | N/A | Docker image (confirmed); dotnet build from source (straightforward) |
| Output format | HTML, DOCX, PDF | HTML preview (live, not file-export automation) | HTML (primary); PDF via separate pdf-service container |
| External dependencies | `wkhtmltopdf` for PDF, .NET 10 runtime | VS Code, Node.js, .NET backend | Docker or .NET 10 + Node.js/Chromium |
| Automation surface | Shell args: `calcpad <in> <out>` | None | REST JSON API |
| Active maintenance | Part of CE monorepo | Part of CE monorepo | Part of CE monorepo |
| Installation for end user | `apt install calcpad` or `dotnet run` | `Install from VSIX` | `docker-compose up` |

**Key CLI finding:** The `Calcpad.Cli` `start.sh` confirms Linux deployment: `dotnet /usr/share/Calcpad/Calcpad.dll $1 $2 $3`. The `.csproj` targets `net10.0` and is framework-dependent (requires .NET 10 runtime). It is NOT self-contained. The Linux packages (`.deb`/`.rpm`) produced by `create-Linux-packages.bat` install as a standard system package with .NET runtime as a declared dependency — meaning apt/yum handles the runtime, not the user.

---

## Recommended approach for /librespin:calcpad cross-platform support

**Primary recommendation: `Calcpad.Cli` with .NET 10 runtime**

The CLI is the simplest automation surface. It takes a `.cpd` file, writes HTML/PDF output, and exits. No server lifecycle to manage. For Linux (the primary LibreSpin target environment given Claude Code), the `.deb` package installs `calcpad` to `/usr/local/bin/calcpad` with .NET as a declared apt dependency.

Skill implementation:
```bash
calcpad "$WORKSHEET" "$OUTPUT_HTML"
# or for PDF:
calcpad "$WORKSHEET" "$OUTPUT_PDF"
```

The skill's setup documentation should instruct users to:
1. Install .NET 10 runtime (`dotnet-runtime-10.0` via apt/brew)
2. Build from source: `dotnet publish Calcpad.Cli -c Release`
3. Or wait for official `.deb` release from the CE maintainer

**Secondary recommendation: Calcpad.Server REST API**

Use this if the skill needs linting/validation in addition to conversion, or if multiple worksheets need to be processed in a session (amortizes server startup cost). The Docker path is the most reliable cross-platform option but adds Docker as a dependency — heavy for a minimalist skill pack.

**Reject: VS Code extension**

No headless invocation path exists. The extension is a UI layer over the REST API. Using it from a skill would require VS Code to be open with the extension active, which is an interactive dependency incompatible with automated skill execution.

---

## Key findings

1. The `calcpad-experimental` branch contains a full VS Code extension (`vscode-calcpad/`) but it has no programmatic/headless API. It is purely a UI wrapper over `Calcpad.Server`.

2. The true automation surface is `Calcpad.Server` — an ASP.NET Core 8 REST API. `POST /api/calcpad/convert` accepts raw `.cpd` text and returns calculated HTML. No auth required. Callable from any shell script via `curl`.

3. `Calcpad.Cli` is the simpler path: single binary, shell invocation `calcpad input.cpd output.html`, Linux packages exist (`.deb`/`.rpm`). Requires .NET 10 runtime (not bundled). This is the right default for the `/librespin:calcpad` skill.

4. Neither approach has a confirmed pre-built standalone binary — both require either .NET 10 runtime installed or Docker. This is a real barrier for non-developer users and should be documented prominently in the skill's setup section.

5. The original CalcPad VS Code extension (by Proektsoftbg/the original author) is closed-source and separate from CalcpadCE. The CE experimental branch is the community continuation under MIT.

6. Output format is identical between CLI and server: HTML report with evaluated formulas, rendered plots, unit resolution. PDF requires `wkhtmltopdf` (CLI) or the Chromium-based pdf-service (server).

---

## Sources

- [CalcpadCE calcpad-experimental branch](https://github.com/imartincei/CalcpadCE/tree/calcpad-experimental)
- [Calcpad.Cli / Program.cs — CLI argument interface](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Cli/Program.cs)
- [Calcpad.Cli / start.sh — Linux launcher](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Cli/start.sh)
- [Calcpad.Cli / Calcpad.Cli.csproj — build config](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Cli/Calcpad.Cli.csproj)
- [vscode-calcpad / package.json — extension manifest](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Web/frontend/vscode-calcpad/package.json)
- [Frontend README — architecture overview](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Web/frontend/README.md)
- [Backend API_SCHEMA.md — /convert endpoint spec](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Web/backend/API_SCHEMA.md)
- [Frontend API_SCHEMA.md — /lint, /definitions, /highlight](https://github.com/imartincei/CalcpadCE/blob/calcpad-experimental/Calcpad.Web/frontend/API_SCHEMA.md)
- [imartincei/vscode-calcpad — original extension repo (archived)](https://github.com/imartincei/vscode-calcpad)
