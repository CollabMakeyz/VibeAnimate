# Disposable Phase Zero numerical probes

Original mathematical experiments, **not production packages**. They examine
quadratic subdivision/intersection and anchored camera transforms before architecture
contracts are finalized. They do not implement topology, merge drawing, rendering,
fitting, an editor or complete geometry robustness.

Run `npm test` and `npm run benchmark:research` from repository root. The benchmark
prints raw JSON with scenario size, seed, environment, percentiles and correctness
residuals. Timing these equations is not evidence of 60/120 fps rendering.

The curve probe uses the quadratic Bernstein equation and De Casteljau interpolation,
and solves intersection with a finite line analytically. Collinear cases return a
separate classification without claiming finite-segment overlap; they do not fabricate
finitely many crossing points. Coordinates are bounded to magnitude 1e12. The
curve/curve coincident/tangent problem remains open. Numeric tolerances are explicit
experimental parameters, not the final GeometryTolerance contract.
