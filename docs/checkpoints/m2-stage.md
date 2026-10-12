# M2 Stage integration

2026-10-12. Partial implementation; M2 is still unchecked.

The native application starts on a real Stage view. The original diagnostics and
native log actions remain available through the Diagnóstico navigation button.
Stage controls use the production shared command registry: Hand/Zoom, fit, 100%,
center, zoom in/out, rotation/reset, mirror axes and grid toggle. Input fields and
buttons retain their keyboard behavior. Ctrl/Command + wheel zooms at the cursor;
plain wheel/trackpad pans; Alt + wheel rotates. Hand drag, temporary Space drag,
middle-button drag and two-contact pan/pinch/rotation update the same camera.

`createBlankDocument` builds a deeply immutable, structurally valid v1 document
with one scene, timeline, layer and empty first-frame exposure. This is not a
file loader, document editor or persistence claim. No placeholder artwork or
fake timeline controls are displayed.

`stage-backdrop.ts` builds clipped Stage and adaptive-grid polygons in float64
CSS coordinates. WebGL2 receives bounded float32 positions and original shaders;
Canvas2D fills the same polygons. Neither path is the eventual artwork renderer.
Backing size is capped at 8192 per dimension / 16M pixels; camera/input math stays
in CSS coordinates regardless of that cap. Grid display spacing increases by
powers of two to keep lines at least 12 CSS pixels apart; the configured spacing
is retained for future snapping. This does not yet implement snapping.

WebGL context loss replaces the owned canvas with Canvas2D and preserves camera
state. The rendering selector can explicitly retry WebGL2. Canvases, GPU buffers,
programs, observers, event handlers and scheduled frames are released on teardown.
Renderer initialization and drawing failure have a Canvas2D fallback; an unavailable
Canvas2D backend is a visible error, not simulated rendering.

## Verification and boundaries

114 Node tests passed, including new blank-document structural/reference checks,
viewport clipping/float32 bounds, adaptive-grid work bounds, invalid input rejection,
single-pointer pan, two-contact anchor preservation and pointer lifecycle cases.
Strict application/package types and formatting passed. The formatter now converges
TypeScript source-layout hints before writing/checking, avoiding repeated invocations.
The Windows native debug build also passed with the Stage frontend embedded.

The expanded native E2E checks real WebGL2 and Canvas2D pixel readback at DPR 1/2,
native input dispatch, cursor anchor preservation, toolbar commands, text-input
protection, actual context loss and explicit WebGL retry. Its result is pending
at this checkpoint; synthetic native events are not physical tablet evidence.

The preceding workspace-core checkpoint passed all three CI platforms at a1691ac:
https://github.com/CollabMakeyz/VibeAnimate/actions/runs/38276099712.

Still missing for M2: full menu/palette integration, docking/floating UI, document
tabs, editable properties and model-backed Library/Timeline surfaces, rulers and
guides, snapping, themes/UI scaling and settings adapter integration. Full M2
acceptance and the later milestones remain outstanding.

Implementation references: [Khronos WebGL 2.0 specification](https://registry.khronos.org/webgl/specs/latest/2.0/)
for context creation and GL API semantics, and [W3C Pointer Events](https://w3c.github.io/pointerevents/)
for pointer capture/cancellation and touch-action. Both are living specifications;
no historical editor parity claim is derived from them.

## CI regression findings

Run 38314318271 at ae515ec passed Linux but found two test-harness defects:
Windows CDP rejected two statements supplied where the evaluator expects an
expression; macOS exposed concurrent diagnostic tests sharing a timestamp-based
temporary directory. The Stage interaction checks had not yet executed when the
Windows harness failed. No renderer acceptance is inferred from that run.

Both are corrected: multi-statement evaluations use an explicit function expression,
and temporary test folders use an atomic sequence plus exclusive directory creation.
A Node regression parses every literal E2E expression in the actual async wrapper;
it failed on the original code and passes after the fix. A Rust regression reserves
16 directories concurrently using the same clock tick and verifies uniqueness.
The expanded suites contain 115 Node tests and seven Windows Rust tests (five on
macOS/Linux); the new native CI result still needs verification.
