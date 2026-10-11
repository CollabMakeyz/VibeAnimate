# ADR: original versioned native package

Date: 2026-10-10. Status: **ACCEPTED format strategy; v1 schema pending Phase One**.

Decision: `.vibeanim` contains manifest, explicit document DTO and referenced assets;
canonical snapshots, migrations, atomic saves and separate recovery journal. XFL/SWF
remain external adapters with compatibility reports. Do not implement FLA natively.

Why: CS4 binary FLA and later XFL are not interchangeable historical assumptions.
An independent schema protects editable topology, pressure strokes, tracks, seeds
and original runtime semantics. Source: XFL-HISTORY and CS4 PDF 52.

Tradeoff: own validation/migration/container code and corpus are required. JSON
serialization of arbitrary runtime objects is rejected. Package implementation is
subject to the dependency policy; ZIP is not adopted without bounds and audit.

Acceptance: canonical round-trip, version awareness, original-file preservation,
path/size/cycle protection, injected interrupted saves and recovery. Revisit envelope
details in Phase One; changing envelope cannot redefine the document model.
