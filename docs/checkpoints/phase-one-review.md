# Phase One architecture exit review

2026-10-11. **Architecture phase complete; M1 Foundation remains unaccepted.**
This review accepts design deliverables and tested structural validation, not an
application, semantic model implementation, renderer or save/load subsystem.

| Required gate | Concrete evidence | Remaining runtime work |
|---|---|---|
| Folder tree and principal interfaces | docs/architecture.md; packages/*/src/contracts.ts; workers/contracts.ts | Build the allocated app/backend implementation directories with M1 onward |
| Explicit versioned schema and native v1 | v1.mjs, generated v1.schema.json and dto.ts; docs/native-format-v1.md; original rectangle DTO demo | Bounded container/JSON parsing, semantic validation, serialization and atomic IO |
| Command/transaction and worker boundaries | Typed patches, executor write capability, revision-bound messages; ADR-transactions-workers.md | Atomic executor, undo state identities, brokers, transfer lifecycle and crash tests |
| Renderer/tablet abstractions | Neutral evaluated scene and backend interfaces; distinct confirmed/predicted types; capability observations | Actual GL/Canvas adapters, event backends and physical tablet evidence |
| Performance budgets and ADRs | docs/performance.md; five ADRs including transactions/workers and revised native format | Calibrate with real native application workloads and hardware |

Local evidence: Windows, Node 24.19.0, TypeScript 5.9.3, Ajv 8.20.0. `npm run check`
passes 67 Node tests (47 prior research/numerical cases and 20 architecture/schema/
dependency cases), generated-schema/DTO/notice synchronization and strict no-DOM
type checking. Tests include all eight element families, four tween families,
line/quadratic/cubic records, malformed input, predicted sample rejection, quotas,
and license approval scope. Compiler assertions reject mutable DTO usage, the wrong
entity patch payload and predicted-to-confirmed assignment.

`npm run demo:contracts` accepts the original rectangle document structure and
rejects a quadratic missing its control point. It explicitly identifies itself as
a contract demonstration, not a native project or editor. The synthetic manifest
fixture tests shape only; its dummy checksum is never presented as a valid package.

Dependency evidence: npm lockfile v3, six exact development packages, full retained
license/notice texts, notice hash matching after installation, strict SPDX parsing,
inventory/edge drift rejection. TypeScript bundled additional terms were explicitly
approved by the user for version 5.9.3 development use only. Runtime/Cargo, peer,
optional and nested dependency graph adoption still fails closed until audited.
No dependency licensing conclusion rests solely on the top-level package license.

CI now audits before installation, installs without lifecycle scripts, compares
installed notices and runs contracts plus tests on Windows/macOS/Linux. The prior
Phase Zero e19007c run passed all three hosts. This review's local evidence is not
a claim that its new remote CI run or native application build has already passed.

Next: M1 Foundation. Inspect/install the required native build prerequisites; select
and audit exact Tauri 2 and UI/build dependencies, implement complete npm/Cargo graph
audits, create the real native shell, logging/error boundaries/capability detection,
lint/format and E2E bootstrap. Run the application and native build tests before
accepting M1. No M2 feature work may substitute for that foundation acceptance.
