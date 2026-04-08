# PR 001: fix(Calcpad.Server): remove references to deleted MacroParser.AuthSettings API

**Target:** imartincei/CalcpadCE — main branch
**Source:** LibreSpin/CalcpadCE — librespin-patched branch
**Type:** Bug fix (build-breaking)

## Summary

`Calcpad.Server/Services/CalcpadService.cs` references `MacroParser.AuthSettings`, a member that was removed from the `Calcpad.Core` parser in recent development commits. This causes CS1061 / CS0234 build errors when building from source against the current parser on .NET 10.

This PR removes the stale `AuthSettings` references so `Calcpad.Server` builds cleanly on .NET 10.

## Reproduction

On a clean Linux environment with .NET SDK 10:

```bash
git clone https://github.com/imartincei/CalcpadCE
cd CalcpadCE
dotnet build Calcpad.Server/Calcpad.Server.csproj
```

Observed: CS1061 errors on `MacroParser.AuthSettings`.

## Fix

Delete the optional AuthSettings wiring block in `CalcpadService.cs`. The parser no longer exposes this surface; the server side should not assume it.

The removed block is lines 54–62 of the original file — an `if (settings?.Auth != null)` guard that set `macroParser.AuthSettings` properties used only for `#fetch` authentication. The `/api/calcpad/convert` endpoint is completely unaffected by this removal.

## Diff

<!-- TODO: inline diff once 06-01 produces calcpadce-authsettings-patch.diff -->

The patch removes approximately 8 lines from `Calcpad.Server/Services/CalcpadService.cs`:

```diff
--- a/Calcpad.Server/Services/CalcpadService.cs
+++ b/Calcpad.Server/Services/CalcpadService.cs
@@ -51,14 +51,6 @@ public class CalcpadService : ICalcpadService
         var macroParser = new MacroParser(parser);
         macroParser.Parse(content);
 
-        if (settings?.Auth != null)
-        {
-            macroParser.AuthSettings = new AuthSettings
-            {
-                UserName = settings.Auth.UserName,
-                Password = settings.Auth.Password,
-            };
-        }
-
         await macroParser.Calculate();
         return parser.PrintHtml();
     }
```

The exact diff will be confirmed and inlined once the upstream patch file is exported from the LibreSpin fork (LibreSpin/CalcpadCE — librespin-patched branch).

## Test plan

- [x] `dotnet build Calcpad.Server/Calcpad.Server.csproj` succeeds on .NET 10
- [x] `dotnet publish Calcpad.Cli -r linux-x64 --self-contained true -p:PublishSingleFile=true` produces a working binary
- [x] `Calcpad.Server --urls http://localhost:9421` starts and accepts `POST /api/calcpad/convert`
- [x] Verified end-to-end in LibreSpin Phase 5 spike (see LibreSpin/LibreSpin .planning/spike-calcpad.md)

## Related

Surfaced while building binaries for the LibreSpin project (https://github.com/LibreSpin/LibreSpin), which uses CalcPad CE as a headless calculation engine.

Evidence: LibreSpin/LibreSpin `.planning/spike-calcpad.md` — Section 2 (Build Results) and Section 7 (Deviations from Research).
