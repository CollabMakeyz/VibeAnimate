# Dependency inventory and license policy

Status: Phase One; **six pinned development packages adopted and audited**.
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
| TypeScript | 5.9.3 | Required static typing | Direct dev | Apache-2.0 plus bundled terms with exact user approval | https://github.com/microsoft/TypeScript | Mature compiler, explicit contract checks | Medium | ADOPTED, development only |
| Ajv | 8.20.0 | Structural JSON Schema validation | Direct dev | MIT | https://github.com/ajv-validator/ajv | Strict draft 2020-12 validation | Medium | ADOPTED, development verification |
| UI framework | Unselected | Chrome and panels only | Candidate direct | Audit before selection | No selection | Lightweight scoped updates | Medium | NOT ADOPTED |

The exact machine-readable graph is `docs/dependencies.json`: Ajv, fast-deep-equal
3.1.3, fast-uri 3.1.8, json-schema-traverse 1.0.0, require-from-string 2.0.2 and
TypeScript. It records purpose, direct/transitive relationship, source, selection
reason, replacement difficulty, scope, package integrity, dependency edges, license
branch and retained notice hashes. Notice hashes use UTF-8 text normalized to LF,
so Git's Windows newline conversion does not invalidate the evidence.

`scripts/audit-dependencies.mjs` validates npm lockfile v3 against that inventory,
strict allowed SPDX expressions, exact direct versions, transitive presence and
version-specific bundled-term approvals. CI audits before `npm ci --ignore-scripts`,
then compares installed notices with their reviewed copies. npm verifies tarball
integrity during installation. Generated THIRD_PARTY_NOTICES.md links every retained
license/notice. The tool cannot discover undeclared copied code inside arbitrary
packages: human review of bundled notices remains required at each adoption.

The initial metadata-only compiler check missed bundled additional terms. Inspection
caught this and further use paused. On 2026-10-11 the user explicitly approved the
TypeScript 5.9.3 development-only exception, including its Unicode, W3C and CC-BY
terms. See `docs/licensing/typescript-review.md` and `approvals.json`. No other
package, version, runtime distribution or general license family was approved.

Runtime packages, nested/workspace dependency graphs, optional/peer/bundled npm
graphs and Cargo currently fail closed until their format-specific resolver and
complete audit are implemented. This is an honest boundary of the current auditor,
not evidence that Tauri's graph has passed. Future Cargo review must include
target-specific and build/dev crates. Do not omit unknown transitives to pass CI.

Krita and Synfig can inform behavior but no GPL code is incorporated. All fixture
assets must have provenance and compatible redistribution rights. Codec availability
and codec distribution review are separate from a library's source license; MP4
remains capability-dependent.
