# Geometry and animation algorithm decisions

Research design; production implementation and numerical acceptance pending.
Sources studied: Schneider, *An Algorithm for Automatically Fitting Digitized
Curves* (1990), pp. 612–622, available from
[IMPA](https://lhf.impa.br/cursos/tmg/Schneider-1990.pdf); Aristidou and Lasenby,
*FABRIK* (2011), sections 3–4.3, available from the
[author](https://www.andreasaristidou.com/publications/papers/FABRIK.pdf).
Only mathematical ideas inform original implementation; no third-party code is
incorporated and no proprietary solver equivalence is asserted.

## Fit design

Schneider uses chord-length parameters and endpoint tangent directions, then
solves two unknown handle lengths by least squares. Refinement adjusts parameters;
unacceptable fits split at a high-error sample. G1 tangent alignment permits
different handle lengths across a smooth join. This yields cubics, not quadratics.

Original robustness policy for VibeAnimate:

- Keep raw confirmed sensor samples separate from geometric resampling; never
  replace pressure/time/tilt values with a curve-fit approximation.
- Remove coincident geometry samples while retaining endpoint attributes. Detect
  corners before fitting; do not impose smooth tangents across a declared corner.
- Work in a translated/scaled local coordinate frame to condition the solve.
  Reject near-singular normal equations and negative/nonfinite handle lengths;
  use bounded subdivision or a straight two-point segment as a defined fallback.
- Refine parameters only when finite, within [0,1], strictly ordered and improving
  the residual. Cap both iteration and recursion. Report budget exhaustion, never
  label an out-of-tolerance segment as an accepted fit.
- The sample residual alone is not a continuous Hausdorff guarantee. Acceptance
  must also check the source polyline and candidate curve between samples with
  adaptive bounds, preserving endpoints and rejecting unintended monotone loops.
- Cubic-to-quadratic conversion uses adaptive de Casteljau subdivision. Derive a
  control-polygon error bound after degree elevation of the candidate quadratic;
  subdivide until the whole segment bound satisfies tolerance. Separate world
  tolerance from renderer screen-space flattening tolerance.
- Unit/property corpus: repeated points, one/two points, straight lines, corners,
  loops, large offsets, pressure impulses, seeded noise, tolerance convergence,
  deterministic serialization and maximum-error certificates.

The disposable cubic-to-quadratic probe now exists at
`experiments/numerics/cubic-conversion.mjs`, with independent Bernstein evaluation,
200 seeded curves, large translations and explicit precision/budget rejection.
Its bound uses degree-elevation residuals and the analytical extremum of
3t(1−t)(1−2t), plus a conservative float allowance. It is not interval arithmetic
and does not replace continuous curve-fitting or production topology tests.

## IK design

FABRIK iteratively projects joint positions while preserving segment lengths in
forward/backward passes. The paper extends this to branch sub-bases and constrained
joints. Length reachability alone does not establish reachability under constraints.

Chosen first production candidate: original planar constrained FABRIK behind an
independent solver interface. The same package must support single chains and
trees before M8 acceptance. Required implementation safeguards:

- Stable bone IDs and canonical traversal order. Clone input pose; outputs include
  residual, iterations and a converged/limited/unreachable diagnostic.
- Root anchors and rest lengths are explicit. Disallow zero-length bones on edit;
  reject malformed imported constraints before evaluating the pose.
- Project parent-relative rotation and enabled translation limits every pass.
  Rebuild child transforms from constrained parents; do not clamp only the final
  visual gizmo. Fixed bones remain fixed.
- A collinear chain aimed inside its length can stagnate. Use a stored preferred
  bend/rest orientation to resolve symmetry deterministically. Never inject random
  noise or depend on the previous evaluated frame for random-access exports.
- For competing branches, combine sub-base requests with explicit target weights
  and deterministic ordering, then reproject lengths/limits. Retain the best legal
  pose if residual increases; obey an iteration cap and stagnation tolerance.
- Pose interpolation and solver input are explicit. Bind stores normalized
  nonnegative weights to stable bone IDs, with rest-space transforms; deform the
  editable shape, not just its bounding box. Influence removal must preserve at
  least one valid weight or request a deliberate unbound state.
- Verify length/root/constraint invariants, unreachable and opposing goals, wrap
  angles, branch order independence, no NaN and repeated-frame determinism. Solver
  failure is reported; it cannot silently commit an invalid document.

Constrained CCD remains a comparison candidate if FABRIK fails this corpus. The
paper alone does not waive tests or prove the historical application's internals.
