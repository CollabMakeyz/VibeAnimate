# Clean-room implementation policy

Implement document semantics, topology, fitting, input, tools and timeline from
independent specifications and mathematical descriptions. Study published behavior
and architecture, not source as a template for translation or renamed copying.
Record algorithm references and original design decisions before implementation.

Do not extract proprietary artwork, fonts, sounds, icons or executable resources.
Produce original icons, gizmos, examples and branding. Do not redistribute manuals
used for research. Local research copies stay outside the repository.

Do not incorporate GPL reference-project code, even after translation. A permitted
tessellation dependency receives paths and returns triangles; it never defines
ownership, selection, document topology or merge semantics.

Before adding a dependency, record exact version, direct/transitive relationship,
purpose, SPDX expression, source, selection rationale and replacement difficulty.
Allowed families are MIT, Apache-2.0, BSD-2-Clause and BSD-3-Clause. Unknown licenses
fail audit; other families require the plan's explicit approval. Do not silently
expand the allowlist. Record dev/build dependencies as well as shipped libraries.

Research confidence: A = primary specification/documentation; B = reliable
historical book; C = secondary account; D = undocumented experiment. Classification
is independent of version applicability. Test evidence never manufactures a
historical claim. Separate intended behavior, implementation status, automated
verification and physical validation in every report.
