# M2 camera, commands and workspace core

2026-10-12. M2 is **PARTIAL**, not accepted. The visible application still shows
M1 diagnostics. This checkpoint contains working production modules awaiting UI
integration, not a claim that drawing/editor workflows are already available.

## Implemented

- `packages/renderer-core/src/camera.ts`: immutable camera, CSS/backing-store affine
  matrices, forward/inverse mapping, anchored zoom and orientation, pan, rotated
  fit, center and resize. Finite/range checks fail explicitly. Rotation normalization
  is idempotent; copying a camera cannot accumulate rounding in its angle.
- `packages/command-system/src/registry.ts`: shared listing/enablement/check/invoke
  path for menus, palette and shortcuts; full keyboard contexts; platform modifiers,
  exact matching, context precedence, conflict detection, atomic remapping/reset,
  opt-in repeat and IME/AltGr protection. Command callbacks propagate failures.
  This does not implement document transactions or undo/redo.
- `packages/workspace/src/dock-layout.ts`: immutable versioned layout for the four
  initial editor panels; grouping/tab order, dock edge/size, floating bounds,
  group order, close/restore/selection/collapse and viewport recovery. Every panel
  retains exactly one home. Decoder rejects unknown fields, versions, panel IDs,
  duplicates, invalid active tabs, missing panels, nonfinite sizes and oversized
  input. Essentials/Animator/Designer have distinct original layouts.
- `packages/workspace/src/workspace-store.ts`: persistent working layout plus
  named snapshots; select, save, overwrite, rename, delete and reset. Injected
  storage boundary needs no DOM or native API. Write errors leave current state
  unchanged; corrupt settings fail explicitly instead of overwriting stored data.
- Desktop emission now preserves root-relative ESM imports under `dist/modules`;
  bootstrap and native E2E paths follow that structure. No dependencies changed.

## Verification

`npm run check` passed: **106 tests**, strict application and DOM-free package
types, formatting/AST checks, schema generation, research records, complete npm/
Cargo license inventory and notices. New test files are `tests/desktop/camera.test.mjs`,
`commands.test.mjs` and `workspace.test.mjs` (29 tests added).
`npm run build:native` also passed on Windows with the new emitted module layout.
Native interaction tests for these new modules await their UI integration.

Camera tests include known analytic transforms; all mirror combinations across
five rotations, five zoom scales and four DPRs; 1,200 deterministic mixed gestures;
rotated fit across the full turn; maximum-format Stage dimensions; repeated camera
copying; resize focus; invalid inputs and arithmetic overflow. A failing DPR test
exposed non-idempotent angle normalization, which was fixed before acceptance of
this code checkpoint.

Command tests exercise actual registered callbacks, menu/palette state, disabled
commands, protected typing/modal contexts, OS modifiers, repeat, dead keys, AltGr,
conflicts, atomic rebind failure and stale disposers. Workspace tests exercise
durable round trips across independent store instances, quota failure, malformed
data, custom limits, viewport recovery and 400 mixed panel operations without
losing or duplicating any panel.

## Exact continuation

1. Build the real editor chrome using these modules and a scoped settings adapter.
2. Implement Stage/pasteboard rendering through WebGL2 and Canvas2D fallback,
   pointer/keyboard navigation and context-loss/resize behavior.
3. Connect functional menus, palette, panels/docking, document tabs and document
   properties; make Library/Timeline surfaces reflect actual document state.
4. Implement rulers, guides, grid/snapping, themes, UI scaling and reduced motion.
5. Expand native E2E with real interactions and visual evidence; prove every M2
   acceptance criterion before checking the milestone. The existing M1 screenshot
   does not prove any M2 UI behavior. M3–M11 remain outstanding.
