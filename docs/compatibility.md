# Compatibility scope

All import/export adapters are **NOT IMPLEMENTED**. Native file format is original.
Historical behavior is researched independently; original artwork and branding are
mandatory. No claim of complete file or keyboard compatibility is currently made.

SWF is isolated: bounded parser → intermediate representation → internal model.
Start with shapes/styles/gradients/bitmaps/placements/symbols/frames, then masks,
text/filters where representable. Script/action tags produce explicit warnings and
are not executed on import. Do not infer original authoring tweens from baked frames
without evidence. V19 describes tags newer than the historical target; record each
tag's minimum version separately.

XFL is external XML with a package corpus covering different producers/versions.
Import reports classify exact, approximate, unsupported and dropped elements,
including file path and node/tag location. Unknown data never disappears silently.
XFL export will declare its actual supported subset. Legacy binary FLA parsing is a
stretch item requiring documented feasibility, not implied by XFL support.

Corpus fixtures must be original or redistributable with provenance. Include
malformed lengths, external XML entities, traversal, huge dimensions, nested symbols
and repeated tags. Test Stage and exported frame comparisons alongside logical
snapshots. Successfully opening a simple rectangle is not compatibility acceptance.

Historical runtime ActionScript and browser plugins are not prerequisites of the
new application. An isolated original editor scripting API is required in M9;
ActionScript 3 subset remains a separately identified stretch feature.
