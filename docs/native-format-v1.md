# Native package v1 specification

2026-10-11. Status: **specified; schema and structural validator tested; container,
semantic validator and persistence runtime not implemented**. The original extension
is `.vibeanim`. It is not FLA, XFL or SWF.

## Envelope and authority

Select a ZIP envelope with stored or DEFLATE entries, UTF-8 names, no encryption,
no multi-disk archive, no symlinks and no ZIP64 in v1. The size limits below are below
ZIP32 limits. The decoder must reconcile central-directory and local-header names,
methods, flags, lengths and offsets before reading bodies; detect overlapping byte
ranges, duplicate entries and malformed descriptors. Do not extract to disk. The ZIP
implementation and any compression library require a separately pinned license audit
before adoption. Specifying an envelope is not adoption of a library.

`manifest.json` is mandatory, bounded to 4 MiB, and validates as `ManifestDTO`.
Exactly one required `document.json` validates as `DocumentDTO`. The manifest lists
every other entry with byte length, SHA-256 and required flag; it does not hash itself.
Manifest and document IDs and formatVersion must agree. Actual entries and manifest
inventory must match exactly, including optional entries; reject undeclared entries.
All entry names are case-sensitive ASCII in v1, using only schema-authorized paths.
Reject duplicate names, directory entries, traversal, NUL, backslash, drive/UNC
names, alternate streams, case aliases and normalization aliases before decoding.

`document.json` is authoritative for scenes, timeline, layer records, content,
topology, styles, symbols, library folders, asset metadata, scripts, seeds and
armatures. Assets are `assets/<sha256>` and script source is
`scripts/<sha256>.js`; verify both size and hash before use. External resource URLs
are not automatically resolved. Script metadata declares capabilities but grants
none; opening a package never runs its scripts.

The directory families required by the plan are retained without two authorities:
`library/<id>.json` is an optional export of a symbol's identical definition, checked
against document.json; `thumbnails/<sha256>.png` is an optional derived preview;
`metadata/<id>.json` is descriptive JSON; `recovery/<id>.json` may contain recovery
descriptors. These optional entries cannot override document records or execute code.
Unknown required entries fail with an unsupported-section diagnostic. An extension
needing new authoritative fields requires a versioned schema change; arbitrary data
is not hidden in metadata to bypass this rule. Empty directory entries are omitted.

## JSON and canonical snapshots

JSON is UTF-8 without BOM, with no duplicate property names. The future bounded
parser must reject malformed UTF-8, duplicate decoded keys, invalid escape sequences
and excessive depth before constructing large objects. JSON.parse alone does not
detect duplicate keys and is not sufficient for the native loader. The current
`validateStructure` function receives already-decoded plain data; it does not claim
these parser guarantees. Proxy objects are not an accepted validation boundary.

Canonical encoding orders object keys lexicographically by Unicode code unit,
uses JSON number spelling with negative zero normalized to zero, preserves string
content without normalization, and emits no insignificant whitespace plus one final
LF. Reject lone surrogates rather than replacing them. Sort ID-indexed record tables
by ID where order is not semantic. Preserve scenes order, layerIds, elementIds,
group children, filters, swatches, stops at equal offsets and all explicit timeline
ordering. Sort chronological samples/keys only during validated construction, never
repair malformed input by silently reordering it on load. Content digests exclude
manifest timestamps but include all authored DTO fields and referenced media hashes.

DTOs contain values and stable references only. No renderer/worker handles, selection,
camera, caches, history stack, callbacks, predictions or platform pointer IDs can be
serialized. Captured confirmed ink and brush parameters remain editable. A fitted
graph is an authored representation when present; its relationship to the raw ink
is explicit, not an untracked cache. Generated artwork keeps seed and parameters;
break-apart is a command that produces independent elements.

## Validation order and semantic invariants

1. Enforce container byte/entry limits and reconcile its headers.
2. Decode/validate manifest and version, then verify inventory, lengths and hashes.
3. Decode/validate explicit DTO shape; no coercion, default injection or removal.
4. Run a known migration only after validating its exact source version. There is
   no fictional v0 migration. Future versions return diagnostics without replacement.
5. Validate references, ownership, topology, cycles and resource expansion.
6. Build indexes privately, then publish one complete immutable document.

Mandatory semantic checks for the implementation are:

- Document-wide uniqueness of all record IDs, including topology subrecords;
  non-null references resolve to the correct kind. Each scene/symbol owns its
  timeline; layer membership is unambiguous. Frame content may be reused for holds,
  with copy-on-write edits. Owned elements are not in multiple groups/contents.
- Every edge has two distinct reciprocal half-edges with correct origin vertices
  and the same edge ID. Next/previous links agree; each contour traverses a finite
  closed cycle without consuming another contour. Each half-edge belongs to its
  declared face. Open stroke chains use null next/previous and exterior face rules;
  they do not masquerade as filled contours. Exterior face has no fill. Hole/outer
  winding, containment, intersections, degenerate edges and Euler/component checks
  follow the vector-model specification with scale-aware tolerances.
- Exposure/tween ranges obey `0 <= start < end <= duration`; exposure spans do not
  overlap. Property and pose keys are strictly ordered and unique within a track,
  remain within their span, and target compatible element/filter properties. Spatial
  tracks stay linked under the motion model. Shape-hint letters are unique paired
  a–z correspondences on referenced edges. Mask/guide/folder links cannot cycle.
- Symbol/group/library nesting is acyclic and bounded. MovieClip epoch and Graphic
  first-frame policies resolve within their definitions. Button state frames exist.
  Expansion counts repeated instances, not just unique symbol definitions.
- FPS is reduced and between 1 and 240 frames/second; stage dimensions and decoded
  surface allocation obey budgets. Effective 3D perspective is strictly below 180°;
  the historical UI endpoint must be clamped explicitly before authoring valid data.
  Noninvertible transforms are rejected where the operation requires inversion.
- Gradient stops are ordered with explicit coincident-stop behavior; pressure curves
  have endpoints x=0 and x=1 and strictly increasing x. Confirmed sample timestamps
  never decrease and remain stroke-relative. Zero pressure remains valid measured data.
- Bone parentage forms rooted acyclic trees, parent references stay in the armature,
  root list agrees with parentless bones, limits have min<=max, weights are finite,
  nonnegative and normalized with a documented tolerance; bindings resolve graph
  vertices and bones. Pose bone references belong to the same armature.
- Asset kind, media type, byte length, decoded dimensions and hash agree. Script
  capabilities are unique and supported by the original API version. Source hashes
  match bytes; grants are external session/project permissions, not file assertions.

Structural validation alone intentionally accepts a well-shaped dangling reference.
That behavior is tested so callers cannot confuse it with semantic acceptance.

## Initial admission limits

| Resource | Default ceiling |
|---|---:|
| Compressed package | 512 MiB |
| Total expanded entries | 1 GiB |
| Single entry | 512 MiB |
| Manifest / document JSON | 4 MiB / 64 MiB |
| Entries | 10,000 |
| Expanded/compressed ratio | 200, checked per entry and globally |
| JSON nesting / visited values | 64 / 2,000,000 |
| Authored records / evaluated symbol instances | 100,000 / 100,000 |
| Decoded image pixels | 67,108,864 per image; aggregate decoded byte budget separately |
| Script source | 1 MiB each; 16 MiB aggregate |

Record/surface/operation counters apply during expansion, not after allocations.
These are admission defaults, not performance claims. Per-schema collection limits
are upper bounds; the shared aggregate budget can reject a structurally permitted
large collection. Exceeding a budget is an explicit diagnostic, never silent loss.
Large valid assets may require user-configured budgets within hard implementation
limits; do not secretly disable validation to open them.

## Saving, recovery and future versions

Save captures snapshot revision R and content identity S once. Encode and verify
to a unique sibling temporary file opened exclusively through a native file token.
Flush data, close handles, then atomically replace the destination using the platform
adapter. Preserve the original on encoding, permission, cancellation or replace
failure. If atomic replacement is unavailable, report that capability before offering
an explicit alternate destination; never report a non-atomic save as atomic.
Successful save marks S saved even if the active document has advanced beyond R;
those later edits remain dirty. Opening a file does not overwrite or migrate it.

Recovery uses an external application-owned directory, a validated base snapshot and
checksummed append-only transaction journal with monotonically increasing revision.
Do not write over the manual file during autosave. An incomplete final journal
record may be ignored only after validating all prior complete records; corruption
within the prefix is reported. Compaction writes a new durable snapshot before
replacing the journal reference. Recovery presents document, timestamp and validation
result, with explicit open/discard. Active ink defers autosave work but never invents
a committed stroke. Retention is bounded by bytes and age.

Required runtime evidence remains canonical save/load equality, all authored feature
round trips, bad hashes, duplicated JSON keys, archive bombs, traversal, truncation,
cycles, unsupported versions, cancellation at each write phase, concurrent edits,
atomic replace failure and restart recovery. Schema tests alone do not satisfy it.
