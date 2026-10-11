# Verification strategy

Status: editor behavior tests **NOT IMPLEMENTED**. Structural schema, license audit,
type contracts and research checks are executable. Numerical probes
are tracked separately in checkpoint reports. Test plans do not count as passed tests.

Current entry point: audit before installing (`node scripts/audit-dependencies.mjs`),
`npm ci --ignore-scripts`, then `npm run check`. This includes generated contract and
notice drift, strict TypeScript checks and the Node test suites. `npm run demo:contracts`
exercises an original rectangle DTO and a malformed quadratic. Neither this demo nor
schema acceptance proves a valid topology, saved package or editor interaction.

## Required suites and oracles

| Suite | Independent evidence / oracle | Acceptance |
|---|---|---|
| Geometry unit | Analytic endpoint/derivative/extrema/intersection examples | Correct numeric values and valid graph |
| Geometry property | Seeded lines/quadratics/ovals/transforms; split equivalence, area, finite values | Reproducible seed and no dangling references |
| Topology integration | Hand-authored expected face ownership and canonical snapshots | Full merge corpus in vector-model.md |
| Commands | Canonical before/apply/undo/redo snapshots | Undo equals before; redo equals first apply |
| File format | Valid original fixtures and malicious/malformed inputs | Round-trip plus bounded diagnostic rejection |
| Timeline/tween | Known values at start/middle/end and random-access frames | Direct seek equals sequential evaluation |
| Input replay | Confirmed/coalesced/predicted/cancel sequences | Prediction absent from document; exactly one stroke transaction |
| IK | Reachable/unreachable/branched/locked joints and limits | Deterministic finite bounded solver output |
| Procedural | Known seed and parameters | Same logical result after reopen |
| Visual | Fixed scene/resolution/DPR/reference images | Explicit tolerance; no auto-accepting changed goldens |
| E2E | Real application interactions and resulting saved/exported content | User workflows work beyond button presence |
| Performance | Versioned scene, correctness assertions and controlled timings | Documented thresholds, environments and raw reports |
| Physical devices | Human-operated tablet and driver observations | At least one tablet before M4 acceptance; expanded matrix in M11 |

Golden scenes must cover primitives, gradients, stroke joins, masks, filters, onion,
nested symbols, tweens, 3D, IK and text. Use deterministic seeds and fonts with
redistributable licenses; separate font fallback variability from renderer bugs.
Suggested initial image tolerance: normalized channel error ≤1/255 outside a
one-pixel antialias boundary; establish actual tolerances from reviewed fixtures.
Do not loosen tolerances simply to make a failure pass.

## High-risk scenarios

Cancel, lost capture, blur/disconnect, undo during async work, stale worker results,
GPU loss/restoration, malformed files, failed writes, unsupported codecs, nested
cycles/expansion and event storms. Every file/asset boundary is untrusted. Every
permanent feature must demonstrate model/editor/undo/save/render/export or explicit
unsupported diagnostic, relevant tests, docs, performance and keyboard consideration.

## CI progression

Phase Zero: dependency-free research data validation, harness tests and disposable
numerical probes across Windows/macOS/Linux. These are allowed before production.
Phase One: explicit schema/contract validation and dependency-boundary tests.
M1 onward: required typecheck, lint, unit, integration, frontend build, Rust build,
license audit, schema and selected E2E. No empty CI job or successful echo may stand
in for a required check. A missing tool must produce a clear failed/blocked check.

## Manual runbook template

Record commit, platform/build, scene/fixture, device/driver, steps, expected result,
observed result, screenshot or capture path when relevant, and pass/fail/untested.
Run keyboard-only new/open/edit/undo/save/export; switch documents; move/floating
panels across displays; change UI scale independently from Stage; test recovery
after injected termination. Never claim these passed without execution evidence.

## Implemented M1 verification (2026-10-11)

77 Node tests cover research, architecture, npm/Cargo audit rejection cases and
capability detection/fallback. Four Rust tests exercise real JSONL persistence,
newline escaping, size rejection, rotation and input schema rejection.
Native Windows E2E starts the built executable with an isolated WebView profile;
it tests startup and native IPC, UI log actions, forbidden IPC, oversized input,
external-network CSP rejection, render-error recovery and reload from embedded
assets. The generated screenshot/report are under test-results/.
See docs/desktop-development.md for exact commands and scope. This is foundation
coverage; no editor operation or physical tablet test is included yet.
