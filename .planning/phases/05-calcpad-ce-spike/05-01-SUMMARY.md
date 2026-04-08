---
phase: 05-calcpad-ce-spike
plan: 01
subsystem: infra
tags: [dotnet, calcpad-ce, cli, build, spike, linux]

# Dependency graph
requires: []
provides:
  - .NET 10 SDK 10.0.201 installed at /tmp/dotnet10
  - CalcpadCE source cloned at /tmp/CalcpadCE (commit 3bc026b)
  - Calcpad.Cli self-contained ELF binary at /tmp/calcpad-cli-out/Cli (79MB)
  - Calcpad.Server self-contained ELF binary at /tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server (110MB)
affects:
  - 05-02 (headless CLI test and REST API test in plan 02)
  - 06-calcpad-skill (binary paths, binary name deviation, build workaround)

# Tech tracking
tech-stack:
  added:
    - .NET 10 SDK 10.0.201 (dotnet-install.sh to /tmp/dotnet10)
    - CalcpadCE 7.6.2 (imartincei/CalcpadCE fork, built from source)
  patterns:
    - Build CalcpadCE from source via dotnet publish (no pre-built Linux packages)
    - Self-contained single-file publish bundles runtime — no dotnet required at runtime
    - dotnet-install.sh to user-local directory avoids sudo requirement

key-files:
  created:
    - /tmp/dotnet10/ — .NET 10 SDK install (system-external, not in repo)
    - /tmp/CalcpadCE/ — CalcpadCE source clone (system-external)
    - /tmp/calcpad-cli-out/Cli — Calcpad.Cli binary (system-external)
    - /tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server — server binary (system-external)
  modified:
    - /tmp/CalcpadCE/Calcpad.Server/Core/Services/CalcpadService.cs — removed dead AuthSettings block (Rule 1 fix)

key-decisions:
  - "Use dotnet-install.sh to /tmp/dotnet10 instead of apt (sudo unavailable in agent env)"
  - "CalcpadCE CLI binary is named 'Cli' not 'Calcpad.Cli' on Linux — Phase 6 skill must reference correct name"
  - "Calcpad.Server targets net10.0 (confirmed from csproj) — not net8.0 as README suggested"
  - "AuthSettings block removed from CalcpadService.cs — MacroParser API changed, #fetch auth feature disabled (no impact on basic convert endpoint)"

patterns-established:
  - "Pattern: Build CalcpadCE from source — no pre-built Linux .deb exists (confirmed)"
  - "Pattern: dotnet publish -r linux-x64 --self-contained true -p:PublishSingleFile=true produces ~80-110MB ELF"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-04-08
---

# Phase 5 Plan 01: Install .NET 10 SDK and Build CalcpadCE Binaries Summary

**.NET 10 SDK installed via dotnet-install.sh; CalcpadCE cloned from imartincei/CalcpadCE and both Calcpad.Cli (79MB ELF) and Calcpad.Server (110MB ELF) built as self-contained Linux x64 binaries after patching a dead API reference in CalcpadService.cs**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-08T15:01:26Z
- **Completed:** 2026-04-08T15:07:00Z
- **Tasks:** 3
- **Files modified:** 2 (STATE.md, CalcpadService.cs in /tmp)

## Accomplishments

- .NET 10 SDK 10.0.201 installed to /tmp/dotnet10 via Microsoft install script (no sudo needed)
- CalcpadCE cloned from imartincei/CalcpadCE at commit 3bc026b; source layout confirmed
- Calcpad.Cli built: 79MB self-contained ELF at /tmp/calcpad-cli-out/Cli
- Calcpad.Server built: 110MB self-contained ELF at Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server after one-line fix

## Task Commits

Each task was committed atomically:

1. **Task 1: Install .NET 10 SDK** - `a3e46be` (chore)
2. **Task 2: Clone CalcpadCE and build Calcpad.Cli** - `59f0d4f` (chore)
3. **Task 3: Build Calcpad.Server** - `4f6121e` (chore)

## Files Created/Modified

- `/tmp/dotnet10/` — .NET 10 SDK 10.0.201 installation (system-external to repo)
- `/tmp/CalcpadCE/` — CalcpadCE source tree, commit 3bc026b
- `/tmp/calcpad-cli-out/Cli` — Calcpad.Cli self-contained binary (79MB, ELF 64-bit x86-64)
- `/tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server` — server binary (110MB, ELF 64-bit x86-64)
- `/tmp/CalcpadCE/Calcpad.Server/Core/Services/CalcpadService.cs` — removed dead AuthSettings block

## Spike Findings

### .NET SDK version installed
```
10.0.201 [/tmp/dotnet10/sdk]
```

### CalcpadCE git commit hash cloned
```
3bc026b70c78a4385bd222c68620374be80f3be0
```

### Final binary paths and sizes
| Binary | Path | Size | Type |
|--------|------|------|------|
| Calcpad.Cli | /tmp/calcpad-cli-out/Cli | 79MB | ELF 64-bit LSB pie executable, x86-64 |
| Calcpad.Server | /tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server | 110MB | ELF 64-bit LSB pie executable, x86-64 |

### Actual target frameworks observed
| Project | TargetFramework | Source |
|---------|-----------------|--------|
| Calcpad.Cli/Calcpad.Cli.csproj | net10.0 (inferred from build output path) | Build output |
| Calcpad.Server/Linux/Calcpad.Server.Linux.csproj | net10.0 | csproj `<TargetFramework>net10.0</TargetFramework>` |

### Open questions resolved
- **OQ-2 (CLI binary name):** Binary is named `Cli` not `Calcpad.Cli` on Linux. Phase 6 skill must invoke `/path/to/Cli` not `/path/to/Calcpad.Cli`.
- **OQ-1 (Server target framework):** Confirmed `net10.0` — README was stale ("targets .NET 8.0").
- **OQ-3 (Server port):** Default port 8080, confirmed from build script output.

## Decisions Made

- **dotnet-install.sh over apt:** Used Microsoft install script to `/tmp/dotnet10` because `sudo apt install` requires password in agent environment. Functionally equivalent result.
- **Rule 1 fix applied to CalcpadService.cs:** `macroParser.AuthSettings` removed from Calcpad.Server source because `MacroParser` no longer exposes this property (removed in commit 51a9053). The 8-line auth settings block was in an optional `if (settings?.Auth != null)` guard — removing it disables `#fetch` authentication but preserves all core convert/calculate functionality. The basic REST endpoint `/api/calcpad/convert` is unaffected.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed dead AuthSettings reference in CalcpadService.cs**
- **Found during:** Task 3 (Build Calcpad.Server)
- **Issue:** `Calcpad.Server.Core/Services/CalcpadService.cs` line 57 referenced `macroParser.AuthSettings = new Calcpad.Core.AuthSettings` — but `MacroParser` no longer has this property (removed in CalcpadCE commit 51a9053). Build error: CS1061 + CS0234.
- **Fix:** Removed lines 54-62 (optional auth settings block) from `CalcpadService.cs`. The block is guarded by `if (settings?.Auth != null)` — removing it silently disables `#fetch` auth, which is not needed for the spike or basic skill wrapping.
- **Files modified:** /tmp/CalcpadCE/Calcpad.Server/Core/Services/CalcpadService.cs
- **Verification:** Build succeeded with 0 errors after fix; `Calcpad.Server` ELF binary produced.
- **Committed in:** `4f6121e` (Task 3 commit)

**2. [Deviation - Install method] Used dotnet-install.sh instead of sudo apt**
- **Found during:** Task 1 (Install .NET 10 SDK)
- **Issue:** `sudo apt install dotnet-sdk-10.0` requires password — agent environment has no sudo access.
- **Fix:** Used Microsoft's `dotnet-install.sh` script, installing SDK 10.0.201 to `/tmp/dotnet10`. All subsequent commands use `PATH="/tmp/dotnet10:$PATH"`.
- **Impact:** SDK version is 10.0.201 (install script) vs 10.0.105 (apt). Both are 10.0.x — plan states "any 10.0.x is acceptable".

**3. [Deviation - Binary name] CLI binary is 'Cli' not 'Calcpad.Cli'**
- **Found during:** Task 2 (verify build output)
- **Issue:** Plan acceptance criteria expected `/tmp/calcpad-cli-out/Calcpad.Cli`. Actual output is `/tmp/calcpad-cli-out/Cli` (assembly name matches csproj).
- **Impact:** Spike data recorded. Plan 02 must invoke `Cli` not `Calcpad.Cli`. Plan 06 skill must document correct binary name.

---

**Total deviations:** 3 (1 auto-fixed Rule 1, 2 environment/naming observations)
**Impact on plan:** Rule 1 fix was required for build completion. Install method deviation produces equivalent result. Binary name deviation is informational only — recorded for plan 02 and 06.

## Issues Encountered

None beyond the deviations documented above. The CalcpadCE `AuthSettings` API regression is a known risk of using a community fork in active development (commit 51a9053 removed it from MacroParser). The fix is safe and minimal.

## Next Phase Readiness

Plan 02 can proceed immediately. Both binaries are on disk and executable:
- CLI: `/tmp/calcpad-cli-out/Cli` — invoke with `./Cli input.cpd output.html -s`
- Server: `/tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server`

Note for plan 02: the .NET 10 SDK is in `/tmp/dotnet10` and is only needed if rebuilding. The binaries themselves are self-contained — they do not require dotnet at runtime.

---
*Phase: 05-calcpad-ce-spike*
*Completed: 2026-04-08*
