---
id: SEED-001
status: dormant
planted: 2026-04-08
planted_during: v0.2 / Phase 05 — calcpad-ce-spike
trigger_when: Phase 6 (CalcPad skill) is stable AND upstream AuthSettings PR is accepted by imartincei/CalcpadCE
scope: medium
---

# SEED-001: CalcpadCE Linux packaging — build-linux.sh + .tar.gz + optional .deb with systemd

## Why This Matters

CalcpadCE has no pre-built Linux packages. Anyone wanting to use it on Linux must know to clone the repo,
install .NET 10 SDK, patch `CalcpadService.cs`, and run `dotnet publish` with the right flags. The upstream
maintainer (imartincei) has explicitly said they don't know how to build `.deb` packages yet.

LibreSpin's Phase 5 spike already did the hard work: we have the exact build commands, deviations, and
a working patch. Contributing this back as a CI workflow and a packaging script gives the CalcpadCE
community something genuinely useful — and gives LibreSpin good standing with the upstream maintainer,
which matters for long-term fork health.

A `Calcpad.Server` `.deb` with a systemd unit would also unlock server-mode deployments (e.g., a shared
team calcpad instance), which may be relevant for LibreSpin's own future multi-user scenarios.

## When to Surface

**Trigger:** Phase 6 (CalcPad skill) is stable AND the upstream AuthSettings PR has been accepted by
`imartincei/CalcpadCE`.

This seed should be presented during `/gsd:new-milestone` when the milestone scope matches any of:
- "community contribution", "upstream", "open source", "packaging"
- Milestone follows v0.2 (CalcPad & NGSpice) and CalcPad skill is shipping
- Any milestone that includes "distribution", "setup", or "install" concerns

## Scope Estimate

**Medium** — a phase or two. Work includes:
1. `build-linux.sh` — wraps `dotnet-install.sh` + clone + patch + `dotnet publish` into a single script
2. GitHub Actions workflow — produces a versioned `.tar.gz` release artifact on tag push
3. Optional: `.deb` packaging via `dpkg-deb` or `fpm`, systemd unit for `Calcpad.Server`
4. PR submission to `imartincei/CalcpadCE` with the above + README corrections

## Breadcrumbs

Relevant files from the Phase 5 spike:

- `.planning/spike-calcpad.md` — exact build commands, deviations table, binary paths, port behavior
- `.planning/phases/05-calcpad-ce-spike/05-01-SUMMARY.md` — dotnet-install.sh path, AuthSettings patch detail, binary sizes
- `.planning/phases/05-calcpad-ce-spike/05-RESEARCH.md` — confirms no pre-built Linux packages exist upstream
- `.planning/REQUIREMENTS.md` — CALC-01, CALC-08 (the Phase 6 requirements this packaging supports)
- `.planning/ROADMAP.md` — Phase 5 + Phase 6 context

Key facts to carry forward:
- Upstream repo: `github.com/imartincei/CalcpadCE` (MIT license, forked March 2026)
- Spike commit hash: `3bc026b70c78a4385bd222c68620374be80f3be0`
- CLI binary name on Linux: `Cli` (not `Calcpad.Cli`) — csproj assembly name
- Server port is non-deterministic — use `--urls http://localhost:PORT` to pin it
- Build command: `dotnet publish Calcpad.Cli/Calcpad.Cli.csproj -r linux-x64 --self-contained true -p:PublishSingleFile=true -c Release -o <outdir>`
- Required patch: remove lines 54-62 (`AuthSettings` block) from `Calcpad.Server/Core/Services/CalcpadService.cs`

## Notes

Phase 6 is already delivering items 1 & 2 (the AuthSettings PR and Linux build docs) as part of its
own scope. This seed is specifically for the **longer-term packaging work** (build-linux.sh, CI artifacts,
.deb, systemd) that goes beyond what Phase 6 needs for LibreSpin itself.

Don't surface this until Phase 6 ships and the PR is merged — upstream relationship matters here.
