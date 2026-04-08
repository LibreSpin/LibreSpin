# PR 002: docs: document Linux build notes (binary naming, server port, dotnet-install path)

**Target:** imartincei/CalcpadCE — main branch
**Source:** LibreSpin/CalcpadCE — librespin-patched branch
**Type:** Documentation

## Summary

While building CalcPad CE on Linux for the LibreSpin project, three Linux-specific details were not documented in the README. This PR adds a "Building on Linux" section to the README capturing them so future Linux contributors don't re-discover them.

## Notes added

1. **Binary assembly name** — On Linux, the published `Calcpad.Cli` project produces an ELF binary named `Cli`, not `Calcpad.Cli`. This is the default dotnet assembly name from the csproj. Users invoking the binary must call `./Cli`, not `./Calcpad.Cli`.

2. **Calcpad.Server port is not 8080 by default** — When started without `--urls`, Kestrel binds a non-deterministic port (observed 9420 in one run). Scripts that assume port 8080 will fail. Recommended invocation:
   ```
   Calcpad.Server --urls http://localhost:9421
   ```
   Or parse the `Now listening on:` line from stdout at startup.

3. **.NET 10 install path without sudo** — `dotnet-install.sh --install-dir /tmp/dotnet10 --version 10.0.x` works in sandboxed environments (e.g. CI or agent containers) without requiring root. The resulting self-contained publish does NOT need .NET at runtime, so end-users don't need this step.

## Proposed README diff

(Append a new section to README.md under "Building from source".)

```diff
--- a/README.md
+++ b/README.md
@@ -X,Y +X,Y @@
 ## Building from source

 ### Windows / macOS
 ...

+### Linux (x64)
+
+```bash
+# Install .NET 10 SDK (no sudo required)
+curl -sSL https://dot.net/v1/dotnet-install.sh | bash -s -- \
+  --install-dir /tmp/dotnet10 --version 10.0.x
+export PATH=/tmp/dotnet10:$PATH
+
+# Publish self-contained single-file Cli
+dotnet publish Calcpad.Cli/Calcpad.Cli.csproj \
+  -r linux-x64 --self-contained true \
+  -p:PublishSingleFile=true -c Release -o ./dist
+
+# Note: the ELF binary is named `Cli`, not `Calcpad.Cli`
+./dist/Cli input.cpd output.html -s
+```
+
+### Calcpad.Server port
+
+Kestrel does not default to port 8080 — always pass an explicit URL:
+
+```bash
+Calcpad.Server --urls http://localhost:9421
+```
+
+Or parse the `Now listening on:` line from stdout if you need the actual bound port.
```

## Observed evidence

- Build environment: Ubuntu Linux 22.04 / kernel 6.8.0-106-generic x86_64
- .NET SDK: 10.0.201 installed via dotnet-install.sh to /tmp/dotnet10 (no sudo)
- CLI binary path after publish: `./dist/Cli` (79 MB self-contained ELF)
- Server binary path after publish: `./publish/Calcpad.Server` (109 MB self-contained ELF)
- Server bound port in test run: 9420 (not 8080)
- `dotnet-install.sh` invocation: `bash dotnet-install.sh --install-dir /tmp/dotnet10 --version 10.0.x`

## Test plan

- [x] Copy-paste build commands work on fresh Ubuntu 22.04 (verified in LibreSpin Phase 5 spike)
- [x] Binary `Cli` executes and produces HTML output
- [x] `Calcpad.Server --urls http://localhost:9421` binds correctly
- [x] `POST /api/calcpad/convert` returns evaluated HTML

## Related

Documented while building pre-release binaries for LibreSpin (https://github.com/LibreSpin/LibreSpin). Evidence in LibreSpin's `.planning/spike-calcpad.md` — Sections 2, 4, and 7 (Deviations from Research).
