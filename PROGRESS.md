# VibeAnimate — implementation progress

Source of truth: `docs/MASTER PLAN.md` (the complete user-supplied plan).
Started: 2026-10-10. Repository baseline: `a673883` (README only).
Unchecked means not accepted, including partially implemented work. A milestone
requires code, tests, successful execution, acceptance evidence, documentation,
known limitations, and a demo project before it is checked.

## Phases and milestones (in required order)

- [x] Phase Zero — deep research and all research exit gates.
- [x] Phase One — architecture, interfaces, schema, workers, save format and ADRs.
- [x] M1 Foundation — monorepo, Tauri/Rust, TypeScript, lint/format, test/E2E harness,
      CI, logging, error boundary, capabilities, documentation and license audit.
- [ ] M2 UI Shell + Stage — commands, panels/docking/floating, tabs, Stage,
      camera, rulers/guides/grid/snapping, themes and persistent workspaces.
- [ ] M3 Vector Core — selection/subselection/lasso, drawing/editing tools,
      actual Merge/Object Drawing, fills/strokes/gradients, color and swatches.
- [ ] M4 Tablet Professional — pressure curves, tilt/twist, eraser/barrel,
      hover, coalescing/prediction, palm heuristic, fitting, calibration/gestures;
      synthetic suite and at least one physical tablet validation.
- [ ] M5 Timeline — layers/folders/guides/masks, frame operations, playback,
      scrub/onion/fps/scenes and 50 × 500 virtualized timeline.
- [ ] M6 Symbols + Library — MovieClip/Graphic/Button, nested editing, assets,
      instances, color effects, blend modes, filters and cycle protection.
- [ ] M7 Tweening — classic/motion/shape, graphical Motion Editor, property keys,
      easing, paths/guides and shape hints; deterministic Stage/export parity.
- [ ] M8 Advanced Tools — Bone/Bind/IK/poses, 2.5D transforms and original gizmos,
      seeded Deco/Spray; persisted and undoable behavior.
- [ ] M9 Text + Scripting + Publish — text layout, isolated permissioned scripts,
      PNG/sequence/SVG/GIF/HTML5/WebM and capability-dependent MP4; async/cancel.
- [ ] M10 Compatibility — bounded SWF/XFL subsets, corpus and explicit reports.
- [ ] M11 Polish — performance, accessibility, DPI, keyboard/workspace parity,
      recovery/autosave, installers, profiling/memory and physical hardware matrix.

## Phase Zero exit gates

- [x] Feature matrix and research evidence/confidence classification (95 items).
- [x] Panel, tool (including contextual behavior), and menu inventories.
- [x] Verified/provisional/unknown Windows/macOS shortcut matrix.
- [x] Merge/Object Drawing specifications and vector model ADR.
- [x] Timeline, tween comparison, symbols, IK and 3D behavior specifications.
- [x] XFL/SWF compatibility decision.
- [x] Pointer Events capability matrix and native fallback decision.
- [x] Renderer comparison and licensing inventory.
- [x] Risk register, test plan and benchmark plan.

## Phase One exit gates

- [x] Folder tree and principal interfaces.
- [x] Explicit versioned schema and native save format v1 specification.
- [x] Command/transaction design and worker boundaries.
- [x] Renderer and tablet abstractions.
- [x] Performance budgets and architectural decision records.

## Current checkpoint

Phase Zero, Phase One and M1 Foundation COMPLETE. M2 UI Shell + Stage is in progress.
The supplied 3,857-line plan was read in full; the initial repo contained only README.
Research preserves the 95-item feature matrix, 16 sources, 19 risks and thirty AA
measurements. See `docs/checkpoints/phase-zero-review.md` for that accepted scope.

Phase One adds explicit v1 JSON Schema and generated readonly DTOs; model, command,
geometry, input, tool, renderer, timeline, persistence and worker contracts; original
rectangle DTO demonstration; structural validation; native-format and transaction
specifications; concrete resource budgets; and five ADRs. Details and exact limits
are in `docs/checkpoints/phase-one-review.md`. The save format is specified, not a
functioning serializer. Interfaces are not implementations of editor features.

M1 now has a real Tauri 2.12.3 native window, Rust backend, Preact/TypeScript chrome,
strict compiler checks, TS formatting/AST lint, Rustfmt/Clippy, enumerated local-only
IPC capabilities, bounded rotating JSONL logs, capability detection and a recoverable
render error boundary. The native bootstrap test launches the built Windows executable.

M1 acceptance on 2026-10-12: 77 Node tests, six Windows Rust tests (four on
macOS/Linux), strict types, generated records, licenses/notices, formatting, Clippy
and native builds passed. CI at commit 7814abc passed Windows/macOS/Linux;
Windows native E2E passed startup, IPC, log actions, permission/input/CSP rejection,
render-failure recovery and reload. Run: https://github.com/CollabMakeyz/VibeAnimate/actions/runs/38273313767.
Screenshot: docs/checkpoints/screenshots/m1-native-window.png.

Nine exact npm packages and 406 external Rust packages are adopted. Three separate
user approvals cover TypeScript bundled terms, 31 exact Cargo versions and the
Tauri JavaScript API 2.12.3 bundled terms. Full retained notices, Cargo feature and
checksum evidence, and unmodified MPL corresponding sources accompany the build.

M2 first implementation checkpoint (2026-10-12): production camera math, shared
command registry, immutable DOM-independent DockLayout and versioned workspace
settings store are implemented. Tests exercise anchored zoom/rotation/mirrors,
DPR independence, fit/resize, keyboard context isolation, remapping/conflicts,
panel docking/floating/tabbing/restore, presets and durable named workspaces.
`npm run check` passes 106 tests plus strict types, formatting, inventories and
generated artifacts. No new dependency was added. These modules are not yet wired
to the native window; M2 remains unchecked. See docs/checkpoints/m2-workspace-core.md.

M2 Stage integration checkpoint: native startup now opens a navigable Stage, with
the M1 diagnostic surface accessible separately. WebGL2/Canvas2D painters consume
the same clipped backdrop geometry; the shared command registry drives camera
buttons/shortcuts; pointer navigation supports pan/pinch/rotation; blank document
creation conforms to v1. 114 Node tests passed. Native E2E additions cover real
pixel readback, pointer/keyboard interaction and context-loss recovery; their new
CI result is not yet available. No physical gesture/device certification is claimed.
The first Stage CI (38314318271, ae515ec) passed Linux but exposed an invalid CDP
test expression and a macOS temporary-test-directory collision. Both are fixed,
with additional regression tests; the expanded suites contain 115 Node tests and
seven Windows/five Unix Rust tests. Native Stage acceptance awaits the corrected CI.

The corrected Rust/JS harness passed macOS/Linux in run 38314909700 (faf9e4f).
Windows passed native startup and the dual-backend pixel checks, then failed the
cursor-anchor comparison. The test now records the native wheel coordinates and
requests integer CSS positions without relaxing tolerance; revalidation is pending.

M2 docking integration now connects the four panels to DockLayout and scoped local
workspace storage. Dock/float/tab/close/restore, pointer resizing, three presets and
custom save/rename/delete/reset are connected. Properties exposes real view settings;
Library/Timeline show the actual empty-document data and do not claim editing.
New native tests cover floating pointer gestures, the DOM drop route and persistent
custom layouts across reload. This integration is not yet accepted by native CI.

Next: finish native Stage/docking validation, then document tabs, editable document
properties, menus/palette, rulers/guides/snapping, themes and UI scaling. macOS/Linux
native E2E and physical tablet validation remain explicit validation work. No
drawing, timeline, document save/load or export feature is claimed.

## Evidence rules

Never treat a screenshot, button, stub, simulated tablet, or passing isolated
unit test as proof of complete workflow parity. Record exact commands, counts,
platforms, deviations, dependency changes and next steps for each checkpoint.
Physical tablet and reference-machine graphics results must be measured, not
inferred. The overall goal remains active until the full acceptance criteria pass.

M2 tabs checkpoint (2026-10-13): canonical blank documents now open in independent
session tabs, retain their own camera, close to an adjacent tab or welcome screen,
and remount Stage without duplicate command registrations. Global shortcuts also
work with body focus. `npm run check` passes 118 tests. Stage/workspace/tabs pass
in an isolated Chromium preview; Windows native revalidation remains pending.
Run 38316048794 passed the full native Stage checks, then exposed unitless CSS
lengths in floating/docked panel placement. Explicit px fixes reproduce and resolve
the defect locally. See docs/checkpoints/m2-document-tabs.md. Next: native CI,
menus/palette, preferences, editable properties, rulers/guides/snapping and remaining
M2 acceptance. No M2 milestone completion is claimed.
