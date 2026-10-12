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

## CI follow-up — 2026-10-12

Runs 38186111032 and 38186258788 passed the complete macOS/Linux jobs and Windows
format/lint/unit/native build checks. Windows native E2E timed out waiting for its
owned CDP endpoint while the process remained alive. This is not a passing M1 gate.
[Run 38186258788](https://github.com/CollabMakeyz/VibeAnimate/actions/runs/38186258788).

Microsoft documents that elevated WebView2 hosts ignore environment-variable
browser overrides starting with Runtime 150. The previous harness relied on those
variables. The candidate fix uses an explicit debug-only e2e Cargo feature: validated
port/profile arguments configure the native WebView API directly. The normal and
release application paths omit this configuration. No system policy is modified.
The test runner now reports the last discovery result and captured native output
on timeout. Two Windows unit tests validate isolated-profile and argument rejection;
six Windows Rust tests and Clippy passed locally. Native CI confirmation is pending.
No added third-party package or new external Cargo feature was required.
