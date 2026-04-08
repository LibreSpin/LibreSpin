---
phase: 05-calcpad-ce-spike
verified: 2026-04-08T12:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 5: CalcPad CE Spike Verification Report

**Phase Goal:** Confirm whether CalcPad CE CLI can be used headless on the target system before writing any skill content
**Verified:** 2026-04-08
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Binary name and invocation path confirmed (`Cli` not `Calcpad.Cli`) | VERIFIED | spike-calcpad.md §2, §6b; 05-01-SUMMARY.md deviation #3; 05-02-SUMMARY.md key-decisions |
| 2 | Headless batch mode verified — `Cli input.cpd output.html -s` executes without GUI | VERIFIED | 05-02-SUMMARY.md CLI verdict WORKING; exit 0; /tmp/spike-calcpad/cli-output.html 29,444 bytes; cli-stdout.log 0 bytes (silent) |
| 3 | .NET 10 runtime install path documented for Linux | VERIFIED | spike-calcpad.md §1 (dotnet-install.sh to /tmp/dotnet10); §6b (CALC-01 prereq check documents both sudo apt and dotnet-install.sh paths) |
| 4 | `Calcpad.Server` REST API tested — `POST /api/calcpad/convert` returns computed results via curl | VERIFIED | spike-calcpad.md §4; /tmp/spike-calcpad/rest-headers.txt HTTP/1.1 200 OK; /tmp/spike-calcpad/rest-response.html 24,146 bytes |
| 5 | Go/no-go decision recorded in `.planning/spike-calcpad.md` with recommended approach for Phase 6 | VERIFIED | .planning/spike-calcpad.md exists, contains `**Verdict:** GO`, all 8 required sections present, CLI-first recommendation in §6b |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/spike-calcpad.md` | Phase 5 decision document | VERIFIED | Exists on disk; 120 lines; GO verdict; all 8 sections; no placeholder markers |
| `/tmp/calcpad-cli-out/Cli` | Self-contained CLI binary | VERIFIED | Exists, executable, 79MB ELF 64-bit x86-64 |
| `/tmp/CalcpadCE/Calcpad.Server/Linux/bin/Release/net10.0/linux-x64/publish/Calcpad.Server` | Self-contained server binary | VERIFIED | Exists, executable, 110MB ELF 64-bit x86-64 |
| `/tmp/spike-calcpad/cli-output.html` | CLI headless run output | VERIFIED | 29,444 bytes; contains V_out and HTML tags |
| `/tmp/spike-calcpad/rest-headers.txt` | REST API response headers | VERIFIED | 121 bytes; HTTP/1.1 200 OK confirmed |
| `/tmp/spike-calcpad/server-stdout.log` | Server startup evidence | VERIFIED | 2.1KB; "Application started" / "Now listening on" present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| dotnet-install.sh | Calcpad.Cli self-contained binary | dotnet publish -r linux-x64 --self-contained | VERIFIED | Build confirmed in 05-01-SUMMARY.md; binary at /tmp/calcpad-cli-out/Cli 79MB |
| `/tmp/calcpad-cli-out/Cli` | `/tmp/spike-calcpad/cli-output.html` | headless invocation with -s flag | VERIFIED | Exit 0; output file 29KB; calculation V_out=8 correct |
| `Calcpad.Server` binary | `POST /api/calcpad/convert` | Kestrel HTTP server, curl JSON body | VERIFIED | HTTP 200; 24KB HTML response; server bound port 9420 |
| spike-calcpad.md | Phase 6 plan-phase | Phase 6 planner reads §6 and §6b | VERIFIED | File committed at 4e0a329 + 46d8386; concrete CALC-01/CALC-08 guidance present |

### Data-Flow Trace (Level 4)

Not applicable — this is a spike/investigation phase. No dynamic UI components or rendering pipelines. All artifacts are decision documents and binary build outputs.

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| CLI binary exists and is executable | `test -x /tmp/calcpad-cli-out/Cli` | Pass | PASS |
| CLI output file non-empty with valid content | `grep -qi 'V_out\|html' /tmp/spike-calcpad/cli-output.html` | Match found | PASS |
| REST API returned HTTP 2xx | `grep -qE 'HTTP/[0-9.]+ 2[0-9]{2}' /tmp/spike-calcpad/rest-headers.txt` | HTTP/1.1 200 OK | PASS |
| Server startup confirmed in log | `grep -q 'Application started\|listening on' /tmp/spike-calcpad/server-stdout.log` | Match found | PASS |
| spike-calcpad.md has Verdict line | `grep -qE '^\*\*Verdict:\*\* (GO\|NO-GO)'` | `**Verdict:** GO` | PASS |
| spike-calcpad.md has all 8 sections | sections 1–8 headers present | All present | PASS |

### Requirements Coverage

No formal requirement IDs assigned to this phase (spike de-risks CALC-01 and CALC-08 for Phase 6 — no REQUIREMENTS.md entries map to Phase 5). Requirements coverage check not applicable.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/spike-calcpad.md` | 92 | `dotnet publish ...` (ellipsis in prose command snippet) | Info | Not a content placeholder — abbreviation for a long command in documentation prose. No impact. |

No TODO, FIXME, or content placeholder markers found. The single `...` occurrence is an intentional prose abbreviation within a code snippet, not an unfilled template slot.

### Human Verification Required

The following items cannot be verified programmatically and are flagged for human awareness (they were resolved during phase execution via the checkpoint task):

**1. User approval of spike findings (Task 2 checkpoint)**
**Test:** Read .planning/spike-calcpad.md end-to-end; confirm GO verdict matches evidence; spot-check at least one /tmp/spike-calcpad/ file.
**Expected:** Verdict is GO, CALC-01/CALC-08 guidance is concrete enough for Phase 6 planning.
**Why human:** Approval was received during phase execution (commit 46d8386 documents user direction and approval). Verified as complete.
**Status:** RESOLVED — user approved; Phase 6 unblocked per 05-03-SUMMARY.md.

### Gaps Summary

No gaps. All five ROADMAP success criteria are satisfied:

1. Binary name confirmed (`Cli`, not `Calcpad.Cli`) — documented in spike-calcpad.md §2 and §6b.
2. Headless batch mode verified — exit 0, 29KB HTML output, calculation correct.
3. .NET 10 install path documented — dotnet-install.sh (sudo-free) and `sudo apt install dotnet-sdk-10.0` both documented for Linux.
4. REST API tested — HTTP 200, 24KB HTML, `POST /api/calcpad/convert` confirmed working.
5. Go/no-go decision recorded at `.planning/spike-calcpad.md` — verdict GO, CLI-first recommendation, Phase 6 upstream PR obligations listed.

One noteworthy deviation from the original ROADMAP success criterion wording: the plan used `Calcpad.Cli` as the anticipated binary name, but the actual binary is named `Cli` on Linux (csproj assembly name). The spike correctly discovered and documented this deviation. This is a finding, not a gap — the criterion asks for the name to be "confirmed," which it was.

The phase goal is achieved. Phase 6 planning is unblocked.

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_
