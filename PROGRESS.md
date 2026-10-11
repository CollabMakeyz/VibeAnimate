# VibeAnimate — implementation progress

Source of truth: `docs/MASTER PLAN.md` (the complete user-supplied plan).
Started: 2026-10-10. Repository baseline: `a673883` (README only).
Unchecked means not accepted, including partially implemented work. A milestone
requires code, tests, successful execution, acceptance evidence, documentation,
known limitations, and a demo project before it is checked.

## Phases and milestones (in required order)

- [ ] Phase Zero — deep research and all research exit gates.
- [ ] Phase One — architecture, interfaces, schema, workers, save format and ADRs.
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
- [ ] Panel, tool (including contextual behavior), and menu inventories.
- [x] Verified/provisional/unknown Windows/macOS shortcut matrix.
- [x] Merge/Object Drawing specifications and vector model ADR.
- [x] Timeline, tween comparison, symbols, IK and 3D behavior specifications.
- [x] XFL/SWF compatibility decision.
- [x] Pointer Events capability matrix and native fallback decision.
- [x] Renderer comparison and licensing inventory.
- [x] Risk register, test plan and benchmark plan.

## Phase One exit gates

- [ ] Folder tree and principal interfaces.
- [ ] Explicit versioned schema and native save format v1.
- [ ] Command/transaction design and worker boundaries.
- [ ] Renderer and tablet abstractions.
- [ ] Performance budgets and architectural decision records.

## Current checkpoint

PARTIAL — Phase Zero. Read all 3,857 lines of the supplied plan and established that
the initial repository contained only README.md. Created the required first-delivery
research documents, four ADRs, a 95-item feature matrix, 16-source bibliography,
19-risk register, panel/tool/menu/shortcut inventories, testing and benchmark plans.

Dependency-free research harness and disposable numerical experiments: 46 tests
passed on Windows/Node 24.19.0. `npm run check` validates research references,
matrix synchronization, absence of unaudited package dependencies, and tests.
`npm run gate:phase-zero` correctly fails while the research gate is incomplete.
Benchmark evidence: `docs/checkpoints/phase-zero-numerics.json` (20,000 cases per
batch, ten measured batches; not a graphics/frame-rate benchmark). Thirty browser AA
scenarios also measured successfully, including shared edges and a decomposed hole:
`docs/checkpoints/phase-zero-rendering-boundaries.json`. Independent fringe produced
visible internal seams; MSAA and supersampling preserved the shared boundary.
Original cubic-to-quadratic conversion passed 200 seeded-curve bound checks.

Research gate review now leaves one open item: reconcile the supplemental dated
menu inventory against the primary manual, preserving source conflicts explicitly.
Motion Editor/shape hints/span boundaries, primitive/text/3D tools and solver/fitting
literature are specified; provisional shortcuts remain clearly identified.
Next: finish that inventory reconciliation and run the Phase Zero exit check.
Then close Phase Zero based on evidence and enter Phase One. No production feature
has been accepted. Rust/Cargo and physical tablet validation are still unavailable.

## Evidence rules

Never treat a screenshot, button, stub, simulated tablet, or passing isolated
unit test as proof of complete workflow parity. Record exact commands, counts,
platforms, deviations, dependency changes and next steps for each checkpoint.
Physical tablet and reference-machine graphics results must be measured, not
inferred. The overall goal remains active until the full acceptance criteria pass.
