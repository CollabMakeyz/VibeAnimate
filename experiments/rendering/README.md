# Convex edge-quality probe

Disposable research, not an editor or general tessellator. Run `npm run
probe:rendering`, open http://127.0.0.1:4173 and choose **Run measurements**. The
server listens only on loopback and serves three fixed files. Stop with Ctrl+C.

An isolated quadrilateral, its two-triangle decomposition, and a rectangular ring
are drawn without AA, with native MSAA, with a one-pixel
coverage fringe, with 2× resolution and explicit box reduction, and with Canvas2D.
Each is measured at backing densities 1 and 2, independently of host display DPR.
The reference is a 16×16 union-of-convex-pieces sample grid per output pixel.
Reference discretization is an approximation, not exact area integration.

Quality metrics compare alpha coverage, include signed area bias and report error
on the union of reference/actual boundary pixels so blank image area cannot hide
edge errors. Timing uses three warmups and twelve samples, and includes CPU work,
synchronous GPU readback, vertical reversal and (where needed) box reduction.
Canvas2D has a different readback path; these are not throughput/FPS rankings.

The numerical harness rejects concave, self-intersecting, degenerate, excessively
acute or thin fringe input. This restriction is intentional and disqualifies the
prototype from production general-purpose tessellation. The ring is decomposed by
hand; there is no arbitrary-hole tessellator. Shared boundaries intentionally expose
AA seams. Text, strokes, complex paint, filters and compositing remain untested.

Initial measured evidence is in `docs/checkpoints/phase-zero-rendering.json`;
the expanded thirty-case corpus is `phase-zero-rendering-boundaries.json`, captured from
the visible browser report. The screenshot confirms execution, not production
parity. The generic GPU string does not establish physical GPU acceleration.
