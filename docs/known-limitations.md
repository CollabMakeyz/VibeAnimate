# Known limitations

Current state: **native M1 foundation implemented and locally verified on Windows**.
Phase Zero research and Phase One architecture are reviewed. The application opens
an actual Tauri window with native IPC, bounded persistent diagnostic logs, graphics
and API detection, error handling and render-boundary recovery.

M2 now opens a Stage view using WebGL2/Canvas2D, camera commands, hand/zoom tools
and a bounded adaptive grid. Pointer pan/pinch/rotation and the command registry
are integrated. The DockLayout model and named-workspace store still await UI
integration. Current Node suite has 114 passing tests. Newly added native Stage
E2E must pass before claiming native interaction acceptance. The historical native
M1 evidence below remains distinct.

The Stage displays a canonical empty document; it does not yet edit artwork.
There is no transaction/undo engine, functional timeline/library editor,
import/export, scripting or save/load container implementation yet. M2–M11 remain
unchecked. The 95-item editor feature matrix remains NOT IMPLEMENTED; the diagnostics
window is not evidence of animation parity. TypeScript interfaces describe boundaries,
not implemented model/worker/renderer behavior. Structural schema validation does not
check dangling references, cycles, geometry or native package bytes.

Local Windows checks passed: 77 Node tests, six Windows Rust tests, strict TypeScript,
formatting and Clippy, native build/run and the E2E bootstrap including actual IPC,
log writes, input/permission/CSP rejection, render-error recovery and reload.
Cross-platform native CI passed at 7814abc; Windows native E2E passed after
configuring the debug test endpoint through the native API. macOS/Linux native E2E drivers are
not implemented. No installer, release signing or reference-machine performance
acceptance exists. No physical tablet has been exercised.

The complete all-target Rust graph is reviewed with exact scoped license approvals.
Preact and Tauri JavaScript are adopted for runtime; the compiler is development only.
MPL corresponding sources and notices are included with built assets. Platform SDK
terms remain host obligations. Dependency and feature changes require review.

The browser AA experiment covers thirty convex/decomposed cases, not arbitrary
topology. Historical shortcut unknowns and menu-placement conflicts remain explicit.
No milestone is accepted from a screenshot or synthetic hardware events alone.
