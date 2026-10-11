# M1 native prerequisite checkpoint

2026-10-11. M1 remains **PARTIAL**; no desktop app or Tauri build exists yet.
Phase One commit `06bbb0e75578eddce3655e914f250c8233ad9f35` passed all three
[CI hosts](https://github.com/CollabMakeyz/VibeAnimate/actions/runs/38129330475):
Windows, macOS and Ubuntu. These are contract/research tests, not native builds.

Verified local prerequisites:

- Windows x64 10.0.26200; Node 24.19.0, npm 12.0.2.
- Visual Studio Community 2026 18.9.12128.139 has
  Microsoft.VisualStudio.Component.VC.Tools.x86.x64 according to vswhere.
- Microsoft Edge WebView2 Runtime 154.0.4258.62 is registered.
- Rust 1.99.0 stable, commit b940084d7eb6a299eb4bfeb8e34901bc051e7ac4,
  host x86_64-pc-windows-msvc; Cargo 1.99.0; rustfmt and clippy installed.
- A disposable Rust arithmetic assertion compiled, linked with MSVC and executed
  successfully. This proves the host compiler/linker path, not Tauri functionality.

Rust was installed from the official rustup x64 Windows installer using the minimal
profile, without modifying global PATH. Download SHA-256 matched the official file:
`6f4bef66261261fcb43131be8720bab817d403a09edec7455c371974b90bdb7e`.
The host toolchain resides in the workspace sibling `work/native-toolchain`, with
`cargo` and `rustup` subdirectories. `scripts/native-environment.mjs` supplies those
paths to child processes; `VIBEANIMATE_TOOLCHAIN_ROOT` can select another installation.
Otherwise a normal system Rust setup also works. Binaries are not committed or
bundled in the application. `npm run doctor` now finds and reports this toolchain.

Reference setup: [Rust installation](https://rust-lang.org/tools/install/) and
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/). At inspection the
system disk had about 11 GiB free before Rust/crate downloads. Check remaining free
space before large debug builds; do not delete unrelated user files to make room.

## Candidate graph, not adoption

Tauri 2.12.3 and tauri-build 2.7.2 were resolved in the separate scratch directory
`work/native-dependency-review`, using `cargo metadata` without compiling or running
crate build scripts. Its Cargo.lock and metadata.json contain 406 external packages
across target platforms. Those files are review inputs, not approved project locks.
No Cargo manifest was added to the product while its complete auditor is pending.

Metadata exposed licenses outside the plan's default families: Unicode-3.0 (including
ICU), MPL-2.0 (CSS parser/selectors and option-ext), ISC (libloading), Zlib
(foldhash/zlib-rs) and Apache-2.0 WITH LLVM-exception (target-lexicon). Additional
bundled notice review found CC-BY-3.0 in crossbeam-channel's third-party notice and
public-domain/CC0 test-code notices in utf8_iter. These are **not covered** by the
TypeScript exception and are not approved. Some legacy Cargo strings use slash
dual-license notation; these need recorded normalization with the retained texts,
not globally permissive substring matching.

The SPDX parser now distinguishes a qualified license from its unqualified base
while allowing an independently permitted OR branch, e.g. LLVM-qualified Apache OR
MIT selects MIT. This does not approve LLVM exceptions themselves.

Next concrete work: finish the complete Cargo inventory/retained-notice review and
auditor, prepare any required version-specific exception proposal, audit selected
frontend/build packages, then implement and run the real Tauri shell. No native
build or package acceptance is inferred from successful dependency resolution.
