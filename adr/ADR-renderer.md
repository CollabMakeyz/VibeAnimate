# ADR: WebGL2 primary with explicit Canvas2D fallback

Date: 2026-10-10. Status: **ACCEPTED backend choice; AA/tessellator experiment open**.

Decision: immutable frame-evaluated scene feeding independent WebGL2/Canvas2D
backends. Stage/input remain outside reactive panel updates. GPU resources are
bounded disposable caches. WebGPU is optional research, never an MVP requirement.
Test actual context creation and worker support, not only property presence.

Why: required by the plan and consistent with Khronos WebGL2, WHATWG Canvas and
Tauri's platform-dependent WebViews. Canvas-only does not meet the required GPU
architecture; WebGPU-only would make target support an unverified prerequisite.

Tessellation uses an adapter. Lyon is a candidate pending pinned-license inventory
and benchmark, not an adopted dependency. Compare MSAA/fringe/selective supersampling
before selecting AA. CPU geometry remains independent of flattening/LOD policy.

Consequences: explicit clipping/compositing/filters and backend parity tests; context
loss/restoration; new canvas surface for context-type fallback; error diagnostics
for unsupported effects. Revisit with target-machine capability/quality/performance
reports, never from Chrome alone. Sources: WEBGL2/CANVAS/TAURI-ARCH/LYON.
