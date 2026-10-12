# VibeAnimate

An original desktop vector-animation editor project following [MASTER PLAN](docs/MASTER%20PLAN.md).
**Current state: a native Stage with camera navigation and diagnostics. Drawing and
animation workflows are not implemented yet.** [PROGRESS.md](PROGRESS.md) tracks
all phases and milestones; screenshots do not imply complete editor functionality.

## Run

Requires Node 22+, Rust/Cargo 1.99.0 and [native platform prerequisites](https://v2.tauri.app/start/prerequisites/).
Windows additionally needs MSVC C++ build tools and the WebView2 runtime.

```sh
node scripts/audit-dependencies.mjs --npm-only
npm ci --ignore-scripts
node scripts/audit-dependencies.mjs --installed
npm start
```

The window opens a blank Stage. Drag with the Hand tool or middle mouse button to
pan; Ctrl/Command + wheel zooms at the cursor; Alt + wheel rotates. The toolbar
provides fit/100%/center, rotation/reset, mirror and grid controls. The rendering
selector switches between WebGL2 and Canvas2D. Diagnóstico opens actual native
IPC and graphics/API availability plus the local log. Pressure/tilt/eraser and
touch hardware remain physically unverified.
See [desktop development](docs/desktop-development.md) for architecture, build outputs,
logging, licensing, tooling and the native E2E harness.

## Verify

```sh
npm run check
npm run format:check
npm run lint:native
npm run test:native
npm run build:native
npm run test:e2e
```

Native E2E currently runs on Windows WebView2. Other OS builds have separate CI
checks and are not treated as native interaction coverage. Reports are written
under test-results/. Installers and editor workflows belong to later milestones.

## Project records

- [Architecture](docs/architecture.md) and [native format specification](docs/native-format-v1.md)
- [Research](docs/research.md), [feature matrix](docs/feature-matrix.md) and [progress](PROGRESS.md)
- [Known limitations](docs/known-limitations.md), [assumptions](docs/assumptions.md), [testing](docs/testing.md)
- [Clean-room policy](docs/clean-room-policy.md) and [licensing](docs/licensing.md)

The standalone research probe remains available with npm run probe:rendering.
The contract demo (npm run demo:contracts) validates an original rectangle DTO;
it is not an openable animation file or a completed persistence implementation.
