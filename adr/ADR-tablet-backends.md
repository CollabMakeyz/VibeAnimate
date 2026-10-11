# ADR: web pointer first, evidence-driven native fallback

Date: 2026-10-10. Status: **ACCEPTED strategy; physical validation pending**.

Decision: WebPointerBackend emits normalized confirmed/coalesced/predicted samples
with separate observed capabilities. Tool logic has no WebView/driver branding
conditionals. Predictions never enter persistent data. Default ingestion is
pointermove/coalescing; raw updates require capability detection and measured benefit.

Why: POINTER defines pressure/orientation/buttons/capture; TAURI-ARCH explains why
the same app uses different engines. A universal native tablet implementation adds
complexity and privileges without evidence. Palm rejection is best effort.

Native Windows/WinTab is added only after a reproduced physical WebView gap, with
opt-in fallback and equivalent tests. Future macOS/Linux bridges follow the same
rule. No synthetic event can establish manufacturer support.

Acceptance: tablet-input.md replay/cancel matrix, pressure affecting brush output,
profile persistence and one real tablet before M4 completion. Revisit only with
device/OS/driver/backend capture showing missing functionality.
