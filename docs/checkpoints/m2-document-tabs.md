# M2 document tabs and panel positioning

On 2026-10-13, document tabs use canonical independent blank DocumentDTOs and
session-only camera/viewport state. New/select/close are real operations; closing
an active tab selects its next neighbor, then previous neighbor, then the welcome
screen. Closing the last tab disposes the Stage and unregisters its commands;
creating again remounts it. No authored edits exist yet, so this checkpoint does
not claim dirty-close prompts, project loading, saving or undo.

The shared registry handles Primary+N and Primary+W. The Editor listens on window
with teardown, so body focus at startup or after removing a focused tab does not
lose global shortcuts. A handled Stage event is not dispatched a second time.
Arrow keys, Home and End select document tabs with roving focus.

CI run 38316048794 at ce8df8d passed Linux/macOS builds and checks. Windows passed
all Stage checks: dual-backend pixel readback at DPR 1/2, pointer pan, anchored
wheel zoom, camera commands, keyboard input isolation, actual WebGL context loss
and Canvas2D recovery. It then failed floating panel movement. Reproduction found
a UI defect: persisted bounds changed but inline CSS lengths were unitless and
ignored. The adopted Preact 11 core does not add px automatically; all docking
positions and dimensions now explicitly include px.
Source: https://preactjs.com/guide/v11/upgrade-guide/

Validation before commit: npm run check passes 118 Node tests, strict types,
formatting and inventory checks. The same Stage/workspace/tab E2E modules pass
against an isolated Chromium 151 headless preview, including pointer movement,
resize, workspace reload and body-focus shortcut regressions. This browser check
is additional UI evidence, not a replacement for Windows Tauri/WebView2 E2E.
Native CI for these changes is still pending. No project dependency was added;
the temporary browser runner uses the host-bundled Playwright outside the package.

The screenshot m2-browser-preview.png records the actual pre-fix browser UI shown
on request. It is not native evidence and predates the inline-length correction.

Remaining M2: editable document properties through transactions, menus/palette,
rulers/guides/snapping, themes/UI scale, keyboard panel focus and resize/device
validation. M2 remains unchecked; all later milestones retain their full scope.
