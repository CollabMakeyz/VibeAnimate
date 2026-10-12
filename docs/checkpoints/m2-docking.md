# M2 docking integration checkpoint

M2 remains partial. `DockChrome` connects the previously tested immutable layout
model to real desktop panel content. Tools controls Hand/Zoom; Properties exposes
the current document metadata and actual grid/renderer settings; Library and
Timeline read the canonical blank document. Their later editing operations are
not exposed as fake controls.

Docked groups support edge placement, HTML drag/drop tab grouping, active-tab
selection, collapse/close/restore and resizing. Floating groups support native
pointer capture for movement and corner resize. Placement menus also provide a
keyboard-accessible path. Visible dock extents are bounded to 40% of the workspace
per edge; the stored preferred extent is preserved. Closed panels retain their
model home. A moved floating header suppresses the following click so it cannot
accidentally collapse the panel.

Workspace settings are scoped to `vibeanimate.workspace.v1` in the local application
origin. Presets and custom save/update/rename/delete/reset use WorkspaceStore;
pointer previews remain in memory until release. A failed durable write restores
the last saved layout and shows an error. Corrupt/unavailable settings produce a
session-only fallback with an explicit repair action, never automatic overwrite.
Workspace preferences are distinct from document save/load, which is not implemented.

The existing 115 Node tests cover pure layout/storage/camera models and parse all
embedded E2E expressions. `scripts/e2e-workspace.mjs` adds native pointer movement/
resize, DOM drag/drop grouping, close/restore, custom save, reload, rename and delete.
These native tests are newly added and have not yet passed. DOM drag/drop injection
is explicitly distinct from OS drag-and-drop certification.

Preceding Stage run 38314909700 passed Linux/macOS. Windows passed seven Rust tests,
native startup, real WebGL2/Canvas2D pixel checks and pointer pan, then failed the
cursor-anchor oracle. The test now requests integer CSS coordinates and records
the delivered wheel point. Its 0.01 world-unit tolerance is unchanged. A new run
must prove whether this resolves coordinate quantization or reveals an app defect.

Remaining M2 work includes document tabs, editable document properties, shared
menus/palette, rulers/guides/snapping, themes/UI scale, full keyboard navigation,
native interaction/resize verification and demonstration evidence. Do not mark M2
complete from compiled UI, test definitions or the historical M1 screenshot.
