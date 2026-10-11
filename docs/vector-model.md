# Vector behavior and model specification

Status: design, **NOT IMPLEMENTED**. Evidence: [CS4 manual](https://help.adobe.com/archive/en_US/flash/cs4/flash_cs4_help.pdf),
PDF 99–101,116,124–127; [SWF specification](https://open-flash.github.io/mirrors/swf-spec-19.pdf), ch. 6.
The manual specifies behavior, not its internal data structure. This graph is our
independent architectural choice; do not claim the historical editor used a DCEL.

```text
Scene / Layer / Keyframe
  shared merge graph ── vertices + edges + directed half-edges + faces
  DrawingObject A ───── transform + local graph A
  DrawingObject B ───── transform + local graph B
                     (A and B never merge because they overlap on screen)

       face L                 face R
          h: origin ──────> destination
               <────── h.twin
 h.face = L; twin.face = R; edge.stroke can exist independently

 Before intersection         After exact parameter subdivision
 A────────B                  A──────I─────B
      C /                          / 
       / D                       C/   D
 Split curve pieces share the vertex I; do not flatten to rewrite the document.

 Selection: {edgeIds, faceIds, vertexIds, elementIds}
                         └── stable model IDs, never GPU buffer offsets
```

## Representation and invariants

A ShapeGraph owns vertices, geometric edges, directed incidences, contours, faces
and style references. A line has two endpoints; a quadratic has one additional
control point. One geometric edge supports zero/one stroke and two fill-side
references through its directed faces. The exterior face is explicit and unfilled.
Open strokes are permitted and must not invent filled faces. Holes belong to their
containing face rather than a separately painted polygon.

Every half-edge has a valid twin; reversing twice is identity; next/previous
incidences are reciprocal on closed face walks. Face boundaries must close, all
IDs must resolve within their owner, coordinates must be finite, and independent
objects cannot share mutable topology. Fill and stroke styles have revisions
independent of geometry. A scene does not store renderer meshes.

## Merge insertion transaction

Find candidate edges through a spatial index; solve line/line, line/quadratic and
quadratic/quadratic intersections, including tangent and coincident intervals.
Sort/deduplicate parameters using the numeric policy; split by De Casteljau;
reconstruct incidence order and face walks; classify the new regions; assign top
paint precedence and preserve only historically appropriate strokes; normalize
compatible coincident/collinear edges; update touched index entries and revisions.
Validate the proposed delta before applying it atomically. If robustness fails,
abort with a diagnostic and retain the previous document. Never commit half a merge.

Historical contracts: overlapping same-color paint forms a single region; different
colors remain distinguishable; newly painted area replaces underlying raw paint;
moving the newer fill leaves the cutout; crossing strokes become selectable pieces.
Stroke deletion leaves fill, and fill deletion leaves stroke. Separate layers,
groups and drawing objects protect unrelated geometry.

Object drawing inserts a local graph. Entering its edit context allows internal
editing; leaving it preserves isolation. Break Apart applies the object transform
to copied geometry and merges it in the owning frame through one reversible
transaction. Grouping changes ownership, not union geometry; Ungroup reverses that
ownership operation. Union is a geometric operation and is not equivalent to Group.

## Numeric and selection policy

GeometryTolerance must carry absolute, relative, parameter, flattening and fitting
tolerances separately. Proposed starting absolute distance is 1e-8 Stage units,
relative distance 1e-12 × local scale, parameter deduplication 1e-10; these are
**prototype hypotheses**, not certified robustness bounds. Normalize difficult
local problems before solving. Hit radius is expressed in screen CSS pixels and
converted by camera scale; it must not become the topology weld tolerance.
Persistent coordinates are never pixel-rounded. Render LOD never mutates geometry.

Single click can select a raw fill or stroke separately. Double-click fill includes
its boundary; double-click stroke follows connected strokes (CS4 PDF 124). Marquee
and lasso can select parts of merge geometry, while whole drawing objects use
the explicit enclosed/contact-sensitive setting. Anchor selection is a separate
Subselection operation. Moving selected raw regions must split/remap topology with
stable selection IDs, not translate a whole GPU mesh.

## Required acceptance corpus

Crossing rectangles; oval/rectangle; line through fill; stroke crossing; same and
different colors; later paint precedence; interior erase; independent stroke/fill
deletion; partial selection; bucket closed region and configurable gap; ink bottle
boundary; self-intersection; tangency; endpoint touch; nested contours; holes;
object isolation; transformed Break Apart; duplicate/near-zero edges; large and
small coordinates; save/load; undo/redo. Assert canonical graph, area where
appropriate, reference validity, finite coordinates and visible region ownership.
Screenshots alone cannot accept this subsystem.
