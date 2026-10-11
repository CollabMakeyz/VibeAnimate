# Tool behavior inventory

Status: **PARTIAL research; no tools implemented**. Sources are PDF page numbers
in the [official CS4 manual](https://help.adobe.com/archive/en_US/flash/cs4/flash_cs4_help.pdf).
Historical exact drag thresholds and some shortcut defaults remain UNKNOWN.
This is explicit uncertainty, not a claim of byte-for-byte interaction parity.

## Shared interaction contract (original implementation design)

Mouse and pen use the same Stage-coordinate tool state machine. Pen-specific
pressure/tilt behavior is added only to tools which consume it; all tools still
support a mouse. A temporary eraser/barrel override preserves the chosen tool.
Viewport tools affect UI state; permanent content tools use one command per completed
gesture, or one compound transaction for a completed multi-click path. Cancel rolls
back previews. Historical undo granularity for individual Pen anchors remains a
research item. Selection-only changes are separate from permanent mutations.

Proposed drag activation: mouse/pen 3 CSS pixels, touch 8, configurable and independent
of zoom. These values are modern assumptions, not historical measurements. Candidate
snapping uses camera-adjusted screen tolerance and reports a visible target. Use
guide/grid/object snapping only where appropriate; freehand input never silently
quantizes saved samples. Explicit option overrides are part of the gesture snapshot.

Each tool gets original cursor artwork plus state indicators, accessible name,
keyboard command and contextual Properties/options. During text editing, tool
shortcuts are suppressed. There are no copied historical bitmaps/cursors.

| Tool | Mouse/pen behavior | Modifiers / snapping | Cursor and Properties/options | Selection / edit mode / double-click | Undo unit | Evidence/confidence |
|---|---|---|---|---|---|---|
| Selection | Click component/object; drag marquee or selected region; reshape raw edge | Shift additive; Ctrl/Cmd temporary selection; snap when moving | Original arrow with endpoint/curve indication; selection attributes | Double fill includes boundary; double line selects connected strokes | One move/reshape | 116,124; A |
| Subselection | Pick/drag anchors and control handles; nudge | Shift multi/45°; Alt/Option independent handles; geometric snap | Original node cursor; point coordinates | Raw graph or entered object context; double-click behavior UNKNOWN | One anchor drag | 111–112; A |
| Free Transform | Scale corners/sides, rotate, skew and move pivot | Shift rotates by 45° or proportional scale; Alt/Option opposite origin; Ctrl/Cmd distort eligible shapes | Original handles; matrix/numeric Transform | Double-click pivot recenters; distortion restrictions differ from ordinary transform | One transform | 118–121; A |
| Gradient/Fill Transform | Move/scale/rotate gradient or bitmap fill without outline change | Shift linear angle 45° | Center/focal/width/size/rotation handles; fill options | Click eligible fill; radial focal handle only when applicable | One fill-matrix edit | 139; A |
| 3D Translation | Move eligible MovieClip along selected axis | D temporary local/global; world/object coordinates | Original axis gizmo; X/Y/Z, perspective | Shift-double-click moves gizmo to selected instance; double center centers multi-selection | One 3D transform | 144–147; A |
| 3D Rotation | Rotate MovieClip plane around axes/free handle | D local/global; exact constraints pending | Original rotation gizmo; rotation/pivot fields | MovieClip context; no CSS transform | One 3D transform | 147–151; A, final pages pending |
| Lasso | Drag freehand region or click polygon vertices | Alt/Option straight segments; contact sensitivity setting | Original lasso/polygon cursor and mode option | Double click closes polygon; raw partial selection vs whole objects | Selection transient; subsequent mutation one command | 124–125; A |
| Pen | Click endpoints; drag tangents; extend/join/close | Shift constrains 45°; Alt/Option split tangents; Ctrl/Cmd off-path ends | Initial/continue/add/delete/close/join indicators; preview/point preferences | Double last anchor completes open path; first closes; closing does not automatically fill | Completed path compound command (modern design) | 107–112; A |
| Add Anchor | Click selected segment to split | Exact modifier default UNKNOWN; no arbitrary snapping off curve | Plus/node indicator; anchor coordinates | Requires selected path, point not already present | One split | 108,111; A |
| Delete Anchor | Click anchor to remove/reconnect path | Delete key has different historical cut behavior | Minus/node indicator | Corner vs smooth conversion behavior preserved; double behavior not documented | One removal | 111–112; A |
| Convert Anchor | Convert smooth/corner and manipulate tangents | Shift+C reported by manual for conversion mode | Conversion indicator; tangent fields | Selected path context; do not treat deleting anchor as deleting entire path | One conversion | 108,112; A |
| Text | Create/edit text box and runs | Keyboard text context; alignment/snapping behavior pending | I-beam; family/size/style/tracking/leading/alignment | Existing text editing and text selection; double word semantics pending | Coalesced text edit | Plan; historical chapter 8 detailed review pending |
| Line | Drag one segment | Shift 45°; Merge/Object toggle | Crosshair/line; stroke only | No automatic fill; no special double-click documented | One segment | 103; A |
| Rectangle | Drag bounds; optional rounded corners | Shift square; snapping uses bounds | Shape cursor; stroke/fill/corners | Raw shared or isolated Object geometry | One shape | 103–106; A |
| Rectangle Primitive | Draw parameterized rectangle then edit radii | Up/down changes radius during draw; other exact modifiers pending | Primitive cursor; per-corner radii/dimensions | Independent primitive; editable after creation | One shape/parameter gesture | 103–104; A |
| Oval | Drag ellipse bounds | Shift circle; snapping uses bounds | Oval cursor; stroke/fill | Merge/Object modes | One shape | 103–106; A |
| Oval Primitive | Draw editable arc/ring/oval | Exact modifier behavior pending | Primitive cursor; start/end angles, inner radius/closure | Independent parameterized shape | One shape/parameter gesture | 103–105; A |
| PolyStar | Drag polygon/star | Exact angle modifiers pending | Polygon cursor; 3–32 sides, star depth | Merge/Object compatibility tested separately | One shape | 106; A |
| Pencil | Freehand line in Straighten/Smooth/Ink | Shift horizontal/vertical; selected recognition tolerances | Pencil cursor; stroke attrs and mode | Straighten recognizes primitives; Smooth fits; Ink avoids intentional smoothing | One stroke | 106,137; A |
| Classic Brush | Paint vector fill with Normal/Fills/Behind/Selection/Inside | Shift horizontal/vertical; pressure/tilt options | Actual footprint; size/shape/mode, fill attrs | Paint mode defines affected topology; Classic size policy tied to zoom | One stroke | 106–107; A |
| Modern Pressure Brush | Confirmed editable ink and optional bake | Size/opacity/flow curves, stabilization/corners; tilt/twist | Hover nib footprint and local calibration | Not asserted to be a historical tool | One stroke; separate bake command | Plan/POINTER; modern |
| Spray Brush | Click/drag dot or symbol particles | Seeded scale/rotation/scatter; exact historical density units pending | Spray footprint; symbol/default dot, scale/rotation | New editable generated content; no special double-click documented | One spray gesture | 113–114; A |
| Deco | Apply Symmetry/Grid/Vine procedural fill | Symmetry handles, collision option, region/path constraints | Original procedural cursor; effect-specific controls | Generated vectors/symbols; saved seed is modern extension | One generation/edit gesture | 114–115; A |
| Bone | Drag root to linked instance/shape point, extend branches | Selection handles; constraints in Properties | Original bone cursor; length/parent/constraints | One armature per pose layer; double bone with Selection selects armature bones | One bone creation or pose change | 230–235; A |
| Bind | Select bone/shape point, edit its connections | Shift adds; Ctrl Windows / Option macOS removes | Original influence overlay; binding inspector | Multiple bones per point; symbols parenting alone is insufficient | One binding gesture | 234; A |
| Paint Bucket | Click empty/painted enclosed region | Gap size and lock-fill option | Bucket indicator; solid/gradient/bitmap | Fill ownership only; too-large gaps explicitly fail | One fill | 138; A |
| Ink Bottle | Click region/outline to change stroke | Stroke attributes; exact double/modifier behavior UNKNOWN | Stroke indicator; solid color, width/style | Does not repaint fill | One stroke-style change | 137; A |
| Eyedropper | Sample stroke or fill/bitmap | Exact modifier behavior UNKNOWN | Sample indicator, resulting active paint | Switch to Ink Bottle for stroke; Bucket with lock fill for fill | Sampling transient; application command | 138; A |
| Eraser | Remove geometry: Normal, Fills, Lines, Selected Fills or Inside | Faucet deletes clicked segment/region; pen flip temporary | Real footprint; erase mode/size | Inside only affects starting fill; double-click toolbar Eraser clears Stage/pasteboard | One erase stroke or clear transaction | 118; A |
| Hand | Drag viewport | Space temporary hand; middle/trackpad are modern routes | Hand/grabbing; camera only | No document selection/mutation; double reset UNKNOWN | UI state only | 24; A |
| Zoom | Click in/out or drag region | Alt/Option inverse; anchored wheel/pinch are modern routes | Magnifier plus/minus; percentage/fit | Camera only; historical range 8–2000% | UI state only | 23; A |

Every row also inherits the mouse/pen, drag-threshold, snapping, cancel and original
cursor contracts above. UNKNOWN means not historically verified, not omitted from
the implementation obligation. Before accepting a tool, its test report must cover
mouse, synthetic pen, modifiers, snap, Properties, selection/edit context, repeated
clicks, cancel, undo, save/load, render/export and keyboard access.

Source conflict note: PDF 120 has an overbroad sentence claiming Free Transform
cannot transform instances/text, immediately followed by instructions to do so.
Its Distort paragraph explicitly restricts distortion. Interpret this as a
distortion restriction and flag the editorial inconsistency rather than disabling
ordinary transforms. PDF 121's dedicated Scale mode reverses the Shift convention
relative to Free Transform; do not collapse these contexts into one modifier rule.
