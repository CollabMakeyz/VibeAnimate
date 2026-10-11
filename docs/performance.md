# Performance and benchmark plan

Status: budgets/protocol only. No production frame rate or input latency result
exists. 60/120 Hz are reference-machine targets, never universal promises.

## Versioned scenario requirements

| Scenario | Layers | Frames | Geometry | Effects/context | Stage / DPR | Input |
|---|---|---|---|---|---|---|
| Simple | 5 | 100 | 500 visible shapes, exactly counted generated edges | Solid fill, mixed strokes | 1920×1080 / 1,2 | Mouse navigation |
| Medium | 25 | 300 | 5,000 visible edges | 20% gradients, 2 mask chains | 1920×1080 / 1,2 | Scrub + camera |
| Stress | 50 | 500 | At least 20,000 visible edges | 3-level nested symbols, 2 previous + 2 next onions, gradients/masks | 1920×1080 / 1,2 | Scrub/playback |
| Ink | 5 | 100 | 30 seconds confirmed strokes | Pressure/tilt, separate predictions | 1920×1080 / 1,2 | Replay 120/240/480 samples/s |
| Timeline | 50 | 500 | Held/key/blank/tween mix | Horizontal/vertical scrolling | Viewport 1280×300 / 1,2 | Scrub/scroll/selection |

Store generator version/seed and actual visible edge/triangle counts; empty frames
do not substitute for complex content. Benchmarks include correctness checks so
dropping geometry cannot make the result appear faster. At least 100 warmup frames
and 1,000 measured frames; record repetitions, environment and throttling state.

## Measurement and provisional budgets

Total frame: 16.67 ms at 60 Hz, 8.33 ms at 120 Hz. Provisional CPU rendering p95
target ≤12 ms at 60 Hz and ≤6 ms at 120 Hz for scenarios where hardware permits;
GPU/present and non-render work consume the rest. These values need reference
machine calibration before becoming release gates. Track p50/p95/p99 separately.
Do not infer GPU time from total requestAnimationFrame interval alone.

Record frame/evaluation/tessellation/upload/command durations, draw calls, triangles,
visible edges, worker queue depth, samples/second, dropped samples and memory.
Normal draw/pan/zoom/scrub must not cause document-wide serialization/tessellation,
encoding or thumbnail regeneration. Ink ingestion/preview has priority; diagnostics
and Properties use bounded-rate summaries rather than per-sample UI refresh.

Suggested starting cache caps: 128 MiB meshes, 64 MiB thumbnails, 128 MiB undo;
configurable and reported, not hidden unbounded growth. High-DPI effect targets
must be included in accounting. Revisit caps with real document workloads.

Phase One admission defaults: one interactive geometry job active per document,
at most eight queued geometry jobs and 64 MiB queued payload bytes; two thumbnail
jobs with 16 MiB queued bytes; one export job with two unacknowledged chunks of at
most 8 MiB each. Deduplicate obsolete thumbnails before admission. Each geometry
job starts with 128 MiB scratch, 100,000 records, depth 64 and 10,000,000 operations.
Resource limits are checked before allocations and within bounded loops. A worker
checks cancellation at least every 4,096 elementary operations; a measured 2-second
nonresponse deadline permits termination, without claiming a 2-second UI pause.
Large operations return an explicit budget diagnostic instead of partial artwork.
These are initial limits to measure during implementation, not achieved latency.

Raster/effect allocation includes width×height×bytes-per-pixel×sample-count and all
temporary targets. Total GPU target budget starts at 256 MiB with explicit capability
clamping; do not allocate a 65,536² target merely because the file allows that Stage
size. Tile or reject with a diagnostic. UI diagnostics update at most ten times per
second; captured ink and Stage overlay ingestion are not throttled to that rate.

CI measures algorithms and logical invariants, not virtual-GPU FPS. Once calibrated,
investigate median/p95 >20% regressions across three controlled repeats. Do not
fail a benchmark solely from one noisy wall-clock sample. Preserve baseline
environment fingerprints locally without transmitting device identifiers.

## Reference machine evidence

Current host: Windows development environment, Node 24.19.0; GPU, display refresh,
driver, power mode and physical tablet measurements are **NOT RECORDED**. This host
is not yet an approved graphics reference machine. Required profiles: Windows 11
WebView2, supported macOS WKWebView and Linux WebKitGTK, with explicit GPU/driver,
display/DPR/refresh and app build. Capture raw reports and limitations per platform.

Phase Zero numerical probes are disposable research tools. Their timings cannot
be reported as editor rendering performance or used to accept any production feature.
