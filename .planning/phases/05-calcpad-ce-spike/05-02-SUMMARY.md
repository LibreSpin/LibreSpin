---
phase: 05-calcpad-ce-spike
plan: 02
subsystem: infra
tags: [dotnet, calcpad-ce, cli, rest-api, spike, linux, headless]

# Dependency graph
requires:
  - phase: 05-01
    provides: "Calcpad.Cli binary at /tmp/calcpad-cli-out/Cli and Calcpad.Server binary at /tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server"
provides:
  - CLI headless execution confirmed: /tmp/calcpad-cli-out/Cli runs -s flag, produces HTML, exit 0
  - REST API confirmed: POST /api/calcpad/convert returns HTTP 200 with HTML body
  - Evidence files in /tmp/spike-calcpad/ ready for plan 03 go/no-go report
  - Server port deviation observed: bound to 9420, not 8080 (port already in use or env override)
affects:
  - 05-03 (spike report — reads evidence files from this plan)
  - 06-calcpad-skill (CLI invocation pattern, REST API endpoint, server port behavior)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CalcpadCE CLI: /path/to/Cli input.cpd output.html -s — exit 0 on success, silent stdout"
    - "CalcpadCE Server: POST /api/calcpad/convert with Content-Type: application/json and {Content: string} body — returns text/html"
    - "Server port is environment-dependent — read bound URL from server-stdout.log, do not hardcode 8080"

key-files:
  created:
    - /tmp/spike-calcpad/test.cpd — minimal voltage divider worksheet (spike-safe, no units)
    - /tmp/spike-calcpad/cli-output.html — CLI headless output (29KB HTML, V_out=8 calculated correctly)
    - /tmp/spike-calcpad/cli-stdout.log — CLI stdout/stderr (0 bytes — CLI ran silently with -s flag)
    - /tmp/spike-calcpad/server-stdout.log — Server startup log (port 9420 confirmed, Application started)
    - /tmp/spike-calcpad/rest-response.html — REST API response body (24KB HTML)
    - /tmp/spike-calcpad/rest-headers.txt — REST API response headers (HTTP/1.1 200 OK)
  modified: []

key-decisions:
  - "CLI path confirmed: invoke as /tmp/calcpad-cli-out/Cli (not Calcpad.Cli) — Phase 6 skill must use correct name"
  - "CLI produces output silently with -s flag — no stdout output on success (exit 0)"
  - "REST API: Content field is the .cpd content, content-type must be application/json"
  - "Server port is not always 8080 — read actual bound URL from server startup log at runtime"
  - "Both CLI and REST paths are confirmed working — Phase 6 has two viable integration strategies"

patterns-established:
  - "Pattern: Parse server startup log for 'Now listening on:' to get actual port — do not hardcode 8080"
  - "Pattern: CLI success = exit 0 + output file exists; CLI stdout is empty on success with -s"
  - "Pattern: REST response Content-Type is text/html — wrap in HTML viewer or serve directly"

requirements-completed: []

# Metrics
duration: 3min
completed: 2026-04-08
---

# Phase 5 Plan 02: Headless CLI and REST API Spike Execution Summary

**Both CalcpadCE integration paths confirmed working on Linux: CLI runs headless via `/tmp/calcpad-cli-out/Cli input.cpd output.html -s` (exit 0, 29KB HTML, V_out=8 correct), and REST API returns HTTP 200 from POST /api/calcpad/convert (24KB HTML, Kestrel on port 9420)**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-04-08T15:10:52Z
- **Completed:** 2026-04-08T15:12:56Z
- **Tasks:** 2
- **Files modified:** 6 (all system-external /tmp artifacts, no repo files)

## Accomplishments

- Confirmed Calcpad.Cli binary runs headless: `Cli test.cpd output.html -s` exits 0 and produces 29KB HTML
- Confirmed voltage divider calculation is correct: V_out = V_in*R2/(R1+R2) = 12*2000/(1000+2000) = 8 (rendered in HTML as fraction with result)
- Confirmed Calcpad.Server REST API: HTTP 200 from POST /api/calcpad/convert with JSON body — 24KB HTML response
- Confirmed server framework: Kestrel (ASP.NET Core) via `Server: Kestrel` response header
- Confirmed server starts in < 1 second on this hardware
- Cleanly shut down server after test (no orphan processes)

## Task Commits

Both tasks produce /tmp evidence files only — no repo files changed. Committed together in the plan metadata commit.

1. **Task 1: Write .cpd worksheet and run Calcpad.Cli headless** — /tmp artifacts only; committed in plan metadata
2. **Task 2: Start Calcpad.Server and POST test request** — /tmp artifacts only; committed in plan metadata

**Plan metadata:** _(committed below)_

## Evidence Files

| File | Size | Content |
|------|------|---------|
| `/tmp/spike-calcpad/test.cpd` | 84B | Voltage divider worksheet |
| `/tmp/spike-calcpad/cli-output.html` | 29KB | CLI headless HTML output |
| `/tmp/spike-calcpad/cli-stdout.log` | 0B | Silent run — expected with `-s` flag |
| `/tmp/spike-calcpad/server-stdout.log` | 2.1KB | Server startup log (port 9420) |
| `/tmp/spike-calcpad/rest-response.html` | 24KB | REST API HTML response |
| `/tmp/spike-calcpad/rest-headers.txt` | 121B | HTTP/1.1 200 OK + headers |

## CLI Test Results

**Command run:**
```bash
/tmp/calcpad-cli-out/Cli /tmp/spike-calcpad/test.cpd /tmp/spike-calcpad/cli-output.html -s
```

**Exit code:** 0

**Output file size:** 29KB

**Verification:** Output contains `V_out = (V_in · R2) / (R1 + R2) = (12 · 2000) / (1000 + 2000) = 8`

**CLI verdict: WORKING**

## REST API Test Results

**Server binary:** `/tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server`

**Server startup time:** < 1 second

**Observed port:** 9420 (not 8080 — see deviation below)

**Server startup log excerpt:**
```
Calcpad Server starting at http://0.0.0.0:9420
Now listening on: http://0.0.0.0:9420
Application started.
```

**curl command:**
```bash
curl -X POST http://localhost:9420/api/calcpad/convert \
  -H "Content-Type: application/json" \
  -d '{"Content": "\"Voltage divider spike test\nV_in = 12\nR1 = 1000\nR2 = 2000\nV_out = V_in*R2/(R1 + R2)"}'
```

**HTTP status:** 200 OK

**Response Content-Type:** text/html

**Response size:** 24KB

**REST API verdict: WORKING**

## Per-Path Verdict (D-04 through D-07)

| Path | Status | Evidence |
|------|--------|----------|
| CLI headless (D-04) | GO | exit 0, 29KB HTML, correct calculation |
| REST API (D-05/D-06) | GO | HTTP 200, 24KB HTML, correct response |
| Overall spike (D-07) | GO | Both paths working — Phase 6 has full choice |

**Overall go/no-go: GO**

## Decisions Made

- **Server port behavior:** The server bound to 9420, not the documented 8080 default. Phase 6 skill must not hardcode the port — read from server startup log or use `--urls` flag to set a predictable port.
- **CLI stdout behavior:** With `-s` flag the CLI produces zero stdout/stderr on success. Success detection must use exit code + output file existence, not stdout parsing.
- **Two viable paths:** Both CLI and REST are working. Phase 6 can choose either. CLI is simpler (no server lifecycle); REST enables multi-request batching and potentially simpler error handling.

## Deviations from Plan

**1. [Observation - Server port] Server bound to 9420, not 8080**
- **Found during:** Task 2 (server startup log)
- **Issue:** Plan and RESEARCH.md document port 8080 as default. Actual bound port was 9420.
- **Fix:** Used port from startup log (`grep -oE 'http://[^:]+:[0-9]+' server-stdout.log`). Test succeeded.
- **Impact:** Phase 6 skill must read port dynamically from server startup output, not hardcode 8080. If using server in production skill, use `--urls` flag to pin port.
- **Committed in:** plan metadata commit

**2. [Observation - CLI stdout] cli-stdout.log is 0 bytes**
- **Found during:** Task 1 verification
- **Issue:** Plan acceptance criteria says "log exists (run was attempted)". Log is 0 bytes because the CLI runs completely silently with `-s` flag (no output to stdout or stderr on success).
- **Fix:** Acceptance criteria still passes — file exists. Success is confirmed by exit code 0 and output file presence.
- **Impact:** Phase 6 skill must not parse stdout for success detection. Use exit code + output file check.

---

**Total deviations:** 2 (both observations only, no fixes required)
**Impact on plan:** Both are informational — they do not affect the go/no-go verdict. Port deviation is important guidance for Phase 6 skill implementation.

## Issues Encountered

- pgrep -f Calcpad.Server false-positive: the bash wrapper command contains the path in its eval string, causing pgrep to match itself. Resolved by using `ps aux | grep Calcpad.Server | grep -v grep | grep -v bash` — confirmed no orphan process.

## Anomalies vs RESEARCH.md Predictions

| Prediction | Observed | Impact |
|-----------|----------|--------|
| Server default port: 8080 | Actual: 9420 | Phase 6 must read port from startup log |
| CLI stdout: may have log output | Actual: completely silent with -s | Success = exit 0 + file exists |
| Server startup time: ~2s (research used sleep 2) | Actual: < 1s | No sleep needed before REST test |

## Next Phase Readiness

Plan 03 (spike report) can proceed immediately. All evidence files are in `/tmp/spike-calcpad/`:
- go/no-go verdict: **GO on both paths**
- CLI pattern confirmed: `./Cli input.cpd output.html -s` → exit 0
- REST pattern confirmed: `POST /api/calcpad/convert` with `Content-Type: application/json` and `{Content: "..."}` → 200 HTML
- Port: read from startup log — not hardcoded
- Binary name: `Cli` (not `Calcpad.Cli`)

Phase 6 will choose between CLI wrapping or REST-based skill. Both options are de-risked.

---
*Phase: 05-calcpad-ce-spike*
*Completed: 2026-04-08*
