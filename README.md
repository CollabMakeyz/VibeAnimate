# VibeAnimate

An original desktop vector-animation editor project, following the full specification
in [MASTER PLAN](docs/MASTER%20PLAN.md). **Current state: Phase Zero research reviewed;
Phase One architecture next. There is no runnable editor yet.**
[PROGRESS.md](PROGRESS.md) records all phases and milestones.

The repository currently contains sourced behavior specifications, architectural
decisions, feature/risk inventories, and a dependency-free research test harness.
Numerical experiments are disposable probes and do not implement the application.

## Run the current verification tools

Requires Node.js 22 or newer (validated locally with 24.19.0). No package installation
is needed for this research checkpoint.

```sh
npm run check
npm run benchmark:research
npm run probe:rendering
npm run doctor
```

`npm run gate:phase-zero` passes the reviewed research inventory. Its negative
tests reject partial or missing records. This is separate from product acceptance
and does not establish full historical compatibility.

The rendering probe serves http://127.0.0.1:4173; choose **Run measurements** to
compare thirty AA cases. It is a disposable experiment, not the editor. Stop its
server with Ctrl+C. Saved results are in `docs/checkpoints/`.

## Project records

- [Research ledger and sources](docs/research.md)
- [Feature matrix](docs/feature-matrix.md)
- [Known limitations](docs/known-limitations.md)
- [Assumptions](docs/assumptions.md)
- [Testing](docs/testing.md) and [performance plan](docs/performance.md)
- [Clean-room policy](docs/clean-room-policy.md) and [licensing](docs/licensing.md)

Production work must follow Phase Zero → Phase One → M1–M11. An unchecked milestone
has not met acceptance. Physical tablet tests, native builds and real graphics
benchmarks must never be inferred from synthetic tests or documentation.
