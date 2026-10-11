# Rendering design and research

Status: design, **NOT IMPLEMENTED**. Sources:
[WebGL2](https://registry.khronos.org/webgl/specs/latest/2.0/),
[Canvas/OffscreenCanvas](https://html.spec.whatwg.org/multipage/canvas.html),
[lyon](https://github.com/nical/lyon).

```text
Document (authoritative) → frame evaluator → immutable scene
  → visibility / clipping → tessellation adapter → bounded mesh cache
  → GPU buffers / batches → WebGL2 surface
                         ↘ Canvas2D fallback using same scene semantics
Ephemeral selection / guides / onion / ink → overlay pass
```

| Backend | Strength | Cost/risk | Role |
|---|---|---|---|
| WebGL2 | Explicit GPU buffers, batching and render targets | Tessellation, AA, masks and filters are our responsibility | Primary |
| Canvas2D | Broad fallback with path drawing | Throughput and filter parity differ | Functional fallback; unsupported effects reported |
| WebGPU | Modern explicit GPU execution | Target WebView and driver availability must be measured | Optional experiment only |

The renderer reads model output and owns no editable content. Cache keys contain
geometry revision, style revision, LOD bucket and effect/mask dependencies. Camera
movement may select a new LOD but must not rewrite paths. Pointer hover invalidates
overlay damage only. Onion neighbors retain distinct frame-aware entries.

The tessellator accepts contours and stroke expansion output and returns typed
vertex/index arrays. It does not perform merge semantics, hit testing or ownership.
Compare original ear clipping for restricted prototypes against lyon for production
paths, especially holes/self-intersections; do not adopt a simple polygon prototype
as a complete vector tessellator. Exact lyon version/dependency licenses remain an
adoption gate.

AA comparison must capture MSAA, fringe geometry and selective supersampling at
DPR 1/2 and multiple zooms; measure memory, triangle count, seams at shared fills
and edge quality. A convex-only browser measurement is now recorded below;
shared-edge and decomposed-hole results are recorded below; arbitrary-contour
tessellation remains a production adoption gate. Screen-space
flattening target starts at 0.25 CSS pixels and is measured with a bounded LOD cache.
Do not allocate a huge Stage texture as the general rendering strategy.

Context loss: stop GPU submission, keep document and undo unchanged, surface status,
discard invalid handles and recreate programs/buffers from immutable scene data.
Switching a canvas from an established WebGL context to 2D requires a replacement
surface, not a second getContext call on the same canvas. Restore to a verified
backend and reapply camera/size/overlay state. Test with forced context loss.

Masks need nested explicit clip relationships; complex blends and filters need
bounded intermediate targets. Cap target size against GPU limits, tile expensive
effects when supported, and report unsupported operations before export.
Premultiplied alpha/color-space decisions must be consistent across backends.

Optional OffscreenCanvas is negotiated by a worker handshake that creates a real
context. Constructor presence alone is insufficient. SharedArrayBuffer is never
required. Transfer compact dirty geometry batches, never the full document on
pointermove. Worker replies carry document/revision/job IDs; stale work is discarded.

Camera state is separate from Stage coordinates: translation, positive zoom,
rotation, mirrors and DPR. Cursor-anchored zoom must preserve inverse-mapped world
position. Resizing/DPI affects backing store, not saved artwork. Render export at
explicit frame/size/scale with no wall-clock dependency.

## First measured AA result

Original probe: `experiments/rendering/`. Evidence:
`docs/checkpoints/phase-zero-rendering.json`. Browser reported Chromium 155 on
Windows, WebGL2, host DPR 1. Native antialiasing returned four samples.

| Method | Boundary mean error DPR 1 | DPR 2 | Triangles | Color-storage lower bound at DPR 1 |
|---|---:|---:|---:|---:|
| No AA | 22.85% | 22.89% | 2 | 96 KiB |
| Native MSAA | 7.28% | 7.31% | 2 | 384 KiB |
| Coverage fringe | 0.76% | 0.69% | 10 | 96 KiB |
| 2× box supersampling | 8.64% | 8.62% | 2 | 384 KiB |
| Canvas2D | 3.03% | 3.22% | Internal | Not measured |

Inference restricted to this scene: coverage fringe merits further investigation;
it does not establish acceptable joins, tiny shapes, holes or shared-edge blending.
Its worst individual pixel error remains 20.45% at DPR 1. Storage numbers exclude
driver, resolve and compositor allocations. The reference is numerical 16×16
subpixel coverage, not exact integration. Timings include readback and CPU resolve;
do not treat them as real-time frame budgets or rank Canvas versus WebGL throughput.

Production direction: start with explicit sample-count-negotiated MSAA render
targets and a bounded selective supersampling fallback, because these work on
tessellated interior triangles without per-face boundary seams. Analytic fringe
is an optimization only after the graph exposes actual paint boundaries and
degenerate joins pass the corpus. This is an architectural choice motivated by
correctness constraints, not a claim that the single-scene timing proves it fastest.

## Shared boundary and hole experiment

Thirty cases completed in `docs/checkpoints/phase-zero-rendering-boundaries.json`:
the isolated quadrilateral, its decomposition into two triangles, and four
rectangles forming a ring with an empty center, each at DPR 1/2 and five methods.
Opaque premultiplied source-over is applied consistently. The coverage oracle tests
the union at each sample; it never double-counts touching or overlapping pieces.

The shared-diagonal image is equivalent to the original quadrilateral. MSAA and
supersampling retained identical coverage metrics after decomposition. Independent
fringe increased boundary error from 0.76% to 5.08% at DPR 1 and introduced a visible
internal seam (signed area bias changed from +0.49 to −27.99 pixels). Canvas2D
separate fills also introduced a seam. DPR 2 repeated the effect. The ring retained
its hole in all paths but independent fringe/Canvas fills also lost coverage at
internal joins. This rejects naive per-face fringe and separate Canvas fills as a
general solution for merged same-paint regions. Canvas fallback must build a
compound paint-region path; GPU AA must resolve coverage after tessellated interiors.

This completes the initial renderer comparison, not implementation acceptance.
Hole decomposition is hand specified and does not test a general tessellator.
Curves, all zoom levels, translucent paint groups, arbitrary holes and target
WebViews remain required production corpus and performance work.
