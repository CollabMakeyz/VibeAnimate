# Known limitations

Current state: **native M1 foundation implemented and locally verified on Windows**.
Phase Zero research and Phase One architecture are reviewed. The application opens
an actual Tauri window with native IPC, bounded persistent diagnostic logs, graphics
and API detection, error handling and render-boundary recovery.

There is no drawing Stage, editable document, command engine, timeline, library,
import/export, scripting or save/load container implementation yet. M2–M11 remain
unchecked. The 95-item editor feature matrix remains NOT IMPLEMENTED; the diagnostics
window is not evidence of animation parity. TypeScript interfaces describe boundaries,
not implemented model/worker/renderer behavior. Structural schema validation does not
check dangling references, cycles, geometry or native package bytes.

Local Windows checks passed: 77 Node tests, four Rust tests, strict TypeScript,
formatting and Clippy, native build/run and the E2E bootstrap including actual IPC,
log writes, input/permission/CSP rejection, render-error recovery and reload.
Cross-platform CI for this revision is pending. macOS/Linux native E2E drivers are
not implemented. No installer, release signing or reference-machine performance
acceptance exists. No physical tablet has been exercised.

The complete all-target Rust graph is reviewed with exact scoped license approvals.
Preact and Tauri JavaScript are adopted for runtime; the compiler is development only.
MPL corresponding sources and notices are included with built assets. Platform SDK
terms remain host obligations. Dependency and feature changes require review.

The browser AA experiment covers thirty convex/decomposed cases, not arbitrary
topology. Historical shortcut unknowns and menu-placement conflicts remain explicit.
No milestone is accepted from a screenshot or synthetic hardware events alone.
