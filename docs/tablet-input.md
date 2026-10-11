# Tablet input specification

Status: **NOT IMPLEMENTED; no physical hardware validated**.
Sources: [Pointer Events Level 3](https://www.w3.org/TR/2026/REC-pointerevents3-20260630/)
§§4,8–10 and [Tauri architecture](https://v2.tauri.app/concept/architecture/).

```text
Device → OS/driver → WebView → WebPointerBackend → normalized samples
                         ↑
        optional native backend only after reproduced missing functionality

confirmed/coalesced → calibration → resample → stabilizer → fitting → Command
predicted          → speculative tail → overlay only → discarded/replaced
```

## Capability contract

Record API presence separately from observed device data. A property existing on
PointerEvent does not demonstrate a sensor. `unknown`, `observed`, `unavailable`
must remain distinct. Mouse pressure defaults must never certify a pressure sensor.
WebView2/Windows, WKWebView/macOS and WebKitGTK/Linux each run this same matrix;
no per-engine support claim has been physically verified here.

| Capability | Detection / evidence | Fallback | Acceptance case |
|---|---|---|---|
| PointerEvent | Constructor availability | Explicit input capability error if absent; baseline mouse adapter may be introduced separately | Startup without constructor |
| Pressure | API + varying pen samples | Configured constant mouse/pen size | Ramp changes size/opacity/flow independently |
| Tilt X/Y | API + observed values | Preset nib angle/aspect | Angle wrapping and tilt extremes |
| Twist | API + device observations | Preset or tilt-derived orientation | Wrap at 360° without jump |
| Tangential pressure | API + observations | Neutral value with no support claim | Signed range and absence |
| Eraser end | button 5 or buttons bit 32 | Manual Eraser | Down/move/up transitions restore previous tool |
| Barrel | button 2 or buttons bit 2 | Configurable right-click behavior | Temporary action ends on release |
| Coalesced | Callable method and nonempty returned samples | Original event | Empty list, sorted timestamps, no duplication |
| Predicted | Callable method and returned samples | No speculative tail | Save/undo never contain predicted samples |
| Raw update | Listener capability plus measured benefit | pointermove/coalesced only | Never ingest both streams twice |
| Hover | Pen movement without contact observed | No unsupported hover claim | Brush outline only, no document mutation |
| Capture | Capture lifecycle | Cancel safely on loss/blur | No stuck drawing state |
| Touch | Pointer touch contacts | Mouse/pen navigation | Two-finger pan/pinch cannot change pen stroke |

Normalize pointer identity/type, client and Stage coordinates, timestamp, pressure,
tangential pressure, tilt, altitude/azimuth, twist, contact dimensions, button masks,
primary/coalesced/predicted flags. Preserve final pen-up position without applying
its zero pressure blindly to the last contact sample. Sort samples stably; dedupe
only actual repeated samples, not all samples sharing a timestamp.

Use one active acquisition stream. Release/cancel/lostcapture/window blur/disconnect
must all terminate or discard the ephemeral stroke under a documented policy.
An interrupted stroke cannot leave an open undo transaction. Configure touch-action
on the Stage before gestures start; do not suppress document-wide browser behavior.

## Brush behavior design

Size, opacity and flow each have independent enabled/min/max/response-curve fields.
Piecewise monotonic curves support Linear/Soft/Firm/S-Curve/Custom, dead zone and
clamp; evaluate deterministically and validate monotonicity. Tilt controls nib
orientation/aspect, twist overrides orientation only when observed. Profile values
must visibly influence the generated outline and opacity, not just a diagnostics bar.

Editable InkStroke persists confirmed samples, fitted segments, width/opacity/angle
profiles, brush preset and seed. Baking creates vector geometry through a reversible
command. Fitting and cubic→quadratic conversion divide a stated total error budget.
Keep sharp corners when requested; dense sample ramps, duplicate points and
thousands of samples must remain finite and bounded. Prediction has its own cache.

## Palm, gestures and diagnostics

Pen state: absent → hover → contact, with configurable cooldown. Pen Only disallows
touch drawing; Pen + Touch permits gestures according to policy; combined mode is
explicit. The application heuristic complements OS palm rejection and cannot
guarantee it. A second finger never supplies points to the pen transaction.

Diagnostics report backend, API flags, observed sensor flags, raw/calibrated pressure,
tilt/twist/buttons, sampling intervals and coalesced/predicted counts. Input latency
is an estimate with its method, not pen-to-photon measurement. Profiles are local;
captures require voluntary action and must not fingerprint devices remotely.

Native Windows/WinTab bridges remain deferred unless physical tests identify a
specific loss in the web path. The bridge must match normalization/cancellation
contracts and remain isolated from tools/document serialization.

## Physical matrix and procedure

| Device | OS/driver | Backend | Pressure/tilt/hover | Eraser/barrel | Coalesced/predicted | Result |
|---|---|---|---|---|---|---|
| Wacom Intuos | Not measured | Not measured | Not measured | Not measured | Not measured | NOT TESTED |
| Wacom Cintiq | Not measured | Not measured | Not measured | Not measured | Not measured | NOT TESTED |
| Huion tablet/display | Not measured | Not measured | Not measured | Not measured | Not measured | NOT TESTED |
| XP-Pen tablet/display | Not measured | Not measured | Not measured | Not measured | Not measured | NOT TESTED |
| Surface Pen | Not measured | Not measured | Not measured | Not measured | Not measured | NOT TESTED |
| Mouse/touchpad/touch display | Not measured | Not measured | Not applicable until device selected | Not measured | Not measured | NOT TESTED |

For each physical device: record model/OS/driver/WebView; run pressure ramps, slow
curves, circles, diagonals and fast zigzags for 30 seconds; test hover, eraser flip,
barrel transitions, leaving window, blur, unplug, concurrent palm/two-finger input;
save/reload and verify undo units; record lost samples and p50/p95 intervals.
At least one real tablet must pass before M4 can be marked complete.
