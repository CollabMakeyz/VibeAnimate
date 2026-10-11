# VibeAnimate — implementation progress

Source of truth: `docs/MASTER PLAN.md` (the complete user-supplied plan).
Started: 2026-10-10. Repository baseline: `a673883` (README only).
Unchecked means not accepted, including partially implemented work. A milestone
requires code, tests, successful execution, acceptance evidence, documentation,
known limitations, and a demo project before it is checked.

## Phases and milestones (in required order)

- [x] Phase Zero — deep research and all research exit gates.
- [x] Phase One — architecture, interfaces, schema, workers, save format and ADRs.
- [ ] M1 Foundation — monorepo, Tauri/Rust, TypeScript, lint/format, test/E2E harness,
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

Phase Zero research and Phase One architecture COMPLETE. M1 Foundation is in progress.
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

Local validation: 77 Node tests, four Rust tests, strict types, generated artifacts,
license/notice checks, native build/run and E2E pass. Full Tauri cross-platform CI
is now configured; results for this checkpoint are pending. M1 remains unchecked
until the new CI results are reviewed. Screenshot: docs/checkpoints/screenshots/m1-native-window.png.

Nine exact npm packages and 406 external Rust packages are adopted. Three separate
user approvals cover TypeScript bundled terms, 31 exact Cargo versions and the
Tauri JavaScript API 2.12.3 bundled terms. Full retained notices, Cargo feature and
checksum evidence, and unmodified MPL corresponding sources accompany the build.

Next: review/fix cross-platform native CI; finalize M1 acceptance; then begin M2
UI Shell + Stage in order. macOS/Linux native E2E and physical tablet validation
remain explicit later validation work. No drawing, timeline, save/load or export
feature is claimed. See docs/checkpoints/m1-native-foundation.md for exact evidence.

## Evidence rules

Never treat a screenshot, button, stub, simulated tablet, or passing isolated
unit test as proof of complete workflow parity. Record exact commands, counts,
platforms, deviations, dependency changes and next steps for each checkpoint.
Physical tablet and reference-machine graphics results must be measured, not
inferred. The overall goal remains active until the full acceptance criteria pass.
