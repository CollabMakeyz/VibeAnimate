# ADR: revision-bound transactions and owned worker messages

Date: 2026-10-11. Status: ACCEPTED design; runtime implementation pending.

Decision: immutable indexed document snapshots, typed forward/inverse patches and
one atomic command executor. Session revision is monotonic; history content identity
is separate. All asynchronous jobs carry protocol, document, revision and job IDs.
Geometry replies never directly mutate the model. Export owns a frozen snapshot
and uses acknowledged chunks with bounded buffering.

Reason: model invariants must survive tool cancellation, delayed geometry, undo and
document switching. Whole-document cloning per pointer event scales poorly and
couples latency to unrelated content. UI-framework state is not the document engine.

Tradeoffs: maintaining dependency indexes, inverse patches, byte accounting and
history-state identities costs implementation work. Conservative revision rejection
may recompute geometry after unrelated edits; dependency-specific rebasing is not
introduced without proofs and tests. Owned transfers can require copies at the
boundary but avoid detached live storage and unsafe shared-memory mutation.

Acceptance: command apply/undo/redo canonical equivalence, atomic failure injection,
one undo entry per stroke, history eviction, stale reply rejection, cancellation,
worker crash cleanup and bounded backpressure. See docs/architecture.md for the
full protocol. No worker or command runtime is claimed at this design checkpoint.
