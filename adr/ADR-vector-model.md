# ADR: independent edge-based document geometry

Date: 2026-10-10. Status: **ACCEPTED design; implementation pending**.

Context: the master plan requires destructive same-layer merge behavior and isolated
object drawing. CS4 PDF 99–101 demonstrates splitting/paint replacement. SWF ch. 6
describes edges, quadratic curves and two fill sides; it does not prescribe the
historical editor's in-memory structure.

Decision: own planar half-edge graph with stable IDs, explicit faces/holes and
styles. One shared graph per layer/keyframe for Merge; one local graph per
DrawingObject for isolation. Classic persisted geometry uses lines/quadratics;
modern cubic fitting can be converted with an explicit error bound. Renderer
buffers and SVG DOM are never authoritative.

Alternatives rejected: independent SVG paths cannot express shared-face editing;
polygon booleans alone destroy exact curve/edit semantics; adopting an external
editor model prevents independent control of ownership and undo.

Consequences: expensive robust intersections and face reconstruction need an
incremental transaction pipeline and canonical corpus before tools are accepted.
Revisit specific incidence representation if open strokes/nonmanifold input cannot
be normalized safely; do not weaken integrity to make a screenshot look correct.

Validation: vector-model.md corpus, scale/tangent/coincidence probes, undo equality,
save/load IDs and renderer-independent hit testing. Sources: CS4/SWF in sources.json.
