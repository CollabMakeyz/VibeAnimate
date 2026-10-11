# Timeline, symbols and tween behavior

Status: specification, **NOT IMPLEMENTED**. Historical evidence:
[CS4 manual](https://help.adobe.com/archive/en_US/flash/cs4/flash_cs4_help.pdf), PDF
27–29,144–151,153,160,177–179,192–194,208–214,228–237.
Other details remain provisional until reviewed.

```text
Document ── scenes (ordered) ── Timeline ── layers ── spans/keyframes ── elements
         └─ library ── SymbolDefinition ── independent Timeline
Element: SymbolInstance ── definitionId + transform + playback settings
Tween: ClassicSpan | MotionSpan(property tracks) | ShapeSpan | PoseSpan
Mask/guide relationships ── explicit layer IDs, never inferred from array position
```

Internal frame numbers start at zero; display starts at one. Ranges are half-open.
A content keyframe owns a frame payload. Held frames refer to that payload until
the next keyframe or span end. A blank keyframe is an explicit empty payload and
does not inherit earlier artwork. A property key belongs to a track inside a
motion span and does not clone frame content.

Insert Frame extends the selected exposure and shifts following content as one
transaction. Insert Keyframe splits exposure with independent copied content;
Insert Blank Keyframe splits it with empty content. Clear Keyframe replaces its
exposure up to the next keyframe with previous content (CS4 PDF 178). Range
removal/copy/cut/paste/reverse must preserve labels, references and span validity.
For motion spans, dragging over another span consumes the overlapped frames;
pasting a whole span replaces the entire target span. Selecting frames inside a
span uses Ctrl-drag on Windows / Command-drag on macOS and paste replaces that
selection. Shift-dragging an endpoint adds static exposure; ordinary endpoint
dragging retimes the tween. F5 extends without a property key; F6 adds keys for all
properties. Splitting is allowed at one selected frame; both parts reference the
same target, and historically eased motion can change after splitting. These
distinct cases require corpus fixtures (PDF 204–205). A layer lock historically
protects Stage editing, not Timeline edits; a stricter lock is a modern option.

Layers: normal, guide, guided, mask, masked, folder and pose. Hidden/locked/folder
state is distinct from payload. Collapsing a folder does not hide artwork. Guide
content is editor assistance; guided classic tweens attach to a path. A mask's
explicit children are clipped using geometry, with visual relationship in the
timeline. Reordering layers cannot silently change their relationship IDs.

Evaluation accepts document, scene, integer frame and playback context, returning
an immutable scene. It cannot depend on the previously evaluated frame. A monotonic
clock maps elapsed time through rational fps; frame skipping changes presentation,
not evaluated results. Pause/resume resets the clock anchor; seek is random access.
Onion evaluation has independent previous/next counts, opacity/tint and cache keys.

## Tween contracts

| Kind | Ownership | Keys | Interpolation | Validation |
|---|---|---|---|---|
| Classic | Compatible content at endpoint keyframes | Frame content, ease between endpoints | Transform/color; guide attachment | Unsupported raw shapes require deliberate conversion; 3D rejected |
| Motion | One target instance per span | Per-property keys | Serializable easing, tracks and editable path | Single target; property/type compatibility; 3D only eligible targets |
| Shape | Raw editable contours | Endpoint geometry plus hints | Contour matching and geometric correspondence | Never a crossfade; handle holes and differing point counts |
| Pose | One armature per pose layer | Poses | Joint transforms with constraints | No unrelated property tracks in pose span |

Motion Editor is a real curve editor: property list, time/value axes, key add/delete,
drag/box select, pan/zoom, tangent handles, ease, clipboard and numeric controls.
All edits are commands. Motion path editing changes the same logical tracks.
Spatial X/Y/Z property keys are linked; they do not expose Bezier handles in the
historical Motion Editor. Spatial path curvature is edited on the Stage; roving
keys redistribute timing along the path. Nonspatial property curves support
smooth/corner keys and tangent handles. Dragging a key cannot cross its immediate
neighbors. Show the eased curve as a separate dashed overlay without destructively
rewriting the base curve. Ratio links apply to compatible X/Y pairs such as scale
or blur; easing may apply to a property, group or all compatible properties.
Copy/paste, reverse and reset act on the selected track scope. Ctrl-click on
Windows / Option-click on macOS toggles a property key; Alt-click on Windows /
Command-click on macOS changes smooth/corner type (PDF 208–214).

Shape correspondence normalizes contours/orientation, matches outer/inner loops,
splits/resamples deterministically and applies explicit user hints. Ambiguous
matching must produce an actionable diagnostic, not apparently successful fading.
Classic shape hints have identities a–z, with a maximum of 26 pairs; starting,
ending and detached hints have distinct states. A hint must attach to actual curve
geometry. Preserve cyclic order when establishing correspondence, expose invalid
ordering, and remove a hint when deliberately dragged off Stage. Hints are shown
only for the active relevant layer/keyframe. The historical manual warns about
holes; the plan's robust hole correspondence is a required modern improvement
(PDF 223–225). Text must be converted to outlines before shape interpolation.

## Symbol semantics

Definition IDs are independent of names/folders. Instances own transforms, color
effects, blend/filter parameters and playback settings. Editing a definition updates
all instances, without overwriting instance transforms. Graphic supports loop,
play-once and single-frame with first-frame offset (PDF 160). MovieClip has its own
clock domain; deterministic exports supply its epoch explicitly. Classic authoring
shows MovieClip statically; live nested preview is a documented modern extension.
Button states are Up/Over/Down/Hit; Hit is interaction geometry and not painted.
The exact input/export runtime behavior must be tested separately from editor preview.

Nested editing keeps a breadcrumb and global undo journal. Validate definition
cycles at mutation/load, and enforce a traversal depth and expansion budget during
evaluation even for acyclic but exponentially expanding graphs.

## IK and 2.5D

Armatures support linear/branched trees with constraints relative to the parent.
Bind changes the relationship between shape points and bones, including multiple
influences. An IK shape is isolated from outside merge geometry. Pose insertion and
movement are reversible. A deterministic solver must clamp rotation/translation,
detect unreachable targets, cap iterations and reject nonfinite output. FABRIK is
a candidate, not evidence of matching the historical solver. Numeric convergence,
branch influence and pose interpolation need fixtures before acceptance.

Historical 3D manipulates MovieClip planes with local/global transforms, one
perspective/vanishing-point model and document rendering/export projection.
Global/local mode and pivots must affect actual vertices. Classic restrictions on
mask layers and edit-in-place are recorded separately from any modern extensions.
Do not implement either 3D or filtering as CSS applied to the Stage canvas.
The dated manual specifies a 55-degree default perspective angle, a 1–180-degree
UI range and a vanishing point initially at the Stage center (PDF 144–151).
Projection must guard singular endpoint angles rather than emit infinity. Stage
resizing compensates perspective to preserve appearance, with a documented option
to recenter the vanishing point. D switches local/global manipulation; G/W choose
translation/rotation. Shift-double-click an instance relocates the rotation gizmo;
double-click its center restores the instance's transform point. These are
interaction contracts, not evidence that a particular solver or matrix convention
matches the proprietary implementation.
