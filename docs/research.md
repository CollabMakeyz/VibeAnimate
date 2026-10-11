# Research ledger

Status: **PARTIAL — Phase Zero**. Research is not production functionality.
Retrieved 2026-10-10. `sources.json` is the machine-readable bibliography.
Page numbers for CS4 below are **PDF pages**, one based; printed page = PDF − 5.
The 474-page official manual is dated 5 March 2009. Its downloaded SHA-256 is
`e4e45d9d91d7e404b347cd472fe907025fb4d69f3ab0f5e5fc91526a0c9fb1f0`.
The PDF was retrieved directly from Adobe and text-extracted locally. It is not
redistributed. The opaque citations in MASTER PLAN.md were not used as evidence.

## Evidence classification

A: primary documentation/specification; B: reliable historical literature;
C: secondary; D: undocumented experimental observation. Version applicability and
confidence are separate. A current manual does not establish CS4 behavior.
Tests named in this ledger are planned until executable evidence is recorded.

| Finding | Evidence | Confidence | Architecture consequence | Test contract | Historical / extension |
|---|---|---|---|---|---|
| Crossing raw artwork changes its selectable regions | CS4 PDF 99–101; DRAWING | A/high | Per-layer/frame shared graph; split at intersection | geom.overlap-cutout | Historical |
| Object artwork retains isolated contents | CS4 PDF 100 | A/high | Local graph and independent transform | geom.object-isolation | Historical |
| Line and quadratic records can reference two fill sides | SWF ch. 6 | A/high | Directed edges, shared boundaries | geom.reverse-fill-sides | Historical format; DCEL is our design |
| Pencil Straighten recognizes shapes; Smooth fits curves; Ink avoids intentional smoothing | CS4 PDF 106 | A/high | Distinct pipelines, not three labels on one filter | tool.pencil-modes | Historical |
| Classic brush size is influenced by zoom when making new strokes | CS4 PDF 106 | A/high | Explicit Classic screen-size policy; modern Stage-size policy | tool.brush-zoom | Preserve Classic; modern behavior separately named |
| Motion targets one instance; classic uses content keyframes | CS4 PDF 192–194 | A/high | Separate span/evaluators | tween.model-validation | Historical |
| Current tween comparison table reverses keyframe/property-frame terminology in one row | TWEENS compared with CS4 PDF 194 | A/conflict resolved historically | Use dated primary manual, not that row | tween.property-keys | Historical manual takes precedence |
| Graphic loops follow parent; MovieClip has independent timeline | CS4 PDF 153,160 | A/high | Pure evaluation with explicit playback epoch/context | symbol.graphic-sync | Independent MovieClip preview is a declared modern extension |
| Pose layer owns one armature; Bind connects shape control points and bones | CS4 PDF 230–235 | A/high | Separate pose tracks and weighted binding | ik.bind-deforms-shape | Historical; numeric weighting is original design |
| 3D authoring acts on MovieClip planes with local/global spaces | CS4 PDF 144–147 | A/high | Matrix/perspective evaluation, never CSS | scene.projected-plane | Historical |
| CS4 Deco has Symmetry, Grid and Vine effects | CS4 PDF 113–115 | A/high | Seeded generators and persisted parameters | procedural.seed-roundtrip | Seed persistence is modern |
| Native CS4 documents precede the CS5 XFL family | XFL-HISTORY; CS4 PDF 52 | A/high | Own format; XFL adapter only | format.no-external-model-coupling | Modern native format |
| Pointer samples distinguish confirmed/coalesced/predicted | POINTER §§4,10 | A/high | Separate durable stroke and speculative tail | input.prediction-never-saved | Modern |
| Runtime capabilities differ by OS WebView | TAURI-ARCH | A/high | Detect actual contexts/APIs and report fallbacks | platform.capabilities-failure | Modern |
| Canvas is a rendering surface, not editable topology | CANVAS; WEBGL2 | A/high | Immutable evaluated scene and disposable caches | renderer.context-loss | Modern |
| Fitting literature produces piecewise cubic curves | SCHNEIDER | B/high | Bound fitting and cubic→quadratic errors separately | fit.error-budget | Original mathematical implementation required |

## Decision table

| Decision | Options | Evidence | Pros | Cons | Compatibility | License impact | Performance impact | Choice | Revisit condition |
|---|---|---|---|---|---|---|---|---|---|
| Canonical vectors | SVG objects / paths / half-edge graph | CS4 99–101; SWF | Shared boundaries and face selection | Robust intersections are difficult | Merge and Object remain distinct | Original core | Incremental dirty regions | Half-edge graph | Corpus shows invariant gap |
| Curves | Quadratic only / all cubic / quadratic with cubic extension | SWF; SCHNEIDER | Historical mapping, useful fitting | Conversion tolerance needed | Explicit modern extension | No code copied | Adaptive subdivisions | Lines/quadratics canonical classic geometry | Accuracy/cost benchmarks |
| GPU backend | WebGL2 / Canvas2D / WebGPU | WEBGL2; CANVAS; TAURI-ARCH | Mature GPU interface | Own tessellation/compositing | Shared scene semantics | No required graphics dependency yet | Batching/cache/LOD | WebGL2 + Canvas2D fallback | Target WebViews and benchmark evidence |
| Tessellation | Original / lyon | LYON | Existing permissive path→mesh boundary | Rust/WASM integration cost | Does not own topology | Candidate only; audit exact graph before adoption | Compare transfer+mesh costs | Adapter; evaluate lyon | Benchmark and dependency audit |
| Tablet | Pointer / native everywhere / selective bridge | POINTER; TAURI-ARCH | Portable, minimal native surface | Driver gaps | Capabilities explicit | Bridges audited separately | Direct ingestion outside UI updates | WebPointer default | Reproduced physical-device loss |
| Save | FLA / XFL / own package | XFL-HISTORY; plan | Stable independent schema | Migration/package code needed | Import reports required | Own format and fixtures | Async compression and atomic write | `.vibeanim` | Interoperability evidence |
| Undo | Document copies / inverse commands / patches | Plan requirement | Bounded deltas, transactions | Every mutation needs inverse | One drag/stroke undo unit | Original implementation | Avoid whole-document cloning | Commands with local before/after patches | Memory and recovery benchmark |
| Time | Stateful stepping / frame-addressable evaluation | Plan; CS4 timeline | Random-access determinism | Explicit MovieClip clock context | Classic + motion + poses separate | Original implementation | Cache evaluated immutable scenes | Rational frame rate and pure evaluators | Runtime scripting semantics |
| Video | Bundled FFmpeg / WebCodecs / native codec | WEBCODECS; plan | No compulsory bundled encoder | Codec/muxer availability varies | Explicit unsupported reports | Codec distribution reviewed separately | Worker export with backpressure | Pluggable encoder | Supported OS/backend validation |

## Research gaps and exit policy

The official user manual documents commands in task descriptions, not an exhaustive
versioned menu/shortcut export. `menus.md` distinguishes located entries from
unverified completeness; `historical-shortcuts.md` does the same for defaults.
Do not declare full menu or keyboard parity from a list recalled from memory.
Phase Zero remains open until the inventories are reviewed against historical
primary evidence, the remaining tool contexts are documented, and prototype
results support the numerical/rendering decisions. Unknown historical behavior
may be recorded, but an unchecked exit gate is not silently waived.

The plan's first delivery documents are present as specifications; statuses and
evidence distinguish a design from its implementation. See PROGRESS.md.
