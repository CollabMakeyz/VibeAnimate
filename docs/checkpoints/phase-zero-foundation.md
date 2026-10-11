# Phase Zero research checkpoint

Status: PARTIAL. No production milestone or application is complete.

The repository started with only a title README. The supplied 3,857-line plan is
preserved in `docs/MASTER PLAN.md`. The research workspace now includes 95 feature
records, 15 source records, 19 risks, four architecture decisions, historical
interaction inventories and explicit unresolved exit gates. Research uses public
documentation and original code; no Adobe implementation or art is incorporated.

Validation on Windows 10.0.26200, Node 24.19.0:

- `npm run check`: 33 tests pass, no failures or skips; research integrity,
  generated matrix, dependency guard and numerical prototypes checked.
- `npm run gate:phase-zero`: expected failure with eight unresolved research gates.
- `npm run benchmark:research`: original quadratic subdivision and camera probes,
  recorded in `phase-zero-numerics.json`; not renderer/FPS evidence.
- `npm run doctor`: Node/Git available; Rust/Cargo unavailable.
- Git whitespace check passes. CI is configured but has not run remotely.

Run the above commands from the repository root; no package install is required.
There is no editor to launch yet. All product feature statuses remain NOT
IMPLEMENTED, and manual/physical tablet acceptance remains outstanding. No
third-party runtime dependency has been adopted; the license check currently
rejects any dependency addition pending a real transitive audit.

Next: render AA probes in a real browser, finish dated menu/shortcut/control
coverage and solver/fitting research, then close the research gates with evidence.
Phase One defines typed interfaces, transactions, workers and schema before M1.
