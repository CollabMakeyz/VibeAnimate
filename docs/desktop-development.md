# Desktop development

The application is a real Tauri window with a Rust backend, Preact chrome,
capability diagnostics, structured bounded local logs and a recoverable render
boundary. M2 adds a blank Stage, shared camera commands, navigation and WebGL2/
Canvas2D backdrop rendering. Artwork editing and animation are still pending.
The design and icon are original.

## Prerequisites and startup

Node 22+ (24.19.0 tested), Rust/Cargo 1.99.0 and the platform's native WebView build
prerequisites are required. Windows needs MSVC C++ build tools and WebView2;
Linux needs WebKitGTK 4.1 and the development packages listed in CI; macOS needs
Xcode command-line tools and its SDK under the host's Apple terms.
See [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

From the repository root:

```sh
node scripts/audit-dependencies.mjs --npm-only
npm ci --ignore-scripts
node scripts/audit-dependencies.mjs --installed
npm run check
npm run test:native
npm start
```

The workspace-local Rust installation is discovered automatically when present;
otherwise Cargo must be on PATH. Set `VIBEANIMATE_TOOLCHAIN_ROOT` only to explicitly
use another directory containing `cargo/bin` and `rustup`. It never changes global
environment settings. `npm run doctor` reports host prerequisites.

`npm run build:native` produces `target/debug/vibeanimate-desktop.exe` on Windows.
No installer is produced by this milestone. `npm start` compiles current assets
and starts the native process. There is no required frontend development server.

## Build and boundaries

Cargo's workspace owns `apps/desktop/src-tauri`; the root npm lock owns frontend
and verification packages. `packages/` and `workers/` remain independently typed
architecture boundaries. The DOM framework is used only by application chrome.
TypeScript emits native ES modules under dist/modules, preserving repository-relative
paths; an import map resolves audited local vendor modules. This avoids a bundler
and does not load modules from a CDN. Core modules are separately type-checked
without DOM types; Stage surface backends and Preact chrome belong to the desktop.

`npm run lint` uses strict TypeScript semantic checks plus application AST rules
against explicit `any`, dynamic code execution, raw HTML injection and type-check
suppression. `npm run format` applies TypeScript's own stable syntax printer to
desktop TS sources and implemented runtime package modules. `npm run lint:native` runs Clippy with warnings denied;
`cargo fmt --all` formats Rust, and `npm run format:check` checks both languages.
These checks have stated scope; they do not claim comprehensive security analysis.

Only the local `main` window receives `runtime_info`, `log_event`, `read_logs`.
The application declares commands in its build manifest so Tauri enforces these
capabilities. No filesystem, shell or external-origin capabilities are granted.
CSP blocks remote scripts, frames, objects and network requests.

The log directory is supplied by Tauri's platform `app_log_dir`. Records are JSONL;
messages are at most 512 Unicode scalars, accepted event codes/levels are enumerated,
and one current file plus one rotated file are each limited to 1 MiB. Automatic
frontend errors record a generic message, never document data or stack paths.
The diagnostic panel reads only the current fixed log filename, with no path input.

GPU context creation is tested and released. Pointer/worker/offscreen flags mean
API availability only. Physical pressure, tilt, eraser and latency remain unverified.

## Verification and demo

The running diagnostics window is the M1 demonstration. Refresh its diagnostics
and consult the session log to exercise native IPC and real file persistence.
`examples/contracts/rectangle.document.json` remains the architecture sample;
it is not yet an openable animation file. The M2 Stage starts from a canonical,
deeply immutable blank DocumentDTO; camera/grid display settings remain outside it.
Its current scope and outstanding work are in checkpoints/m2-stage.md.

`npm run test:e2e` launches the built Windows executable with an isolated WebView2
profile and loopback CDP endpoint. It tests native startup/IPC, capability rendering,
log actions, permission and input rejection, CSP, actual render-error recovery and
reload. Stage checks additionally read actual pixels from both graphics backends,
dispatch pointer/keyboard events and exercise context loss/recovery. It writes a
screenshot and JSON report under `test-results/`, then stops
only its own process. The test command first builds the explicit Cargo e2e feature. Only debug Windows
builds with that feature recognize the test arguments. They validate a loopback port
and an existing empty absolute profile directory, then pass the settings directly
to the native WebView API. Normal builds and release builds have no such code.
This follows [Microsoft's explanation of elevated WebView2 hosts](https://github.com/MicrosoftEdge/WebView2Feedback/issues/5645): Runtime 150+ ignores
WebView environment overrides in elevated processes. No registry/security setting
is changed, and the host runtime is not downgraded.
macOS/Linux native E2E drivers are not implemented; they are not counted as passes.

## License delivery

Full exact-version npm/Cargo inventories and scoped approvals are in `docs/`.
The static audit runs without building crates. Before native compilation, the
runner also resolves and audits live complete all-target Cargo metadata with
`--locked`, including features and sources. Source archives use lock checksums.
Every frontend build includes retained notices and checksum-verified unmodified
MPL source archives under `license-sources/`. Upgrading dependencies or enabling
new features requires explicit inventory review; approvals do not float versions.
