# M1 native foundation checkpoint

2026-10-11. Windows 10.0.26200 x64, Node 24.19.0, Rust/Cargo 1.99.0, MSVC 2026,
WebView2 154.0.4258.62. M1 acceptance is pending review of the new cross-platform CI.

Implemented: native workspace and real Tauri window, strict TS/Preact frontend,
local-only declared IPC permissions, structured bounded rotating logs, GPU/API
capability detection, render-error recovery, lint/format, unit/native E2E harness,
CI and complete lock/inventory/notices checks. The diagnostic UI is the M1 demo.
No animation feature, physical tablet result or installer is implied.

Evidence:
- npm run check: 77 tests passed plus strict types, generated records, licenses,
  notices and desktop lint/build.
- node scripts/native.mjs test: four Rust tests passed.
- node scripts/native.mjs lint: Clippy passed with warnings denied.
- node scripts/native.mjs build: native Windows build passed and window launched.
- npm run test:e2e: real packaged WebView startup, IPC, log action persistence,
  rejection checks, controlled render failure/recovery and embedded-asset reload.
  See m1-native-e2e.json. A screenshot of the actual native window is in screenshots/.

Failures found and corrected: missing Windows icon on first build; stale initial
loading DOM on first window run; circular module await in combined license CLI;
E2E expression quoting. Each affected check was rerun after the correction.

Nine npm packages and 406 Rust registry packages are reviewed. Exact additional
terms are user-approved and notices retained. 5 MPL source archives are included
with frontend assets after checksum verification. APIs remain scoped; dependency
features cannot drift unnoticed. The complete Rust graph includes other OS targets.

Next: review cross-platform native CI, finalize M1, then implement M2. macOS/Linux
native UI automation and physical tablet validation remain untested.
