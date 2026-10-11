# Workspace and panel inventory

Status: researched specification; **NOT IMPLEMENTED**. Evidence: CS4 manual PDF
16–41 for workspace/panels/focus, plus subsystem sections below. Historical labels
are recorded here for research; the application's artwork must be original.

| Surface/panel | Behavior and context | Source (PDF page) | Milestone | Required verification |
|---|---|---|---|---|
| Application frame | Groups workspace; platform differences | 16 | M2 | Multiwindow bounds and platform behavior |
| Menu bar | Context commands | 25 | M2 | Shared command enablement and keyboard focus |
| Document tabs | Select open document | Workspace section; exact platform behavior pending | M2 | Per-document state and dirty-close handling |
| Stage/pasteboard | Work area and outside-stage artwork | 23–24 | M2 | Pan/zoom, clipping and exported bounds |
| Tools | Tool groups, view, colors and contextual options | 25–26 | M2/M3/M4 | 1/2-column modes, flyouts, keyboard access |
| Properties | Selection-dependent attributes or document settings | 30 | M2 onward | Multi-selection and throttled live updates |
| Library | Definitions/assets/folders/search/sort/usage/preview | 31,162 | M6 | Drag instance; definition updates |
| Timeline | Layer list, frame area, playhead, fps/time, onion controls | 27–29 | M5 | Virtualization and dock/float |
| Color | Solid/gradient/bitmap, alpha and color models | 132–135 | M3 | Editing updates model via command |
| Swatches | Document palette, duplicate/delete/load/save | 133,138 | M3 | Palette persistence and active paint |
| Align | Left/center/right and top/center/bottom alignment; distribution/size matching; To Stage switch | 126; dated menu inventory supplement | M3 | Stage vs selection reference and undo |
| Transform | Numeric transforms and pivots | 118–122,233 | M3/M8 | Matrix correctness and IK attachment |
| Info | Editable X/Y plus registration/transformation-point mode and dimensions | 119,129 | M2/M11 | Coordinate convention and readout rate |
| History | Undo/redo and historical repeatable steps | 34–38 | M1/M11 | Bounded journal; repeat capability distinct |
| Actions | Script editor tied to current context | 31–32,338 | M9 | Original isolated API; not JSFL/AS parity |
| Motion Editor | Property curves/keys/ease, linked spatial keys, nonspatial tangent handles, ratio links, eased overlay | 208–214 | M7 | Graph manipulation and keyboard editing; spatial curves edited on Stage |
| Motion Presets | Preview/apply/store tween presets | 194–195 | M7 | Applied tween independent of later preset edit |
| Components | Historical reusable UI components | 34,153 | M9 research scope | Original runtime components; no proprietary bundles |
| Component Inspector | Parameter context | 34 | M9 research scope | No panel exposed before functional behavior |
| Output | Diagnostics/runtime messages | 364 | M9 | Structured bounded logs; accessible messages |
| Scene | Scene order and navigation | 184–185 | M5 | Reorder without corrupting definitions |
| Movie Explorer | Hierarchical document contents/search | 32 | M6/M11 | Stable ID navigation and category filters |
| Project | Historical project grouping | 57–59 | M11 parity research | Not equivalent to document tabs |
| Behaviors | Historical AS2 interactions | 174–175 | Compatibility research | No AS2 compatibility claim |
| Accessibility | Historical document accessibility metadata | 310–316 | M11 | Separate from editor accessibility |
| Strings | Historical localization workflow | 268–275 | Compatibility research | No unsupported workflow exposed |
| Tablet/Input Diagnostics | Modern local sensor/profile diagnostics | Plan, POINTER | M4 | API presence distinct from observed data |
| Performance HUD | Modern optional dev metrics | Plan | M1/M11 | Sampling cost bounded; no default sample spam |

DockLayout is a serializable layout model, separate from document data and DOM.
Panels can dock to supported edges, join tab groups, float, resize, collapse, close
and restore. Presets Essentials/Animator/Designer and named custom workspaces must
support save/rename/delete/reset. Offscreen floating panels recover to visible bounds
after monitor changes. Workspace persistence never enters the artwork graph.

Historical focus traversal favors docked Timeline, then other docked panels, then
floating panels; Ctrl/Cmd+F6 advances and Shift reverses (PDF 38–39). Implement
visible focus and full modern keyboard access even where historical macOS support
was limited. Space on a panel header toggles collapse; within Stage it can temporarily
pan. Input fields and modals own their keyboard context.

All product panels remain absent until they serve an implemented action. The
inventory is not permission to create empty shells presented as working features.

Version-specific cautions from PDF 16,20–21: the generic Creative Suite workspace
chapter includes examples for other products. Flash's application frame is always
on; the one/two-column Tools switch is explicitly excluded for Flash. The plan's
1/2-column option is therefore a modern extension. Flash saves a workspace through
the Application bar switcher; Window > Workspace examples for Photoshop are not
verified Flash menu entries. Info registration/pivot readout is specified on PDF 119.

Control semantics now reviewed: Info defaults to top-left selection coordinates
relative to Stage; its registration/transformation toggle exposes the pivot.
Transform offers numeric scale/rotation/skew, copy/apply and removal of transforms
(PDF 119–122); base geometry and transform must remain separable. Align's To Stage
changes the reference bounds, not the coordinate system. Motion Editor control
details and historical restrictions are in `timeline-model.md`. Unverified visual
spacing/icon details are deliberately original UI, not compatibility evidence.
