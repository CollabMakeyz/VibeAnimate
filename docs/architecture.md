# Phase One architecture contracts

2026-10-11. These are design contracts, generated persisted types and executable
structural validation. They are not implementations of the editor subsystems.
The schema source is `packages/file-format/schema/v1.mjs`; its JSON Schema and
readonly TypeScript DTO are generated together. Runtime interfaces import that DTO
instead of redefining persisted fields. `npm run check:contracts` detects drift and
type-checks without DOM types or a UI framework.

## Boundaries and directory ownership

| Location | Responsibility | Permitted inward dependencies |
|---|---|---|
| `packages/shared/src` | Result, diagnostics, budgets, cancellation | Standard language types |
| `packages/document-model/src` | Immutable document snapshots, entity patches, semantic validation contract | Shared; generated DTO |
| `packages/renderer-core/src` | Neutral scene tree, meshes, render capability contract | Document DTO, shared |
| `packages/geometry/src` | Original curves/topology/boolean/fitting interfaces | Document DTO, shared, neutral mesh type |
| `packages/command-system/src` | Transaction preparation, atomic commit capability, undo/redo, command registry | Document model, shared |
| `packages/input/src` | Normalized confirmed/predicted batches and capability observations | Document DTO, shared |
| `packages/tools/src` | Tool lifecycle and explicit interaction state | Document reader, command bus, input, overlay types |
| `packages/timeline-engine/src` | Pure frame evaluation and rational playback clock | Immutable model, neutral scene contract |
| `packages/file-format/src` | Explicit DTO validation and persistence interfaces | Document model, shared; reviewed validator |
| `workers/contracts.ts` | Structured-clone messages, identity, budget and asset exchange | DTO, patch, neutral mesh and shared types |

All these locations now contain contracts. The following implementation directories
are allocated by this architecture but will be created with their first real code:

```text
apps/desktop/src/
  app/ commands/ panels/ stage/ timeline/ tools-ui/ workspace/
  dialogs/ settings/ platform/
apps/desktop/src-tauri/       native file handles, atomic writes, capabilities
packages/geometry/src/
  math/ curves/ intersections/ topology/ boolean/ hit-test/
  stroke/ fitting/ spatial/
packages/renderer-webgl2/     WebGL2 renderer implementation
packages/renderer-canvas2d/   Canvas2D fallback implementation
packages/input/src/          pointer/ pen/ touch/ gestures/
packages/tween-engine/       property, classic and shape evaluation
packages/symbols/            expansion, library operations, instance clocks
packages/ik/                 parent-relative constraints and solver
packages/text/               shaping/layout with audited font dependencies
packages/export/             streaming encoders and publish adapters
packages/scripting/          isolated original scripting API
packages/compatibility/      bounded SWF/XFL adapters
workers/                    geometry/ export/ thumbnail/ optional-render/
tests/                      unit/ integration/ e2e/ visual/ fixtures/
```

No empty class or success-returning substitute is supplied for these future
implementations. Contracts are deliberate Phase One deliverables. The UI may use a
lightweight framework for chrome/panels; geometry, frame evaluation and rendering
must not import that framework, application state stores or DOM events. Render-core
is neutral data, not a graphics backend. If a renderer-specific type is needed, it
belongs in that backend and must not be added to the neutral contracts.

## State and identity

Stage coordinates are float64 logical pixels, origin upper left, x right and y
down. Display units affect presentation only. GPU adapters convert bounded local
coordinates to float32. Matrix2D is `[a,b,c,d,tx,ty]`: x'=ax+cy+tx, y'=bx+dy+ty.
Colors are unpremultiplied normalized RGBA in saved sRGB; compositing adapters
explicitly convert and premultiply. Camera rotation is radians; authored rotation,
tilt, twist and 3D fields are degrees. Internal frames are zero-based integers;
exposures and tween ranges are half-open `[start,end)`. FPS is a reduced positive
rational, constrained semantically to the supported playback range.

Stable IDs are opaque ASCII strings matching the schema. IDs are never array
indices, memory addresses or UI labels. Global entities have document-wide unique
IDs; graph vertices/edges/half-edges/contours/faces also use document-wide unique IDs
so selection and topology lineage stay unambiguous. A document revision increases
on every committed change, including undo and redo. It is a session concurrency
token, not persisted content or the dirty-state identity.

The runtime builds indexed maps and dependency indexes from validated DTOs.
Snapshots are immutable and structurally shared. UI selection, camera, panel state,
hover, capture, brush preview, predictions, tessellation, spatial indexes and GPU
handles remain outside the document DTO. Workspace preferences have a separate
versioned settings store. Prepared worker inputs contain the affected geometry or
one explicit export snapshot, never a live document class.

## Commands and transactions

`Command.prepare` receives one immutable snapshot and selection. It returns forward
and inverse typed patches plus byte cost and selection before/after. Preparation
must not mutate the model. Nested operations compose into one prepared transaction;
they do not push independent history entries. Worker-assisted operations finish
preparation asynchronously before dispatching a command with its original revision.

Only the executor holds `CommandContext.commitAtomic`. Tools, menus, shortcuts,
Properties and scripts dispatch through `CommandBus`. Every patch validates its
before-value against the current state. Entity IDs must agree with their payloads;
order patches must contain exactly the table's surviving IDs, once each. Apply all
patches to a private candidate, validate affected invariants and resource limits,
then publish one snapshot and one invalidation event. Any failure discards the
candidate, changes neither selection nor history, and returns a diagnostic.

A revision mismatch rejects the prepared transaction. Do not rebase a late geometry
result over unrelated edits by guessing. Undo/redo construct a fresh commit attempt
at the current revision, using stored inverse/forward patches and their exact
before-values; they never reset the revision to the original number. Inverse patches
run in reverse operation order. The original history state identity is restored on
undo, allowing dirty state to clear when returning to the saved content even though
the session revision increased. `savedRevision` describes the save snapshot, while
`savedStateId`/`currentStateId` determine `dirty`.

One completed pen stroke or drag creates one history entry. Preview changes are
transient. Cancel/lost capture restores preview and selection without a commit.
Continuous numeric edits merge only for the same document, target set, property
and explicit interaction session, with no save, undo, selection change or intervening
command. Merging retains the oldest inverse and newest forward state. A new commit
after undo discards the redo branch. Byte accounting includes retained inverse
geometry and selection; evict oldest whole entries to the configured cap. Reject an
individual transaction larger than the allowed operation budget before mutation;
never silently make a successful edit non-undoable.

## Evaluation and rendering

`FrameEvaluator` consumes a snapshot, exact frame and explicit epoch/preview policy.
Graphic symbols follow parent time. MovieClip preview policy is explicit; export
uses deterministic frame time. Seeds, constraints and shape correspondence are
document data. Evaluation produces neutral `EvaluatedScene` nodes. It does not
invoke wall-clock time, DOM layout, filesystem access or arbitrary document scripts.
Script execution is isolated and returns permission-checked commands separately.

Groups isolate blend/filter/mask composition. Backend caches key geometry revision,
LOD, style revision, scale bucket and relevant effect settings. A changed style must
invalidate paint even when topology is unchanged. Shared boundaries follow the
Phase Zero AA findings: never add independent feathering to internal same-paint
edges. WebGL2 chooses supported sample counts; Canvas2D reports its actual capability
limits. Context loss suspends submission, preserves model/undo and reconstructs GPU
resources from CPU data. Restore failure reports a diagnostic and offers a supported
fallback. Unsupported effects are reported, never silently claimed as rendered.

## Input and tools

`InputBackend` owns native/web event normalization and pointer capture. An observed
capability is separate from an API's presence. Confirmed samples are sorted and
deduplicated with a stable batch/sample policy; predictions are replaceable overlay
data with a different type. Pressure absent is null, never fabricated device pressure.
Mouse fallback pressure is applied by brush policy, leaving the captured raw sample
honest. Timestamps are stroke-relative monotonic milliseconds. Coordinate transform
revision is captured with ingestion; camera movement cannot reinterpret old points.

Tools have activate/deactivate/down/move/up/cancel/key/overlay methods. Interaction
state is a tagged union. Switching tool, closing a document, losing focus or switching
backend cancels active capture before teardown. Temporary eraser/hand tool state
restores the prior tool. Touch/pen arbitration and palm heuristics stay in input
policy, never in persisted geometry. Diagnostics are bounded summaries, not per-event
framework renders. Real tablet validation remains required in M4.

## Workers and failure boundaries

Every request/reply carries protocolVersion, documentId, baseRevision and unique
jobId. The broker admits only known message shapes within budget. Geometry replies
are useful only for the matching open document, active job and exact revision;
stale replies release transferred buffers without modifying caches or document.
Thumbnail results also require the matching symbol dependency revision. Export
keeps its original snapshot and may finish after later edits, labeling that revision.

Transfer lists move ownership of buffers; sender must stop reading detached buffers.
Do not transfer shared document storage: send owned copies or worker-owned immutable
snapshot buffers. Mesh byteCost is recalculated from actual buffer lengths. Asset
requests are resolved against the admitted snapshot's assets and expected hash,
not arbitrary paths or URLs. Worker messages never contain callbacks, native file
handles, UI objects or unvalidated scripts.

Queues are bounded by jobs and bytes, with interactive geometry above thumbnails.
Export emits numbered chunks, at most two unacknowledged; the host acknowledges only
after accepting the chunk into its bounded writer. Duplicate/out-of-order chunks,
identity mismatches and exceeded totals fail the export. Cancellation is idempotent,
cooperative at bounded iteration intervals; a nonresponsive worker is terminated
after the measured deadline. Termination invalidates all its job IDs and releases
reserved budgets. Retry only pure jobs; never replay a document commit automatically.
Optional render workers are a capability choice, not a required baseline.

## Phase One verification and remaining implementation

The structural validator rejects unknown fields, runtime classes, getters, cycles,
nonfinite numbers, quota overflow, malformed entry paths, speculative ink and future
versions. It does not resolve references or verify topology. Compiler assertions
cover readonly DTOs, correlated patches and predicted/confirmed incompatibility.
Dependency tests cover drift, missing transitives and the exact compiler exception.

Persistence, semantic graph validation, command execution, worker processes, actual
input, frame evaluation and renderers must be implemented and integration-tested in
their milestones. The contracts do not satisfy their behavior acceptance criteria.
