# Phase 5 Spike: CalcPad CE on Linux

**Date:** 2026-04-08
**Verdict:** GO
**Recommended Phase 6 path:** CLI-first (REST as optional fallback)

## 1. Environment

- OS: Linux WILL-LAPTOP-MINT 6.8.0-106-generic #106-Ubuntu SMP PREEMPT_DYNAMIC Fri Mar 6 07:58:08 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux
- .NET SDK installed: `10.0.201 [/tmp/dotnet10/sdk]` (installed via dotnet-install.sh to /tmp/dotnet10 — sudo unavailable in agent env)
- .NET runtimes available: `Microsoft.AspNetCore.App 10.0.5 [/tmp/dotnet10/shared/Microsoft.AspNetCore.App]` / `Microsoft.NETCore.App 10.0.5 [/tmp/dotnet10/shared/Microsoft.NETCore.App]`
- CalcpadCE source: github.com/imartincei/CalcpadCE @ 3bc026b70c78a4385bd222c68620374be80f3be0

## 2. Build Results

| Component | Built? | Path | Size | Target Framework |
|-----------|--------|------|------|------------------|
| Calcpad.Cli | yes | /tmp/calcpad-cli-out/Cli | 79MB (82,610,557 bytes) | net10.0 |
| Calcpad.Server | yes | /tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server | 109MB (114,433,759 bytes) | net10.0 |

Both binaries are self-contained ELF 64-bit x86-64 executables — no dotnet required at runtime.

Note: Calcpad.Server required a one-line source patch (removed dead `AuthSettings` block from CalcpadService.cs — MacroParser no longer exposes this property after commit 51a9053). The patched block is optional (`#fetch` auth only) and has no effect on the `/api/calcpad/convert` endpoint.

## 3. CLI Headless Test (D-04 — primary go/no-go gate)

- Command: `/tmp/calcpad-cli-out/Cli /tmp/spike-calcpad/test.cpd /tmp/spike-calcpad/cli-output.html -s`
- Exit code: 0
- Output file produced: yes, 29,444 bytes
- First 10 lines of output:
  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <title>Created with Calcpad</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ```
- stdout/stderr: 0 bytes (CLI runs completely silently with `-s` flag — expected behavior)
- Calculation verified: V_out = V_in·R2/(R1+R2) = 12·2000/(1000+2000) = 8 (correct)
- **CLI verdict:** WORKING

## 4. REST API Test (D-03 — CALC-08 path validation)

- Server start command: `/tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server`
- Bound port: 9420 (not 8080 — see Section 7 for deviation)
- Server target framework: net10.0
- Request: `POST http://localhost:9420/api/calcpad/convert`
- Request body: `{"Content": "\"Voltage divider spike test\nV_in = 12\nR1 = 1000\nR2 = 2000\nV_out = V_in*R2/(R1 + R2)"}`
- HTTP status: 200 OK
- Response headers:
  ```
  HTTP/1.1 200 OK
  Content-Length: 24146
  Content-Type: text/html
  Date: Wed, 08 Apr 2026 15:12:12 GMT
  Server: Kestrel
  ```
- Response body size: 24,146 bytes
- Server startup time: < 1 second
- **REST verdict:** WORKING

## 5. Go/No-Go Decision (per D-04..D-07)

Apply the decision matrix:
- CLI working → GO (D-04)
- CLI broken, REST working → GO, Phase 6 must use REST-only path (D-06)
- Neither working → NO-GO, Phase 6 must be replanned (D-07)

**Verdict:** GO
**Reason:** Both CLI (exit 0, 29KB HTML, correct calculation) and REST API (HTTP 200, 24KB HTML) are working — Phase 6 has full choice of integration path.

## 6. Phase 6 Upstream Contribution Deliverables

These are **required Phase 6 deliverables**, not optional:

1. **PR: Fix CalcpadService.cs AuthSettings regression** — Submit to `imartincei/CalcpadCE`. Remove lines 54-62 (the `if (settings?.Auth != null)` block referencing the removed `macroParser.AuthSettings` API). Fixes a build-breaking CS1061/CS0234 compile error for anyone building from source. This is the patch applied during the spike.

2. **PR: Document Linux build path** — Update CalcpadCE README/docs with:
   - CLI binary outputs as `Cli` not `Calcpad.Cli` on Linux (assembly naming)
   - Server port is non-deterministic — use `--urls` flag or parse `Now listening on:` from startup log; do not hardcode 8080
   - `dotnet-install.sh` as the sudo-free install path for .NET 10 SDK
   - Server `<TargetFramework>` is `net10.0`, not `net8.0` as the current README states

See `.planning/seeds/SEED-001-calcpadce-linux-packaging.md` for longer-term packaging work (build-linux.sh, .deb, systemd unit) — deferred until Phase 6 ships and PRs are accepted.

## 6b. Recommended Phase 6 Implementation Strategy

- **CALC-01 (prereq check):** Check that the `Cli` binary exists at the configured path (e.g., `~/.librespin/bin/Cli`). If absent, prompt user to run the build sequence: install .NET 10 SDK via `dotnet-install.sh` (or `sudo apt install dotnet-sdk-10.0` if sudo is available), clone `github.com/imartincei/CalcpadCE`, run `dotnet publish Calcpad.Cli/Calcpad.Cli.csproj -r linux-x64 --self-contained true -p:PublishSingleFile=true -c Release -o ~/.librespin/bin/`. The binary is self-contained — no dotnet required at runtime after install.

- **CALC-08 (REST fallback):** Implement as optional path. Start server with `Calcpad.Server --urls http://localhost:{port}` to pin a predictable port (avoids the port 9420 anomaly). Read bound URL from server startup log — grep for `Now listening on:` line. Do NOT hardcode port 8080. Request: `POST /api/calcpad/convert` with `Content-Type: application/json` and `{"Content": "<cpd text>"}`. Response is `text/html` — write to `.librespin/<project>/output.html`.

- **Binary distribution:** Self-contained build (the spike build command: `dotnet publish ... --self-contained true -p:PublishSingleFile=true`). This bundles the .NET 10.5 runtime inside the ~80-109MB ELF. No dotnet required at user runtime. Phase 6 can optionally provide a `setup.sh` script that runs the build.

- **Known anomalies Phase 6 must handle:**
  1. **Binary name:** The CLI binary is named `Cli` (not `Calcpad.Cli`) on Linux — the csproj assembly name is the bare project name without namespace.
  2. **Server port is not always 8080:** In the spike the server bound to port 9420. Always use `--urls` flag to set a fixed port, or parse `Now listening on:` from server stdout.
  3. **CLI stdout is empty on success:** With `-s` flag the CLI produces no stdout/stderr. Success detection = exit code 0 AND output file exists. Do not attempt stdout parsing.
  4. **CalcpadService.cs AuthSettings patch:** If building from source, the `macroParser.AuthSettings` line in `Calcpad.Server/Core/Services/CalcpadService.cs` must be removed (lines 54-62 of original file) before `Calcpad.Server` will compile. Affects `#fetch` auth only — core convert endpoint is unaffected.
  5. **No pre-built Linux packages:** CalcpadCE has no `.deb`. Must build from source.

## 7. Deviations from Research

| RESEARCH.md Prediction | Observed Reality | Impact |
|------------------------|-----------------|--------|
| Server default port: 8080 | Bound to 9420 | Phase 6 must parse startup log or use `--urls` — do not hardcode port |
| `sudo apt install dotnet-sdk-10.0` | Used dotnet-install.sh to /tmp/dotnet10 (no sudo in agent env) | Functionally equivalent; SDK 10.0.201 vs 10.0.105 apt version |
| CLI binary named `Calcpad.Cli` | Actually named `Cli` (assembly name from csproj) | Phase 6 skill must invoke `./Cli`, not `./Calcpad.Cli` |
| CLI stdout may contain log output | Zero bytes stdout with `-s` flag | Success detection must use exit code + output file, not stdout |
| Server startup time ~2s (research suggested `sleep 2`) | Actual: < 1s | No sleep needed between start and first request |
| Calcpad.Server compiles clean from source | CS1061 / CS0234 build error in CalcpadService.cs (dead AuthSettings API) | Patch required: remove 8-line optional auth block before build |

## 8. Evidence Files

- /tmp/spike-calcpad/test.cpd (84 bytes — voltage divider worksheet)
- /tmp/spike-calcpad/cli-output.html (29,444 bytes — CLI headless HTML output, V_out=8 correct)
- /tmp/spike-calcpad/cli-stdout.log (0 bytes — CLI runs silently with -s flag, exit 0)
- /tmp/spike-calcpad/server-stdout.log (2,139 bytes — Kestrel startup log, port 9420, POST 200)
- /tmp/spike-calcpad/rest-response.html (24,146 bytes — REST API HTML response)
- /tmp/spike-calcpad/rest-headers.txt (121 bytes — HTTP/1.1 200 OK + Content-Type: text/html + Server: Kestrel)
