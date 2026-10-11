# Contract demonstration

`rectangle.document.json` is original test geometry: a filled 100×80 rectangle,
one layer and a 24-frame exposure on a 1920×1080 stage. It demonstrates the explicit
v1 document DTO and is generated from `tests/architecture/fixtures.mjs`.

Run `npm run demo:contracts` after the reviewed dependency installation. The demo
validates its structure, then proves a quadratic without a control point is rejected.
This JSON is not a saved `.vibeanim` package, a renderer demo or semantic validation
evidence. No importer or app is implied. Geometry and metadata were authored for
this project; no external artwork or fonts are included.
