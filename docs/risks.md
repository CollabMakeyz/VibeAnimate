# Risk register

All risks are OPEN; mitigations are design obligations, not claims of implemented
protection. Module owner identifies responsibility, not an assigned person.

| RISK | Likelihood | Impact | Mitigation | Owner/module | Trigger | Status |
|---|---|---|---|---|---|---|
| Merge topology complexity | High | Critical | Incremental DCEL, transactional validation, canonical overlap corpus | geometry | Invalid face or paint ownership | OPEN |
| Bezier numeric robustness | High | Critical | Central tolerance, local normalization, tangent/coincident fixtures | geometry | Nonfinite coordinate, missed intersection or unstable split | OPEN |
| Shape tween correspondence | High | High | Contour/hole matching, hints, explicit ambiguity diagnostics | tween-engine | Twisted interpolation or lost holes | OPEN |
| WebView tablet inconsistency | High | High | API versus observed matrix; physical tests per platform | input | Missing sensor or capture behavior | OPEN |
| Driver quirks | Medium | High | Replay captures plus physical reproduction before workaround | input | Device-specific loss or duplicate samples | OPEN |
| OffscreenCanvas support | Medium | Medium | Real worker handshake and main-surface fallback | platform | Constructor exists but worker context fails | OPEN |
| High-DPI memory | High | High | Bounded surface/effect sizes and cache eviction | renderer | DPR resize exceeds configured memory | OPEN |
| GPU context loss | Medium | High | Rebuild caches from model; surface replacement fallback | renderer | webglcontextlost | OPEN |
| Video codec availability | High | High | Per-configuration encoder support check and diagnostics | export | Unsupported codec/container/dimensions | OPEN |
| Codec licensing/patent review | Medium | High | Separate approved distribution decision; no automatic FFmpeg | export/licensing | New encoder or distribution target | OPEN |
| XFL variation | High | High | Producer/version corpus and reports | import-xfl | Unknown node/version or contradictory mapping | OPEN |
| SWF parser security | High | Critical | Bounded reads, quotas and malformed corpus | import-swf | Length overflow, expansion or unsupported compression | OPEN |
| Legacy shortcut uncertainty | High | Medium | Dated evidence matrix; provisional labels | commands | Conflicting source or OS interception | OPEN |
| Font differences | High | High | Explicit fallback and text metrics fixtures | text | Font unavailable or export differs | OPEN |
| Nested timeline recursion | Medium | Critical | Cycle validation plus depth/expansion budget | document-model | Cycle or exponential expansion | OPEN |
| Large project memory | High | High | Asset quotas, lazy decode and measured cache budgets | document-model | Resident memory exceeds scenario budget | OPEN |
| Undo memory growth | High | High | Delta commands, byte accounting, bounded history | command-system | History limit reached | OPEN |
| Performance regression | High | High | Reproducible corpora and p95 thresholds | benchmarks | Algorithm/graphics regression beyond threshold | OPEN |
| Corrupted project recovery | Medium | Critical | Atomic save, independent journal and injected failures | file-format | Interrupted write or invalid latest snapshot | OPEN |

