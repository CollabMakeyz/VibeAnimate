# Export contract

Status: **NOT IMPLEMENTED**. Required outputs: PNG, PNG sequence, SVG, animated
GIF and standalone HTML5; then WebM and MP4 when a usable approved encoder exists.

Use the same frame evaluator as Stage. `renderFrame(scene, frame, width, height,
scale)` is deterministic and independent of UI clock, selection and viewport camera.
Explicitly choose document background vs alpha. Preserve frame-rate rational values
when assigning timestamps; do not accumulate rounded milliseconds.

Jobs have IDs, bounded work queues, progress, cancellation and structured errors.
Workers prepare/encode frames and release resources on cancellation/error. Temporary
outputs cannot replace a successful previous export until finalization succeeds.
Memory backpressure must prevent keeping all uncompressed movie frames resident.

SVG emits geometry, styles, transforms, masks, text and symbols when representable.
For other effects, give a visible choice of documented baking or rejection; never
silently omit content. PNG sequence includes stable frame names. GIF needs palette,
transparency/disposal and duration tests; HTML5 package runs without the editor and
records runtime licensing. Animated output must be decoded in tests to validate
actual nonblank frames and ordering.

Encoder capability checks include format/container plus codec, dimensions, framerate
and alpha. [WebCodecs](https://www.w3.org/TR/webcodecs/) is an encoding API; a muxer
is still required for a media file. Separate both interfaces and audit dependencies.
Do not add FFmpeg or declare MP4 available from API presence alone. Test unsupported
codec diagnostics, cancellation, cleanup and Stage/export equivalence.
