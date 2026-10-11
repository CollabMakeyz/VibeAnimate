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
and edge quality. No result has yet selected a winning AA strategy. Screen-space
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
