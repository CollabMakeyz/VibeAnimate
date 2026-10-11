# Known limitations

Current status: **research, architecture contracts and structural validation**. The repository began with
README.md alone. There is no runnable editor, renderer, document engine, native
shell, import/export system or production feature yet. All M1–M11 features remain
NOT IMPLEMENTED. Numerical probes are explicitly non-production experiments.

Phase Zero research and Phase One design are reviewed. Historical shortcut unknowns
and menu placement conflicts remain explicit. Structural schema validation is real,
but it does not check graph references, geometry, cycles or native package bytes.
Typed interfaces are not implementations of commands, workers or rendering.
The browser AA probe covers thirty convex/decomposed cases, not arbitrary topology.
Fitting/IK mathematical choices still require production implementation and corpus
validation. Source discrepancies are documented rather than hidden.

No production build, E2E editor interaction, graphical benchmark or physical tablet
test has passed. Rust/Cargo 1.99.0 are now installed in a workspace-local host toolchain
and an MSVC compile/link probe passed; no Tauri application build has run.
No Windows/macOS/Linux installer exists. Six pinned development packages are now
audited, including a user-approved exception for TypeScript 5.9.3 bundled notices.
No Tauri/Rust/runtime graph has been adopted or license-approved by that exception.

The master plan's completion rules remain in force. Do not mark a milestone complete
based on documentation, a research probe, planned tests or synthetic hardware events.
