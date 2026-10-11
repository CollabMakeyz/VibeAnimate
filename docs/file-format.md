# Native format research and proposed v1

Status: **v1 schema and structural validation implemented; serializer pending**.
The authoritative Phase One contract is [native-format-v1.md](native-format-v1.md).
Extension: `.vibeanim`.
The format is original. FLA/XFL/SWF are external formats, not document models.
[Historical format evidence](https://helpx.adobe.com/animate/desktop/multimedia-and-video/opening-cs6-files-cc.html)
distinguishes CS4 binary FLA from the CS5 XFL generation. CS4 manual PDF 52 also
documents opening interchange XFL; these facts are compatible.

Planned package entries:

```text
manifest.json    format/version/appVersion/documentId/createdAt/modifiedAt
document.json    explicit model DTO, scenes, styles, stable references
library/        symbol definitions and asset records
assets/         content-addressed media bytes
scripts/        isolated script sources and requested capabilities
thumbnails/     optional disposable previews
metadata/       optional descriptive metadata
recovery/       recovery metadata, not a substitute for external autosave
```

Phase One defines and schema-tests the v1 DTO before feature persistence.
Do not publish the above directory sketch as a functioning file format. JSON schema
validation is followed by semantic validation: ID uniqueness/references, graph
invariants, frame ranges, symbol cycles and resource quotas. Unknown future major
versions open as a diagnostic/read-only path, never destructive conversion.

Canonical serialization sorts record-map keys, preserves semantically ordered arrays,
rejects NaN/infinities and excludes selection, interactions and render caches.
Canonical test snapshots exclude nondeterministic timestamps; normal saves preserve
document timestamps intentionally. Asset bytes are addressed by hash and verified.

Load stages: bounded container inspection → manifest/version → schema → migration
if supported → semantic validation → normalize → construct document. Report file,
version, section, cause and recoverability. Never load half a document into the
active editor when validation fails. Never silently drop unsupported elements.

Untrusted package limits must cover compressed/uncompressed bytes, entry count,
compression ratio, asset decoded dimensions, nesting and expansion. Reject absolute
paths, drive/UNC names, `..`, NULs, duplicate normalized names and symlink entries.
Do not extract arbitrary paths first and validate later. XML disables external
entities and network resolution. SWF bounds every tag/bit read before allocation.

Manual saves use temp file in the destination directory, flush, then atomic replace
where supported. Preserve the previous file on every failure. Autosave writes a
separate recoverable journal/snapshot and defers work during active ink. Recovery
shows document/timestamp and explicit open/discard choices. File migration never
overwrites the original merely by opening it.

Required tests: canonical equality after save/load, graph IDs and styles, editable
ink without predictions, layers/keyframes/tweens/IK/seeds, version rejection,
truncation, malformed JSON/XML/SWF, quota abuse, traversal, cycles, interrupted save
and restart recovery. Add each feature to these tests before marking it complete.
