# Dependency inventory and license policy

Status: Phase Zero; **no third-party project dependencies installed**.
Research documents and host PDF/browser tooling are not bundled in VibeAnimate.
Dependency approval must not be inferred from an installed host tool.

Allowed families: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause. Other licenses require
the explicit approval stipulated by the master plan; unknown transitives fail audit.
An SPDX `OR` may select an allowed branch with recorded reasoning; `AND` requires
every branch to be allowed. Do not use substring matching for license expressions.

| Name | Version | Purpose | Direct/transitive | License | Source | Selection reason | Replacement difficulty | Status |
|---|---|---|---|---|---|---|---|---|
| Node.js host | 24.19.0 | Run dependency-free research harness | Host only | Host distribution, not project package | https://nodejs.org/ | Already present | Low | Host observed |
| Tauri | Unselected 2.x | Required desktop shell | Candidate direct | MIT OR Apache-2.0 at project level; pinned graph pending | https://github.com/tauri-apps/tauri | Required by plan | High | NOT ADOPTED |
| lyon | Unselected | Tessellation adapter | Candidate direct | MIT OR Apache-2.0 at project level; graph pending | https://github.com/nical/lyon | Path→mesh boundary | Medium | NOT ADOPTED |
| TypeScript | Unselected | Required static typing | Candidate dev | Exact version audit pending | https://github.com/microsoft/TypeScript | Required by plan | Medium | NOT ADOPTED |
| UI framework | Unselected | Chrome and panels only | Candidate direct | Audit before selection | No selection | Lightweight scoped updates | Medium | NOT ADOPTED |

When introduced, npm and Cargo lockfiles both enter CI audit, including optional,
target-specific and dev dependencies. Record name/version/source/integrity/license
and exceptions with approval evidence. Generate THIRD_PARTY_NOTICES.md from adopted
dependencies; fail on lockfile/inventory drift. Do not claim a clean audit by checking
only top-level package names or excluding Rust transitive crates.

Krita and Synfig can inform behavior but no GPL code is incorporated. All fixture
assets must have provenance and compatible redistribution rights. Codec availability
and codec distribution review are separate from a library's source license; MP4
remains capability-dependent.
